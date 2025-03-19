import fs from 'fs';
import path from 'path';

/**
 * ファイルが存在するかチェックする
 * @param filePath ファイルパス
 * @returns 存在する場合はtrue
 */
export const fileExists = (filePath: string): boolean => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

/**
 * JSONファイルを読み込む
 * @param filePath ファイルパス
 * @returns JSONオブジェクト
 */
export const readJsonFile = <T>(filePath: string): T | null => {
  try {
    if (!fileExists(filePath)) {
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    throw new Error(`JSONファイルの読み込みに失敗しました: ${filePath} - ${error}`);
  }
};

/**
 * プロジェクトルートからの相対パスを絶対パスに変換する
 * @param relativePath 相対パス
 * @returns 絶対パス
 */
export const resolveProjectPath = (relativePath: string): string => {
  // プロジェクトルートディレクトリの取得
  const projectRoot = path.resolve(__dirname, '../../');
  return path.resolve(projectRoot, relativePath);
};
