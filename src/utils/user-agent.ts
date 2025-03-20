/**
 * User-Agent管理モジュール
 */

import { Config } from '../config/types';

/**
 * デフォルトのUser-Agentプリセット
 */
const DEFAULT_USER_AGENTS = [
  // 一般的なブラウザ
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  // モバイルブラウザ
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.90 Mobile Safari/537.36',
];

/**
 * User-Agent管理クラス
 */
export class UserAgentManager {
  private currentIndex: number = 0;
  private userAgents: string[] = [];
  private config: Config['userAgent'];

  constructor(config: Config['userAgent']) {
    this.config = config;
    this.reset();
  }

  /**
   * 現在のUser-Agentを取得
   */
  public getCurrentUserAgent(): string | undefined {
    if (!this.config.enabled) {
      return undefined;
    }

    if (this.config.value) {
      return this.config.value;
    }

    if (this.config.rotate) {
      return this.getNextUserAgent();
    }

    return this.userAgents[0];
  }

  /**
   * 次のUser-Agentを取得（ローテーション用）
   */
  private getNextUserAgent(): string {
    const userAgent = this.userAgents[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.userAgents.length;
    return userAgent;
  }

  /**
   * User-Agentリストをシャッフル
   */
  private shuffleUserAgents(): void {
    for (let i = this.userAgents.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.userAgents[i], this.userAgents[j]] = [
        this.userAgents[j],
        this.userAgents[i],
      ];
    }
  }

  /**
   * カスタムUser-Agentを追加
   */
  public addUserAgent(userAgent: string): void {
    if (!this.userAgents.includes(userAgent)) {
      this.userAgents.push(userAgent);
    }
  }

  /**
   * User-Agentリストをリセット
   */
  public reset(): void {
    this.currentIndex = 0;
    // 設定から新しい配列を作成して完全にリセット
    const baseAgents = this.config.presets || DEFAULT_USER_AGENTS;
    this.userAgents = [...baseAgents];
    // ローテーションが有効な場合のみシャッフル
    if (this.config.rotate) {
      this.shuffleUserAgents();
    }
  }
}
