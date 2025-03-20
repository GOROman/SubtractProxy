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
}

export interface ContentFilter {
  name: string;
  filter: (content: string, context: ProxyContext) => Promise<string>;
}
