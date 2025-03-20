/**
 * フィルタリングルールの型定義
 */

/**
 * フィルタリングアクションの種類
 */
export enum FilterActionType {
  REMOVE = 'remove', // 要素を削除
  REPLACE = 'replace', // 要素を置換
  REMOVE_PARAM = 'remove-param', // URLパラメータを削除
  BLOCK = 'block', // コンテンツをブロック
  MODIFY = 'modify', // コンテンツを修正
}

/**
 * フィルタリングルールの基本インターフェース
 */
export interface FilterRule {
  name: string; // ルール名
  enabled: boolean; // 有効/無効
  description?: string; // 説明
  priority?: number; // 優先順位（高いほど先に適用）
}

/**
 * パターンベースのフィルタリングルール
 */
export interface PatternFilterRule extends FilterRule {
  pattern: string; // 正規表現パターン
  action: FilterActionType;
  replacement?: string; // 置換用テキスト（actionがreplaceの場合）
  caseSensitive?: boolean; // 大文字小文字を区別するか
}

/**
 * CSSセレクタベースのフィルタリングルール
 */
export interface SelectorFilterRule extends FilterRule {
  selector: string; // CSSセレクタ
  action: FilterActionType;
  replacement?: string; // 置換用HTML（actionがreplaceの場合）
}

/**
 * URLパラメータフィルタリングルール
 */
export interface ParamFilterRule extends FilterRule {
  pattern: string; // パラメータ名のパターン
  action: FilterActionType.REMOVE_PARAM;
}

/**
 * コンテンツタイプフィルタリングルール
 */
export interface ContentTypeFilterRule extends FilterRule {
  contentType: string; // 対象のコンテンツタイプ
  action: FilterActionType;
}

/**
 * フィルタリングルールの条件
 */
export interface FilterCondition {
  urlPattern?: string; // 適用するURLパターン
  contentTypePattern?: string; // 適用するコンテンツタイプパターン
  headerPattern?: {
    // 適用するヘッダーパターン
    name: string;
    value: string;
  };
}

/**
 * フィルタリングルールセット
 */
export interface FilterRuleSet {
  name: string;
  description?: string;
  enabled: boolean;
  condition?: FilterCondition;
  rules: (
    | PatternFilterRule
    | SelectorFilterRule
    | ParamFilterRule
    | ContentTypeFilterRule
  )[];
}

/**
 * フィルタリング設定
 */
export interface FilterConfig {
  enabled: boolean;
  ruleSets: FilterRuleSet[];
  paramRules?: ParamFilterRule[];
}
