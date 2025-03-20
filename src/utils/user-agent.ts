/**
 * User-Agent管理モジュール
 * 
 * プロキシサーバーのUser-Agentを管理するためのモジュールです。
 * 以下の機能を提供します：
 * 
 * 1. カスタムUser-Agentの設定
 * 2. User-Agentのローテーション
 * 3. プリセットUser-Agentの管理
 * 
 * 設定オプション：
 * - enabled: User-Agentの変更を有効にするかどうか
 * - rotate: User-Agentの自動ローテーションを有効にする
 * - value: カスタムUser-Agent文字列
 * - presets: ローテーション用のUser-Agentリスト
 */

import { Config } from '../config/types';

/**
 * デフォルトのUser-Agentプリセット
 * 
 * 一般的なブラウザやモバイルデバイスのUser-Agent文字列を提供します。
 * ローテーション機能で使用され、設定で上書き可能です。
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
 * 
 * User-Agentの取得、ローテーション、カスタマイズを行うクラスです。
 * 設定に応じて、以下の動作を行います：
 * 
 * 1. enabled=falseの場合、元のUser-Agentを保持
 * 2. valueが設定されている場合、その値を使用
 * 3. rotate=trueの場合、プリセットをローテーション
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
   * 
   * 設定に応じて適切なUser-Agentを返します。
   * - enabled=falseの場合、undefinedを返します
   * - valueが設定されている場合、その値を返します
   * - rotate=trueの場合、次のUser-Agentを返します
   * 
   * @returns string | undefined - User-Agent文字列またはundefined
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
   * 
   * 現在のインデックスのUser-Agentを取得し、
   * インデックスを次に進めます。リストの最後に達した場合、
   * 最初に戻ります。
   * 
   * @returns string - User-Agent文字列
   */
  private getNextUserAgent(): string {
    const userAgent = this.userAgents[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.userAgents.length;
    return userAgent;
  }

  /**
   * User-Agentリストをシャッフル
   * 
   * Fisher-Yatesアルゴリズムを使用してリストをシャッフルします。
   * ローテーション時のランダム性を確保するために使用されます。
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
   * 
   * 新しいUser-Agentをリストに追加します。
   * 既に存在する場合は追加されません。
   * 
   * @param userAgent - 追加するUser-Agent文字列
   */
  public addUserAgent(userAgent: string): void {
    if (!this.userAgents.includes(userAgent)) {
      this.userAgents.push(userAgent);
    }
  }

  /**
   * User-Agentリストをリセット
   * 
   * リストを初期状態に戻します：
   * 1. インデックスを0にリセット
   * 2. 設定のプリセットまたはデフォルト値を使用
   * 3. ローテーションが有効な場合、リストをシャッフル
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
