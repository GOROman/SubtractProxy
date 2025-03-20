/**
 * エラーハンドリングミドルウェアのテスト
 *
 * @description
 * エラーハンドリングミドルウェアの機能をテストします。
 * 各種エラーの処理が適切に行われることを確認します。
 */

import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  NetworkError,
  LLMError,
  ConfigError,
  ProxyError,
} from '../../utils/errors';
import { errorHandler } from '../error-handler';
import { createLogger } from '../../utils/logger';

describe('エラーハンドリングミドルウェア', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockLogger: ReturnType<typeof createLogger>;

  /**
   * 各テストの前に実行されるセットアップ処理
   */
  beforeEach(() => {
    // Expressのモックオブジェクトを設定
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRequest = {};
    mockResponse = {
      status: mockStatus,
    };
    nextFunction = jest.fn();

    // ロガーのモックを設定
    mockLogger = createLogger({
      port: 8080,
      host: 'localhost',
      ignoreRobotsTxt: false,
      timeout: 30000,
      userAgent: {
        enabled: false,
        rotate: false,
      },
      llm: {
        enabled: false,
        type: 'ollama',
        model: 'gemma',
      },
      logging: {
        level: 'error',
      },
      filtering: {
        enabled: false,
        configPath: undefined,
      },
    });
  });

  /**
   * AppErrorのハンドリングテスト
   *
   * @description
   * AppErrorが正しく処理され、適切なステータスコードと
   * エラーメッセージが返されることを確認します。
   */
  test('AppErrorを適切に処理する', () => {
    // テスト用のエラーオブジェクトを作成
    const error = new AppError(
      'アプリケーションエラー',
      'APP_ERROR',
      500,
      { detail: 'テスト' }
    );

    // エラーハンドラーを実行
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    // ステータスコードとエラーレスポンスを検証
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
        message: 'アプリケーションエラー',
        code: 'APP_ERROR',
        metadata: { detail: 'テスト' },
      },
    });
  });

  /**
   * NetworkErrorのハンドリングテスト
   *
   * @description
   * NetworkErrorが正しく処理され、503ステータスコードと
   * 適切なエラーメッセージが返されることを確認します。
   */
  test('NetworkErrorを適切に処理する', () => {
    // 元のエラーとNetworkErrorを作成
    const originalError = new Error('接続エラー');
    const error = new NetworkError('ネットワークエラー', originalError);

    // エラーハンドラーを実行
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    // ステータスコードとエラーレスポンスを検証
    expect(mockStatus).toHaveBeenCalledWith(503);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
        message: 'ネットワークエラー: ネットワークエラー',
        code: 'NETWORK_ERROR',
      },
    });
  });

  /**
   * LLMErrorのハンドリングテスト
   *
   * @description
   * LLMErrorが正しく処理され、適切なステータスコードと
   * メタデータを含むエラーメッセージが返されることを確認します。
   */
  test('LLMErrorを適切に処理する', () => {
    // テスト用のLLMエラーを作成
    const error = new LLMError('LLMエラー', { model: 'test-model' });

    // エラーハンドラーを実行
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    // ステータスコードとエラーレスポンスを検証
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
        message: 'LLMエラー: LLMエラー',
        code: 'LLM_ERROR',
        metadata: { model: 'test-model' },
      },
    });
  });

  /**
   * ConfigErrorのハンドリングテスト
   *
   * @description
   * ConfigErrorが正しく処理され、適切なステータスコードと
   * 設定関連のメタデータを含むエラーメッセージが返されることを
   * 確認します。
   */
  test('ConfigErrorを適切に処理する', () => {
    // テスト用の設定エラーを作成
    const error = new ConfigError('設定エラー', { config: 'test' });

    // エラーハンドラーを実行
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    // ステータスコードとエラーレスポンスを検証
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
        message: '設定エラー: 設定エラー',
        code: 'CONFIG_ERROR',
        metadata: { config: 'test' },
      },
    });
  });

  /**
   * ProxyErrorのハンドリングテスト
   *
   * @description
   * ProxyErrorが正しく処理され、502ステータスコードと
   * URL情報を含むメタデータが返されることを確認します。
   */
  test('ProxyErrorを適切に処理する', () => {
    // テスト用のプロキシエラーを作成
    const error = new ProxyError(
      'プロキシエラー',
      { url: 'http://example.com' }
    );

    // エラーハンドラーを実行
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    // ステータスコードとエラーレスポンスを検証
    expect(mockStatus).toHaveBeenCalledWith(502);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
        message: 'プロキシエラー: プロキシエラー',
        code: 'PROXY_ERROR',
        metadata: { url: 'http://example.com' },
      },
    });
  });
});

  /**
   * 一般的なErrorのハンドリングテスト
   *
   * @description
   * 標準のErrorオブジェクトが正しく処理され、500ステータスコードと
   * 適切なエラーメッセージが返されることを確認します。
   */
  test('一般的なErrorを適切に処理する', () => {
    // テスト用の標準エラーを作成
    const error = new Error('一般的なエラー');

    // エラーハンドラーを実行
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    // ステータスコードとエラーレスポンスを検証
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
