/**
 * エラーハンドリングのテスト
 */

<<<<<<< HEAD
=======
import winston from 'winston';
>>>>>>> feature/error-handling-tests
import {
  AppError,
  NetworkError,
  LLMError,
  ConfigError,
  ProxyError,
  isAppError,
<<<<<<< HEAD
} from '../errors';

describe('エラークラスのテスト', () => {
  describe('AppError', () => {
    test('基本的なエラー情報が正しく設定される', () => {
      const error = new AppError('テストエラー');
      expect(error.message).toBe('テストエラー');
      expect(error.name).toBe('AppError');
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    test('カスタムコードとメタデータが設定される', () => {
      const metadata = { key: 'value' };
      const error = new AppError('テストエラー', 'TEST_ERROR', metadata);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.metadata).toEqual(metadata);
=======
  logError,
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

  describe('AppError', () => {
    test('基本的なエラー情報を持つ', () => {
      const error = new AppError('テストエラー', 'TEST_ERROR');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('テストエラー');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    test('メタデータを設定できる', () => {
      const metadata = { detail: 'テスト詳細' };
      const error = new AppError('テストエラー', 'TEST_ERROR', 400, metadata);
      expect(error.metadata).toEqual(metadata);
      expect(error.statusCode).toBe(400);
    });

    test('運用エラーフラグを設定できる', () => {
      const error = new AppError('システムエラー', 'SYSTEM_ERROR', 500, undefined, false);
      expect(error.isOperational).toBe(false);
    });

    test('スタックトレースを設定できる', () => {
      const customStack = 'カスタムスタック';
      const error = new AppError('テストエラー', 'TEST_ERROR', 500, undefined, true, customStack);
      expect(error.stack).toBe(customStack);
>>>>>>> feature/error-handling-tests
    });
  });

  describe('NetworkError', () => {
<<<<<<< HEAD
    test('ネットワークエラーが正しく作成される', () => {
      const originalError = new Error('接続エラー');
      const error = new NetworkError('ネットワークエラー', originalError);
      expect(error.message).toBe('ネットワークエラー');
      expect(error.name).toBe('NetworkError');
      expect(error.cause).toBe(originalError);
      expect(error instanceof NetworkError).toBe(true);
      expect(error instanceof AppError).toBe(true);
=======
    test('ネットワークエラーを生成する', () => {
      const originalError = new Error('元のエラー');
      const error = new NetworkError('接続エラー', originalError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('ネットワークエラー: 接続エラー');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.statusCode).toBe(503);
      expect(error.cause).toBe(originalError);
>>>>>>> feature/error-handling-tests
    });
  });

  describe('LLMError', () => {
<<<<<<< HEAD
    test('LLMエラーが正しく作成される', () => {
      const metadata = { model: 'test-model', prompt: 'test-prompt' };
      const error = new LLMError('LLMエラー', metadata);
      expect(error.message).toBe('LLMエラー');
      expect(error.name).toBe('LLMError');
      expect(error.metadata).toEqual(metadata);
      expect(error instanceof LLMError).toBe(true);
      expect(error instanceof AppError).toBe(true);
=======
    test('LLMエラーを生成する', () => {
      const metadata = { model: 'test-model' };
      const error = new LLMError('モデルエラー', metadata);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('LLMエラー: モデルエラー');
      expect(error.code).toBe('LLM_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.metadata).toEqual(metadata);
>>>>>>> feature/error-handling-tests
    });
  });

  describe('ConfigError', () => {
<<<<<<< HEAD
    test('設定エラーが正しく作成される', () => {
      const error = new ConfigError('設定エラー', { config: 'test' });
      expect(error.message).toBe('設定エラー');
      expect(error.name).toBe('ConfigError');
      expect(error.metadata).toEqual({ config: 'test' });
      expect(error instanceof ConfigError).toBe(true);
      expect(error instanceof AppError).toBe(true);
=======
    test('設定エラーを生成する', () => {
      const metadata = { config: 'test.json' };
      const error = new ConfigError('設定ファイルが見つかりません', metadata);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('設定エラー: 設定ファイルが見つかりません');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.metadata).toEqual(metadata);
>>>>>>> feature/error-handling-tests
    });
  });

  describe('ProxyError', () => {
<<<<<<< HEAD
    test('プロキシエラーが正しく作成される', () => {
      const metadata = { url: 'http://example.com', status: 500 };
      const error = new ProxyError('プロキシエラー', metadata);
      expect(error.message).toBe('プロキシエラー');
      expect(error.name).toBe('ProxyError');
      expect(error.metadata).toEqual(metadata);
      expect(error instanceof ProxyError).toBe(true);
      expect(error instanceof AppError).toBe(true);
=======
    test('プロキシエラーを生成する', () => {
      const metadata = { url: 'http://example.com' };
      const error = new ProxyError('プロキシ接続エラー', metadata);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('プロキシエラー: プロキシ接続エラー');
      expect(error.code).toBe('PROXY_ERROR');
      expect(error.statusCode).toBe(502);
      expect(error.metadata).toEqual(metadata);
>>>>>>> feature/error-handling-tests
    });
  });

  describe('isAppError', () => {
<<<<<<< HEAD
    test('AppErrorとそのサブクラスを正しく判定する', () => {
      const appError = new AppError('AppError');
      const networkError = new NetworkError('NetworkError');
      const llmError = new LLMError('LLMError');
      const configError = new ConfigError('ConfigError');
      const proxyError = new ProxyError('ProxyError');
      const standardError = new Error('StandardError');

      expect(isAppError(appError)).toBe(true);
      expect(isAppError(networkError)).toBe(true);
      expect(isAppError(llmError)).toBe(true);
      expect(isAppError(configError)).toBe(true);
      expect(isAppError(proxyError)).toBe(true);
      expect(isAppError(standardError)).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
=======
    test('AppErrorのインスタンスを正しく判定する', () => {
      const appError = new AppError('テストエラー');
      const networkError = new NetworkError('ネットワークエラー');
      const standardError = new Error('標準エラー');

      expect(isAppError(appError)).toBe(true);
      expect(isAppError(networkError)).toBe(true);
      expect(isAppError(standardError)).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError({})).toBe(false);
    });
  });
});

describe('エラーユーティリティのテスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logError', () => {
    test('AppErrorの詳細情報がログに記録される', () => {
      const error = new AppError('テストエラー', 'TEST_ERROR', 400, { test: true });
      logError(mockLogger, error, 'テスト');
      expect(mockLogger.error).toHaveBeenCalledWith('エラーが発生しました:', expect.objectContaining({
        message: 'テストエラー',
        code: 'TEST_ERROR',
        statusCode: 400,
        metadata: { test: true },
        context: 'テスト',
      }));
    });

    test('標準エラーが適切にログに記録される', () => {
      const error = new Error('標準エラー');
      logError(mockLogger, error, 'テスト');
      expect(mockLogger.error).toHaveBeenCalledWith('エラーが発生しました:', expect.objectContaining({
        message: '標準エラー',
        context: 'テスト',
      }));
    });
  });

  describe('handleErrorWithFallback', () => {
    test('操作が成功した場合は結果を返す', async () => {
      const operation = jest.fn().mockResolvedValue('成功');
      const fallback = jest.fn().mockReturnValue('フォールバック');

      const result = await handleErrorWithFallback(
        mockLogger,
        operation,
        fallback,
        'テスト'
      );

      expect(result).toBe('成功');
      expect(operation).toHaveBeenCalled();
      expect(fallback).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    test('操作が失敗した場合はフォールバック値を返す', async () => {
      const error = new Error('テストエラー');
      const operation = jest.fn().mockRejectedValue(error);
      const fallback = jest.fn().mockReturnValue('フォールバック');

      const result = await handleErrorWithFallback(
        mockLogger,
        operation,
        fallback,
        'テスト'
      );

      expect(result).toBe('フォールバック');
      expect(operation).toHaveBeenCalled();
      expect(fallback).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
>>>>>>> feature/error-handling-tests
    });
  });
});
