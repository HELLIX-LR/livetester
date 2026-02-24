/**
 * Quick Start Script for LIVE RUSSIA Tester Dashboard
 * Автоматически настраивает и запускает систему
 */

const { exec, spawn } = require('child_process');
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
 * Check if .env file exists and create if needed
 */
function setupEnvFile() {
  log.header('Настройка .env файла');
  
  if (!fs.existsSync('.env')) {
    if (fs.existsSync('.env.example')) {
      fs.copyFileSync('.env.example', '.env');
      log.success('.env файл создан из .env.example');
      log.warning('Отредактируйте .env файл с вашими настройками базы данных');
      return false; // Need manual configuration
    } else {
      log.error('.env.example файл не найден');
      return false;
    }
  } else {
    log.success('.env файл уже существует');
    return true;
  }
}

/**
 * Install dependencies
 */
async function installDependencies() {
  log.header('Установка зависимостей');
  
  if (!fs.existsSync('node_modules')) {
    try {
      log.info('Установка npm зависимостей...');
      await execCommand('npm install');
      log.success('Зависимости установлены');
      return true;
    } catch (error) {
      log.error('Ошибка установки зависимостей: ' + error.error?.message);
      return false;
    }
  } else {
    log.success('Зависимости уже установлены');
    return true;
  }
}

/**
 * Run database migrations
 */
async function runMigrations() {
  log.header('Запуск миграций базы данных');
  
  try {
    const { stdout } = await execCommand('node backend/db/run-migrations.js');
    log.success('Миграции выполнены успешно');
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
    log.success('Администратор создан или уже существует');
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
 * Run checkpoint verification
 */
async function runCheckpoint() {
  log.header('Запуск проверки системы');
  
  try {
    const { stdout } = await execCommand('node checkpoint-verification.js');
    console.log(stdout);
    log.success('Проверка системы завершена');
    return true;
  } catch (error) {
    log.warning('Некоторые проверки не прошли');
    console.log(error.stdout || error.stderr);
    return false;
  }
}

/**
 * Start the server
 */
function startServer() {
  log.header('Запуск сервера');
  
  log.info('Запуск сервера разработки...');
  log.info('Сервер будет доступен по адресу: http://localhost:3000');
  log.info('Для остановки нажмите Ctrl+C');
  
  // Start server with npm run dev
  const serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  serverProcess.on('error', (error) => {
    log.error('Ошибка запуска сервера: ' + error.message);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log.info('\nОстановка сервера...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
  
  return serverProcess;
}

/**
 * Main quick start function
 */
async function quickStart() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('🚀 LIVE RUSSIA Tester Dashboard - Quick Start');
  console.log('=============================================');
  console.log(`${colors.reset}`);
  
  // Step 1: Setup environment
  const envReady = setupEnvFile();
  if (!envReady) {
    log.error('Настройте .env файл и запустите скрипт снова');
    log.info('Отредактируйте .env файл с настройками вашей базы данных');
    process.exit(1);
  }
  
  // Step 2: Install dependencies
  const depsInstalled = await installDependencies();
  if (!depsInstalled) {
    log.error('Не удалось установить зависимости');
    process.exit(1);
  }
  
  // Step 3: Run migrations
  const migrationsRun = await runMigrations();
  if (!migrationsRun) {
    log.error('Не удалось выполнить миграции базы данных');
    log.info('Убедитесь, что PostgreSQL запущен и настройки в .env корректны');
    process.exit(1);
  }
  
  // Step 4: Create admin
  const adminCreated = await createAdmin();
  if (!adminCreated) {
    log.warning('Не удалось создать администратора, но продолжаем...');
  }
  
  // Step 5: Run checkpoint
  log.info('Запуск проверки системы...');
  await runCheckpoint();
  
  // Step 6: Start server
  log.header('Система готова к запуску!');
  log.success('Настройка завершена успешно');
  log.info('Учетные данные администратора по умолчанию:');
  log.info('  Username: admin');
  log.info('  Password: admin123');
  log.warning('Смените пароль после первого входа!');
  
  console.log('\n' + '='.repeat(50));
  log.info('Полезные ссылки:');
  log.info('  Главная страница: http://localhost:3000');
  log.info('  Страница входа: http://localhost:3000/login.html');
  log.info('  Админ панель: http://localhost:3000/dashboard.html');
  log.info('  API Health: http://localhost:3000/api/health');
  console.log('='.repeat(50));
  
  // Ask user if they want to start the server
  console.log('\nЗапустить сервер сейчас? (y/n)');
  
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', (key) => {
    const input = key.toString().toLowerCase();
    
    if (input === 'y' || input === '\r' || input === '\n') {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      startServer();
    } else if (input === 'n') {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      log.info('Для запуска сервера выполните: npm run dev');
      process.exit(0);
    } else if (input === '\u0003') { // Ctrl+C
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.exit(0);
    }
  });
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log.error('Unhandled error: ' + error.message);
  process.exit(1);
});

// Run quick start
if (require.main === module) {
  quickStart().catch(error => {
    log.error('Quick start failed: ' + error.message);
    process.exit(1);
  });
}

module.exports = { quickStart };