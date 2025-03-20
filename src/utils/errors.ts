/**
 * アプリケーションで使用するエラークラスの定義
 */

/**
 * アプリケーションの基本エラークラス
 */
export class AppError extends Error {
  code: string;
  metadata?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'APP_ERROR',
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.metadata = metadata;
  }
}

/**
 * ネットワーク関連のエラー
 */
export class NetworkError extends AppError {
  constructor(
    message: string,
    originalError?: Error,
    metadata?: Record<string, unknown>
  ) {
    super(message, 'NETWORK_ERROR', metadata);
    this.name = 'NetworkError';
    this.cause = originalError;
  }
}

/**
 * LLM関連のエラー
 */
export class LLMError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'LLM_ERROR', metadata);
    this.name = 'LLMError';
  }
}

/**
 * 設定関連のエラー
 */
export class ConfigError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'CONFIG_ERROR', metadata);
    this.name = 'ConfigError';
  }
}

/**
 * プロキシ関連のエラー
 */
export class ProxyError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'PROXY_ERROR', metadata);
    this.name = 'ProxyError';
  }
}

/**
 * エラーがAppErrorのインスタンスかどうかを判定
 * 
 * @param error - 判定対象のエラー
 * @returns AppErrorのインスタンスの場合はtrue
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
