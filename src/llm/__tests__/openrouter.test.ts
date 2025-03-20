import { OpenRouterFilter } from '../openrouter';
import { Config } from '../../config';
import { ProxyContext } from '../../proxy/types';

// OpenAIクライアントをモック化
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: 'フィルタリングされたコンテンツ',
                  },
                },
              ],
            }),
          },
        },
      };
    }),
  };
});

describe('OpenRouterFilter', () => {
  let config: Config;
  let context: ProxyContext;

  beforeEach(() => {
    // テスト用の設定を作成
    config = {
      port: 8080,
      host: '127.0.0.1',
      ignoreRobotsTxt: false,
      timeout: 30000,
      llm: {
        enabled: true,
        type: 'openrouter',
        model: 'anthropic/claude-3-opus:beta',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: 'test-api-key',
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

    // テスト用のコンテキストを作成
    context = {
      req: {} as any,
      res: {} as any,
      logger: {
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
      } as any,
      ignoreRobotsTxt: false,
    };
  });

  test('フィルターが正しく初期化される', () => {
    const filter = new OpenRouterFilter(config);
    expect(filter.name).toBe('OpenRouterFilter');
  });

  test('APIキーが設定されていない場合はエラーがスローされる', () => {
    const invalidConfig = { ...config };
    invalidConfig.llm.apiKey = '';

    expect(() => {
      new OpenRouterFilter(invalidConfig);
    }).toThrow('OpenRouterフィルターにはAPIキーが必要です');
  });

  test('LLMが無効の場合は元のコンテンツが返される', async () => {
    const disabledConfig = { ...config };
    disabledConfig.llm.enabled = false;

    const filter = new OpenRouterFilter(disabledConfig);
    const result = await filter.filter('テストコンテンツ', context);

    expect(result).toBe('テストコンテンツ');
  });

  test('フィルターが正しくコンテンツをフィルタリングする', async () => {
    const filter = new OpenRouterFilter(config);
    const result = await filter.filter('テストコンテンツ', context);

    expect(result).toBe('フィルタリングされたコンテンツ');
  });
});
