/**
 * robots.txtマネージャーのテスト
 */

import { RobotsTxtManager } from '../robots-txt';
import { ConfigError } from '../errors';
import fetchMock from 'jest-fetch-mock';

describe('RobotsTxtManager', () => {
  let manager: RobotsTxtManager;

  beforeEach(() => {
    fetchMock.resetMocks();
    manager = new RobotsTxtManager({
      port: 8080,
      host: 'localhost',
      ignoreRobotsTxt: false,
      llm: {
        enabled: false,
        type: 'ollama',
        model: 'gemma',
      },
      logging: {
        level: 'error',
      },
    });
  });

  describe('robots.txtの取得と解析', () => {
    const sampleRobotsTxt = `
      User-agent: *
      Disallow: /private/
      Allow: /public/
      Crawl-delay: 1

      User-agent: Googlebot
      Allow: /
      Disallow: /admin/
    `;

    test('robots.txtを正しく取得して解析する', async () => {
      fetchMock.mockResponseOnce(sampleRobotsTxt);

      const result = await manager.getRobotsTxt('example.com');
      expect(result).toBeTruthy();
      expect(result?.rules).toHaveLength(2);

      const wildcardRule = result?.rules[0];
      expect(wildcardRule?.userAgent).toBe('*');
      expect(wildcardRule?.disallow).toContain('/private/');
      expect(wildcardRule?.allow).toContain('/public/');
      expect(wildcardRule?.crawlDelay).toBe(1);

      const googlebotRule = result?.rules[1];
      expect(googlebotRule?.userAgent).toBe('googlebot');
      expect(googlebotRule?.allow).toContain('/');
      expect(googlebotRule?.disallow).toContain('/admin/');
    });

    test('robots.txtが存在しない場合はnullを返す', async () => {
      fetchMock.mockResponseOnce('', { status: 404 });

      const result = await manager.getRobotsTxt('example.com');
      expect(result).toBeNull();
    });

    test('robots.txtの取得に失敗した場合はエラーを投げる', async () => {
      fetchMock.mockResponseOnce('', { status: 500 });

      await expect(manager.getRobotsTxt('example.com')).rejects.toThrow(ConfigError);
    });

    test('キャッシュが正しく動作する', async () => {
      fetchMock.mockResponseOnce(sampleRobotsTxt);

      // 1回目の取得
      const result1 = await manager.getRobotsTxt('example.com');
      expect(result1).toBeTruthy();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // キャッシュから取得（新しいリクエストは発生しない）
      const result2 = await manager.getRobotsTxt('example.com');
      expect(result2).toBeTruthy();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // forceRefreshでキャッシュを無視
      const result3 = await manager.getRobotsTxt('example.com', true);
      expect(result3).toBeTruthy();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('パスのブロック判定', () => {
    const sampleRobotsTxt = `
      User-agent: *
      Disallow: /private/
      Allow: /private/public/
      Disallow: /*.pdf$

      User-agent: Googlebot
      Allow: /
      Disallow: /admin/
    `;

    beforeEach(() => {
      fetchMock.mockResponseOnce(sampleRobotsTxt);
    });

    test('ワイルドカードルールが正しく適用される', async () => {
      expect(await manager.isBlocked('example.com', '/private/secret', 'TestBot')).toBe(true);
      expect(await manager.isBlocked('example.com', '/private/public/page', 'TestBot')).toBe(false);
      expect(await manager.isBlocked('example.com', '/public/page', 'TestBot')).toBe(false);
      expect(await manager.isBlocked('example.com', '/document.pdf', 'TestBot')).toBe(true);
    });

    test('特定のUser-Agentのルールが優先される', async () => {
      expect(await manager.isBlocked('example.com', '/private/secret', 'Googlebot')).toBe(false);
      expect(await manager.isBlocked('example.com', '/admin/panel', 'Googlebot')).toBe(true);
    });

    test('robots.txtが存在しない場合はブロックしない', async () => {
      fetchMock.mockResponseOnce('', { status: 404 });
      expect(await manager.isBlocked('example.com', '/any/path', 'TestBot')).toBe(false);
    });
  });

  describe('キャッシュ管理', () => {
    const sampleRobotsTxt = `User-agent: *\nDisallow: /`;

    test('特定のドメインのキャッシュをクリアする', async () => {
      fetchMock.mockResponseOnce(sampleRobotsTxt);

      await manager.getRobotsTxt('example.com');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      manager.clearCache('example.com');

      await manager.getRobotsTxt('example.com');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test('全てのキャッシュをクリアする', async () => {
      fetchMock
        .mockResponseOnce(sampleRobotsTxt) // example.com用
        .mockResponseOnce(sampleRobotsTxt); // test.com用

      await manager.getRobotsTxt('example.com');
      await manager.getRobotsTxt('test.com');
      expect(fetchMock).toHaveBeenCalledTimes(2);

      manager.clearCache();

      await manager.getRobotsTxt('example.com');
      await manager.getRobotsTxt('test.com');
      expect(fetchMock).toHaveBeenCalledTimes(4);
    });
  });
});
