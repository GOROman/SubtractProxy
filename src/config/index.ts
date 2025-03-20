import { Config, ConfigSchema } from './types';
import { readJsonFile, resolveProjectPath } from '../utils/file';
import { getEnv, getEnvBoolean, getEnvNumber } from '../utils/env';
// pathモジュールは必要ないので削除

/**
 * デフォルト設定
 */
const defaultConfig: Config = {
  port: 8080,
  host: '127.0.0.1',
  ignoreRobotsTxt: false,
  timeout: 30000,
  llm: {
    enabled: true,
    type: 'ollama',
    model: 'gemma',
  },
  logging: {
    level: 'info',
  },
};

/**
 * 設定ファイルのパスを取得する
 * @returns 設定ファイルのパス
 */
export const getConfigFilePath = (): string => {
  // 環境変数から設定ファイルのパスを取得
  const configPath = getEnv('CONFIG_PATH');
  if (configPath) {
    return configPath;
  }

  // デフォルトは「プロジェクトルート/config.json」
  return resolveProjectPath('config.json');
};

/**
 * 環境変数から設定を上書きする
 * @param config 設定オブジェクト
 * @returns 環境変数で上書きされた設定
 */
export const overrideConfigFromEnv = (config: Config): Config => {
  const envConfig = { ...config };

  // サーバー設定
  const port = getEnvNumber('PORT');
  if (port !== undefined) envConfig.port = port;

  const host = getEnv('HOST');
  if (host !== undefined) envConfig.host = host;

  const timeout = getEnvNumber('TIMEOUT');
  if (timeout !== undefined) envConfig.timeout = timeout;

  const ignoreRobotsTxt = getEnvBoolean('IGNORE_ROBOTS_TXT');
  if (ignoreRobotsTxt !== undefined)
    envConfig.ignoreRobotsTxt = ignoreRobotsTxt;

  // LLM設定
  const llmEnabled = getEnvBoolean('LLM_ENABLED');
  if (llmEnabled !== undefined) envConfig.llm.enabled = llmEnabled;

  const llmType = getEnv('LLM_TYPE');
  if (llmType === 'ollama' || llmType === 'openrouter') {
    envConfig.llm.type = llmType;
  }

  const llmModel = getEnv('LLM_MODEL');
  if (llmModel !== undefined) envConfig.llm.model = llmModel;

  const llmApiKey = getEnv('LLM_API_KEY');
  if (llmApiKey !== undefined) envConfig.llm.apiKey = llmApiKey;

  const llmBaseUrl = getEnv('LLM_BASE_URL');
  if (llmBaseUrl !== undefined) envConfig.llm.baseUrl = llmBaseUrl;

  // ロギング設定
  const loggingLevel = getEnv('LOGGING_LEVEL');
  if (
    loggingLevel === 'error' ||
    loggingLevel === 'warn' ||
    loggingLevel === 'info' ||
    loggingLevel === 'debug'
  ) {
    envConfig.logging.level = loggingLevel;
  }

  const loggingFile = getEnv('LOGGING_FILE');
  if (loggingFile !== undefined) envConfig.logging.file = loggingFile;

  return envConfig;
};

/**
 * 設定をロードする
 * @returns 検証済みの設定オブジェクト
 */
export const loadConfig = (): Config => {
  try {
    // 設定ファイルのパスを取得
    const configPath = getConfigFilePath();

    // 設定ファイルが存在する場合は読み込む
    let config = defaultConfig;
    const fileConfig = readJsonFile<Partial<Config>>(configPath);

    if (fileConfig) {
      // ファイルからの設定とデフォルト設定をマージ
      config = { ...defaultConfig, ...fileConfig };
    }

    // 環境変数から設定を上書き
    config = overrideConfigFromEnv(config);

    // 設定を検証
    return ConfigSchema.parse(config);
  } catch (error) {
    console.error('設定のロードに失敗しました:', error);
    // エラーが発生した場合はデフォルト設定を返す
    return ConfigSchema.parse(defaultConfig);
  }
};

export type { Config } from './types';
export { ConfigSchema };
