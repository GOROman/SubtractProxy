import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import { ContentFilter, ProxyContext } from '../proxy/types';
import { Config } from '../config';
import { processPromptTemplate } from './prompt';

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
      // コンテキスト情報から追加変数を作成
      const additionalVars: Record<string, string> = {
        url: context.url || '',
        method: context.method || '',
        contentType: context.contentType || '',
        userAgent: typeof context.userAgent === 'string' ? context.userAgent : '',
      };

      // プロンプトテンプレートを処理
      const promptTemplate = processPromptTemplate(
        this.config.llm.prompt,
        content,
        additionalVars
      );

      // OpenRouterリクエストの構築
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: promptTemplate.system,
        },
      ];

      // ユーザープロンプトが設定されている場合は追加
      if (promptTemplate.user) {
        messages.push({
          role: 'user',
          content: promptTemplate.user,
        });
      } else {
        // デフォルトではコンテンツをそのまま使用
        messages.push({
          role: 'user',
          content,
        });
      }

      // OpenRouterを使用してコンテンツをフィルタリング
      const response = await this.client.chat.completions.create({
        model: this.config.llm.model,
        messages,
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
