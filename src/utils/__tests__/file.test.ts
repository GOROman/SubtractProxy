import fs from 'fs';
import path from 'path';
import { fileExists, readJsonFile, resolveProjectPath } from '../file';

// fsモジュールをモック
jest.mock('fs');

describe('ファイルユーティリティのテスト', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('fileExists', () => {
    test('ファイルが存在する場合、trueを返す', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      const result = fileExists('/path/to/file.json');
      expect(result).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/file.json');
    });

    test('ファイルが存在しない場合、falseを返す', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = fileExists('/path/to/nonexistent.json');
      expect(result).toBe(false);
    });

    test('エラーが発生した場合、falseを返す', () => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => {
        throw new Error('アクセス拒否');
      });

      const result = fileExists('/path/to/file.json');
      expect(result).toBe(false);
    });
  });

  describe('readJsonFile', () => {
    test('ファイルが存在する場合、JSONオブジェクトを返す', () => {
      const mockData = { key: 'value' };
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockData));

      const result = readJsonFile('/path/to/file.json');
      expect(result).toEqual(mockData);
      expect(fs.readFileSync).toHaveBeenCalledWith(
        '/path/to/file.json',
        'utf-8',
      );
    });

    test('ファイルが存在しない場合、nullを返す', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = readJsonFile('/path/to/nonexistent.json');
      expect(result).toBeNull();
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    test('ファイル読み込みでエラーが発生した場合、例外をスローする', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('読み込みエラー');
      });

      expect(() => readJsonFile('/path/to/file.json')).toThrow();
    });

    test('JSONパースでエラーが発生した場合、例外をスローする', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('不正なJSON');

      expect(() => readJsonFile('/path/to/file.json')).toThrow();
    });
  });

  describe('resolveProjectPath', () => {
    test('相対パスを絶対パスに変換する', () => {
      // パスの解決をモック
      const mockProjectRoot = '/mock/project/root';
      jest.spyOn(path, 'resolve').mockImplementation((...args) => {
        // 単純化のため、引数を連結して返す
        return args.join('/');
      });

      const result = resolveProjectPath('config/file.json');

      // 最終的な結果のみを検証
      expect(result).toContain('config/file.json');
    });
  });
});
