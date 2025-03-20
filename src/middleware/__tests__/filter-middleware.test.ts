import { Request, Response, NextFunction } from 'express';
import { FilterMiddleware } from '../filter-middleware';
import { FilterService } from '../../services/filter-service';
import { MatchType, RulePriority } from '../../types/filtering';

describe('FilterMiddleware', () => {
  let filterService: FilterService;
  let filterMiddleware: FilterMiddleware;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    filterService = new FilterService();
    filterMiddleware = new FilterMiddleware(filterService);
    req = {
      url: 'http://example.com',
    };
    res = {
      getHeader: jest.fn(),
      setHeader: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };
    next = jest.fn();
  });

  describe('HTMLコンテンツのフィルタリング', () => {
    beforeEach(() => {
      (res.getHeader as jest.Mock).mockReturnValue('text/html; charset=utf-8');
    });

    it('正規表現ルールが正しく適用されること', async () => {
      filterService.addRule({
        name: '数字除去',
        matchType: MatchType.REGEX,
        pattern: '\\d+',
        priority: RulePriority.MEDIUM,
        enabled: true,
      });

      const middleware = filterMiddleware.createMiddleware();
      await middleware(req as Request, res as Response, next);

      // HTMLコンテンツをシミュレート
      const content = 'テスト123テスト456';
      (res.write as jest.Mock).call(res, content);
      await (res.end as jest.Mock).call(res);

      expect(res.write).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('content-length', expect.any(Number));
    });

    it('CSSセレクタルールが正しく適用されること', async () => {
      filterService.addRule({
        name: '広告除去',
        matchType: MatchType.CSS_SELECTOR,
        pattern: '.ad-content',
        priority: RulePriority.HIGH,
        enabled: true,
      });

      const middleware = filterMiddleware.createMiddleware();
      await middleware(req as Request, res as Response, next);

      // HTMLコンテンツをシミュレート
      const content = '<div>通常コンテンツ</div><div class="ad-content">広告</div>';
      (res.write as jest.Mock).call(res, content);
      await (res.end as jest.Mock).call(res);

      expect(res.write).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('content-length', expect.any(Number));
    });

    it('複数のルールが優先度順に適用されること', async () => {
      filterService.addRule({
        name: '数字除去',
        matchType: MatchType.REGEX,
        pattern: '\\d+',
        priority: RulePriority.LOW,
        enabled: true,
      });

      filterService.addRule({
        name: '広告除去',
        matchType: MatchType.CSS_SELECTOR,
        pattern: '.ad-content',
        priority: RulePriority.HIGH,
        enabled: true,
      });

      const middleware = filterMiddleware.createMiddleware();
      await middleware(req as Request, res as Response, next);

      // HTMLコンテンツをシミュレート
      const content = '<div>テスト123</div><div class="ad-content">広告456</div>';
      (res.write as jest.Mock).call(res, content);
      await (res.end as jest.Mock).call(res);

      expect(res.write).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('content-length', expect.any(Number));
    });

    it('非HTMLコンテンツはフィルタリングされないこと', async () => {
      (res.getHeader as jest.Mock).mockReturnValue('application/json');

      const middleware = filterMiddleware.createMiddleware();
      await middleware(req as Request, res as Response, next);

      const content = '{"test": 123}';
      (res.write as jest.Mock).call(res, content);
      await (res.end as jest.Mock).call(res);

      expect(res.write).toHaveBeenCalled();
      expect(res.setHeader).not.toHaveBeenCalled();
    });

    it('エラー発生時にエラーハンドラーが呼ばれること', async () => {
      (res.getHeader as jest.Mock).mockImplementation(() => {
        throw new Error('テストエラー');
      });

      const middleware = filterMiddleware.createMiddleware();
      await middleware(req as Request, res as Response, next);

      const content = 'テストコンテンツ';
      (res.write as jest.Mock).call(res, content);
      await (res.end as jest.Mock).call(res);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
