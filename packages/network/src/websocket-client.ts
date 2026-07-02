import type { Observable, Subject } from 'rxjs';
import { Subject as RxSubject } from 'rxjs';

/**
 * WebSocket connection state.
 */
export type WebSocketState = 'idle' | 'connecting' | 'open' | 'closing' | 'closed' | 'error';

/**
 * WebSocket message — can be a string or binary data.
 */
export type WebSocketMessage = string | ArrayBuffer | Blob;

/**
 * Reconnecting WebSocket client.
 *
 * Per ADR-001 (Gemini Live Translate) and `09_EVENT_SYSTEM.md`:
 * WebSocket connections MUST auto-reconnect with exponential backoff.
 *
 * @example
 * ```ts
 * const client = new ReconnectingWebSocketClient({
 *   url: 'wss://api.example.com/ws',
 *   maxRetries: 10,
 * });
 *
 * client.messages$.subscribe((msg) => console.log('Received:', msg));
 * client.state$.subscribe((state) => console.log('State:', state));
 *
 * client.connect();
 * client.send('Hello');
 * ```
 */
export interface ReconnectingWebSocketOptions {
  readonly url: string;
  readonly protocols?: string | string[];
  readonly maxRetries?: number;
  readonly initialBackoffMs?: number;
  readonly maxBackoffMs?: number;
  readonly heartbeatIntervalMs?: number;
  readonly heartbeatMessage?: string;
}

export class ReconnectingWebSocketClient {
  private readonly messagesSubject: Subject<WebSocketMessage> = new RxSubject<WebSocketMessage>();
  private readonly stateSubject: Subject<WebSocketState> = new RxSubject<WebSocketState>();
  private ws: WebSocket | null = null;
  private retries = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionallyClosed = false;

  constructor(private readonly options: ReconnectingWebSocketOptions) {}

  /** Observable of incoming messages. */
  readonly messages$: Observable<WebSocketMessage> = this.messagesSubject.asObservable();

  /** Observable of connection state changes. */
  readonly state$: Observable<WebSocketState> = this.stateSubject.asObservable();

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.intentionallyClosed = false;
    this.setState('connecting');

    try {
      this.ws = new WebSocket(this.options.url, this.options.protocols);
    } catch {
      this.setState('error');
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.retries = 0;
      this.setState('open');
      this.startHeartbeat();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this.messagesSubject.next(event.data as WebSocketMessage);
    };

    this.ws.onerror = () => {
      this.setState('error');
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.setState('closed');
      if (!this.intentionallyClosed) {
        this.scheduleReconnect();
      }
    };
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      // Buffer or drop — for now, drop with a warning
      console.warn('WebSocket is not open; message dropped');
    }
  }

  close(): void {
    this.intentionallyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.setState('closing');
      this.ws.close();
    }
    this.messagesSubject.complete();
    this.stateSubject.complete();
  }

  private setState(state: WebSocketState): void {
    this.stateSubject.next(state);
  }

  private scheduleReconnect(): void {
    const maxRetries = this.options.maxRetries ?? 10;
    if (this.retries >= maxRetries) {
      this.setState('closed');
      return;
    }

    const initialBackoff = this.options.initialBackoffMs ?? 1_000;
    const maxBackoff = this.options.maxBackoffMs ?? 30_000;
    const backoff = Math.min(initialBackoff * 2 ** this.retries, maxBackoff);

    this.retries += 1;
    this.reconnectTimer = setTimeout(() => this.connect(), backoff);
  }

  private startHeartbeat(): void {
    const interval = this.options.heartbeatIntervalMs;
    if (!interval) return;
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(this.options.heartbeatMessage ?? 'ping');
      }
    }, interval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}