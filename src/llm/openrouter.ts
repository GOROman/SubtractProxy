import { OpenAI } from 'openai';
import { ContentFilter, ProxyContext } from '../proxy/types';
import { Config } from '../config';

export class OpenRouterFilter implements ContentFilter {
  name = 'OpenRouterFilter';
  private client: OpenAI;

  constructor(private config: Config) {
    // APIキーが設定されていない場合はエラーをスロー
    if (!config.llm.apiKey) {
      throw new Error('OpenRouterフィルターにはAPIキーが必要です');
    }

    // OpenRouterのベースURLを設定（デフォルトはOpenRouterのAPI URL）
    const baseURL = config.llm.baseUrl || 'https://openrouter.ai/api/v1';

    // OpenAIクライアントを初期化
    this.client = new OpenAI({
      apiKey: config.llm.apiKey,
      baseURL: baseURL,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/GOROman/SubtractProxy', // URL
        'X-Title': 'SubtractProxy', // アプリ名
      },
    });
  }

  async filter(content: string, context: ProxyContext): Promise<string> {
    if (!this.config.llm.enabled) {
      return content;
    }

    try {
      // OpenRouterを使用してコンテンツをフィルタリング
      const response = await this.client.chat.completions.create({
        model: this.config.llm.model,
        messages: [
          {
            role: 'system',
            content:
              'あなたはWebコンテンツフィルターです。以下のコンテンツを分析し、不要な情報を削除または要約してください。',
          },
          {
            role: 'user',
            content,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      // レスポンスからコンテンツを抽出
      return response.choices[0]?.message?.content || content;
    } catch (error) {
      // エラーをログに記録し、元のコンテンツを返す
      context.logger.error(
        'OpenRouterフィルタリング中にエラーが発生しました:',
        error,
      );
      return content;
    }
  }
}
