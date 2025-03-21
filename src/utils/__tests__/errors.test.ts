/**
 * エラーハンドリングのテスト
 */

import winston from 'winston';
import {
  AppError,
  NetworkError,
  LLMError,
  ConfigError,
  ProxyError,
  isAppError,
  logError,
  handleErrorWithFallback,
} from '../errors';

// モックロガー
const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  silly: jest.fn(),
  verbose: jest.fn(),
  http: jest.fn(),
  log: jest.fn(),
  add: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
  close: jest.fn(),
  profile: jest.fn(),
  startTimer: jest.fn(),
  exceptions: {
    handle: jest.fn(),
    unhandle: jest.fn(),
    logger: undefined,
    handlers: [],
    catcher: jest.fn(),
    getAllInfo: jest.fn(),
    getProcessInfo: jest.fn(),
    getOsInfo: jest.fn(),
    getTrace: jest.fn()
  },
  rejections: {
    handle: jest.fn(),
    unhandle: jest.fn(),
    logger: undefined,
    handlers: [],
    catcher: jest.fn(),
    getAllInfo: jest.fn(),
    getProcessInfo: jest.fn(),
    getOsInfo: jest.fn(),
    getTrace: jest.fn()
  },
  profilers: new Map(),
  exitOnError: false,
  silent: false,
  format: winston.format.json(),
  levels: winston.config.npm.levels,
  level: 'info',
  transports: [],
  write: jest.fn(),
  stream: jest.fn(),
  setMaxListeners: jest.fn(),
  getMaxListeners: jest.fn(),
  emit: jest.fn(),
  addListener: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  prependListener: jest.fn(),
  prependOnceListener: jest.fn(),
  removeListener: jest.fn(),
  off: jest.fn(),
  removeAllListeners: jest.fn(),
  listeners: jest.fn(),
  rawListeners: jest.fn(),
  listenerCount: jest.fn(),
  eventNames: jest.fn(),
  help: jest.fn(),
  data: jest.fn(),
  prompt: jest.fn(),
  input: jest.fn(),
  emerg: jest.fn(),
  alert: jest.fn(),
  crit: jest.fn(),
  warning: jest.fn(),
  notice: jest.fn(),
  eror: jest.fn(),
  child: jest.fn(),
  defaultMeta: {},
  isLevelEnabled: jest.fn(),
  query: jest.fn(),
  configure: jest.fn(),
  cli: jest.fn(),
  handleRejections: jest.fn(),
  handleExceptions: jest.fn(),
  unhandleRejections: jest.fn(),
  unhandleExceptions: jest.fn(),
  createLogger: jest.fn(),
  loggers: new Map(),
  container: jest.fn(),
  addColors: jest.fn(),
  setLevels: jest.fn(),
  config: jest.fn(),
  addLevel: jest.fn(),
  clone: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  destroy: jest.fn(),
  _destroy: jest.fn(),
  _final: jest.fn(),
  _write: jest.fn(),
  _writev: jest.fn(),
  _read: jest.fn(),
  pipe: jest.fn(),
  unpipe: jest.fn(),
  unshift: jest.fn(),
  wrap: jest.fn(),
  push: jest.fn(),
  _transform: jest.fn(),
  _flush: jest.fn(),
  cork: jest.fn(),
  uncork: jest.fn(),
  setEncoding: jest.fn(),
  read: jest.fn(),
  isPaused: jest.fn(),
  setDefaultEncoding: jest.fn()
} as unknown as winston.Logger;

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
    });
  });

  describe('NetworkError', () => {
    test('ネットワークエラーを生成する', () => {
      const originalError = new Error('元のエラー');
      const error = new NetworkError('接続エラー', originalError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('ネットワークエラー: 接続エラー');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.statusCode).toBe(503);
      expect(error.cause).toBe(originalError);
    });
  });

  describe('LLMError', () => {
    test('LLMエラーを生成する', () => {
      const metadata = { model: 'test-model' };
      const error = new LLMError('モデルエラー', metadata);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('LLMエラー: モデルエラー');
      expect(error.code).toBe('LLM_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.metadata).toEqual(metadata);
    });
  });

  describe('ConfigError', () => {
    test('設定エラーを生成する', () => {
      const metadata = { config: 'test.json' };
      const error = new ConfigError('設定ファイルが見つかりません', metadata);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('設定エラー: 設定ファイルが見つかりません');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.metadata).toEqual(metadata);
    });
  });

  describe('ProxyError', () => {
    test('プロキシエラーを生成する', () => {
      const metadata = { url: 'http://example.com' };
      const error = new ProxyError('プロキシ接続エラー', metadata);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('プロキシエラー: プロキシ接続エラー');
      expect(error.code).toBe('PROXY_ERROR');
      expect(error.statusCode).toBe(502);
      expect(error.metadata).toEqual(metadata);
    });
  });

  describe('isAppError', () => {
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
        stack: expect.any(String),
        context: 'テスト'
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
        fallback
      );

      expect(result).toBe('成功');
      expect(operation).toHaveBeenCalled();
      expect(fallback).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    test('操作が失敗した場合はフォールバック値を返す', async () => {
      const error = new AppError('テストエラー');
      const operation = jest.fn().mockRejectedValue(error);
      const fallback = jest.fn().mockResolvedValue('フォールバック');

      const result = await handleErrorWithFallback(
        mockLogger,
        operation,
        fallback
      );

      expect(result).toBe('フォールバック');
      expect(operation).toHaveBeenCalled();
      expect(fallback).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('フォールバック処理も失敗した場合のエラーハンドリング', async () => {
      const error = new AppError('テストエラー');
      const fallbackError = new Error('フォールバックエラー');
      const operation = jest.fn().mockRejectedValue(error);
      const fallback = jest.fn().mockRejectedValue(fallbackError);

      await expect(handleErrorWithFallback(
        mockLogger,
        operation,
        fallback
      )).rejects.toThrow('フォールバックエラー');
      expect(operation).toHaveBeenCalled();
      expect(fallback).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

