import { createLogger } from '../logger';
import { Config } from '../../config';
import winston from 'winston';

// winstonをモック化
jest.mock('winston', () => {
  const mockFormat = {
    combine: jest.fn().mockReturnThis(),
    colorize: jest.fn().mockReturnThis(),
    timestamp: jest.fn().mockReturnThis(),
    printf: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  return {
    format: mockFormat,
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
    createLogger: jest.fn().mockReturnValue(mockLogger),
  };
});

describe('ロガー', () => {
  let config: Config;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();

    // 設定オブジェクトの作成
    config = {
      port: 8080,
      host: 'localhost',
      ignoreRobotsTxt: false,
      llm: {
        type: 'ollama',
        enabled: true,
        model: 'gemma',
      },
      logging: {
        level: 'info',
      },
    } as Config;
  });

  test('ロガーが正しく作成される', () => {
    const logger = createLogger(config);
    expect(winston.createLogger).toHaveBeenCalledWith({
      level: config.logging.level,
      transports: expect.any(Array),
    });
  });

  test('ファイルロギングが設定されている場合', () => {
    const configWithFile = { ...config };
    configWithFile.logging.file = 'logs/app.log';

    createLogger(configWithFile);
    expect(winston.transports.File).toHaveBeenCalledWith({
      filename: configWithFile.logging.file,
      format: expect.any(Object),
    });
  });

  test('ロガーが正しいレベルで作成される', () => {
    config.logging.level = 'debug';
    createLogger(config);
    expect(winston.createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug',
      }),
    );
  });
});
