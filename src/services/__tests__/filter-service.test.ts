import { FilterService } from '../filter-service';
import { FilterRule, MatchType, RulePriority } from '../../types/filtering';
import { AppError } from '../../utils/errors';

describe('FilterService', () => {
  let filterService: FilterService;

  beforeEach(() => {
    filterService = new FilterService();
  });

  describe('ルールの追加', () => {
    it('有効なルールを追加できること', () => {
      const rule = {
        name: 'テストルール',
        matchType: MatchType.REGEX,
        pattern: '\\d+',
        priority: RulePriority.MEDIUM,
        enabled: true,
      };

      const addedRule = filterService.addRule(rule);

      expect(addedRule.id).toBeDefined();
      expect(addedRule.name).toBe(rule.name);
      expect(addedRule.pattern).toBe(rule.pattern);
      expect(addedRule.createdAt).toBeInstanceOf(Date);
      expect(addedRule.updatedAt).toBeInstanceOf(Date);
    });

    it('無効なルール名でエラーとなること', () => {
      const rule = {
        name: '',
        matchType: MatchType.REGEX,
        pattern: '\\d+',
        priority: RulePriority.MEDIUM,
        enabled: true,
      };

      expect(() => filterService.addRule(rule)).toThrow(AppError);
    });

    it('無効な正規表現パターンでエラーとなること', () => {
      const rule = {
        name: 'テストルール',
        matchType: MatchType.REGEX,
        pattern: '[',  // 無効な正規表現
        priority: RulePriority.MEDIUM,
        enabled: true,
      };

      expect(() => filterService.addRule(rule)).toThrow(AppError);
    });
  });

  describe('ルールの更新', () => {
    let existingRule: FilterRule;

    beforeEach(() => {
      existingRule = filterService.addRule({
        name: '既存ルール',
        matchType: MatchType.REGEX,
        pattern: '\\d+',
        priority: RulePriority.MEDIUM,
        enabled: true,
      });
    });

    it('ルールを正しく更新できること', () => {
      const updates = {
        name: '更新後のルール',
        pattern: '[a-z]+',
      };

      const updatedRule = filterService.updateRule(existingRule.id, updates);

      expect(updatedRule.name).toBe(updates.name);
      expect(updatedRule.pattern).toBe(updates.pattern);
      expect(updatedRule.updatedAt).not.toBe(existingRule.updatedAt);
    });

    it('存在しないルールIDでエラーとなること', () => {
      expect(() => {
        filterService.updateRule('non-existent-id', { name: '新しい名前' });
      }).toThrow(AppError);
    });
  });

  describe('ルールの削除', () => {
    let existingRule: FilterRule;

    beforeEach(() => {
      existingRule = filterService.addRule({
        name: '削除対象ルール',
        matchType: MatchType.REGEX,
        pattern: '\\d+',
        priority: RulePriority.MEDIUM,
        enabled: true,
      });
    });

    it('ルールを正しく削除できること', () => {
      filterService.deleteRule(existingRule.id);
      expect(() => {
        filterService.updateRule(existingRule.id, {});
      }).toThrow(AppError);
    });

    it('存在しないルールIDでエラーとなること', () => {
      expect(() => {
        filterService.deleteRule('non-existent-id');
      }).toThrow(AppError);
    });
  });

  describe('フィルタリングの適用', () => {
    it('正規表現ルールが正しく適用されること', async () => {
      filterService.addRule({
        name: '数字除去',
        matchType: MatchType.REGEX,
        pattern: '\\d+',
        priority: RulePriority.MEDIUM,
        enabled: true,
      });

      const result = await filterService.applyFilters('テスト123テスト456');
      expect(result).toBe('テストテスト');
    });

    it('無効化されたルールが適用されないこと', async () => {
      filterService.addRule({
        name: '数字除去',
        matchType: MatchType.REGEX,
        pattern: '\\d+',
        priority: RulePriority.MEDIUM,
        enabled: false,
      });

      const result = await filterService.applyFilters('テスト123テスト456');
      expect(result).toBe('テスト123テスト456');
    });

    it('優先度順にルールが適用されること', async () => {
      filterService.addRule({
        name: '数字除去',
        matchType: MatchType.REGEX,
        pattern: '\\d+',
        priority: RulePriority.LOW,
        enabled: true,
      });

      filterService.addRule({
        name: 'テスト文字除去',
        matchType: MatchType.REGEX,
        pattern: 'テスト',
        priority: RulePriority.HIGH,
        enabled: true,
      });

      const result = await filterService.applyFilters('テスト123テスト456');
      expect(result).toBe('123456');
    });
  });
});
