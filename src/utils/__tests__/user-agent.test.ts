/**
 * User-Agent管理モジュールのテスト
 */

import { UserAgentManager } from '../user-agent';

describe('UserAgentManager', () => {
  describe('基本機能', () => {
    test('デフォルト設定で初期化できる', () => {
      const manager = new UserAgentManager({
        enabled: true,
        rotate: false,
      });

      expect(manager.getCurrentUserAgent()).toBeDefined();
    });

    test('無効化時はundefinedを返す', () => {
      const manager = new UserAgentManager({
        enabled: false,
        rotate: false,
      });

      expect(manager.getCurrentUserAgent()).toBeUndefined();
    });
  });

  describe('カスタム設定', () => {
    test('カスタムUser-Agentを使用できる', () => {
      const customUA = 'Custom User Agent';
      const manager = new UserAgentManager({
        enabled: true,
        rotate: false,
        value: customUA,
      });

      expect(manager.getCurrentUserAgent()).toBe(customUA);
    });

    test('プリセットUser-Agentを設定できる', () => {
      const presets = ['UA1', 'UA2', 'UA3'];
      const manager = new UserAgentManager({
        enabled: true,
        rotate: false,
        presets,
      });

      expect(presets).toContain(manager.getCurrentUserAgent());
    });
  });

  describe('ローテーション機能', () => {
    test('User-Agentをローテーションできる', () => {
      const presets = ['UA1', 'UA2', 'UA3'];
      const manager = new UserAgentManager({
        enabled: true,
        rotate: true,
        presets,
      });

      const firstUA = manager.getCurrentUserAgent();
      const secondUA = manager.getCurrentUserAgent();
      const thirdUA = manager.getCurrentUserAgent();
      const fourthUA = manager.getCurrentUserAgent();

      expect(firstUA).not.toBe(secondUA);
      expect(secondUA).not.toBe(thirdUA);
      expect(fourthUA).toBe(firstUA); // 一周して最初に戻る
    });
  });

  describe('User-Agent管理', () => {
    test('新しいUser-Agentを追加できる', () => {
      const manager = new UserAgentManager({
        enabled: true,
        rotate: true,
      });

      const newUA = 'New User Agent';
      manager.addUserAgent(newUA);

      // ローテーションを一周させて新しいUAが含まれているか確認
      let found = false;
      for (let i = 0; i < 10; i++) {
        if (manager.getCurrentUserAgent() === newUA) {
          found = true;
          break;
        }
      }

      expect(found).toBe(true);
    });

    test('リセット機能が正しく動作する', () => {
      const presets = ['UA1', 'UA2'];
      const manager = new UserAgentManager({
        enabled: true,
        rotate: true,
        presets,
      });

      // プリセットに含まれていないUser-Agentを追加
      const newUA = 'New User Agent';
      manager.addUserAgent(newUA);

      // リセット前に新しいUser-Agentが含まれていることを確認
      let foundBefore = false;
      for (let i = 0; i < 10; i++) {
        if (manager.getCurrentUserAgent() === newUA) {
          foundBefore = true;
          break;
        }
      }
      expect(foundBefore).toBe(true);

      // リセット後
      manager.reset();

      // リセット後は元のプリセットのみが使用されることを確認
      const usedUAs = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const ua = manager.getCurrentUserAgent();
        usedUAs.add(ua!);
      }

      expect(usedUAs.size).toBeLessThanOrEqual(presets.length);
      expect(usedUAs.has(newUA)).toBe(false);
      for (const ua of usedUAs) {
        expect(presets).toContain(ua);
      }
    });
  });
});
