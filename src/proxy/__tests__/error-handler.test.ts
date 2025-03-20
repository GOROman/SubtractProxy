/**
 * エラーハンドリングミドルウェアのテスト
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, NetworkError, LLMError, ConfigError, ProxyError } from '../../utils/errors';
import { errorHandler } from '../error-handler';
import { createLogger } from '../../utils/logger';

describe('エラーハンドリングミドルウェア', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockLogger: ReturnType<typeof createLogger>;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRequest = {};
    mockResponse = {
      status: mockStatus,
    };
    nextFunction = jest.fn();
    mockLogger = createLogger({
      port: 8080,
      host: 'localhost',
      ignoreRobotsTxt: false,
<<<<<<< HEAD
=======
      timeout: 30000,
>>>>>>> feature/error-handling-tests
      llm: {
        enabled: false,
        type: 'ollama',
        model: 'gemma',
      },
      logging: {
        level: 'error',
      },
<<<<<<< HEAD
=======
      filtering: {
        enabled: false,
        configPath: undefined,
      },
>>>>>>> feature/error-handling-tests
    });
  });

  test('AppErrorを適切に処理する', () => {
<<<<<<< HEAD
    const error = new AppError('アプリケーションエラー', 'APP_ERROR', { detail: 'テスト' });
=======
    const error = new AppError('アプリケーションエラー', 'APP_ERROR', 500, { detail: 'テスト' });
>>>>>>> feature/error-handling-tests
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
        message: 'アプリケーションエラー',
        code: 'APP_ERROR',
        metadata: { detail: 'テスト' },
      },
    });
  });

  test('NetworkErrorを適切に処理する', () => {
    const originalError = new Error('接続エラー');
    const error = new NetworkError('ネットワークエラー', originalError);
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockStatus).toHaveBeenCalledWith(503);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
<<<<<<< HEAD
        message: 'ネットワークエラー',
=======
        message: 'ネットワークエラー: ネットワークエラー',
>>>>>>> feature/error-handling-tests
        code: 'NETWORK_ERROR',
      },
    });
  });

  test('LLMErrorを適切に処理する', () => {
    const error = new LLMError('LLMエラー', { model: 'test-model' });
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
<<<<<<< HEAD
        message: 'LLMエラー',
=======
        message: 'LLMエラー: LLMエラー',
>>>>>>> feature/error-handling-tests
        code: 'LLM_ERROR',
        metadata: { model: 'test-model' },
      },
    });
  });

  test('ConfigErrorを適切に処理する', () => {
    const error = new ConfigError('設定エラー', { config: 'test' });
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
<<<<<<< HEAD
        message: '設定エラー',
=======
        message: '設定エラー: 設定エラー',
>>>>>>> feature/error-handling-tests
        code: 'CONFIG_ERROR',
        metadata: { config: 'test' },
      },
    });
  });

  test('ProxyErrorを適切に処理する', () => {
    const error = new ProxyError('プロキシエラー', { url: 'http://example.com' });
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockStatus).toHaveBeenCalledWith(502);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
<<<<<<< HEAD
        message: 'プロキシエラー',
=======
        message: 'プロキシエラー: プロキシエラー',
>>>>>>> feature/error-handling-tests
        code: 'PROXY_ERROR',
        metadata: { url: 'http://example.com' },
      },
    });
  });

  test('一般的なErrorを適切に処理する', () => {
    const error = new Error('一般的なエラー');
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
        message: '内部サーバーエラーが発生しました',
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  });

  test('開発環境でのスタックトレース表示', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('開発環境エラー');
    error.stack = 'Error: 開発環境エラー\n    at Test';
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockJson).toHaveBeenCalledWith({
      error: {
        message: '内部サーバーエラーが発生しました',
        code: 'INTERNAL_SERVER_ERROR',
        stack: 'Error: 開発環境エラー\n    at Test',
      },
    });

    process.env.NODE_ENV = originalNodeEnv;
  });
});
