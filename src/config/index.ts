import { Config, ConfigSchema } from './types';

const defaultConfig: Config = {
  port: 8080,
  host: '127.0.0.1',
  ignoreRobotsTxt: false,
  llm: {
    enabled: true,
    type: 'ollama',
    model: 'gemma',
  },
  logging: {
    level: 'info',
  },
};

export const loadConfig = (): Config => {
  // TODO: 設定ファイルからの読み込み実装
  return ConfigSchema.parse(defaultConfig);
};

export type { Config } from './types';
export { ConfigSchema };
