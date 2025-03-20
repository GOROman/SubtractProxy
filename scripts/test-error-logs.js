/**
 * エラーログフォーマット検証スクリプト
 * 
 * このスクリプトは、エラーログのフォーマットが正しいかどうかを検証します。
 * CI/CDパイプラインで使用されます。
 */

const fs = require('fs');
const path = require('path');
const winston = require('winston');

// テスト用のロガーを作成
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/test-error.log') 
    })
  ]
});

// テスト用のエラーログディレクトリを作成
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// テスト用のエラーログを生成
logger.error('テスト用エラーログ', {
  errorType: 'NetworkError',
  statusCode: 503,
  message: 'ネットワーク接続エラー',
  context: 'テスト',
  timestamp: new Date().toISOString()
});

logger.warn('テスト用警告ログ', {
  errorType: 'ConfigError',
  statusCode: 400,
  message: '設定エラー',
  context: 'テスト',
  timestamp: new Date().toISOString()
});

// ログファイルを読み込んで検証
setTimeout(() => {
  try {
    const logContent = fs.readFileSync(path.join(__dirname, '../logs/test-error.log'), 'utf8');
    const logLines = logContent.trim().split('\n');
    
    // 各ログエントリをJSONとしてパース
    const logEntries = logLines.map(line => JSON.parse(line));
    
    // 必須フィールドの存在を確認
    const requiredFields = ['level', 'message', 'timestamp'];
    const missingFields = [];
    
    for (const entry of logEntries) {
      for (const field of requiredFields) {
        if (!entry[field]) {
          missingFields.push(`エントリ ${entry.message || 'unknown'} に ${field} が欠けています`);
        }
      }
    }
    
    if (missingFields.length > 0) {
      console.error('エラーログフォーマット検証に失敗しました:');
      missingFields.forEach(msg => console.error(`- ${msg}`));
      process.exit(1);
    } else {
      console.log('エラーログフォーマット検証に成功しました');
      process.exit(0);
    }
  } catch (error) {
    console.error('エラーログの検証中にエラーが発生しました:', error);
    process.exit(1);
  }
}, 1000); // ログファイルが書き込まれるのを待つ
