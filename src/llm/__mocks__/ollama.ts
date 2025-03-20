// Ollamaのモッククラス
export class Ollama {
  constructor(_options: Record<string, unknown>) {
    // コンストラクタのモック
  }

  // generateメソッドのモック
  async generate(_params: Record<string, unknown>): Promise<{ response: string }> {
    return {
      response: 'フィルタリングされたコンテンツ',
    };
  }
}
