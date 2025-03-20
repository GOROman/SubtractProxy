import express from 'express';
import httpProxy from 'http-proxy';
import { Config } from '../config';
import { createLogger } from '../utils/logger';
import { ContentFilter, ProxyContext } from './types';

export class ProxyServer {
  private app: express.Application;
  private proxy: httpProxy;
  private logger: ReturnType<typeof createLogger>;
  private filters: ContentFilter[] = [];

  constructor(private config: Config) {
    this.app = express();
    this.proxy = httpProxy.createProxyServer({});
    this.logger = createLogger(config);
    this.setupProxy();
  }

  private setupProxy(): void {
    this.proxy.on('proxyReq', (proxyReq, _req, _res): void => {
      if (this.config.ignoreRobotsTxt) {
        proxyReq.setHeader('User-Agent', 'SubtractProxy/1.0');
      }
    });

    this.proxy.on('proxyRes', async (proxyRes, req, res): Promise<void> => {
      const context: ProxyContext = {
        req: req as express.Request,
        res: res as express.Response,
        logger: this.logger,
        ignoreRobotsTxt: this.config.ignoreRobotsTxt,
      };

      let body = '';
      proxyRes.on('data', (chunk) => {
        body += chunk;
      });

      proxyRes.on('end', async () => {
        try {
          let modifiedContent = body;
          for (const filter of this.filters) {
            modifiedContent = await filter.filter(modifiedContent, context);
          }
          res.end(modifiedContent);
        } catch (error) {
          this.logger.error(
            'コンテンツフィルタリング中にエラーが発生しました:',
            error,
          );
          res.end(body);
        }
      });
    });

    this.app.use('/', (req, res): void => {
      this.proxy.web(req, res, {
        target: req.url,
        changeOrigin: true,
      });
    });
  }

  public addFilter(filter: ContentFilter): void {
    this.filters.push(filter);
    this.logger.info(`フィルター追加: ${filter.name}`);
  }

  public start(): void {
    this.app.listen(this.config.port, this.config.host, (): void => {
      this.logger.info(
        `プロキシサーバーが起動しました - http://${this.config.host}:${this.config.port}`,
      );
    });
  }
}
