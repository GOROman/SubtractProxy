import { PromptTemplate } from '../config/types';

/**
 * プロンプトテンプレート内の変数を置換する
 * 
 * @param template プロンプトテンプレート
 * @param content 置換対象のコンテンツ
 * @param additionalVars 追加の変数（オプション）
 * @returns 変数が置換されたプロンプトテンプレート
 */
export function processPromptTemplate(
  template: PromptTemplate,
  content: string,
  additionalVars?: Record<string, string>
): PromptTemplate {
  // 基本変数の設定
  const baseVars: Record<string, string> = {
    content,
    timestamp: new Date().toISOString(),
    ...template.variables,
    ...additionalVars,
  };

  // システムプロンプトの変数置換
  const systemPrompt = replaceVariables(template.system, baseVars);
  
  // ユーザープロンプトの変数置換（存在する場合）
  const userPrompt = template.user 
    ? replaceVariables(template.user, baseVars) 
    : undefined;

  return {
    system: systemPrompt,
    user: userPrompt,
    variables: template.variables,
  };
}

/**
 * テキスト内の変数プレースホルダーを実際の値で置換する
 * 
 * @param text 置換対象のテキスト
 * @param variables 変数と値のマップ
 * @returns 変数が置換されたテキスト
 */
export function replaceVariables(
  text: string,
  variables: Record<string, string>
): string {
  // {{変数名}} 形式のプレースホルダーを置換
  return text.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    const trimmedVarName = varName.trim();
    return variables[trimmedVarName] !== undefined 
      ? variables[trimmedVarName] 
      : match; // 変数が見つからない場合は元のプレースホルダーをそのまま残す
  });
}

/**
 * プロンプトテンプレートのバリデーションを行う
 * 
 * @param template バリデーション対象のプロンプトテンプレート
 * @returns バリデーション結果（true: 有効、false: 無効）
 */
export function validatePromptTemplate(template: PromptTemplate): boolean {
  // システムプロンプトは必須
  if (!template.system || template.system.trim() === '') {
    return false;
  }
  
  // 変数の参照チェック（存在しない変数への参照がないか）
  const allVars = template.variables || {};
  const systemVarRefs = extractVariableReferences(template.system);
  
  if (template.user) {
    const userVarRefs = extractVariableReferences(template.user);
    // ユーザープロンプト内の変数参照をチェック
    for (const varRef of userVarRefs) {
      // content と timestamp は基本変数なのでスキップ
      if (varRef !== 'content' && varRef !== 'timestamp' && !(varRef in allVars)) {
        return false;
      }
    }
  }
  
  // システムプロンプト内の変数参照をチェック
  for (const varRef of systemVarRefs) {
    // content と timestamp は基本変数なのでスキップ
    if (varRef !== 'content' && varRef !== 'timestamp' && !(varRef in allVars)) {
      return false;
    }
  }
  
  return true;
}

/**
 * テキスト内の変数参照を抽出する
 * 
 * @param text 抽出対象のテキスト
 * @returns 抽出された変数名の配列
 */
function extractVariableReferences(text: string): string[] {
  const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
  return matches.map(match => match.slice(2, -2).trim());
}
