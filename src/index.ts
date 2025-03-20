import { loadConfig } from './config';
import { ProxyServer } from './proxy/server';
import { createLLMFilter } from './llm';
import { createCustomFilters, loadFilterConfig } from './filters';
import { resolveProjectPath } from './utils/file';
import { createLogger } from './utils/logger';
import path from 'path';

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config);
  const server = new ProxyServer(config);

  // LLMフィルターの追加
  if (config.llm.enabled) {
    try {
      const llmFilter = createLLMFilter(config);
      server.addFilter(llmFilter);
    } catch (error) {
      logger.error('LLMフィルターの初期化中にエラーが発生しました:', error);
    }
  }

  // カスタムフィルターの追加
  if (config.filtering.enabled) {
    try {
      // フィルタリング設定ファイルのパスを解決
      const filterConfigPath = config.filtering.configPath
        ? path.isAbsolute(config.filtering.configPath)
          ? config.filtering.configPath
          : resolveProjectPath(config.filtering.configPath)
        : resolveProjectPath('config.filter.json');

      // フィルタリング設定をロード
      const filterConfig = loadFilterConfig(filterConfigPath);
      
      // カスタムフィルターを作成して追加
      const customFilters = createCustomFilters(filterConfig, logger);
      for (const filter of customFilters) {
        server.addFilter(filter);
      }
      
      logger.info(`カスタムフィルタリングを有効化しました: ${customFilters.length} フィルター`);
    } catch (error) {
      logger.error('カスタムフィルターの初期化中にエラーが発生しました:', error);
    }
  }

  server.start();
}

main().catch((error) => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
