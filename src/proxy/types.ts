import { IncomingMessage, ServerResponse } from 'http';
import { Logger } from 'winston';
import { IncomingHttpHeaders } from 'http';

export interface ProxyContext {
  req: IncomingMessage;
  res: ServerResponse;
  logger: Logger;
  ignoreRobotsTxt: boolean;
  originalUrl?: string;
  statusCode?: number;
  headers?: IncomingHttpHeaders;
  userAgent?: string;
  // プロンプト変数として使用するプロパティ
  url?: string;
  method?: string;
  contentType?: string;
  // 元のuserAgent設定
  userAgentConfig?: {
    enabled: boolean;
    value?: string;
    rotate: boolean;
    presets?: string[];
  };
}

export interface ContentFilter {
  name: string;
  filter: (content: string, context: ProxyContext) => Promise<string>;
}
