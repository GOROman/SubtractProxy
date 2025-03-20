import { loadConfig } from './config';
import { ProxyServer } from './proxy/server';
import { createLLMFilter } from './llm';

async function main(): Promise<void> {
  const config = loadConfig();
  const server = new ProxyServer(config);

  // LLMフィルターの追加
  if (config.llm.enabled) {
    try {
      const llmFilter = createLLMFilter(config);
      server.addFilter(llmFilter);
    } catch (error) {
      console.error('LLMフィルターの初期化中にエラーが発生しました:', error);
    }
  }

  server.start();
}

main().catch((error) => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
