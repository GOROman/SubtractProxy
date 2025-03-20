/**
 * フィルタリングルールの優先度
 */
export enum RulePriority {
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
}

/**
 * マッチング条件の種類
 */
export enum MatchType {
  REGEX = 'regex',
  CSS_SELECTOR = 'css',
}

/**
 * フィルタリングルールの定義
 */
export interface FilterRule {
  /** ルールの一意な識別子 */
  id: string;
  /** ルールの名前 */
  name: string;
  /** ルールの説明 */
  description?: string;
  /** マッチングの種類 */
  matchType: MatchType;
  /** マッチングパターン（正規表現文字列またはCSSセレクタ） */
  pattern: string;
  /** ルールの優先度 */
  priority: RulePriority;
  /** ルールが有効かどうか */
  enabled: boolean;
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

/**
 * フィルタリング設定
 */
export interface FilterConfig {
  /** フィルタリングルールのリスト */
  rules: FilterRule[];
  /** デフォルトの優先度 */
  defaultPriority: RulePriority;
  /** フィルタリングが有効かどうか */
  enabled: boolean;
}
