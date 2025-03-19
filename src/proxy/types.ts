import { IncomingMessage, ServerResponse } from 'http';
import { Logger } from 'winston';

export interface ProxyContext {
  req: IncomingMessage;
  res: ServerResponse;
  logger: Logger;
  ignoreRobotsTxt: boolean;
}

export interface ContentFilter {
  name: string;
  filter: (content: string, context: ProxyContext) => Promise<string>;
}
