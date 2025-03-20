/**
 * カスタムフィルタリングルールの実装
 */

// DOM型定義を使用するためにtsconfig.jsonでlibに"DOM"を追加しました
// @ts-ignore - CI環境で型定義が認識されない問題を回避するため
import { JSDOM } from 'jsdom';
import { ContentFilter, ProxyContext } from '../proxy/types';
import * as fs from 'fs';
import { 
  FilterConfig, 
  FilterRuleSet, 
  PatternFilterRule, 
  SelectorFilterRule, 
  ParamFilterRule,
  ContentTypeFilterRule,
  FilterActionType
} from './types';
import { ConfigError, ProxyError } from '../utils/errors';
import winston from 'winston';
import { URL } from 'url';

/**
 * カスタムフィルタリングルールを適用するフィルタークラス
 */
export class CustomRuleFilter implements ContentFilter {
  name = 'CustomRuleFilter';
  private config: FilterConfig;
  private logger: winston.Logger;

  constructor(config: FilterConfig, logger: winston.Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * コンテンツにフィルタリングルールを適用する
   */
  async filter(content: string, context: ProxyContext): Promise<string> {
    if (!this.config.enabled) {
      return content;
    }

    try {
      this.logger.debug(`カスタムフィルタリングルールを適用: ${context.originalUrl}`);
      
      // 適用するルールセットを選択
      const applicableRuleSets = this.getApplicableRuleSets(context);
      
      if (applicableRuleSets.length === 0) {
        this.logger.debug('適用可能なルールセットがありません');
        return content;
      }

      // コンテンツタイプに基づいて適切なフィルタリング方法を選択
      const contentType = context.headers && context.headers['content-type'] ? 
        context.headers['content-type'] as string : '';
      
      if (contentType.includes('text/html')) {
        return this.filterHtmlContent(content, applicableRuleSets);
      } else if (contentType.includes('application/json')) {
        return this.filterJsonContent(content, applicableRuleSets);
      } else if (contentType.includes('text/plain')) {
        return this.filterTextContent(content, applicableRuleSets);
      } else {
        // サポートされていないコンテンツタイプ
        this.logger.debug(`サポートされていないコンテンツタイプ: ${contentType}`);
        return content;
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
       ? error.message 
       : String(error);
      this.logger.error(`フィルタリング中にエラーが発生しました: ${errorMessage}`);
      
      // エラーが発生した場合は元のコンテンツを返す
      return content;
    }
  }

  /**
   * 現在のコンテキストに適用可能なルールセットを取得する
   */
  private getApplicableRuleSets(context: ProxyContext): FilterRuleSet[] {
    return this.config.ruleSets.filter(ruleSet => {
      if (!ruleSet.enabled) {
        return false;
      }

      // 条件がない場合は常に適用
      if (!ruleSet.condition) {
        return true;
      }

      // URLパターンの確認
      if (ruleSet.condition.urlPattern) {
        const urlRegex = new RegExp(ruleSet.condition.urlPattern);
        if (!context.originalUrl || !urlRegex.test(context.originalUrl)) {
          return false;
        }
      }

      // コンテンツタイプパターンの確認
      if (ruleSet.condition.contentTypePattern && context.headers) {
        const contentType = context.headers['content-type'] ? 
          context.headers['content-type'] as string : '';
        const pattern = ruleSet.condition.contentTypePattern;
       const contentTypeRegex = new RegExp(pattern);
        if (!contentTypeRegex.test(contentType)) {
          return false;
        }
      }

      // ヘッダーパターンの確認
      if (ruleSet.condition.headerPattern && context.headers) {
        const headerName = ruleSet.condition.headerPattern.name;
        const headerValue = context.headers[headerName] ? 
          context.headers[headerName] as string : '';
        const headerRegex = new RegExp(ruleSet.condition.headerPattern.value);
        if (!headerRegex.test(headerValue)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * HTMLコンテンツにフィルタリングルールを適用する
   */
  private filterHtmlContent(
   content: string, 
   ruleSets: FilterRuleSet[]
 ): string {
    try {
      const dom = new JSDOM(content);
      const document = dom.window.document;

      // ルールセットを優先度順にソート
      const sortedRuleSets = [...ruleSets].sort((a, b) => 
        (b.rules[0]?.priority || 0) - (a.rules[0]?.priority || 0)
      );

      for (const ruleSet of sortedRuleSets) {
        for (const rule of ruleSet.rules) {
          if (!rule.enabled) {
            continue;
          }

          if ('selector' in rule) {
            // CSSセレクタルールの適用
            this.applySelectorRule(document, rule as SelectorFilterRule);
          } else if ('pattern' in rule) {
            // パターンルールの適用
            // HTMLの場合はテキストノードに対して適用
            this.applyPatternRuleToTextNodes(
             document, 
             rule as PatternFilterRule
           );
          }
        }
      }

      return dom.serialize();
    } catch (error) {
      this.logger.error(`HTMLフィルタリング中にエラーが発生しました: ${error}`);
      return content;
    }
  }

  /**
   * JSONコンテンツにフィルタリングルールを適用する
   */
  private filterJsonContent(
   content: string, 
   ruleSets: FilterRuleSet[]
 ): string {
    try {
      let jsonObj = JSON.parse(content);
      
      // ルールセットを優先度順にソート
      const sortedRuleSets = [...ruleSets].sort((a, b) => 
        (b.rules[0]?.priority || 0) - (a.rules[0]?.priority || 0)
      );

      for (const ruleSet of sortedRuleSets) {
        for (const rule of ruleSet.rules) {
          if (!rule.enabled || !('pattern' in rule)) {
            continue;
          }

          const patternRule = rule as PatternFilterRule;
          jsonObj = this.applyPatternRuleToJson(jsonObj, patternRule);
        }
      }

      return JSON.stringify(jsonObj);
    } catch (error) {
      this.logger.error(`JSONフィルタリング中にエラーが発生しました: ${error}`);
      return content;
    }
  }

  /**
   * テキストコンテンツにフィルタリングルールを適用する
   */
  private filterTextContent(
   content: string, 
   ruleSets: FilterRuleSet[]
 ): string {
    try {
      let result = content;
      
      // ルールセットを優先度順にソート
      const sortedRuleSets = [...ruleSets].sort((a, b) => 
        (b.rules[0]?.priority || 0) - (a.rules[0]?.priority || 0)
      );

      for (const ruleSet of sortedRuleSets) {
        for (const rule of ruleSet.rules) {
          if (!rule.enabled || !('pattern' in rule)) {
            continue;
          }

          const patternRule = rule as PatternFilterRule;
          result = this.applyPatternRuleToText(result, patternRule);
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`テキストフィルタリング中にエラーが発生しました: ${error}`);
      return content;
    }
  }

  /**
   * CSSセレクタルールをDOMに適用する
   */
  private applySelectorRule(
   document: Document, 
   rule: SelectorFilterRule
 ): void {
    try {
      const elements = document.querySelectorAll(rule.selector);
      
      if (elements.length === 0) {
        return;
      }

      this.logger.debug(
       `セレクタ "${rule.selector}" に一致する要素が ${elements.length} 個見つかりました`
     );

      elements.forEach((element: Element) => {
        switch (rule.action) {
          case FilterActionType.REMOVE:
            element.parentNode?.removeChild(element);
            break;
          case FilterActionType.REPLACE:
            if (rule.replacement) {
              element.outerHTML = rule.replacement;
            }
            break;
          case FilterActionType.MODIFY:
            // 要素の属性を修正するなどの処理
            break;
          default:
            break;
        }
      });
    } catch (error) {
      this.logger.error(`セレクタルール適用中にエラーが発生しました: ${error}`);
    }
  }

  /**
   * パターンルールをテキストノードに適用する
   */
  private applyPatternRuleToTextNodes(
   document: Document, 
   rule: PatternFilterRule
 ): void {
    try {
      const textNodes: Text[] = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node as Text);
      }

      const pattern = new RegExp(rule.pattern, rule.caseSensitive ? 'g' : 'gi');

      textNodes.forEach(textNode => {
        const originalText = textNode.textContent || '';
        
        switch (rule.action) {
          case FilterActionType.REPLACE:
            if (rule.replacement !== undefined) {
              const newText = originalText.replace(pattern, rule.replacement);
              if (newText !== originalText) {
                textNode.textContent = newText;
              }
            }
            break;
          case FilterActionType.REMOVE:
            const newText = originalText.replace(pattern, '');
            if (newText !== originalText) {
              textNode.textContent = newText;
            }
            break;
          default:
            break;
        }
      });
    } catch (error) {
      this.logger.error(`テキストノードへのパターンルール適用中にエラーが発生しました: ${error}`);
    }
  }

  /**
   * パターンルールをJSONオブジェクトに適用する
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyPatternRuleToJson(
   jsonObj: unknown, 
   rule: PatternFilterRule
 ): unknown {
    const pattern = new RegExp(rule.pattern, rule.caseSensitive ? 'g' : 'gi');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processValue = (value: unknown): unknown => {
      if (typeof value === 'string') {
        switch (rule.action) {
          case FilterActionType.REPLACE:
            if (rule.replacement !== undefined) {
              return value.replace(pattern, rule.replacement);
            }
            return value;
          case FilterActionType.REMOVE:
            return value.replace(pattern, '');
          default:
            return value;
        }
      } else if (Array.isArray(value)) {
        return value.map(item => processValue(item));
      } else if (value !== null && typeof value === 'object') {
        return processObject(value);
      }
      return value;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processObject = (
     obj: Record<string, any>
   ): Record<string, unknown> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: Record<string, unknown> = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = processValue(obj[key]);
        }
      }
      return result;
    };

    return processValue(jsonObj);
  }

  /**
   * パターンルールをテキストに適用する
   */
  private applyPatternRuleToText(
    text: string, 
    rule: PatternFilterRule
  ): string {
    const pattern = new RegExp(rule.pattern, rule.caseSensitive ? 'g' : 'gi');

    switch (rule.action) {
      case FilterActionType.REPLACE:
        if (rule.replacement !== undefined) {
          return text.replace(pattern, rule.replacement);
        }
        return text;
      case FilterActionType.REMOVE:
        return text.replace(pattern, '');
      default:
        return text;
    }
  }
}

/**
 * URLパラメータフィルタリングを行うフィルタークラス
 */
export class UrlParamFilter implements ContentFilter {
  name = 'UrlParamFilter';
  private rules: ParamFilterRule[];
  private logger: winston.Logger;

  constructor(rules: ParamFilterRule[], logger: winston.Logger) {
    this.rules = rules;
    this.logger = logger;
  }

  /**
   * URLパラメータをフィルタリングする
   * 注: このフィルタはコンテンツを変更せず、リダイレクトのためのURLを返す
   */
  async filter(content: string, context: ProxyContext): Promise<string> {
    try {
      if (!context.originalUrl || !context.req.headers.host) {
        return content;
      }
      
      const baseUrl = `http://${context.req.headers.host}`;
      const url = new URL(context.originalUrl, baseUrl);
      let modified = false;

      for (const rule of this.rules) {
        if (!rule.enabled) {
          continue;
        }

        const pattern = new RegExp(rule.pattern);
        const params = Array.from(url.searchParams.keys());

        for (const param of params) {
          if (pattern.test(param)) {
            url.searchParams.delete(param);
            modified = true;
            this.logger.debug(`パラメータを削除しました: ${param}`);
          }
        }
      }

      if (modified) {
        // URLが変更された場合、リダイレクト用のURLを設定
        // Express.Responseの場合はredirectメソッドを使用
        if ('redirect' in context.res && 
            typeof context.res.redirect === 'function') {
          context.res.redirect(url.pathname + url.search);
          return ''; // リダイレクト後のレスポンスは無視される
        } else {
          // 標準のServerResponseの場合は手動でリダイレクトを設定
          context.res.writeHead(302, { 'Location': url.pathname + url.search });
          context.res.end();
          return '';
        }
      }

      return content;
    } catch (error) {
      this.logger.error(`URLパラメータフィルタリング中にエラーが発生しました: ${error}`);
      return content;
    }
  }
}

/**
 * フィルタリング設定からフィルターを作成する
 */
export function createCustomFilters(
  config: FilterConfig, 
  logger: winston.Logger
): ContentFilter[] {
  if (!config.enabled) {
    return [];
  }

  const filters: ContentFilter[] = [];
  
  // カスタムルールフィルターを追加
  filters.push(new CustomRuleFilter(config, logger));
  
  // URLパラメータフィルターを追加
  const paramRules = config.ruleSets
    .filter(ruleSet => ruleSet.enabled)
    .flatMap(ruleSet => ruleSet.rules)
    .filter(rule => 
      rule.enabled && 
      'action' in rule && 
      rule.action === FilterActionType.REMOVE_PARAM
    ) as ParamFilterRule[];
  
  if (paramRules.length > 0) {
    filters.push(new UrlParamFilter(paramRules, logger));
  }
  
  return filters;
}

/**
 * JSONファイルからフィルタリング設定をロードする
 */
export function loadFilterConfig(configPath: string): FilterConfig {
  try {
    // 実際の実装ではファイルからJSONを読み込む
    const configJson = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configJson) as FilterConfig;
    
    // 設定の検証
    if (typeof config.enabled !== 'boolean') {
      throw new ConfigError('フィルタリング設定の enabled プロパティが不正です');
    }
    
    if (!Array.isArray(config.ruleSets)) {
      throw new ConfigError('フィルタリング設定の ruleSets プロパティが不正です');
    }
    
    return config;
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    throw new ConfigError(`フィルタリング設定のロードに失敗しました: ${error}`);
  }
}
