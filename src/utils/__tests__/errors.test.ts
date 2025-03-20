/**
 * エラーハンドリングのテスト
 */

import {
  AppError,
  NetworkError,
  LLMError,
  ConfigError,
  ProxyError,
  isAppError,
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
    });
  });

  describe('NetworkError', () => {
    test('ネットワークエラーが正しく作成される', () => {
      const originalError = new Error('接続エラー');
      const error = new NetworkError('ネットワークエラー', originalError);
      expect(error.message).toBe('ネットワークエラー');
      expect(error.name).toBe('NetworkError');
      expect(error.cause).toBe(originalError);
      expect(error instanceof NetworkError).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('LLMError', () => {
    test('LLMエラーが正しく作成される', () => {
      const metadata = { model: 'test-model', prompt: 'test-prompt' };
      const error = new LLMError('LLMエラー', metadata);
      expect(error.message).toBe('LLMエラー');
      expect(error.name).toBe('LLMError');
      expect(error.metadata).toEqual(metadata);
      expect(error instanceof LLMError).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('ConfigError', () => {
    test('設定エラーが正しく作成される', () => {
      const error = new ConfigError('設定エラー', { config: 'test' });
      expect(error.message).toBe('設定エラー');
      expect(error.name).toBe('ConfigError');
      expect(error.metadata).toEqual({ config: 'test' });
      expect(error instanceof ConfigError).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('ProxyError', () => {
    test('プロキシエラーが正しく作成される', () => {
      const metadata = { url: 'http://example.com', status: 500 };
      const error = new ProxyError('プロキシエラー', metadata);
      expect(error.message).toBe('プロキシエラー');
      expect(error.name).toBe('ProxyError');
      expect(error.metadata).toEqual(metadata);
      expect(error instanceof ProxyError).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('isAppError', () => {
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
    });
  });
});
