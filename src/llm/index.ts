import { Config } from '../config';
import { ContentFilter } from '../proxy/types';
import { OllamaFilter } from './ollama';
import { OpenRouterFilter } from './openrouter';

/**
 * LLMフィルターを作成するファクトリー関数
 * 
 * @param config アプリケーション設定
 * @returns 設定に基づいた適切なContentFilterインスタンス
 */
export function createLLMFilter(config: Config): ContentFilter {
  // LLMが無効の場合はダミーフィルターを返す
  if (!config.llm.enabled) {
    return {
      name: 'NoOpFilter',
      filter: async (content) => content,
    };
  }

  // 設定に基づいて適切なフィルターを作成
  switch (config.llm.type) {
    case 'ollama':
      return new OllamaFilter(config);
    case 'openrouter':
      return new OpenRouterFilter(config);
    default:
      throw new Error(`未対応のLLMタイプ: ${config.llm.type}`);
  }
}
