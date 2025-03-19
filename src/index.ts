import { loadConfig } from './config';
import { ProxyServer } from './proxy/server';
import { OllamaFilter } from './llm/ollama';

async function main() {
  const config = loadConfig();
  const server = new ProxyServer(config);

  // LLMフィルターの追加
  if (config.llm.enabled) {
    const ollamaFilter = new OllamaFilter(config);
    server.addFilter(ollamaFilter);
  }

  server.start();
}

main().catch((error) => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
