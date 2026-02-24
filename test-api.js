/**
 * Test script for API endpoint functionality
 * This script tests the API endpoints using HTTP requests
 */

const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAPI() {
  console.log('Testing API Endpoints...\n');

  const baseOptions = {
    hostname: 'localhost',
    port: 3000,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  // Test 1: Health check
  console.log('Test 1: Health check');
  try {
    const response = await makeRequest({
      ...baseOptions,
      path: '/api/health',
      method: 'GET'
    });
    
    if (response.status === 200) {
      console.log('✓ Health check successful');
    } else {
      console.log('✗ Health check failed:', response.status);
    }
  } catch (error) {
    console.log('✗ Health check error:', error.message);
  }

  console.log();

  // Test 2: Tester registration
  console.log('Test 2: Tester registration');
  const testerData = {
    name: 'API Test User',
    email: 'api.test@example.com',
    deviceType: 'smartphone',
    os: 'Android',
    nickname: 'api_tester',
    telegram: '@api_tester',
    osVersion: '13.0'
  };

  try {
    const response = await makeRequest({
      ...baseOptions,
      path: '/api/testers',
      method: 'POST'
    }, testerData);
    
    if (response.status === 201 && response.data.success) {
      console.log('✓ Tester registration successful');
      console.log('  Created tester:', response.data.data.name);
    } else {
      console.log('✗ Tester registration failed:', response.status, response.data);
    }
  } catch (error) {
    console.log('✗ Tester registration error:', error.message);
  }

  console.log();

  // Test 3: Get testers list
  console.log('Test 3: Get testers list');
  try {
    const response = await makeRequest({
      ...baseOptions,
      path: '/api/testers',
      method: 'GET'
    });
    
    if (response.status === 200 && response.data.success) {
      console.log('✓ Get testers list successful');
      console.log('  Total testers:', response.data.data.total);
    } else {
      console.log('✗ Get testers list failed:', response.status, response.data);
    }
  } catch (error) {
    console.log('✗ Get testers list error:', error.message);
  }

  console.log('\nAPI testing completed.');
}

// Run the test
testAPI().catch(console.error);