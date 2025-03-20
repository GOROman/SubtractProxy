/**
 * jsdomモジュールの型定義
 * CI環境での型定義問題を解決するための補助ファイル
 */

declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string, options?: any);
    window: any;
    serialize(): string;
  }
}
