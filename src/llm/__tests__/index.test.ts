import { createLLMFilter } from '../index';
import { Config } from '../../config';

// モジュールをモック化
jest.mock('../ollama', () => {
  return {
    OllamaFilter: jest.fn().mockImplementation(() => ({
      name: 'OllamaFilter',
      filter: jest.fn().mockResolvedValue('フィルタリングされたコンテンツ'),
    })),
  };
});

jest.mock('../openrouter', () => {
  return {
    OpenRouterFilter: jest.fn().mockImplementation(() => ({
      name: 'OpenRouterFilter',
      filter: jest.fn().mockResolvedValue('フィルタリングされたコンテンツ'),
    })),
  };
});

// モックを取得
const { OllamaFilter: mockOllamaFilter } = jest.requireMock('../ollama');
const { OpenRouterFilter: mockOpenRouterFilter } =
  jest.requireMock('../openrouter');

describe('LLMフィルターファクトリー', () => {
  let config: Config;

  beforeEach(() => {
    // テスト用の設定を作成
    config = {
      port: 8080,
      host: '127.0.0.1',
      ignoreRobotsTxt: false,
      timeout: 30000,
      llm: {
        enabled: true,
        type: 'ollama',
        model: 'gemma',
        baseUrl: 'http://localhost:11434',
        apiKey: '',
      },
      logging: {
        level: 'info',
        file: 'proxy.log',
      },
      filtering: {
        enabled: false,
        configPath: 'config.filter.json',
      },
    };

    // モックをリセット
    jest.clearAllMocks();
  });

  test('Ollamaタイプの場合はOllamaFilterを返す', () => {
    config.llm.type = 'ollama';
    createLLMFilter(config);
    expect(mockOllamaFilter).toHaveBeenCalledWith(config);
  });

  test('OpenRouterタイプの場合はOpenRouterFilterを返す', () => {
    config.llm.type = 'openrouter';
    config.llm.apiKey = 'test-api-key';
    createLLMFilter(config);
    expect(mockOpenRouterFilter).toHaveBeenCalledWith(config);
  });

  test('未対応のLLMタイプの場合はエラーをスローする', () => {
    config.llm.type = 'unsupported' as any;
    expect(() => {
      createLLMFilter(config);
    }).toThrow('未対応のLLMタイプ: unsupported');
  });
});
