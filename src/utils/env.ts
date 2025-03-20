/**
 * 環境変数から値を取得する
 * @param key 環境変数名
 * @param defaultValue デフォルト値
 * @returns 環境変数の値またはデフォルト値
 */
export const getEnv = (
  key: string,
  defaultValue?: string,
): string | undefined => {
  const value = process.env[key];
  return value !== undefined ? value : defaultValue;
};

/**
 * 環境変数から数値を取得する
 * @param key 環境変数名
 * @param defaultValue デフォルト値
 * @returns 環境変数の数値またはデフォルト値
 */
export const getEnvNumber = (
  key: string,
  defaultValue?: number,
): number | undefined => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }

  const numValue = Number(value);
  return !isNaN(numValue) ? numValue : defaultValue;
};

/**
 * 環境変数からブール値を取得する
 * @param key 環境変数名
 * @param defaultValue デフォルト値
 * @returns 環境変数のブール値またはデフォルト値
 */
export const getEnvBoolean = (
  key: string,
  defaultValue?: boolean,
): boolean | undefined => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
};
