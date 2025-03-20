/**
 * エラーハンドリングミドルウェア
 */

import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  NetworkError,
  LLMError,
  ConfigError,
  ProxyError,
  isAppError,
} from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger({
  port: 8080,
  host: 'localhost',
  ignoreRobotsTxt: false,
  llm: {
    enabled: false,
    type: 'ollama',
    model: 'gemma',
  },
  logging: {
    level: 'error',
  },
});

/**
 * エラーレスポンスの型定義
 */
interface ErrorResponse {
  error: {
    message: string;
    code: string;
    metadata?: Record<string, unknown>;
    stack?: string;
  };
}

/**
 * エラーハンドリングミドルウェア
 * 
 * @param error - 発生したエラー
 * @param req - リクエストオブジェクト
 * @param res - レスポンスオブジェクト
 * @param next - 次のミドルウェア
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('エラーが発生しました:', error);

  const response: ErrorResponse = {
    error: {
      message: '内部サーバーエラーが発生しました',
      code: 'INTERNAL_SERVER_ERROR',
    },
  };

  let statusCode = 500;

  if (isAppError(error)) {
    response.error.message = error.message;
    response.error.code = error.code;
    if (error.metadata) {
      response.error.metadata = error.metadata;
    }

    // エラータイプに応じたステータスコードの設定
    if (error instanceof NetworkError) {
      statusCode = 503; // Service Unavailable
    } else if (error instanceof ProxyError) {
      statusCode = 502; // Bad Gateway
    }
  }

  // 開発環境の場合はスタックトレースを含める
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.error.stack = error.stack;
  }

  res.status(statusCode).json(response);
};
