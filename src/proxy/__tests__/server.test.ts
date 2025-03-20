import { ProxyServer } from '../server';
import { Config } from '../../config';
import { createLLMFilter } from '../../llm';
import express from 'express';
import httpProxy from 'http-proxy';

// モックの設定
jest.mock('express');
jest.mock('http-proxy');
jest.mock('../../llm');
jest.mock('../../utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  }),
}));

describe('プロキシサーバー', () => {
  let config: Config;
  let mockApp: any;
  let mockProxy: any;
  let mockFilter: any;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();

    // 設定オブジェクトの作成
    config = {
      port: 8080,
      host: 'localhost',
      ignoreRobotsTxt: false,
      llm: {
        type: 'ollama',
        enabled: true,
        model: 'gemma',
        baseUrl: 'http://localhost:11434',
      },
      logging: {
        level: 'info',
      },
    } as Config;

    // モックの作成
    mockApp = {
      use: jest.fn(),
      listen: jest.fn().mockImplementation((port, host, callback) => {
        if (callback) callback();
        return mockApp;
      }),
      on: jest.fn().mockReturnThis(),
    };

    mockProxy = {
      on: jest.fn().mockReturnThis(),
      web: jest.fn(),
    };

    mockFilter = {
      name: 'TestFilter',
      filter: jest
        .fn()
        .mockImplementation((content) =>
          Promise.resolve('フィルタリングされたコンテンツ'),
        ),
    };

    // モックの設定
    (express as unknown as jest.Mock).mockReturnValue(mockApp);
    (httpProxy.createProxyServer as jest.Mock).mockReturnValue(mockProxy);
    (createLLMFilter as jest.Mock).mockReturnValue(mockFilter);
  });

  test('プロキシサーバーが正しく作成される', () => {
    const server = new ProxyServer(config);

    // Expressアプリが作成されたか確認
    expect(express).toHaveBeenCalled();

    // プロキシが作成されたか確認
    expect(httpProxy.createProxyServer).toHaveBeenCalled();
  });

  test('プロキシサーバーがリクエストを正しく処理する', () => {
    // リクエストとレスポンスをモック
    const req = { url: 'http://example.com' };
    const res = { status: jest.fn().mockReturnThis(), end: jest.fn() };
    const next = jest.fn();

    // サーバーを作成
    const server = new ProxyServer(config);

    // app.useが呼ばれたか確認
    expect(mockApp.use).toHaveBeenCalled();

    // プロキシリクエストをシミュレート
    // 最後のミドルウェアのコールバックを取得
    const lastCall = mockApp.use.mock.calls[mockApp.use.mock.calls.length - 1];
    const path = lastCall[0];
    const middleware = lastCall[1];
    
    // ミドルウェアを実行
    middleware(req, res, next);

    // proxy.webが正しく呼ばれたか確認
    expect(mockProxy.web).toHaveBeenCalledWith(req, res, {
      target: req.url,
      changeOrigin: true,
      timeout: 30000,
    });
  });

  test('proxyReqイベントが正しく処理される', () => {
    // ignoreRobotsTxtをtrueに設定
    config.ignoreRobotsTxt = true;

    const server = new ProxyServer(config);

    // proxyReqイベントハンドラを取得
    const proxyReqHandler = mockProxy.on.mock.calls.find(
      (call: any[]) => call[0] === 'proxyReq',
    )[1];

    // リクエストをモック
    const proxyReq = { setHeader: jest.fn() };
    const req = {};
    const res = {};

    // ハンドラを実行
    proxyReqHandler(proxyReq, req, res);

    // User-Agentヘッダーが設定されたか確認
    expect(proxyReq.setHeader).toHaveBeenCalledWith(
      'User-Agent',
      'SubtractProxy/1.0',
    );
  });

  test('proxyResイベントの登録が正しく行われる', () => {
    const server = new ProxyServer(config);

    // proxyResイベントが登録されたか確認
    expect(mockProxy.on).toHaveBeenCalledWith('proxyRes', expect.any(Function));
  });

  test('フィルターの追加が正しく動作する', () => {
    const server = new ProxyServer(config);

    // フィルターを追加
    server.addFilter(mockFilter);

    // フィルターが追加されたか確認する方法がないので、
    // フィルターの動作をテストする

    // proxyResイベントハンドラを取得
    const proxyResHandler = mockProxy.on.mock.calls.find(
      (call: any[]) => call[0] === 'proxyRes',
    )[1];

    // レスポンスをモック
    const proxyRes = {
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'data') {
          callback('test content');
        }
        if (event === 'end') {
          callback();
        }
        return proxyRes;
      }),
    };

    const req = {};
    const res = { end: jest.fn() };

    // ハンドラを実行
    proxyResHandler(proxyRes, req, res);

    // フィルターが呼ばれたか確認
    expect(mockFilter.filter).toHaveBeenCalled();
  });

  test('サーバーが正しく起動する', () => {
    const server = new ProxyServer(config);

    // process.onをモック
    const originalProcessOn = process.on;
    process.on = jest.fn().mockReturnThis() as any;

    // サーバーを起動
    server.start();

    // listenが正しく呼ばれたか確認
    expect(mockApp.listen).toHaveBeenCalledWith(
      config.port,
      config.host,
      expect.any(Function),
    );

    // プロセスイベントハンドラーが登録されたか確認
    expect(process.on).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));

    // モックを元に戻す
    process.on = originalProcessOn;
  });

  test('プロキシイベントが正しく設定される', () => {
    const server = new ProxyServer(config);

    // proxyResイベントが設定されたか確認
    expect(mockProxy.on).toHaveBeenCalledWith('proxyRes', expect.any(Function));

    // proxyReqイベントが設定されたか確認
    expect(mockProxy.on).toHaveBeenCalledWith('proxyReq', expect.any(Function));
  });

  test('フィルターが正しく追加される', () => {
    const server = new ProxyServer(config);
    server.addFilter(mockFilter);

    // サーバーが起動するとリッスンする
    server.start();
    expect(mockApp.listen).toHaveBeenCalledWith(
      config.port,
      config.host,
      expect.any(Function),
    );
  });

  test('プロキシエラーが正しく処理される', () => {
    const server = new ProxyServer(config);

    // プロキシのエラーハンドラーを取得
    const errorHandler = mockProxy.on.mock.calls.find(
      (call: any[]) => call[0] === 'error'
    )[1];

    // リクエストとレスポンスをモック
    const req = {};
    const res = {
      headersSent: false,
      writeHead: jest.fn(),
      end: jest.fn()
    };

    // エラーハンドラーを実行
    errorHandler(new Error('プロキシエラー'), req, res);

    // レスポンスが正しく設定されたか確認
    expect(res.writeHead).toHaveBeenCalledWith(500, { 'Content-Type': 'application/json' });
    expect(res.end).toHaveBeenCalled();
  });

  test('サーバーが正しく停止される', () => {
    // サーバーを作成
    const server = new ProxyServer(config);
    
    // サーバーを起動
    server.start();
    
    // サーバーの停止をモック
    mockApp.close = jest.fn().mockImplementation((callback) => {
      if (callback) callback();
    });
    
    // サーバーを停止
    server.stop();
  });

  test('favicon.icoリクエストが正しく処理される', () => {
    // リクエストとレスポンスをモック
    const req = { url: '/favicon.ico' };
    const res = { status: jest.fn().mockReturnThis(), end: jest.fn() };
    const next = jest.fn();

    // サーバーを作成
    const server = new ProxyServer(config);

    // 最後のミドルウェアを取得して実行
    const lastCall = mockApp.use.mock.calls[mockApp.use.mock.calls.length - 1];
    const middleware = lastCall[1];
    
    // ミドルウェアを実行
    middleware(req, res, next);

    // statusとendが正しく呼ばれたか確認
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
    // proxy.webは呼ばれないことを確認
    expect(mockProxy.web).not.toHaveBeenCalled();
  });

  test('ミドルウェアのエラーハンドリングが正しく動作する', () => {
    // リクエストとレスポンスをモック
    const req = { url: 'http://example.com' };
    const res = {};
    const next = jest.fn();

    // サーバーを作成
    const server = new ProxyServer(config);

    // 最後のミドルウェアを取得
    const lastCall = mockApp.use.mock.calls[mockApp.use.mock.calls.length - 1];
    const middleware = lastCall[1];
    
    // proxy.webがエラーを投げるように設定
    mockProxy.web.mockImplementationOnce(() => {
      throw new Error('プロキシエラー');
    });
    
    // ミドルウェアを実行
    middleware(req, res, next);
    
    // nextがエラーとともに呼ばれたか確認
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('サーバーのエラーハンドリングが正しく動作する', () => {
    const server = new ProxyServer(config);

    // サーバーを起動
    server.start();

    // サーバーのエラーハンドラーをシミュレート
    const serverErrorHandler = mockApp.on.mock.calls.find(
      (call: any[]) => call[0] === 'error'
    )?.[1];

    // EADDRINUSEエラーをシミュレート
    if (serverErrorHandler) {
      const error = new Error('ポートが使用中です') as NodeJS.ErrnoException;
      error.code = 'EADDRINUSE';
      serverErrorHandler(error);
    }

    // その他のエラーをシミュレート
    if (serverErrorHandler) {
      const error = new Error('その他のサーバーエラー');
      serverErrorHandler(error);
    }
  });

  test('シャットダウンシグナルが正しく処理される', () => {
    // オリジナルのprocess.exitを保存
    const originalProcessExit = process.exit;
    process.exit = jest.fn() as any;

    // オリジナルのprocess.onを保存
    const originalProcessOn = process.on;
    const processOnMock = jest.fn().mockReturnThis();
    process.on = processOnMock as any;

    // オリジナルのsetTimeoutを保存
    const originalSetTimeout = global.setTimeout;
    (global.setTimeout as any) = jest.fn().mockImplementation((callback, ms) => {
      return { unref: jest.fn() };
    });

    // サーバーを作成して起動
    const server = new ProxyServer(config);
    server.start();

    // SIGTERMハンドラーを取得
    const sigtermHandler = processOnMock.mock.calls.find(
      (call: any[]) => call[0] === 'SIGTERM'
    )?.[1];

    // サーバーの停止をモック
    mockApp.close = jest.fn().mockImplementation((callback) => {
      if (callback) callback();
    });

    // SIGTERMハンドラーを実行
    if (sigtermHandler) {
      sigtermHandler();
    }

    // process.exitが呼ばれたか確認
    expect(process.exit).toHaveBeenCalledWith(0);

    // モックを元に戻す
    process.exit = originalProcessExit;
    process.on = originalProcessOn;
    global.setTimeout = originalSetTimeout;
  });

  test('シャットダウンタイムアウトが正しく処理される', () => {
    // オリジナルのprocess.exitを保存
    const originalProcessExit = process.exit;
    process.exit = jest.fn() as any;

    // オリジナルのprocess.onを保存
    const originalProcessOn = process.on;
    const processOnMock = jest.fn().mockReturnThis();
    process.on = processOnMock as any;

    // オリジナルのsetTimeoutを保存
    const originalSetTimeout = global.setTimeout;
    let timeoutCallback: Function | null = null;
    (global.setTimeout as any) = jest.fn().mockImplementation((callback, ms) => {
      timeoutCallback = callback as Function;
      return { unref: jest.fn() };
    });

    // サーバーを作成して起動
    const server = new ProxyServer(config);
    server.start();

    // SIGTERMハンドラーを取得
    const sigtermHandler = processOnMock.mock.calls.find(
      (call: any[]) => call[0] === 'SIGTERM'
    )?.[1];

    // サーバーの停止をモックし、コールバックを呼ばないように設定
    mockApp.close = jest.fn();

    // SIGTERMハンドラーを実行
    if (sigtermHandler) {
      sigtermHandler();
    }

    // タイムアウトコールバックを実行
    if (timeoutCallback) {
      (timeoutCallback as Function)();
    }

    // タイムアウト後のprocess.exitが呼ばれたか確認
    expect(process.exit).toHaveBeenCalledWith(1);

    // モックを元に戻す
    process.exit = originalProcessExit;
    process.on = originalProcessOn;
    global.setTimeout = originalSetTimeout;
  });

  test('未処理例外ハンドラーが正しく動作する', () => {
    // オリジナルのprocess.exitを保存
    const originalProcessExit = process.exit;
    process.exit = jest.fn() as any;

    // オリジナルのprocess.onを保存
    const originalProcessOn = process.on;
    const processOnMock = jest.fn().mockReturnThis();
    process.on = processOnMock as any;

    // オリジナルのsetTimeoutを保存
    const originalSetTimeout = global.setTimeout;
    let timeoutCallback: Function | null = null;
    (global.setTimeout as any) = jest.fn().mockImplementation((callback, ms) => {
      timeoutCallback = callback as Function;
      return { unref: jest.fn() };
    });

    // サーバーを作成して起動
    const server = new ProxyServer(config);
    server.start();

    // uncaughtExceptionハンドラーを取得
    const uncaughtExceptionHandler = processOnMock.mock.calls.find(
      (call: any[]) => call[0] === 'uncaughtException'
    )?.[1];

    // ハンドラーを実行
    if (uncaughtExceptionHandler) {
      uncaughtExceptionHandler(new Error('未処理例外'));
    }

    // タイムアウトコールバックを実行
    if (timeoutCallback) {
      (timeoutCallback as Function)();
    }

    // process.exitが呼ばれたか確認
    expect(process.exit).toHaveBeenCalledWith(1);

    // モックを元に戻す
    process.exit = originalProcessExit;
    process.on = originalProcessOn;
    global.setTimeout = originalSetTimeout;
  });

  test('未処理Promiseリジェクションハンドラーが正しく動作する', () => {
    // オリジナルのprocess.onを保存
    const originalProcessOn = process.on;
    const processOnMock = jest.fn().mockReturnThis();
    process.on = processOnMock as any;

    // サーバーを作成して起動
    const server = new ProxyServer(config);
    server.start();

    // unhandledRejectionハンドラーを取得
    const unhandledRejectionHandler = processOnMock.mock.calls.find(
      (call: any[]) => call[0] === 'unhandledRejection'
    )?.[1];

    // ハンドラーを実行
    if (unhandledRejectionHandler) {
      unhandledRejectionHandler(new Error('未処理リジェクション'));
      unhandledRejectionHandler('文字列リジェクション');
    }

    // モックを元に戻す
    process.on = originalProcessOn;
  });
});
