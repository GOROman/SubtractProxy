import { Config } from '../../config';
import { ProxyContext } from '../../proxy/types';

// Ollamaモジュールをモック化
jest.mock('ollama', () => {
  return {
    Ollama: jest.fn().mockImplementation(() => {
      return {
        chat: jest.fn().mockImplementation(async ({ model, messages }) => {
          return {
            message: {
              role: 'assistant',
              content: 'フィルタリングされたコンテンツ',
            },
          };
        }),
      };
    }),
  };
});

// 実際のOllamaFilterをインポート
import { OllamaFilter } from '../ollama';

describe('OllamaFilter', () => {
  let config: Config;
  let context: ProxyContext;

  beforeEach(() => {
    // テスト用の設定を作成
    config = {
      port: 8080,
      host: '127.0.0.1',
      ignoreRobotsTxt: false,
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

    // モックをリセット
    jest.clearAllMocks();
  });

  test('フィルターが正しく初期化される', () => {
    const filter = new OllamaFilter(config);
    expect(filter.name).toBe('OllamaFilter');
  });

  test('LLMが無効の場合は元のコンテンツが返される', async () => {
    const disabledConfig = { ...config };
    disabledConfig.llm.enabled = false;

    const filter = new OllamaFilter(disabledConfig);
    const result = await filter.filter('テストコンテンツ', context);

    expect(result).toBe('テストコンテンツ');
  });

  test('フィルターが正しくコンテンツをフィルタリングする', async () => {
    const filter = new OllamaFilter(config);
    const result = await filter.filter('テストコンテンツ', context);

    expect(result).toBe('フィルタリングされたコンテンツ');
  });

  test('LLMが無効の場合は元のコンテンツが返される', async () => {
    const disabledConfig = { ...config };
    disabledConfig.llm.enabled = false;

    const filter = new OllamaFilter(disabledConfig);
    const result = await filter.filter('テストコンテンツ', context);

    expect(result).toBe('テストコンテンツ');
  });

  test('カスタムベースURLを使用する', async () => {
    const customConfig = { ...config };
    customConfig.llm.baseUrl = 'http://custom-ollama:11434';

    const filter = new OllamaFilter(customConfig);
    const result = await filter.filter('テストコンテンツ', context);

    expect(result).toBe('フィルタリングされたコンテンツ');
  });

  test('Ollamaでエラーが発生した場合は元のコンテンツが返される', async () => {
    // エラーを発生させるためのモックを上書き
    const { Ollama } = require('ollama');
    Ollama.mockImplementation(() => {
      return {
        chat: jest.fn().mockRejectedValue(new Error('テストエラー')),
      };
    });

    const filter = new OllamaFilter(config);
    const result = await filter.filter('テストコンテンツ', context);

    // エラー時は元のコンテンツが返される
    expect(result).toBe('テストコンテンツ');
    // ロガーがエラーを記録したことを確認
    expect(context.logger.error).toHaveBeenCalled();
  });
});
