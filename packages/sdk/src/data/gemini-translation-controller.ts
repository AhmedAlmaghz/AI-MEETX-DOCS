import type { Result, TranslationSessionId } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type { GeminiLiveTranslateConfig, TranscriptSegment, TranslatedAudioChunk } from '../domain/model/translation.js';
import { TRANSLATION_CONSTRAINTS } from '../domain/model/translation.js';

// ============================================================================
// Gemini Live Translate WebSocket Controller
// ============================================================================

/**
 * Gemini Live Translate WebSocket controller.
 *
 * Per `feature-translation/SPECIFICATION.md`: handles the WebSocket connection
 * to the Gemini Live Translate API.
 *
 * Protocol:
 * - Connection: WebSocket over TLS.
 * - Input: PCM audio chunks at 16kHz, 16-bit, mono.
 * - Output: Translated PCM audio + transcript JSON.
 * - Heartbeat: Every 30 seconds.
 * - Reconnect: Automatic with exponential backoff.
 */
export class GeminiTranslationController {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private isConnecting = false;
  private isDestroyed = false;

  private readonly onTranscriptCallback: ((segment: TranscriptSegment) => void) | undefined;
  private readonly onAudioCallback: ((chunk: TranslatedAudioChunk) => void) | undefined;
  private readonly onErrorCallback: ((error: Error) => void) | undefined;
  private readonly onCloseCallback: (() => void) | undefined;

  constructor(
    private readonly config: GeminiLiveTranslateConfig,
    private readonly sessionId: TranslationSessionId,
    callbacks?: {
      onTranscript?: (segment: TranscriptSegment) => void;
      onAudio?: (chunk: TranslatedAudioChunk) => void;
      onError?: (error: Error) => void;
      onClose?: () => void;
    },
  ) {
    this.onTranscriptCallback = callbacks?.onTranscript;
    this.onAudioCallback = callbacks?.onAudio;
    this.onErrorCallback = callbacks?.onError;
    this.onCloseCallback = callbacks?.onClose;
  }

  /**
   * Connect to Gemini Live Translate API.
   */
  async connect(): Promise<Result<void, Error>> {
    if (this.isDestroyed) {
      return failure(new Error('Controller has been destroyed'));
    }

    if (this.isConnecting) {
      return failure(new Error('Connection already in progress'));
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      return success(undefined);
    }

    this.isConnecting = true;

    try {
      const wsUrl = this.buildWebSocketUrl();
      this.ws = new WebSocket(wsUrl);

      await this.waitForConnection();

      this.setupMessageHandlers();
      this.startHeartbeat();
      this.reconnectAttempts = 0;
      this.isConnecting = false;

      return success(undefined);
    } catch (error) {
      this.isConnecting = false;
      return failure(error instanceof Error ? error : new Error('Connection failed'));
    }
  }

  /**
   * Send PCM audio chunk to Gemini.
   */
  async sendAudioChunk(audioData: ArrayBuffer): Promise<Result<void, Error>> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return failure(new Error('WebSocket is not connected'));
    }

    try {
      // Validate audio format
      if (audioData.byteLength > TRANSLATION_CONSTRAINTS.MAX_AUDIO_CHUNK_SIZE_BYTES) {
        return failure(
          new Error(
            `Audio chunk size (${audioData.byteLength}) exceeds maximum (${TRANSLATION_CONSTRAINTS.MAX_AUDIO_CHUNK_SIZE_BYTES})`,
          ),
        );
      }

      // Send as binary message
      this.ws.send(audioData);
      return success(undefined);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to send audio'));
    }
  }

  /**
   * Disconnect from Gemini API.
   */
  async disconnect(): Promise<Result<void, Error>> {
    this.stopHeartbeat();

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client disconnect');
      }
      this.ws = null;
    }

    return success(undefined);
  }

  /**
   * Destroy the controller and clean up resources.
   */
  async destroy(): Promise<Result<void, Error>> {
    this.isDestroyed = true;
    return this.disconnect();
  }

  /**
   * Check if connected.
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ==========================================================================
  // Private methods
  // ==========================================================================

  private buildWebSocketUrl(): string {
    const baseUrl = 'wss://generativelanguage.googleapis.com/ws';
    const params = new URLSearchParams({
      model: this.config.model,
      key: this.config.apiKey,
      source_language: this.config.sourceLanguage,
      target_language: this.config.targetLanguage,
      enable_original_transcript: String(this.config.enableOriginalTranscript),
      enable_translated_transcript: String(this.config.enableTranslatedTranscript),
      enable_translated_audio: String(this.config.enableTranslatedAudio),
      sample_rate: String(TRANSLATION_CONSTRAINTS.AUDIO_SAMPLE_RATE),
      bit_depth: String(TRANSLATION_CONSTRAINTS.AUDIO_BIT_DEPTH),
      channels: String(TRANSLATION_CONSTRAINTS.AUDIO_CHANNELS),
    });

    return `${baseUrl}?${params.toString()}`;
  }

  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error('WebSocket not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };

      this.ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('WebSocket error'));
      };
    });
  }

  private setupMessageHandlers(): void {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onerror = () => {
      this.onErrorCallback?.(new Error('WebSocket error'));
    };

    this.ws.onclose = (ev) => {
      this.stopHeartbeat();
      this.onCloseCallback?.();

      // Attempt reconnection if not a clean close
      if (ev.code !== 1000 && !this.isDestroyed) {
        this.attemptReconnect();
      }
    };
  }

  private handleMessage(data: string | ArrayBuffer | Blob): void {
    try {
      if (typeof data === 'string') {
        // JSON message (transcript, status, etc.)
        const message = JSON.parse(data);
        this.handleJsonMessage(message);
      } else if (data instanceof ArrayBuffer) {
        // Binary message (translated audio)
        this.handleBinaryMessage(data);
      } else if (data instanceof Blob) {
        // Convert Blob to ArrayBuffer
        data.arrayBuffer().then((buffer) => this.handleBinaryMessage(buffer));
      }
    } catch (error) {
      this.onErrorCallback?.(error instanceof Error ? error : new Error('Message handling failed'));
    }
  }

  private handleJsonMessage(message: Record<string, unknown>): void {
    const messageType = message.type as string;

    switch (messageType) {
      case 'transcript':
        this.handleTranscriptMessage(message);
        break;
      case 'error':
        this.onErrorCallback?.(new Error(message.message as string));
        break;
      case 'pong':
        // Heartbeat response
        break;
      default:
        // Unknown message type
        break;
    }
  }

  private handleTranscriptMessage(message: Record<string, unknown>): void {
    if (!this.onTranscriptCallback) return;

    const segment: TranscriptSegment = {
      id: message.segment_id as TranscriptSegment['id'],
      sessionId: this.sessionId,
      meetingId: message.meeting_id as TranscriptSegment['meetingId'],
      speakerName: (message.speaker_name as string) || 'Unknown',
      speakerParticipantId: (message.speaker_participant_id as TranscriptSegment['speakerParticipantId']) || null,
      originalText: message.original_text as string,
      translatedText: message.translated_text as string,
      sourceLanguage: this.config.sourceLanguage,
      targetLanguage: this.config.targetLanguage,
      startTimestamp: message.start_timestamp as TranscriptSegment['startTimestamp'],
      endTimestamp: message.end_timestamp as TranscriptSegment['endTimestamp'],
      confidence: (message.confidence as number) || 1.0,
    };

    this.onTranscriptCallback(segment);
  }

  private handleBinaryMessage(data: ArrayBuffer): void {
    if (!this.onAudioCallback) return;

    const chunk: TranslatedAudioChunk = {
      sessionId: this.sessionId,
      meetingId: '' as TranslatedAudioChunk['meetingId'], // Will be set by gateway
      targetLanguage: this.config.targetLanguage,
      pcmData: data,
      sampleRate: TRANSLATION_CONSTRAINTS.AUDIO_SAMPLE_RATE,
      bitDepth: TRANSLATION_CONSTRAINTS.AUDIO_BIT_DEPTH,
      channels: TRANSLATION_CONSTRAINTS.AUDIO_CHANNELS,
      timestamp: new Date().toISOString() as TranslatedAudioChunk['timestamp'],
      durationMs: this.calculateAudioDuration(data),
    };

    this.onAudioCallback(chunk);
  }

  private calculateAudioDuration(pcmData: ArrayBuffer): number {
    const bytesPerSample = TRANSLATION_CONSTRAINTS.AUDIO_BIT_DEPTH / 8;
    const samples = pcmData.byteLength / bytesPerSample / TRANSLATION_CONSTRAINTS.AUDIO_CHANNELS;
    return (samples / TRANSLATION_CONSTRAINTS.AUDIO_SAMPLE_RATE) * 1000;
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, TRANSLATION_CONSTRAINTS.HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= TRANSLATION_CONSTRAINTS.MAX_RECONNECT_ATTEMPTS) {
      this.onErrorCallback?.(
        new Error(`Max reconnection attempts (${TRANSLATION_CONSTRAINTS.MAX_RECONNECT_ATTEMPTS}) exceeded`),
      );
      return;
    }

    const delay = Math.min(
      TRANSLATION_CONSTRAINTS.RECONNECT_BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      TRANSLATION_CONSTRAINTS.RECONNECT_MAX_DELAY_MS,
    );

    this.reconnectAttempts++;

    await new Promise((resolve) => setTimeout(resolve, delay));

    if (!this.isDestroyed) {
      await this.connect();
    }
  }
}