/**
 * robots.txtの解析とキャッシュを管理するクラス
 */

import { ConfigError } from './errors';
import { createLogger } from './logger';
import { Config } from '../config';

/**
 * robots.txtのキャッシュエントリ
 */
interface RobotsTxtCacheEntry {
  content: string;
  expiry: number;
  rules: RobotsRule[];
}

/**
 * robots.txtのルール
 */
interface RobotsRule {
  userAgent: string;
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
}

/**
 * robots.txtの解析とキャッシュを管理するクラス
 */
export class RobotsTxtManager {
  private cache: Map<string, RobotsTxtCacheEntry>;
  private readonly ttl: number;
  private readonly logger;

  constructor(config: Config) {
    this.cache = new Map();
    this.ttl = 3600000; // 1時間（ミリ秒）
    this.logger = createLogger(config);
  }

  /**
   * robots.txtの内容を取得
   * 
   * @param domain - 対象ドメイン
   * @param forceRefresh - キャッシュを無視して強制的に再取得するかどうか
   * @returns robots.txtの内容とルール
   */
  async getRobotsTxt(domain: string, forceRefresh = false): Promise<RobotsTxtCacheEntry | null> {
    const now = Date.now();
    const cached = this.cache.get(domain);

    if (!forceRefresh && cached && cached.expiry > now) {
      this.logger.debug(`robots.txt cache hit for ${domain}`);
      return cached;
    }

    try {
      const url = new URL('/robots.txt', `https://${domain}`);
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        if (response.status === 404) {
          this.logger.info(`robots.txt not found for ${domain}`);
          return null;
        }
        throw new ConfigError(`robots.txtの取得に失敗: ${response.statusText}`, {
          domain,
          status: response.status,
        });
      }

      const content = await response.text();
      const rules = this.parseRobotsTxt(content);
      const entry: RobotsTxtCacheEntry = {
        content,
        expiry: now + this.ttl,
        rules,
      };

      this.cache.set(domain, entry);
      this.logger.debug(`robots.txt cached for ${domain}`);

      return entry;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`robots.txtの取得中にエラーが発生: ${error.message}`, error);
      } else {
        this.logger.error('robots.txtの取得中に不明なエラーが発生しました', error);
      }
      throw error;
    }
  }

  /**
   * robots.txtの内容を解析
   * 
   * @param content - robots.txtの内容
   * @returns 解析されたルール
   */
  private parseRobotsTxt(content: string): RobotsRule[] {
    const rules: RobotsRule[] = [];
    let currentRule: RobotsRule | null = null;

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim().toLowerCase();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      const [field, ...valueParts] = trimmedLine.split(':');
      const value = valueParts.join(':').trim();

      if (field === 'user-agent') {
        if (currentRule) {
          rules.push(currentRule);
        }
        currentRule = {
          userAgent: value,
          allow: [],
          disallow: [],
        };
      } else if (currentRule) {
        switch (field) {
          case 'allow':
            if (value) {
              currentRule.allow.push(value);
            }
            break;
          case 'disallow':
            if (value) {
              currentRule.disallow.push(value);
            }
            break;
          case 'crawl-delay':
            const delay = parseFloat(value);
            if (!isNaN(delay)) {
              currentRule.crawlDelay = delay;
            }
            break;
        }
      }
    }

    if (currentRule) {
      rules.push(currentRule);
    }

    return rules;
  }

  /**
   * 指定されたパスがrobots.txtによってブロックされているかどうかを判定
   * 
   * @param domain - 対象ドメイン
   * @param path - チェックするパス
   * @param userAgent - 使用するUser-Agent
   * @returns ブロックされている場合はtrue
   */
  async isBlocked(domain: string, path: string, userAgent: string): Promise<boolean> {
    const robotsTxt = await this.getRobotsTxt(domain);
    if (!robotsTxt) {
      return false;
    }

    const normalizedPath = path.toLowerCase();
    const rules = robotsTxt.rules;

    // ユーザーエージェント固有のルールを探す
    const specificRules = rules.find(rule => rule.userAgent === userAgent.toLowerCase());
    const wildcardRules = rules.find(rule => rule.userAgent === '*');

    const targetRules = specificRules || wildcardRules;
    if (!targetRules) {
      return false;
    }

    // Allowルールを優先してチェック
    for (const allowPath of targetRules.allow) {
      if (this.pathMatches(normalizedPath, allowPath)) {
        return false;
      }
    }

    // Disallowルールをチェック
    for (const disallowPath of targetRules.disallow) {
      if (this.pathMatches(normalizedPath, disallowPath)) {
        return true;
      }
    }

    return false;
  }

  /**
   * パスがrobots.txtのパターンにマッチするかどうかを判定
   * 
   * @param path - チェックするパス
   * @param pattern - robots.txtのパターン
   * @returns マッチする場合はtrue
   */
  private pathMatches(path: string, pattern: string): boolean {
    const regex = pattern
      .toLowerCase()
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // 特殊文字をエスケープ
      .replace(/\*/g, '.*') // ワイルドカードを正規表現に変換
      .replace(/\$/, '$'); // 末尾マッチ

    return new RegExp(`^${regex}`).test(path);
  }

  /**
   * キャッシュをクリア
   * 
   * @param domain - クリアするドメイン（指定しない場合は全てクリア）
   */
  clearCache(domain?: string): void {
    if (domain) {
      this.cache.delete(domain);
      this.logger.debug(`robots.txt cache cleared for ${domain}`);
    } else {
      this.cache.clear();
      this.logger.debug('all robots.txt cache cleared');
    }
  }
}
