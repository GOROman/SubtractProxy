import { FilterRule, FilterConfig, MatchType, RulePriority } from '../types/filtering';
import { AppError } from '../utils/errors';

/**
 * フィルタリングサービス
 * フィルタリングルールの管理と適用を行う
 */
export class FilterService {
  private config: FilterConfig;

  constructor() {
    this.config = {
      rules: [],
      defaultPriority: RulePriority.MEDIUM,
      enabled: true,
    };
  }

  /**
   * フィルタリング設定を更新する
   */
  public updateConfig(newConfig: Partial<FilterConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }

  /**
   * 新しいフィルタリングルールを追加する
   */
  public addRule(rule: Omit<FilterRule, 'id' | 'createdAt' | 'updatedAt'>): FilterRule {
    const now = new Date();
    const newRule: FilterRule = {
      ...rule,
      id: this.generateRuleId(),
      createdAt: now,
      updatedAt: now,
    };

    this.validateRule(newRule);
    this.config.rules.push(newRule);
    return newRule;
  }

  /**
   * フィルタリングルールを更新する
   */
  public updateRule(id: string, updates: Partial<FilterRule>): FilterRule {
    const index = this.findRuleIndex(id);
    if (index === -1) {
      throw new AppError('フィルタリングルールが見つかりません', {
        ruleId: id,
      });
    }

    const updatedRule: FilterRule = {
      ...this.config.rules[index],
      ...updates,
      updatedAt: new Date(),
    };

    this.validateRule(updatedRule);
    this.config.rules[index] = updatedRule;
    return updatedRule;
  }

  /**
   * フィルタリングルールを削除する
   */
  public deleteRule(id: string): void {
    const index = this.findRuleIndex(id);
    if (index === -1) {
      throw new AppError('フィルタリングルールが見つかりません', {
        ruleId: id,
      });
    }

    this.config.rules.splice(index, 1);
  }

  /**
   * コンテンツにフィルタリングルールを適用する
   */
  public async applyFilters(content: string): Promise<string> {
    if (!this.config.enabled || this.config.rules.length === 0) {
      return content;
    }

    // 優先度順にルールをソート
    const sortedRules = [...this.config.rules]
      .filter(rule => rule.enabled)
      .sort((a, b) => a.priority - b.priority);

    let filteredContent = content;
    for (const rule of sortedRules) {
      try {
        filteredContent = await this.applyRule(rule, filteredContent);
      } catch (error) {
        console.error(`ルール適用エラー: ${rule.id}`, error);
      }
    }

    return filteredContent;
  }

  /**
   * 単一のフィルタリングルールを適用する
   */
  private async applyRule(rule: FilterRule, content: string): Promise<string> {
    switch (rule.matchType) {
      case MatchType.REGEX:
        return this.applyRegexRule(rule, content);
      case MatchType.CSS_SELECTOR:
        return this.applyCssSelectorRule(rule, content);
      default:
        throw new AppError('未対応のマッチングタイプです', 'UNSUPPORTED_MATCH_TYPE', 400, {
          matchType: rule.matchType,
        });
    }
  }

  /**
   * 正規表現ルールを適用する
   */
  private applyRegexRule(rule: FilterRule, content: string): string {
    try {
      const regex = new RegExp(rule.pattern, 'g');
      return content.replace(regex, '');
    } catch (error) {
      throw new AppError('正規表現ルールの適用に失敗しました', 'REGEX_RULE_FAILED', 500, {
        ruleId: rule.id,
        pattern: rule.pattern,
        error,
      });
    }
  }

  /**
   * CSSセレクタルールを適用する
   */
  private async applyCssSelectorRule(rule: FilterRule, content: string): Promise<string> {
    // Note: 実際のDOM操作はプロキシミドルウェアで行う
    return content;
  }

  /**
   * フィルタリングルールの一意なIDを生成する
   */
  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * フィルタリングルールのインデックスを検索する
   */
  private findRuleIndex(id: string): number {
    return this.config.rules.findIndex(rule => rule.id === id);
  }

  /**
   * フィルタリングルールのバリデーションを行う
   */
  private validateRule(rule: FilterRule): void {
    if (!rule.name) {
      throw new AppError('ルール名は必須です');
    }

    if (!rule.pattern) {
      throw new AppError('マッチングパターンは必須です');
    }

    if (rule.matchType === MatchType.REGEX) {
      try {
        new RegExp(rule.pattern);
      } catch (error) {
        throw new AppError('無効な正規表現パターンです', 'INVALID_REGEX_PATTERN', 400, {
          pattern: rule.pattern,
          error,
        });
      }
    }
  }
}
