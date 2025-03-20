/**
 * エラーユーティリティのテスト
 */

import winston from 'winston';
import { Request, Response } from 'express';
import {
  AppError,
  NetworkError,
  LLMError,
  ConfigError,
  ProxyError,
  logError,
  errorHandler,
  handleErrorWithFallback,
} from '../errors';

// モックロガー
const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
} as unknown as winston.Logger & {
  error: jest.Mock;
  warn: jest.Mock;
  info: jest.Mock;
};

describe('エラークラスのテスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('AppErrorが正しく初期化される', () => {
    const error = new AppError('テストエラー', 400, true);
    expect(error.message).toBe('テストエラー');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
    expect(error.stack).toBeDefined();
  });

  test('AppErrorがスタックを受け入れる', () => {
    const customStack = 'カスタムスタック';
    const error = new AppError('テストエラー', 400, true, customStack);
    expect(error.stack).toBe(customStack);
  });

  test('NetworkErrorが正しく初期化される', () => {
    const error = new NetworkError('接続エラー');
    expect(error.message).toBe('ネットワークエラー: 接続エラー');
    expect(error.statusCode).toBe(503);
  });

  test('LLMErrorが正しく初期化される', () => {
    const error = new LLMError('モデルエラー');
    expect(error.message).toBe('LLMエラー: モデルエラー');
    expect(error.statusCode).toBe(500);
  });

  test('ConfigErrorが正しく初期化される', () => {
    const error = new ConfigError('設定ファイルエラー');
    expect(error.message).toBe('設定エラー: 設定ファイルエラー');
    expect(error.statusCode).toBe(500);
  });

  test('ProxyErrorが正しく初期化される', () => {
    const error = new ProxyError('プロキシエラー');
    expect(error.message).toBe('プロキシエラー: プロキシエラー');
    expect(error.statusCode).toBe(502);
  });
});

describe('logErrorのテスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('運用エラーが警告としてログに記録される', () => {
    const error = new AppError('運用エラー', 400, true);
    logError(mockLogger, error, 'テスト');
    expect(mockLogger.warn).toHaveBeenCalled();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  test('非運用エラーがエラーとしてログに記録される', () => {
    const error = new Error('予期しないエラー');
    logError(mockLogger, error, 'テスト');
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  test('コンテキストが指定されていない場合、デフォルト値が使用される', () => {
    const error = new Error('エラー');
    logError(mockLogger, error);
    expect(mockLogger.error).toHaveBeenCalled();
    const logCall = mockLogger.error.mock.calls[0][0];
    expect(logCall).toContain('アプリケーション');
  });
});

describe('errorHandlerのテスト', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  test('AppErrorが適切に処理される', () => {
    const error = new AppError('カスタムエラー', 400);
    const handler = errorHandler(mockLogger);

    handler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'カスタムエラー',
    });
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  test('一般的なエラーが500として処理される', () => {
    const error = new Error('一般的なエラー');
    const handler = errorHandler(mockLogger);

    handler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'サーバー内部エラーが発生しました',
    });
    expect(mockLogger.error).toHaveBeenCalled();
  });
});

describe('handleErrorWithFallbackのテスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('操作が成功した場合、結果が返される', async () => {
    const operation = jest.fn().mockResolvedValue('成功');
    const fallback = jest.fn().mockReturnValue('フォールバック');

    const result = await handleErrorWithFallback(
      mockLogger,
      operation,
      fallback,
    );

    expect(result).toBe('成功');
    expect(operation).toHaveBeenCalled();
    expect(fallback).not.toHaveBeenCalled();
  });

  test('操作が失敗した場合、フォールバックが実行される', async () => {
    const error = new Error('操作エラー');
    const operation = jest.fn().mockRejectedValue(error);
    const fallback = jest.fn().mockReturnValue('フォールバック');

    const result = await handleErrorWithFallback(
      mockLogger,
      operation,
      fallback,
      'テスト',
    );

    expect(result).toBe('フォールバック');
    expect(operation).toHaveBeenCalled();
    expect(fallback).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled();
  });

  test('Errorでない例外もエラーとして処理される', async () => {
    const operation = jest.fn().mockRejectedValue('文字列エラー');
    const fallback = jest.fn().mockReturnValue('フォールバック');

    const result = await handleErrorWithFallback(
      mockLogger,
      operation,
      fallback,
    );

    expect(result).toBe('フォールバック');
    expect(operation).toHaveBeenCalled();
    expect(fallback).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
