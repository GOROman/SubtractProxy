import { Request, Response, NextFunction } from 'express';
import { FilterService } from '../services/filter-service';
import { AppError } from '../utils/errors';
import * as cheerio from 'cheerio';
import { MatchType } from '../types/filtering';

/**
 * フィルタリングミドルウェア
 * レスポンスのコンテンツに対してフィルタリングルールを適用する
 */
export class FilterMiddleware {
  constructor(private filterService: FilterService) {}

  /**
   * フィルタリングミドルウェアを生成する
   */
  public createMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      // オリジナルのend関数を保存
      const originalEnd = res.end;
      let buffer = Buffer.from('');

      // レスポンスデータを収集
      res.write = (...args: any[]): boolean => {
        if (args[0]) {
          const chunk = Buffer.isBuffer(args[0])
            ? args[0]
            : Buffer.from(args[0]);
          buffer = Buffer.concat([buffer, chunk]);
        }
        return true;
      };

      // レスポンスの最後でフィルタリングを適用
      res.end = async (...args: any[]): Promise<any> => {
        try {
          if (args[0]) {
            const chunk = Buffer.isBuffer(args[0])
              ? args[0]
              : Buffer.from(args[0]);
            buffer = Buffer.concat([buffer, chunk]);
          }

          const contentType = res.getHeader('content-type');
          if (typeof contentType === 'string' && 
              contentType.includes('text/html')) {
            // HTMLコンテンツの場合
            const content = buffer.toString();
            const filteredContent = await this.filterHtmlContent(content);
            buffer = Buffer.from(filteredContent);

            // Content-Lengthを更新
            res.setHeader('content-length', buffer.length);
          }

          // オリジナルのend関数を呼び出し
          res.write = originalEnd;
          return originalEnd.call(res, buffer);
        } catch (error) {
          next(new AppError('フィルタリング処理中にエラーが発生しました', {
            error,
            url: req.url,
          }));
        }
      };

      next();
    };
  }

  /**
   * HTMLコンテンツにフィルタリングを適用する
   */
  private async filterHtmlContent(content: string): Promise<string> {
    // 正規表現ルールを適用
    let filteredContent = await this.filterService.applyFilters(content);

    // CSSセレクタルールを適用
    const $ = cheerio.load(filteredContent);
    const rules = this.filterService['config'].rules
      .filter(rule => rule.enabled && rule.matchType === MatchType.CSS_SELECTOR)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of rules) {
      try {
        $(rule.pattern).remove();
      } catch (error) {
        console.error(`CSSセレクタルール適用エラー: ${rule.id}`, error);
      }
    }

    return $.html();
  }
}
