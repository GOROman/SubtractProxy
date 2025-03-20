import express from 'express';
import httpProxy from 'http-proxy';
import { Config } from '../config';
import { createLogger } from '../utils/logger';
import { ContentFilter, ProxyContext } from './types';
import {
  ProxyError,
  NetworkError,
  errorHandler,
  handleErrorWithFallback,
  logError,
} from '../utils/errors';

export class ProxyServer {
  private app: express.Application;
  private proxy: httpProxy;
  private logger: ReturnType<typeof createLogger>;
  private filters: ContentFilter[] = [];
  private server: ReturnType<typeof this.app.listen> | null = null;

  constructor(private config: Config) {
    this.app = express();
    this.proxy = httpProxy.createProxyServer({});
    this.logger = createLogger(config);
    this.setupProxy();
  }

  private setupProxy(): void {
    // プロキシエラーハンドリング
    this.proxy.on('error', (err, req, res): void => {
      const error = new ProxyError(
        `プロキシリクエスト中にエラーが発生しました: ${err.message}`,
      );
      logError(this.logger, error, 'proxy.error');

      // ServerResponseかどうかを確認
      if ('headersSent' in res && !res.headersSent) {
        if ('writeHead' in res) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
      }

      const errorResponse = {
        status: 'error',
        message:
          'プロキシサーバーでエラーが発生しました。しばらく経ってから再試行してください。',
        code: 'PROXY_ERROR',
      };

      // end()メソッドがあるか確認
      if ('end' in res) {
        res.end(JSON.stringify(errorResponse));
      }
    });

    this.proxy.on('proxyReq', (proxyReq, _req, _res): void => {
      try {
        if (this.config.ignoreRobotsTxt) {
          proxyReq.setHeader('User-Agent', 'SubtractProxy/1.0');
        }
      } catch (error) {
        logError(
          this.logger,
          error instanceof Error ? error : new Error(String(error)),
          'proxyReq.setHeader',
        );
      }
    });

    this.proxy.on('proxyRes', async (proxyRes, req, res): Promise<void> => {
      const context: ProxyContext = {
        req: req as express.Request,
        res: res as express.Response,
        logger: this.logger,
        ignoreRobotsTxt: this.config.ignoreRobotsTxt,
        originalUrl: (req as express.Request).originalUrl || '',
        statusCode: proxyRes.statusCode,
        headers: proxyRes.headers,
      };

      // レスポンスステータスコードのログ記録
      this.logger.debug(
        `プロキシレスポンス: ${proxyRes.statusCode} ` +
          `${(req as express.Request).method} ${(req as express.Request).url}`,
      );

      let body = '';
      let hasError = false;

      // データ受信中のエラーハンドリング
      proxyRes.on('error', (err) => {
        hasError = true;
        const error = new NetworkError(
          `レスポンスデータの受信中にエラーが発生しました: ${err.message}`,
        );
        logError(this.logger, error, 'proxyRes.data');

        // ServerResponseの型チェック
        const serverRes = res as express.Response;
        if (!serverRes.headersSent) {
          serverRes.writeHead(502, { 'Content-Type': 'application/json' });
          serverRes.end(
            JSON.stringify({
              status: 'error',
              message: 'コンテンツの取得中にエラーが発生しました。',
              code: 'CONTENT_FETCH_ERROR',
            }),
          );
        }
      });

      proxyRes.on('data', (chunk) => {
        try {
          body += chunk;
        } catch (error) {
          hasError = true;
          logError(
            this.logger,
            error instanceof Error ? error : new Error(String(error)),
            'proxyRes.data.chunk',
          );
        }
      });

      // 外部変数を使用してthisの参照を避ける
      const logger = this.logger;
      const filters = this.filters;

      proxyRes.on('end', async () => {
        if (hasError) return; // すでにエラー処理済みの場合は何もしない

        await handleErrorWithFallback(
          logger,
          async () => {
            let modifiedContent = body;

            // 各フィルターを順番に適用
            for (const filter of filters) {
              logger.debug(`フィルター適用: ${filter.name}`);
              modifiedContent = await filter.filter(modifiedContent, context);
            }

            // オリジナルのヘッダーをコピー（Content-Lengthは除外）
            for (const [key, value] of Object.entries(proxyRes.headers)) {
              if (
                key.toLowerCase() !== 'content-length' &&
                value !== undefined
              ) {
                res.setHeader(key, value);
              }
            }

            // 新しいコンテンツの長さに基づいてContent-Lengthを設定
            res.setHeader('Content-Length', Buffer.byteLength(modifiedContent));
            res.end(modifiedContent);
          },
          () => {
            // フォールバック: 元のコンテンツを返す
            logger.warn(
              'フィルタリング失敗のためオリジナルコンテンツを返します',
            );

            // オリジナルのヘッダーをコピー
            if (proxyRes.headers) {
              for (const [key, value] of Object.entries(proxyRes.headers)) {
                if (value !== undefined) {
                  res.setHeader(key, value);
                }
              }
            }

            res.end(body);
            return body;
          },
          'proxyRes.filter',
        );
      });
    });

    // エラーハンドリングミドルウェアの追加
    this.app.use(errorHandler(this.logger));

    // 404ハンドラー
    this.app.use('*', (req, res, next): void => {
      if (req.url === '/favicon.ico') {
        res.status(204).end(); // No Content for favicon requests
        return;
      }

      // リクエスト情報のログ記録
      this.logger.debug(`プロキシリクエスト: ${req.method} ${req.url}`);

      try {
        this.proxy.web(req, res, {
          target: req.url,
          changeOrigin: true,
          timeout: this.config.timeout || 30000, // タイムアウト設定（デフォルト30秒）
        });
      } catch (error) {
        next(error); // エラーハンドリングミドルウェアに渡す
      }
    });
  }

  public addFilter(filter: ContentFilter): void {
    this.filters.push(filter);
    this.logger.info(`フィルター追加: ${filter.name}`);
  }

  public stop(): void {
    if (this.server) {
      this.server.close(() => {
        this.logger.info('プロキシサーバーを停止しました');
      });
    }
  }

  public start(): ReturnType<typeof this.app.listen> {
    // プロセス全体の未処理例外ハンドラー
    process.on('uncaughtException', (error: Error) => {
      logError(this.logger, error, 'uncaughtException');
      this.logger.error('未処理の例外が発生しました。プロセスを終了します。');

      // 既存の接続を閉じるための猶予期間を設けてからプロセスを終了
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // 未処理のPromiseリジェクションハンドラー
    process.on('unhandledRejection', (reason: unknown) => {
      const error =
        reason instanceof Error ? reason : new Error(String(reason));
      logError(this.logger, error, 'unhandledRejection');
      this.logger.warn('未処理のPromiseリジェクションが発生しました。');
    });

    const server = this.app.listen(
      this.config.port,
      this.config.host,
      (): void => {
        this.logger.info(
          `プロキシサーバーが起動しました - http://${this.config.host}:${this.config.port}`,
        );
      },
    );

    this.server = server;

    // サーバーエラーハンドリング
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        this.logger.error(
          `ポート ${this.config.port} は既に使用されています。`,
        );
      } else {
        logError(this.logger, error, 'server.error');
      }
    });

    // 正常なシャットダウンのためのシグナルハンドリング
    const gracefulShutdown = (): void => {
      this.logger.info(
        'シャットダウンシグナルを受信しました。サーバーを停止します...',
      );
      server.close(() => {
        this.logger.info('サーバーが正常に停止しました。');
        process.exit(0);
      });

      // 強制終了のタイムアウト
      setTimeout(() => {
        this.logger.error(
          'サーバーの正常な停止に失敗しました。強制終了します。',
        );
        process.exit(1);
      }, 10000);
    };

    // シグナルハンドラーの登録
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    return server;
  }
}
