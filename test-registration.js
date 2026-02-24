/**
 * Test script for tester registration functionality
 * This script tests the core registration logic without requiring a running server
 */

require('dotenv').config();
const TesterService = require('./backend/services/tester.service');

async function testTesterRegistration() {
  console.log('Testing Tester Registration Functionality...\n');

  // Test 1: Valid registration data
  console.log('Test 1: Valid registration data');
  const validTesterData = {
    name: 'Иван Петров',
    email: 'ivan.petrov@example.com',
    deviceType: 'smartphone',
    os: 'Android',
    nickname: 'ivan_tester',
    telegram: '@ivan_tester',
    osVersion: '13.0'
  };

  try {
    const result = await TesterService.registerTester(validTesterData);
    if (result.success) {
      console.log('✓ Valid registration successful');
      console.log('  Created tester:', result.data.name, 'with ID:', result.data.id);
    } else {
      console.log('✗ Valid registration failed:', result.error.message);
    }
  } catch (error) {
    console.log('✗ Valid registration error:', error.message);
  }

  console.log();

  // Test 2: Missing required fields
  console.log('Test 2: Missing required fields');
  const invalidTesterData = {
    name: '',
    email: 'invalid-email',
    deviceType: '',
    os: ''
  };

  try {
    const result = await TesterService.registerTester(invalidTesterData);
    if (!result.success && result.error.code === 'VALIDATION_ERROR') {
      console.log('✓ Validation correctly rejected invalid data');
      console.log('  Errors:', result.error.details.map(e => e.message).join(', '));
    } else {
      console.log('✗ Validation should have failed');
    }
  } catch (error) {
    console.log('✗ Validation test error:', error.message);
  }

  console.log();

  // Test 3: Invalid email format
  console.log('Test 3: Invalid email format');
  const invalidEmailData = {
    name: 'Test User',
    email: 'invalid-email-format',
    deviceType: 'smartphone',
    os: 'Android'
  };

  try {
    const result = await TesterService.registerTester(invalidEmailData);
    if (!result.success && result.error.details.some(e => e.field === 'email')) {
      console.log('✓ Email validation correctly rejected invalid format');
    } else {
      console.log('✗ Email validation should have failed');
    }
  } catch (error) {
    console.log('✗ Email validation test error:', error.message);
  }

  console.log();

  // Test 4: Duplicate email (if first test succeeded)
  console.log('Test 4: Duplicate email');
  try {
    const result = await TesterService.registerTester(validTesterData);
    if (!result.success && result.error.code === 'CONFLICT') {
      console.log('✓ Duplicate email correctly rejected');
    } else {
      console.log('✗ Duplicate email should have been rejected');
    }
  } catch (error) {
    console.log('✗ Duplicate email test error:', error.message);
  }

  console.log('\nTesting completed.');
}

// Run the test
testTesterRegistration().catch(console.error);