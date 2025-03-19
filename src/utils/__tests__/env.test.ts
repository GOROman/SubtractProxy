import { getEnv, getEnvNumber, getEnvBoolean } from '../env';

describe('環境変数ユーティリティのテスト', () => {
  // テスト前の準備
  const originalEnv = process.env;

  beforeEach(() => {
    // 環境変数をリセット
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // テスト後に環境変数を元に戻す
    process.env = originalEnv;
  });

  describe('getEnv', () => {
    test('環境変数が存在する場合、その値を返す', () => {
      process.env.TEST_VAR = 'test-value';
      expect(getEnv('TEST_VAR')).toBe('test-value');
    });

    test('環境変数が存在しない場合、デフォルト値を返す', () => {
      expect(getEnv('NON_EXISTENT_VAR', 'default')).toBe('default');
    });

    test('環境変数が存在せずデフォルト値も指定されていない場合、undefinedを返す', () => {
      expect(getEnv('NON_EXISTENT_VAR')).toBeUndefined();
    });
  });

  describe('getEnvNumber', () => {
    test('環境変数が数値として解析可能な場合、数値を返す', () => {
      process.env.TEST_NUM = '123';
      expect(getEnvNumber('TEST_NUM')).toBe(123);
    });

    test('環境変数が数値として解析不可能な場合、デフォルト値を返す', () => {
      process.env.TEST_NUM = 'not-a-number';
      expect(getEnvNumber('TEST_NUM', 456)).toBe(456);
    });

    test('環境変数が存在しない場合、デフォルト値を返す', () => {
      expect(getEnvNumber('NON_EXISTENT_NUM', 789)).toBe(789);
    });

    test('環境変数が存在せずデフォルト値も指定されていない場合、undefinedを返す', () => {
      expect(getEnvNumber('NON_EXISTENT_NUM')).toBeUndefined();
    });
  });

  describe('getEnvBoolean', () => {
    test('環境変数が"true"の場合、trueを返す', () => {
      process.env.TEST_BOOL = 'true';
      expect(getEnvBoolean('TEST_BOOL')).toBe(true);
    });

    test('環境変数が"TRUE"（大文字）の場合、trueを返す', () => {
      process.env.TEST_BOOL = 'TRUE';
      expect(getEnvBoolean('TEST_BOOL')).toBe(true);
    });

    test('環境変数が"true"以外の場合、falseを返す', () => {
      process.env.TEST_BOOL = 'false';
      expect(getEnvBoolean('TEST_BOOL')).toBe(false);

      process.env.TEST_BOOL = 'anything';
      expect(getEnvBoolean('TEST_BOOL')).toBe(false);
    });

    test('環境変数が存在しない場合、デフォルト値を返す', () => {
      expect(getEnvBoolean('NON_EXISTENT_BOOL', true)).toBe(true);
      expect(getEnvBoolean('NON_EXISTENT_BOOL', false)).toBe(false);
    });

    test('環境変数が存在せずデフォルト値も指定されていない場合、undefinedを返す', () => {
      expect(getEnvBoolean('NON_EXISTENT_BOOL')).toBeUndefined();
    });
  });
});
