/**
 * アプリケーション全体で使用するエラークラスと関連ユーティリティ
 */

import winston from 'winston';

/**
 * アプリケーションのベースエラークラス
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly metadata?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'APP_ERROR',
    statusCode = 500,
    metadata?: Record<string, unknown>,
    isOperational = true,
    stack = '',
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.metadata = metadata;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
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
    super(
      `ネットワークエラー: ${message}`,
      'NETWORK_ERROR',
      503,
      metadata
    );
    this.name = 'NetworkError';
    this.cause = originalError;
  }
}

/**
 * LLM関連のエラー
 */
export class LLMError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(
      `LLMエラー: ${message}`,
      'LLM_ERROR',
      500,
      metadata
    );
    this.name = 'LLMError';
  }
}

/**
 * 設定関連のエラー
 */
export class ConfigError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(
      `設定エラー: ${message}`,
      'CONFIG_ERROR',
      500,
      metadata
    );
    this.name = 'ConfigError';
  }
}

/**
 * プロキシ関連のエラー
 */
export class ProxyError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(
      `プロキシエラー: ${message}`,
      'PROXY_ERROR',
      502,
      metadata
    );
    this.name = 'ProxyError';
  }
}

/**
 * エラーをログに記録する
 */
export function logError(
  logger: winston.Logger,
  error: Error,
  context?: string,
): void {
  interface ErrorDetails {
    message: string;
    stack?: string;
    context?: string;
    statusCode?: number;
    isOperational?: boolean;
    code?: string;
    metadata?: Record<string, unknown>;
  }

  const errorDetails: ErrorDetails = {
    message: error.message,
    stack: error.stack,
    context,
  };

  if (error instanceof AppError) {
    errorDetails.statusCode = error.statusCode;
    errorDetails.isOperational = error.isOperational;
    errorDetails.code = error.code;
    if (error.metadata) {
      errorDetails.metadata = error.metadata;
    }
  }

  logger.error('エラーが発生しました:', errorDetails);
}

/**
 * エラーをハンドリングして適切なフォールバック処理を実行する
 */
export async function handleErrorWithFallback<T>(
  logger: winston.Logger,
  operation: () => Promise<T>,
  fallback: () => T,
  context?: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logError(logger, error instanceof Error ? error : new Error(String(error)), context);
    return fallback();
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
