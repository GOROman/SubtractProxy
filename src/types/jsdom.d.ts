/**
 * jsdomモジュールの型定義
 * CI環境での型定義問題を解決するための補助ファイル
 */

declare module 'jsdom' {
  export interface JSDOMOptions {
    url?: string;
    referrer?: string;
    contentType?: string;
    includeNodeLocations?: boolean;
    storageQuota?: number;
    runScripts?: 'dangerously' | 'outside-only' | undefined;
  }

  export class JSDOM {
    constructor(html?: string, options?: JSDOMOptions);
    window: Window & typeof globalThis;
    serialize(): string;
  }
}
