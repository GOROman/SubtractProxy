import { loadConfig, getConfigFilePath, overrideConfigFromEnv } from '../index';
import { Config } from '../types';
import * as fileUtils from '../../utils/file';
import * as envUtils from '../../utils/env';

// モック関数
jest.mock('../../utils/file');
jest.mock('../../utils/env');

describe('設定管理機能のテスト', () => {
  // テスト前の準備
  beforeEach(() => {
    jest.resetAllMocks();

    // デフォルトのモック実装
    jest
      .spyOn(fileUtils, 'resolveProjectPath')
      .mockImplementation((path) => `/project/${path}`);
    jest.spyOn(envUtils, 'getEnv').mockImplementation(() => undefined);
    jest.spyOn(envUtils, 'getEnvNumber').mockImplementation(() => undefined);
    jest.spyOn(envUtils, 'getEnvBoolean').mockImplementation(() => undefined);
  });

  describe('getConfigFilePath', () => {
    test('環境変数が設定されていない場合、デフォルトパスを返す', () => {
      const path = getConfigFilePath();
      expect(path).toBe('/project/config.json');
      expect(envUtils.getEnv).toHaveBeenCalledWith('CONFIG_PATH');
    });

    test('環境変数が設定されている場合、環境変数のパスを返す', () => {
      jest.spyOn(envUtils, 'getEnv').mockImplementation((key) => {
        if (key === 'CONFIG_PATH') return '/custom/path/config.json';
        return undefined;
      });

      const path = getConfigFilePath();
      expect(path).toBe('/custom/path/config.json');
    });
  });

  describe('overrideConfigFromEnv', () => {
    const baseConfig: Config = {
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

    test('環境変数が設定されていない場合、元の設定を返す', () => {
      const config = overrideConfigFromEnv(baseConfig);
      expect(config).toEqual(baseConfig);
    });

    test('サーバー設定の環境変数が設定されている場合、設定を上書きする', () => {
      jest.spyOn(envUtils, 'getEnvNumber').mockImplementation((key) => {
        if (key === 'PORT') return 3000;
        return undefined;
      });

      jest.spyOn(envUtils, 'getEnv').mockImplementation((key) => {
        if (key === 'HOST') return '0.0.0.0';
        return undefined;
      });

      jest.spyOn(envUtils, 'getEnvBoolean').mockImplementation((key) => {
        if (key === 'IGNORE_ROBOTS_TXT') return true;
        return undefined;
      });

      const config = overrideConfigFromEnv(baseConfig);
      expect(config.port).toBe(3000);
      expect(config.host).toBe('0.0.0.0');
      expect(config.ignoreRobotsTxt).toBe(true);
    });

    test('LLM設定の環境変数が設定されている場合、設定を上書きする', () => {
      jest.spyOn(envUtils, 'getEnvBoolean').mockImplementation((key) => {
        if (key === 'LLM_ENABLED') return false;
        return undefined;
      });

      jest.spyOn(envUtils, 'getEnv').mockImplementation((key) => {
        if (key === 'LLM_TYPE') return 'openrouter';
        if (key === 'LLM_MODEL') return 'gpt-4';
        if (key === 'LLM_API_KEY') return 'test-api-key';
        if (key === 'LLM_BASE_URL') return 'https://api.example.com';
        return undefined;
      });

      const config = overrideConfigFromEnv(baseConfig);
      expect(config.llm.enabled).toBe(false);
      expect(config.llm.type).toBe('openrouter');
      expect(config.llm.model).toBe('gpt-4');
      expect(config.llm.apiKey).toBe('test-api-key');
      expect(config.llm.baseUrl).toBe('https://api.example.com');
    });

    test('ロギング設定の環境変数が設定されている場合、設定を上書きする', () => {
      jest.spyOn(envUtils, 'getEnv').mockImplementation((key) => {
        if (key === 'LOGGING_LEVEL') return 'debug';
        if (key === 'LOGGING_FILE') return 'custom.log';
        return undefined;
      });

      const config = overrideConfigFromEnv(baseConfig);
      expect(config.logging.level).toBe('debug');
      expect(config.logging.file).toBe('custom.log');
    });
  });

  describe('loadConfig', () => {
    test('設定ファイルが存在しない場合、デフォルト設定を返す', () => {
      jest.spyOn(fileUtils, 'readJsonFile').mockReturnValue(null);

      const config = loadConfig();
      expect(config.port).toBe(8080);
      expect(config.host).toBe('127.0.0.1');
      expect(config.llm.type).toBe('ollama');
    });

    test('設定ファイルが存在する場合、ファイルの設定を読み込む', () => {
      jest.spyOn(fileUtils, 'readJsonFile').mockReturnValue({
        port: 3000,
        host: '0.0.0.0',
        llm: {
          type: 'openrouter',
          model: 'gpt-4',
        },
      });

      const config = loadConfig();
      expect(config.port).toBe(3000);
      expect(config.host).toBe('0.0.0.0');
      expect(config.llm.type).toBe('openrouter');
      expect(config.llm.model).toBe('gpt-4');
      // デフォルト値はそのまま
      expect(config.ignoreRobotsTxt).toBe(false);
      expect(config.llm.enabled).toBe(true);
    });

    test('環境変数が設定されている場合、ファイルの設定より優先される', () => {
      jest.spyOn(fileUtils, 'readJsonFile').mockReturnValue({
        port: 3000,
        host: '0.0.0.0',
      });

      jest.spyOn(envUtils, 'getEnvNumber').mockImplementation((key) => {
        if (key === 'PORT') return 4000;
        return undefined;
      });

      const config = loadConfig();
      expect(config.port).toBe(4000); // 環境変数の値
      expect(config.host).toBe('0.0.0.0'); // ファイルの値
    });

    test('設定の検証に失敗した場合、デフォルト設定を返す', () => {
      // 不正な設定を返す
      jest.spyOn(fileUtils, 'readJsonFile').mockReturnValue({
        port: 'invalid-port', // 数値であるべき
      } as any);

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const config = loadConfig();
      expect(config.port).toBe(8080); // デフォルト値
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
