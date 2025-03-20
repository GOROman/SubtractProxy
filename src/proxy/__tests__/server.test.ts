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
    const server = new ProxyServer(config);

    // app.useが呼ばれたか確認
    expect(mockApp.use).toHaveBeenCalled();

    // useのコールバックを取得
    const useCallback = mockApp.use.mock.calls[0][1];

    // リクエストとレスポンスをモック
    const req = { url: 'http://example.com' };
    const res = {};

    // コールバックを実行
    useCallback(req, res);

    // proxy.webが正しく呼ばれたか確認
    expect(mockProxy.web).toHaveBeenCalledWith(req, res, {
      target: req.url,
      changeOrigin: true,
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

    // サーバーを起動
    server.start();

    // listenが正しく呼ばれたか確認
    expect(mockApp.listen).toHaveBeenCalledWith(
      config.port,
      config.host,
      expect.any(Function),
    );
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
});
