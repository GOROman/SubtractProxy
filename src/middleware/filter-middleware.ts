import { Request, Response, NextFunction } from 'express';
import { FilterService } from '../services/filter-service';
import { AppError } from '../utils/errors';
import * as cheerio from 'cheerio';
import { MatchType } from '../types/filtering';

type WriteCallback = (error?: Error | null) => void;
type EndCallback = () => void;

type WriteFunction = {
  (chunk: any, callback?: WriteCallback): boolean;
  (chunk: any, encoding: BufferEncoding, callback?: WriteCallback): boolean;
}

type EndFunction = {
  (cb?: EndCallback): void;
  (chunk: any, cb?: EndCallback): void;
  (chunk: any, encoding: BufferEncoding, cb?: EndCallback): void;
}

type ResponseWrite = {
  (chunk: any, callback?: WriteCallback): boolean;
  (chunk: any, encoding: BufferEncoding, callback?: WriteCallback): boolean;
}

type ResponseEnd = {
  (cb?: EndCallback): Response;
  (chunk: any, cb?: EndCallback): Response;
  (chunk: any, encoding: BufferEncoding, cb?: EndCallback): Response;
}

/**
 * フィルタリングミドルウェア
 * レスポンスのコンテンツに対してフィルタリングルールを適用する
 */
export class FilterMiddleware {
  constructor(private filterService: FilterService) {}

  /**
   * フィルタリングミドルウェアを生成する
   */
  public createMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      // オリジナルの関数を保存
      const originalWrite = res.write.bind(res) as WriteFunction;
      const originalEnd = res.end.bind(res) as EndFunction;
      let buffer = Buffer.from('');

      // レスポンスデータを収集
      const newWrite: ResponseWrite = (chunk: any, encodingOrCallback?: BufferEncoding | WriteCallback, callback?: WriteCallback): boolean => {
        if (chunk) {
          const data = Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk);
          buffer = Buffer.concat([buffer, data]);
        }

        if (typeof encodingOrCallback === 'function') {
          return originalWrite(chunk, encodingOrCallback);
        }
        return originalWrite(chunk, encodingOrCallback as BufferEncoding, callback);
      };
      res.write = newWrite;

      // レスポンスの最後でフィルタリングを適用
      const newEnd: ResponseEnd = (chunkOrCallback?: any, encodingOrCallback?: BufferEncoding | EndCallback, callback?: EndCallback): Response => {
        void (async () => {
          try {
            if (typeof chunkOrCallback !== 'function' && chunkOrCallback) {
              const data = Buffer.isBuffer(chunkOrCallback)
                ? chunkOrCallback
                : Buffer.from(chunkOrCallback);
              buffer = Buffer.concat([buffer, data]);
            }

            const contentType = res.getHeader('content-type');
            if (typeof contentType === 'string' && 
                contentType.includes('text/html')) {
              // HTMLコンテンツの場合
              const content = buffer.toString();
              const filteredContent = await this.filterHtmlContent(content);
              buffer = Buffer.from(filteredContent);

              // 更新されたコンテンツを送信
              res.setHeader('content-length', buffer.length);
              if (typeof chunkOrCallback === 'function') {
                originalEnd(buffer, chunkOrCallback);
              } else if (typeof encodingOrCallback === 'function') {
                originalEnd(buffer, encodingOrCallback);
              } else {
                originalEnd(buffer, encodingOrCallback as BufferEncoding, callback);
              }
            } else {
              // 非HTMLコンテンツはそのまま送信
              if (typeof chunkOrCallback === 'function') {
                originalEnd(buffer, chunkOrCallback);
              } else if (typeof encodingOrCallback === 'function') {
                originalEnd(buffer, encodingOrCallback);
              } else {
                originalEnd(buffer, encodingOrCallback as BufferEncoding, callback);
              }
            }
          } catch (error) {
            const appError = new AppError(
              'フィルタリング処理中にエラーが発生しました',
              'FILTER_ERROR',
              500,
              { error, url: req.url }
            );
            next(appError);
            if (typeof chunkOrCallback === 'function') {
              originalEnd(chunkOrCallback);
            } else {
              originalEnd();
            }
          }
        })();
        return res;
      };
      res.end = newEnd;
    };
  }

  /**
   * HTMLコンテンツにフィルタリングを適用する
   */
  private async filterHtmlContent(content: string): Promise<string> {
    // 正規表現ルールを適用
    const filteredContent = await this.filterService.applyFilters(content);

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
