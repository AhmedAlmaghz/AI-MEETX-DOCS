export type {
  HttpClient,
  HttpError,
  HttpRequestConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from './http-client.js';
export { FetchHttpClient } from './http-client.js';

export type { WebSocketState, WebSocketMessage, ReconnectingWebSocketOptions } from './websocket-client.js';
export { ReconnectingWebSocketClient } from './websocket-client.js';

// Whiteboard sync
export type {
  WhiteboardPoint,
  WhiteboardStrokeStyle,
  WhiteboardOperationType,
  WhiteboardOperation,
  WhiteboardStroke,
  WhiteboardState,
  WhiteboardSyncMessage,
  WhiteboardSyncCallbacks,
  WebSocketWhiteboardSyncOptions,
} from './whiteboard-sync-gateway.js';
export { WebSocketWhiteboardSyncGateway } from './whiteboard-sync-gateway.js';
