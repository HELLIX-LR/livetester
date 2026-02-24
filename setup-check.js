/**
 * Automated Setup Check Script
 * Проверяет и настраивает окружение для LIVE RUSSIA Tester Dashboard
 */

require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.blue}\n=== ${msg} ===${colors.reset}`)
};

/**
 * Execute command and return promise
 */
function execCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Check if a command exists
 */
async function commandExists(command) {
  try {
    await execCommand(`${command} --version`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check Node.js version
 */
async function checkNodeJS() {
  log.header('Проверка Node.js');
  
  try {
    const { stdout } = await execCommand('node --version');
    const version = stdout.trim();
    const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
    
    if (majorVersion >= 16) {
      log.success(`Node.js ${version} установлен`);
      return true;
    } else {
      log.error(`Node.js ${version} слишком старая версия. Требуется 16.0+`);
      return false;
    }
  } catch {
    log.error('Node.js не установлен');
    log.info('Скачайте и установите Node.js с https://nodejs.org/');
    return false;
  }
}

/**
 * Check npm and install dependencies
 */
async function checkNPM() {
  log.header('Проверка npm и зависимостей');
  
  try {
    const { stdout } = await execCommand('npm --version');
    log.success(`npm ${stdout.trim()} доступен`);
    
    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
      log.info('Установка зависимостей...');
      await execCommand('npm install');
      log.success('Зависимости установлены');
    } else {
      log.success('Зависимости уже установлены');
    }
    
    return true;
  } catch (error) {
    log.error('Ошибка при работе с npm: ' + error.error?.message);
    return false;
  }
}

/**
 * Check PostgreSQL connection
 */
async function checkPostgreSQL() {
  log.header('Проверка PostgreSQL');
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'live_russia_dashboard',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  };
  
  if (!dbConfig.password) {
    log.warning('DB_PASSWORD не установлен в .env файле');
    return false;
  }
  
  try {
    // Try to connect using psql
    const psqlCommand = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -c "SELECT NOW();"`;
    process.env.PGPASSWORD = dbConfig.password;
    
    await execCommand(psqlCommand);
    log.success(`PostgreSQL подключение успешно (${dbConfig.host}:${dbConfig.port}/${dbConfig.database})`);
    return true;
  } catch (error) {
    log.error('Не удается подключиться к PostgreSQL');
    log.info(`Проверьте настройки в .env: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    log.info('Убедитесь, что PostgreSQL запущен и база данных создана');
    return false;
  }
}

/**
 * Check Redis connection
 */
async function checkRedis() {
  log.header('Проверка Redis');
  
  try {
    await execCommand('redis-cli ping');
    log.success('Redis подключение успешно');
    return true;
  } catch {
    log.error('Не удается подключиться к Redis');
    log.info('Убедитесь, что Redis запущен:');
    log.info('  Windows (WSL): sudo service redis-server start');
    log.info('  Windows (native): запустите redis-server.exe');
    return false;
  }
}

/**
 * Check .env file
 */
function checkEnvFile() {
  log.header('Проверка .env файла');
  
  if (!fs.existsSync('.env')) {
    log.warning('.env файл не найден');
    
    if (fs.existsSync('.env.example')) {
      log.info('Копирование .env.example в .env...');
      fs.copyFileSync('.env.example', '.env');
      log.success('.env файл создан из .env.example');
      log.warning('Отредактируйте .env файл с вашими настройками');
    } else {
      log.error('.env.example файл не найден');
      return false;
    }
  } else {
    log.success('.env файл существует');
  }
  
  // Check required variables
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'REDIS_URL', 'SESSION_SECRET'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    log.warning(`Отсутствуют переменные в .env: ${missingVars.join(', ')}`);
    return false;
  }
  
  log.success('Все необходимые переменные окружения установлены');
  return true;
}

/**
 * Run database migrations
 */
async function runMigrations() {
  log.header('Запуск миграций базы данных');
  
  try {
    const { stdout } = await execCommand('node backend/db/run-migrations.js');
    log.success('Миграции выполнены успешно');
    console.log(stdout);
    return true;
  } catch (error) {
    log.error('Ошибка при выполнении миграций');
    console.log(error.stderr || error.stdout);
    return false;
  }
}

/**
 * Create admin user
 */
async function createAdmin() {
  log.header('Создание администратора');
  
  try {
    const { stdout } = await execCommand('node backend/db/seed-admin.js');
    log.success('Администратор создан');
    console.log(stdout);
    return true;
  } catch (error) {
    if (error.stdout && error.stdout.includes('already exists')) {
      log.info('Администратор уже существует');
      return true;
    }
    log.error('Ошибка при создании администратора');
    console.log(error.stderr || error.stdout);
    return false;
  }
}

/**
 * Test database connection using Node.js
 */
async function testDatabaseConnection() {
  log.header('Тестирование подключения к базе данных');
  
  try {
    const pool = require('./backend/config/database');
    const result = await pool.query('SELECT NOW() as current_time');
    log.success(`База данных доступна: ${result.rows[0].current_time}`);
    await pool.end();
    return true;
  } catch (error) {
    log.error('Ошибка подключения к базе данных: ' + error.message);
    return false;
  }
}

/**
 * Test Redis connection using Node.js
 */
async function testRedisConnection() {
  log.header('Тестирование подключения к Redis');
  
  try {
    const { redisClient } = require('./backend/config/redis');
    await redisClient.ping();
    log.success('Redis доступен');
    await redisClient.quit();
    return true;
  } catch (error) {
    log.error('Ошибка подключения к Redis: ' + error.message);
    return false;
  }
}

/**
 * Check Google Sheets configuration
 */
function checkGoogleSheets() {
  log.header('Проверка Google Sheets конфигурации');
  
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const credentialsPath = './backend/config/google-credentials.json';
  
  if (!spreadsheetId || spreadsheetId === 'your_spreadsheet_id_here') {
    log.warning('Google Sheets не настроен (GOOGLE_SHEETS_SPREADSHEET_ID)');
    log.info('Это опционально для базовой функциональности');
    return false;
  }
  
  if (!fs.existsSync(credentialsPath)) {
    log.warning('Google credentials файл не найден');
    log.info('Создайте backend/config/google-credentials.json для интеграции');
    return false;
  }
  
  log.success('Google Sheets конфигурация найдена');
  return true;
}

/**
 * Run basic API tests
 */
async function runBasicTests() {
  log.header('Запуск базовых тестов');
  
  try {
    // Start server in background for testing
    log.info('Запуск сервера для тестирования...');
    const serverProcess = exec('node backend/server.js');
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Run checkpoint verification
    const { stdout } = await execCommand('node checkpoint-verification.js');
    console.log(stdout);
    
    // Kill server process
    serverProcess.kill();
    
    log.success('Базовые тесты завершены');
    return true;
  } catch (error) {
    log.error('Ошибка при запуске тестов');
    console.log(error.stderr || error.stdout);
    return false;
  }
}

/**
 * Main setup check function
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('🚀 LIVE RUSSIA Tester Dashboard - Setup Check');
  console.log('============================================');
  console.log(`${colors.reset}`);
  
  const checks = [];
  
  // System checks
  checks.push({ name: 'Node.js', fn: checkNodeJS });
  checks.push({ name: 'npm & dependencies', fn: checkNPM });
  checks.push({ name: '.env configuration', fn: checkEnvFile });
  
  // Service checks
  checks.push({ name: 'PostgreSQL', fn: checkPostgreSQL });
  checks.push({ name: 'Redis', fn: checkRedis });
  
  // Database setup
  checks.push({ name: 'Database connection', fn: testDatabaseConnection });
  checks.push({ name: 'Database migrations', fn: runMigrations });
  checks.push({ name: 'Admin user creation', fn: createAdmin });
  
  // Optional checks
  checks.push({ name: 'Redis connection', fn: testRedisConnection });
  checks.push({ name: 'Google Sheets (optional)', fn: checkGoogleSheets });
  
  let passed = 0;
  let failed = 0;
  
  for (const check of checks) {
    try {
      const result = await check.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log.error(`Unexpected error in ${check.name}: ${error.message}`);
      failed++;
    }
    
    // Add spacing between checks
    console.log('');
  }
  
  // Summary
  log.header('Результаты проверки');
  console.log(`${colors.green}Успешно: ${passed}${colors.reset}`);
  console.log(`${colors.red}Ошибки: ${failed}${colors.reset}`);
  
  if (failed === 0) {
    log.success('🎉 Все проверки пройдены! Система готова к работе.');
    log.info('Запустите сервер: npm run dev');
    log.info('Откройте браузер: http://localhost:3000');
  } else if (failed <= 2) {
    log.warning('⚠️  Большинство проверок пройдено. Исправьте оставшиеся проблемы.');
  } else {
    log.error('❌ Много ошибок. Следуйте инструкциям в SETUP_GUIDE.md');
  }
  
  console.log('\n📖 Подробные инструкции: SETUP_GUIDE.md');
  console.log('🧪 Запуск тестов: node checkpoint-verification.js');
  
  process.exit(failed === 0 ? 0 : 1);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log.error('Unhandled error: ' + error.message);
  process.exit(1);
});

// Run main function
if (require.main === module) {
  main().catch(error => {
    log.error('Setup check failed: ' + error.message);
    process.exit(1);
  });
}

module.exports = { main };