import { Ollama } from 'ollama';
import { ContentFilter, ProxyContext } from '../proxy/types';
import { Config } from '../config';
import { processPromptTemplate } from './prompt';

export class OllamaFilter implements ContentFilter {
  name = 'OllamaFilter';
  private ollama: Ollama;

  constructor(private config: Config) {
    // LLM設定からホスト情報を取得
    const host =
      config.llm.baseUrl !== undefined
        ? config.llm.baseUrl
        : 'http://localhost:11434';

    // Ollamaクラスのコンストラクタには host プロパティを渡す
    this.ollama = new Ollama({
      host,
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

      // Ollamaリクエストの構築
      const messages = [
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

      const response = await this.ollama.chat({
        model: this.config.llm.model,
        messages,
      });

      return response.message.content;
    } catch (error) {
      context.logger.error(
        'Ollamaフィルタリング中にエラーが発生しました:',
        error,
      );
      return content;
    }
  }
}
