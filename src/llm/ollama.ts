import { Ollama } from 'ollama';
import { ContentFilter, ProxyContext } from '../proxy/types';
import { Config } from '../config';

export class OllamaFilter implements ContentFilter {
  name = 'OllamaFilter';
  private ollama: Ollama;

  constructor(private config: Config) {
    // baseUrlが設定されていない場合はデフォルト値を使用
    const baseUrl = config.llm.baseUrl !== undefined 
      ? config.llm.baseUrl 
      : 'http://localhost:11434';
      
    this.ollama = new Ollama({
      baseUrl,
    });
  }

  async filter(content: string, context: ProxyContext): Promise<string> {
    if (!this.config.llm.enabled) {
      return content;
    }

    try {
      const response = await this.ollama.chat({
        model: this.config.llm.model,
        messages: [
          {
            role: 'system',
            content: 'あなたはWebコンテンツフィルターです。以下のコンテンツを分析し、不要な情報を削除または要約してください。',
          },
          {
            role: 'user',
            content,
          },
        ],
      });

      return response.message.content;
    } catch (error) {
      context.logger.error('Ollamaフィルタリング中にエラーが発生しました:', error);
      return content;
    }
  }
}
