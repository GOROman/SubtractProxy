/**
 * 負荷テストスクリプト
 * 
 * このスクリプトは、プロキシサーバーに対して負荷テストを実行します。
 * CI/CDパイプラインで使用されます。
 */

const http = require('http');
const { performance } = require('perf_hooks');
const { spawn } = require('child_process');
const { promisify } = require('util');
const wait = promisify(setTimeout);

// テスト設定
const TEST_DURATION = 30000; // 30秒
const CONCURRENT_REQUESTS = 10;
const REQUEST_INTERVAL = 100; // ミリ秒
const TEST_URL = 'http://localhost:3000/proxy?url=https://example.com';
const SERVER_STARTUP_WAIT = 3000; // サーバー起動待機時間（ミリ秒）

// 結果格納用
const results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  timeouts: 0,
  responseTimes: [],
  errors: []
};

// サーバーを起動
console.log('テスト用サーバーを起動しています...');
const server = spawn('node', ['dist/index.js'], {
  env: { ...process.env, NODE_ENV: 'test' },
  stdio: 'pipe'
});

server.stdout.on('data', (data) => {
  console.log(`サーバー出力: ${data}`);
});

server.stderr.on('data', (data) => {
  console.error(`サーバーエラー: ${data}`);
});

// 単一のリクエストを送信する関数
function sendRequest() {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    const req = http.get(TEST_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        results.totalRequests++;
        results.responseTimes.push(responseTime);
        
        if (res.statusCode >= 200 && res.statusCode < 400) {
          results.successfulRequests++;
        } else {
          results.failedRequests++;
          results.errors.push({
            statusCode: res.statusCode,
            time: new Date().toISOString()
          });
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      results.totalRequests++;
      results.failedRequests++;
      results.errors.push({
        error: error.message,
        time: new Date().toISOString()
      });
      
      resolve();
    });
    
    req.setTimeout(5000, () => {
      req.abort();
      results.totalRequests++;
      results.timeouts++;
      results.errors.push({
        error: 'タイムアウト',
        time: new Date().toISOString()
      });
      
      resolve();
    });
  });
}

// 負荷テストを実行
async function runLoadTest() {
  console.log(`負荷テストを開始します: ${CONCURRENT_REQUESTS}同時リクエスト、${TEST_DURATION / 1000}秒間`);
  
  const startTime = performance.now();
  let running = true;
  
  // テスト時間経過後に停止
  setTimeout(() => {
    running = false;
  }, TEST_DURATION);
  
  // 並行リクエストを管理
  const workers = Array(CONCURRENT_REQUESTS).fill(0).map(async (_, index) => {
    while (running) {
      await sendRequest();
      await wait(REQUEST_INTERVAL);
    }
  });
  
  await Promise.all(workers);
  
  const endTime = performance.now();
  const testDuration = endTime - startTime;
  
  // 結果を計算
  const avgResponseTime = results.responseTimes.length > 0
    ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length
    : 0;
  
  const successRate = results.totalRequests > 0
    ? (results.successfulRequests / results.totalRequests) * 100
    : 0;
  
  // 結果を表示
  console.log('\n負荷テスト結果:');
  console.log(`総リクエスト数: ${results.totalRequests}`);
  console.log(`成功リクエスト数: ${results.successfulRequests}`);
  console.log(`失敗リクエスト数: ${results.failedRequests}`);
  console.log(`タイムアウト数: ${results.timeouts}`);
  console.log(`成功率: ${successRate.toFixed(2)}%`);
  console.log(`平均応答時間: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`テスト時間: ${(testDuration / 1000).toFixed(2)}秒`);
  
  if (results.errors.length > 0) {
    console.log('\nエラー詳細:');
    results.errors.slice(0, 5).forEach((err, i) => {
      console.log(`エラー ${i + 1}: ${JSON.stringify(err)}`);
    });
    
    if (results.errors.length > 5) {
      console.log(`...他 ${results.errors.length - 5} 件のエラー`);
    }
  }
  
  // 成功基準を確認
  const testPassed = successRate >= 95 && results.timeouts <= results.totalRequests * 0.05;
  
  if (testPassed) {
    console.log('\n✅ 負荷テスト成功: 成功率が95%以上、タイムアウトが5%以下');
    return 0;
  } else {
    console.error('\n❌ 負荷テスト失敗: 成功率が95%未満、またはタイムアウトが5%を超えています');
    return 1;
  }
}

// サーバー起動を待ってからテスト実行
async function main() {
  try {
    // サーバー起動を待つ
    await wait(SERVER_STARTUP_WAIT);
    
    // 負荷テスト実行
    const exitCode = await runLoadTest();
    
    // サーバー終了
    server.kill();
    
    process.exit(exitCode);
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
    server.kill();
    process.exit(1);
  }
}

main();
