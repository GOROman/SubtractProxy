/**
 * アプリケーション全体で使用するエラークラスと関連ユーティリティ
 */

import { Request, Response } from 'express';
import winston from 'winston';

/**
 * アプリケーションのベースエラークラス
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    isOperational = true,
    stack = '',
  ) {
    super(message);
    this.statusCode = statusCode;
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
  constructor(message: string, statusCode = 503) {
    super(`ネットワークエラー: ${message}`, statusCode);
  }
}

/**
 * LLM関連のエラー
 */
export class LLMError extends AppError {
  constructor(message: string, statusCode = 500) {
    super(`LLMエラー: ${message}`, statusCode);
  }
}

/**
 * 設定関連のエラー
 */
export class ConfigError extends AppError {
  constructor(message: string, statusCode = 500) {
    super(`設定エラー: ${message}`, statusCode);
  }
}

/**
 * プロキシ関連のエラー
 */
export class ProxyError extends AppError {
  constructor(message: string, statusCode = 502) {
    super(`プロキシエラー: ${message}`, statusCode);
  }
}

/**
 * エラーをログに記録する
 */
export const logError = (
  logger: winston.Logger,
  error: Error,
  context?: string,
): void => {
  const errorDetails = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    context: context || 'アプリケーション',
  };
  
  if (error instanceof AppError && error.isOperational) {
    logger.warn(`運用エラー: ${JSON.stringify(errorDetails)}`);
  } else {
    logger.error(`予期しないエラー: ${JSON.stringify(errorDetails)}`);
  }
};

/**
 * エラーハンドリングミドルウェア
 */
export const errorHandler = (
  logger: winston.Logger,
) => {
  return (
    err: Error,
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: () => void,
  ): void => {
    let statusCode = 500;
    let errorMessage = 'サーバー内部エラーが発生しました';
    
    if (err instanceof AppError) {
      statusCode = err.statusCode;
      errorMessage = err.message;
    }
    
    logError(logger, err);
    
    res.status(statusCode).json({
      status: 'error',
      message: errorMessage,
    });
  };
};

/**
 * エラーをハンドリングして適切なフォールバック処理を実行する
 */
export const handleErrorWithFallback = async <T>(
  logger: winston.Logger,
  operation: () => Promise<T>,
  fallback: () => T,
  context?: string,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    logError(logger, error instanceof Error ? error : new Error(String(error)), context);
    return fallback();
  }
};
