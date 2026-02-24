/**
 * Checkpoint Verification Script
 * Tests basic functionality for LIVE RUSSIA Tester Dashboard
 * 
 * This script verifies:
 * 1. Server health and API availability
 * 2. Tester registration functionality
 * 3. Registration validation
 * 4. Database operations
 * 5. Google Sheets synchronization status
 * 6. Administrator authentication
 * 7. Frontend file accessibility
 */

require('dotenv').config();
const http = require('http');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 10000; // 10 seconds

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

/**
 * Make HTTP request with timeout
 */
function makeRequest(options, data = null, timeout = TEST_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      req.destroy();
      reject(new Error('Request timeout'));
    }, timeout);

    const req = http.request(options, (res) => {
      clearTimeout(timer);
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: response, headers: res.headers });
        } catch (error) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Run a test and record results
 */
async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🧪 Running: ${testName}`);
  
  try {
    const result = await testFunction();
    if (result.success) {
      testResults.passed++;
      console.log(`${colors.green}✅ PASSED: ${testName}${colors.reset}`);
      if (result.message) {
        console.log(`   ${result.message}`);
      }
    } else {
      testResults.failed++;
      console.log(`${colors.red}❌ FAILED: ${testName}${colors.reset}`);
      console.log(`   ${result.message || 'Test failed without specific message'}`);
    }
    
    testResults.details.push({
      name: testName,
      success: result.success,
      message: result.message,
      details: result.details
    });
  } catch (error) {
    testResults.failed++;
    console.log(`${colors.red}❌ ERROR: ${testName}${colors.reset}`);
    console.log(`   ${error.message}`);
    
    testResults.details.push({
      name: testName,
      success: false,
      message: error.message,
      error: true
    });
  }
}

/**
 * Test 1: Server Health Check
 */
async function testServerHealth() {
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 200 && response.data.status === 'ok') {
      return {
        success: true,
        message: `Server is running and healthy (${response.data.timestamp})`
      };
    } else {
      return {
        success: false,
        message: `Health check failed: ${response.status} - ${JSON.stringify(response.data)}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Server connection failed: ${error.message}`
    };
  }
}

/**
 * Test 2: Tester Registration
 */
async function testTesterRegistration() {
  const testTester = {
    name: 'Checkpoint Test User',
    email: `checkpoint.test.${Date.now()}@example.com`,
    deviceType: 'smartphone',
    os: 'Android',
    nickname: 'checkpoint_tester',
    telegram: '@checkpoint_test',
    osVersion: '13.0'
  };

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/testers',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, testTester);

    if (response.status === 201 && response.data.success) {
      const createdTester = response.data.data;
      return {
        success: true,
        message: `Tester registered successfully: ${createdTester.name} (ID: ${createdTester.id})`,
        details: { testerId: createdTester.id, email: createdTester.email }
      };
    } else {
      return {
        success: false,
        message: `Registration failed: ${response.status} - ${JSON.stringify(response.data)}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Registration request failed: ${error.message}`
    };
  }
}

/**
 * Test 3: Tester Registration Validation
 */
async function testTesterValidation() {
  const invalidTester = {
    name: '',
    email: 'invalid-email',
    deviceType: '',
    os: ''
  };

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/testers',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, invalidTester);

    if (response.status === 400 && response.data.error && response.data.error.code === 'VALIDATION_ERROR') {
      return {
        success: true,
        message: `Validation correctly rejected invalid data (${response.data.error.details.length} errors)`
      };
    } else {
      return {
        success: false,
        message: `Validation should have failed but got: ${response.status} - ${JSON.stringify(response.data)}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Validation test request failed: ${error.message}`
    };
  }
}

/**
 * Test 4: Get Testers List
 */
async function testGetTestersList() {
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/testers',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 200 && response.data.success) {
      const testersData = response.data.data;
      return {
        success: true,
        message: `Retrieved testers list: ${testersData.total} total testers, page ${testersData.page}/${testersData.totalPages}`
      };
    } else {
      return {
        success: false,
        message: `Get testers failed: ${response.status} - ${JSON.stringify(response.data)}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Get testers request failed: ${error.message}`
    };
  }
}

/**
 * Test 5: Google Sheets Connection Status
 */
async function testGoogleSheetsConnection() {
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/testers/google-sheets/status',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 200) {
      const connected = response.data.connected;
      return {
        success: true,
        message: `Google Sheets connection status: ${connected ? 'CONNECTED' : 'NOT CONNECTED'}`,
        details: { connected }
      };
    } else {
      return {
        success: false,
        message: `Google Sheets status check failed: ${response.status} - ${JSON.stringify(response.data)}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Google Sheets status request failed: ${error.message}`
    };
  }
}

/**
 * Test 6: Authentication - Invalid Credentials
 */
async function testAuthenticationInvalid() {
  const invalidCredentials = {
    username: 'invalid_user',
    password: 'wrong_password'
  };

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, invalidCredentials);

    if (response.status === 401 && response.data.error && response.data.error.code === 'UNAUTHORIZED') {
      return {
        success: true,
        message: 'Invalid credentials correctly rejected'
      };
    } else {
      return {
        success: false,
        message: `Expected 401 Unauthorized but got: ${response.status} - ${JSON.stringify(response.data)}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Authentication test request failed: ${error.message}`
    };
  }
}

/**
 * Test 7: Session Check (Unauthenticated)
 */
async function testSessionCheck() {
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/session',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 200 && response.data.success && response.data.data.authenticated === false) {
      return {
        success: true,
        message: 'Session check correctly shows unauthenticated state'
      };
    } else {
      return {
        success: false,
        message: `Session check failed: ${response.status} - ${JSON.stringify(response.data)}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Session check request failed: ${error.message}`
    };
  }
}

/**
 * Test 9: Database Connection Test
 */
async function testDatabaseConnection() {
  try {
    const pool = require('./backend/config/database');
    const result = await pool.query('SELECT NOW() as current_time, COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = $1', ['public']);
    await pool.end();
    
    return {
      success: true,
      message: `Database connected successfully. Tables: ${result.rows[0].table_count}, Time: ${result.rows[0].current_time}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Database connection failed: ${error.message}`
    };
  }
}

/**
 * Test 10: Redis Connection Test
 */
async function testRedisConnection() {
  try {
    const { redisClient } = require('./backend/config/redis');
    const pong = await redisClient.ping();
    await redisClient.quit();
    
    return {
      success: pong === 'PONG',
      message: `Redis connection successful: ${pong}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Redis connection failed: ${error.message}`
    };
  }
}

/**
 * Test 9: Database Connection Test
 */
async function testDatabaseConnection() {
  try {
    const pool = require('./backend/config/database');
    const result = await pool.query('SELECT NOW() as current_time, COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = $1', ['public']);
    await pool.end();
    
    return {
      success: true,
      message: `Database connected successfully. Tables: ${result.rows[0].table_count}, Time: ${result.rows[0].current_time}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Database connection failed: ${error.message}`
    };
  }
}

/**
 * Test 10: Redis Connection Test
 */
async function testRedisConnection() {
  try {
    const { redisClient } = require('./backend/config/redis');
    const pong = await redisClient.ping();
    await redisClient.quit();
    
    return {
      success: pong === 'PONG',
      message: `Redis connection successful: ${pong}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Redis connection failed: ${error.message}`
    };
  }
}

/**
 * Test 11: Environment Configuration Test
 */
async function testEnvironmentConfig() {
  const requiredVars = [
    'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
    'REDIS_URL', 'SESSION_SECRET', 'PORT'
  ];
  
  const missingVars = [];
  const presentVars = [];
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      presentVars.push(varName);
    } else {
      missingVars.push(varName);
    }
  });
  
  return {
    success: missingVars.length === 0,
    message: missingVars.length === 0 
      ? `All ${presentVars.length} required environment variables are set`
      : `Missing environment variables: ${missingVars.join(', ')}`,
    details: { present: presentVars, missing: missingVars }
  };
}

/**
 * Main verification function
 */
async function runCheckpointVerification() {
  console.log(`${colors.bold}${colors.blue}🚀 LIVE RUSSIA Tester Dashboard - Checkpoint Verification${colors.reset}`);
  console.log(`${colors.blue}=${'='.repeat(60)}${colors.reset}`);
  console.log('Testing basic functionality...\n');

  // Environment and configuration tests (don't require server)
  await runTest('Environment Configuration', testEnvironmentConfig);
  await runTest('Database Connection', testDatabaseConnection);
  await runTest('Redis Connection', testRedisConnection);

  // Server-dependent tests
  await runTest('Server Health Check', testServerHealth);
  await runTest('Tester Registration', testTesterRegistration);
  await runTest('Registration Validation', testTesterValidation);
  await runTest('Get Testers List', testGetTestersList);
  await runTest('Google Sheets Connection', testGoogleSheetsConnection);
  await runTest('Authentication (Invalid)', testAuthenticationInvalid);
  await runTest('Session Check', testSessionCheck);
  await runTest('Frontend Files Access', testFrontendFiles);

  // Print summary
  console.log(`\n${colors.blue}=${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bold}📊 CHECKPOINT VERIFICATION SUMMARY${colors.reset}`);
  console.log(`${colors.blue}=${'='.repeat(60)}${colors.reset}`);
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed} ✅${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed} ❌${colors.reset}`);
  console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);

  // Detailed results
  console.log(`\n${colors.bold}📋 DETAILED RESULTS:${colors.reset}`);
  console.log('-'.repeat(40));
  
  testResults.details.forEach((test, index) => {
    const status = test.success ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
    console.log(`${index + 1}. ${status} ${test.name}`);
    if (test.message) {
      console.log(`   ${test.message}`);
    }
    if (test.details && Array.isArray(test.details)) {
      test.details.forEach(detail => {
        console.log(`   - ${detail}`);
      });
    }
  });

  // Recommendations
  console.log(`\n${colors.bold}💡 RECOMMENDATIONS:${colors.reset}`);
  console.log('-'.repeat(40));

  const failedTests = testResults.details.filter(t => !t.success);
  
  if (failedTests.length === 0) {
    console.log(`${colors.green}🎉 All basic functionality is working correctly!${colors.reset}`);
    console.log(`${colors.green}✅ Tester registration is functional${colors.reset}`);
    console.log(`${colors.green}✅ API endpoints are responding${colors.reset}`);
    console.log(`${colors.green}✅ Validation is working${colors.reset}`);
    console.log(`${colors.green}✅ Database and Redis connections are stable${colors.reset}`);
    console.log(`${colors.green}✅ Frontend files are accessible${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  Some issues were found:${colors.reset}`);
    
    failedTests.forEach(test => {
      if (test.name.includes('Google Sheets')) {
        console.log('- Configure Google Sheets API credentials for full synchronization');
      } else if (test.name.includes('Server Health')) {
        console.log('- Ensure the server is running on port 3000');
      } else if (test.name.includes('Database')) {
        console.log('- Check PostgreSQL connection and database setup');
      } else if (test.name.includes('Redis')) {
        console.log('- Check Redis server status and connection');
      } else if (test.name.includes('Environment')) {
        console.log('- Review .env file configuration');
      } else if (test.name.includes('Authentication')) {
        console.log('- Check database connection and admin user setup');
      } else {
        console.log(`- Fix issue with: ${test.name}`);
      }
    });
  }

  console.log(`\n${colors.bold}🔧 NEXT STEPS:${colors.reset}`);
  console.log('-'.repeat(40));
  console.log('1. Review any failed tests above');
  console.log('2. Configure Google Sheets integration if needed');
  console.log('3. Set up admin user for authentication testing');
  console.log('4. Test the web interface manually');
  console.log('5. Proceed with remaining development tasks');

  console.log(`\n${colors.bold}📖 HELPFUL COMMANDS:${colors.reset}`);
  console.log('-'.repeat(40));
  console.log('Setup check:     node setup-check.js');
  console.log('Start server:    npm run dev');
  console.log('Run migrations:  node backend/db/run-migrations.js');
  console.log('Create admin:    node backend/db/seed-admin.js');
  console.log('Open browser:    http://localhost:3000');

  return {
    success: testResults.failed === 0,
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: Math.round((testResults.passed / testResults.total) * 100)
    },
    details: testResults.details
  };
}

// Run verification if called directly
if (require.main === module) {
  runCheckpointVerification()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { runCheckpointVerification };