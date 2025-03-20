/**
 * カスタムフィルタリングルールのテスト
 */

import { JSDOM } from 'jsdom';
import { CustomRuleFilter, UrlParamFilter, loadFilterConfig, createCustomFilters } from '../index';
import { 
  FilterConfig, 
  FilterActionType, 
  ParamFilterRule 
} from '../types';
import { createLogger } from '../../utils/logger';
import { Config } from '../../config';
import { ProxyContext } from '../../proxy/types';

// JSDOMのグローバル設定
const { window } = new JSDOM('');
global.document = window.document;
global.NodeFilter = window.NodeFilter;
global.Node = window.Node;

// テスト用のロガーを作成
const logger = createLogger({
  port: 8080,
  host: '127.0.0.1',
  ignoreRobotsTxt: false,
  timeout: 30000,
  llm: {
    enabled: false,
    type: 'ollama',
    model: 'gemma',
  },
  logging: {
    level: 'error',
    file: '',
  },
  filtering: {
    enabled: false,
  },
});

// テスト用のコンテキストを作成
const createMockContext = (
  url: string = 'https://example.com',
  contentType: string = 'text/html'
): ProxyContext => {
  return {
    req: {
      headers: {
        host: 'localhost:3000'
      }
    } as any,
    res: {
      redirect: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn()
    } as any,
    logger,
    originalUrl: url,
    headers: {
      'content-type': contentType
    },
    ignoreRobotsTxt: false,
    statusCode: 200
  };
};

describe('CustomRuleFilter', () => {
  describe('HTMLフィルタリング', () => {
    test('CSSセレクタルールが正しく適用される', async () => {
      // テスト用の設定
      const config: FilterConfig = {
        enabled: true,
        ruleSets: [
          {
            name: 'テスト用ルールセット',
            enabled: true,
            rules: [
              {
                name: 'div削除',
                enabled: true,
                selector: 'div.ad',
                action: FilterActionType.REMOVE,
                priority: 10
              }
            ]
          }
        ]
      };

      const filter = new CustomRuleFilter(config, logger);
      const html = '<html><body><div class="ad">広告</div><div class="content">コンテンツ</div></body></html>';
      const context = createMockContext('https://example.com', 'text/html');

      const result = await filter.filter(html, context);
      
      // 広告divが削除されていることを確認
      expect(result).not.toContain('<div class="ad">広告</div>');
      expect(result).toContain('<div class="content">コンテンツ</div>');
    });

    test('パターンルールが正しく適用される', async () => {
      // テスト用の設定
      const config: FilterConfig = {
        enabled: true,
        ruleSets: [
          {
            name: 'テスト用ルールセット',
            enabled: true,
            rules: [
              {
                name: 'センシティブ情報置換',
                enabled: true,
                pattern: '\\d{4}-\\d{4}-\\d{4}-\\d{4}',
                action: FilterActionType.REPLACE,
                replacement: '[カード番号]',
                priority: 10
              }
            ]
          }
        ]
      };

      const filter = new CustomRuleFilter(config, logger);
      const html = '<html><body><p>カード番号: 1234-5678-9012-3456</p></body></html>';
      const context = createMockContext('https://example.com', 'text/html');

      const result = await filter.filter(html, context);
      
      // カード番号が置換されていることを確認
      expect(result).not.toContain('1234-5678-9012-3456');
      expect(result).toContain('[カード番号]');
    });

    test('無効化されたルールは適用されない', async () => {
      // テスト用の設定
      const config: FilterConfig = {
        enabled: true,
        ruleSets: [
          {
            name: 'テスト用ルールセット',
            enabled: true,
            rules: [
              {
                name: '無効化されたルール',
                enabled: false,
                selector: 'div.ad',
                action: FilterActionType.REMOVE,
                priority: 10
              }
            ]
          }
        ]
      };

      const filter = new CustomRuleFilter(config, logger);
      const html = '<html><body><div class="ad">広告</div></body></html>';
      const context = createMockContext('https://example.com', 'text/html');

      const result = await filter.filter(html, context);
      
      // ルールが無効なので、広告divは削除されていないことを確認
      expect(result).toContain('<div class="ad">広告</div>');
    });
  });

  describe('JSONフィルタリング', () => {
    test('JSONオブジェクトにパターンルールが正しく適用される', async () => {
      // テスト用の設定
      const config: FilterConfig = {
        enabled: true,
        ruleSets: [
          {
            name: 'テスト用ルールセット',
            enabled: true,
            rules: [
              {
                name: 'メールアドレス置換',
                enabled: true,
                pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
                action: FilterActionType.REPLACE,
                replacement: '[メールアドレス]',
                priority: 10
              }
            ]
          }
        ]
      };

      const filter = new CustomRuleFilter(config, logger);
      const json = JSON.stringify({
        user: {
          name: 'テストユーザー',
          email: 'test@example.com'
        },
        contacts: [
          { name: '連絡先1', email: 'contact1@example.com' },
          { name: '連絡先2', email: 'contact2@example.com' }
        ]
      });
      const context = createMockContext('https://example.com', 'application/json');

      const result = await filter.filter(json, context);
      const parsedResult = JSON.parse(result);
      
      // メールアドレスが置換されていることを確認
      expect(parsedResult.user.email).toBe('[メールアドレス]');
      expect(parsedResult.contacts[0].email).toBe('[メールアドレス]');
      expect(parsedResult.contacts[1].email).toBe('[メールアドレス]');
    });
  });

  describe('テキストフィルタリング', () => {
    test('テキストにパターンルールが正しく適用される', async () => {
      // テスト用の設定
      const config: FilterConfig = {
        enabled: true,
        ruleSets: [
          {
            name: 'テスト用ルールセット',
            enabled: true,
            rules: [
              {
                name: '電話番号置換',
                enabled: true,
                pattern: '\\b0\\d{1,4}-\\d{1,4}-\\d{4}\\b',
                action: FilterActionType.REPLACE,
                replacement: '[電話番号]',
                priority: 10
              }
            ]
          }
        ]
      };

      const filter = new CustomRuleFilter(config, logger);
      const text = '連絡先: 03-1234-5678, 090-1234-5678';
      const context = createMockContext('https://example.com', 'text/plain');

      const result = await filter.filter(text, context);
      
      // 電話番号が置換されていることを確認
      expect(result).toBe('連絡先: [電話番号], [電話番号]');
    });
  });

  describe('条件付きフィルタリング', () => {
    test('URLパターンに一致する場合のみルールが適用される', async () => {
      // テスト用の設定
      const config: FilterConfig = {
        enabled: true,
        ruleSets: [
          {
            name: 'テスト用ルールセット',
            enabled: true,
            condition: {
              urlPattern: '.*\\.example\\.com.*'
            },
            rules: [
              {
                name: 'キーワード置換',
                enabled: true,
                pattern: 'キーワード',
                action: FilterActionType.REPLACE,
                replacement: '[置換済み]',
                priority: 10
              }
            ]
          }
        ]
      };

      const filter = new CustomRuleFilter(config, logger);
      const text = 'これはテストキーワードです。';
      
      // 一致するURL
      const matchContext = createMockContext('https://test.example.com', 'text/plain');
      const matchResult = await filter.filter(text, matchContext);
      
      // 一致しないURL
      const nonMatchContext = createMockContext('https://test.other.com', 'text/plain');
      const nonMatchResult = await filter.filter(text, nonMatchContext);
      
      // 一致するURLの場合は置換されていることを確認
      expect(matchResult).toBe('これはテスト[置換済み]です。');
      
      // 一致しないURLの場合は置換されていないことを確認
      expect(nonMatchResult).toBe('これはテストキーワードです。');
    });
  });
});

describe('UrlParamFilter', () => {
  test('URLパラメータが正しくフィルタリングされる', async () => {
    // テスト用のルール
    const rules: ParamFilterRule[] = [
      {
        name: 'トラッキングパラメータ除去',
        enabled: true,
        pattern: 'utm_.*|fbclid|gclid',
        action: FilterActionType.REMOVE_PARAM,
        priority: 10
      }
    ];

    const filter = new UrlParamFilter(rules, logger);
    const url = 'https://example.com/page?id=123&utm_source=google&utm_medium=cpc&fbclid=abc123';
    const context = createMockContext(url);

    await filter.filter('', context);
    
    // リダイレクトが呼ばれたことを確認
    if ('redirect' in context.res && typeof context.res.redirect === 'function') {
      expect(context.res.redirect).toHaveBeenCalled();
      
      // リダイレクト先のURLにトラッキングパラメータが含まれていないことを確認
      const redirectUrl = (context.res.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectUrl).toBe('/page?id=123');
    } else {
      // writeHeadが呼ばれたことを確認
      expect(context.res.writeHead).toHaveBeenCalled();
      
      // リダイレクト先のURLにトラッキングパラメータが含まれていないことを確認
      const redirectLocation = (context.res.writeHead as jest.Mock).mock.calls[0][1]['Location'];
      expect(redirectLocation).toBe('/page?id=123');
    }
  });

  test('無効化されたルールは適用されない', async () => {
    // テスト用のルール
    const rules: ParamFilterRule[] = [
      {
        name: '無効化されたルール',
        enabled: false,
        pattern: 'utm_.*|fbclid|gclid',
        action: FilterActionType.REMOVE_PARAM,
        priority: 10
      }
    ];

    const filter = new UrlParamFilter(rules, logger);
    const url = 'https://example.com/page?id=123&utm_source=google';
    const context = createMockContext(url);

    await filter.filter('', context);
    
    // ルールが無効なので、リダイレクトは呼ばれていないことを確認
    if ('redirect' in context.res && typeof context.res.redirect === 'function') {
      expect(context.res.redirect).not.toHaveBeenCalled();
    } else {
      expect(context.res.writeHead).not.toHaveBeenCalled();
    }
  });
});

describe('loadFilterConfig', () => {
  test('JSONファイルから設定をロードする', () => {
    // fsモジュールをモック化
    const fs = require('fs');
    const mockReadFileSync = jest.spyOn(fs, 'readFileSync');
    mockReadFileSync.mockImplementation(() => JSON.stringify({
      enabled: true,
      ruleSets: [
        {
          name: 'テスト用ルールセット',
          enabled: true,
          rules: [
            {
              name: 'テストルール',
              enabled: true,
              pattern: '\\d{4}-\\d{4}-\\d{4}-\\d{4}',
              action: FilterActionType.REPLACE,
              replacement: '[カード番号]',
              priority: 10
            }
          ]
        }
      ]
    }));

    // エラーが発生しないことを確認
    let config: FilterConfig | undefined;
    expect(() => {
      config = loadFilterConfig('/path/to/config.filter.json');
    }).not.toThrow();
    
    expect(config).toBeDefined();
    if (config) {
      expect(config.enabled).toBe(true);
      expect(config.ruleSets).toHaveLength(1);
      expect(config.ruleSets[0].rules).toHaveLength(1);
      expect(config.ruleSets[0].rules[0].name).toBe('テストルール');
    }
    
    // モックをリセット
    mockReadFileSync.mockRestore();
  });

  test('ファイル読み込みでエラーが発生した場合はエラーをスローする', () => {
    // fsモジュールをモック化
    const fs = require('fs');
    const mockReadFileSync = jest.spyOn(fs, 'readFileSync');
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ファイル読み込みエラー');
    });

    // エラーがスローされることを確認
    expect(() => {
      loadFilterConfig('/path/to/error.json');
    }).toThrow();
    
    // モックをリセット
    mockReadFileSync.mockRestore();
  });
});

describe('createCustomFilters', () => {
  test('設定に基づいてフィルターを作成する', () => {
    const config: FilterConfig = {
      enabled: true,
      ruleSets: [
        {
          name: 'コンテンツフィルタールールセット',
          enabled: true,
          rules: [
            {
              name: 'センシティブ情報置換',
              enabled: true,
              pattern: '\\d{4}-\\d{4}-\\d{4}-\\d{4}',
              action: FilterActionType.REPLACE,
              replacement: '[カード番号]',
              priority: 10
            }
          ]
        }
      ],
      paramRules: [
        {
          name: 'トラッキングパラメータ除去',
          enabled: true,
          pattern: 'utm_.*|fbclid',
          action: FilterActionType.REMOVE_PARAM,
          priority: 10
        }
      ]
    };

    const filters = createCustomFilters(config, logger);
    
    // フィルターが作成されていることを確認
    expect(filters.length).toBeGreaterThan(0);
    // 少なくともCustomRuleFilterが含まれていることを確認
    const customRuleFilter = filters.find(f => f.name === 'CustomRuleFilter');
    expect(customRuleFilter).toBeDefined();
  });

  test('フィルタリングが無効の場合は空の配列を返す', () => {
    const config: FilterConfig = {
      enabled: false,
      ruleSets: [],
      paramRules: []
    };

    const filters = createCustomFilters(config, logger);
    
    expect(filters).toHaveLength(0);
  });

  test('ルールセットが空の場合でもパラメータルールがあれば適切なフィルターを作成する', () => {
    const config: FilterConfig = {
      enabled: true,
      ruleSets: [],
      paramRules: [
        {
          name: 'トラッキングパラメータ除去',
          enabled: true,
          pattern: 'utm_.*',
          action: FilterActionType.REMOVE_PARAM,
          priority: 10
        }
      ]
    };

    const filters = createCustomFilters(config, logger);
    
    // 少なくとも1つのフィルターが作成されていることを確認
    expect(filters.length).toBeGreaterThan(0);
  });

  test('パラメータルールが空の場合でもルールセットがあれば適切なフィルターを作成する', () => {
    const config: FilterConfig = {
      enabled: true,
      ruleSets: [
        {
          name: 'コンテンツフィルタールールセット',
          enabled: true,
          rules: [
            {
              name: 'センシティブ情報置換',
              enabled: true,
              pattern: '\\d{4}-\\d{4}-\\d{4}-\\d{4}',
              action: FilterActionType.REPLACE,
              replacement: '[カード番号]',
              priority: 10
            }
          ]
        }
      ],
      paramRules: []
    };

    const filters = createCustomFilters(config, logger);
    
    // 少なくとも1つのフィルターが作成されていることを確認
    expect(filters.length).toBeGreaterThan(0);
    // CustomRuleFilterが含まれていることを確認
    const customRuleFilter = filters.find(f => f.name === 'CustomRuleFilter');
    expect(customRuleFilter).toBeDefined();
  });
});
