/**
 * Test script for screenshot upload functionality
 * Tests the screenshot API endpoints
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_BUG_ID = 1; // Assuming bug with ID 1 exists

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  const fetch = (await import('node-fetch')).default;
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`${options.method || 'GET'} ${url}`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('---');
    
    return { response, data };
  } catch (error) {
    console.error('Request failed:', error.message);
    return { error };
  }
}

// Create a test image file
function createTestImage() {
  const testImagePath = path.join(__dirname, 'test-image.png');
  
  // Create a simple PNG file (1x1 pixel)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Image data
    0xE2, 0x21, 0xBC, 0x33, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  fs.writeFileSync(testImagePath, pngData);
  return testImagePath;
}

async function testScreenshotAPI() {
  console.log('=== Testing Screenshot API ===\n');
  
  try {
    // 1. Test getting screenshots for a bug (should be empty initially)
    console.log('1. Getting screenshots for bug (should be empty):');
    await makeRequest(`${BASE_URL}/api/bugs/${TEST_BUG_ID}/screenshots`);
    
    // 2. Test getting screenshot statistics
    console.log('2. Getting screenshot statistics:');
    await makeRequest(`${BASE_URL}/api/bugs/${TEST_BUG_ID}/screenshots/statistics`);
    
    // 3. Create test image
    console.log('3. Creating test image...');
    const testImagePath = createTestImage();
    console.log(`Created test image: ${testImagePath}\n`);
    
    // 4. Test uploading a screenshot
    console.log('4. Uploading screenshot:');
    const form = new FormData();
    form.append('screenshot', fs.createReadStream(testImagePath), {
      filename: 'test-screenshot.png',
      contentType: 'image/png'
    });
    
    const uploadResult = await makeRequest(`${BASE_URL}/api/bugs/${TEST_BUG_ID}/screenshots`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    let screenshotId = null;
    if (uploadResult.data && uploadResult.data.success) {
      screenshotId = uploadResult.data.data.id;
      console.log(`Screenshot uploaded with ID: ${screenshotId}\n`);
    }
    
    // 5. Test getting screenshots again (should have one now)
    console.log('5. Getting screenshots after upload:');
    await makeRequest(`${BASE_URL}/api/bugs/${TEST_BUG_ID}/screenshots`);
    
    // 6. Test getting updated statistics
    console.log('6. Getting updated screenshot statistics:');
    await makeRequest(`${BASE_URL}/api/bugs/${TEST_BUG_ID}/screenshots/statistics`);
    
    // 7. Test deleting the screenshot
    if (screenshotId) {
      console.log('7. Deleting screenshot:');
      await makeRequest(`${BASE_URL}/api/bugs/${TEST_BUG_ID}/screenshots/${screenshotId}`, {
        method: 'DELETE'
      });
      
      // 8. Verify screenshot is deleted
      console.log('8. Verifying screenshot is deleted:');
      await makeRequest(`${BASE_URL}/api/bugs/${TEST_BUG_ID}/screenshots`);
    }
    
    // 9. Test error cases
    console.log('9. Testing error cases:');
    
    // Test uploading to non-existent bug
    console.log('9a. Upload to non-existent bug:');
    const form2 = new FormData();
    form2.append('screenshot', fs.createReadStream(testImagePath), {
      filename: 'test-screenshot.png',
      contentType: 'image/png'
    });
    
    await makeRequest(`${BASE_URL}/api/bugs/99999/screenshots`, {
      method: 'POST',
      body: form2,
      headers: form2.getHeaders()
    });
    
    // Test uploading without file
    console.log('9b. Upload without file:');
    const form3 = new FormData();
    await makeRequest(`${BASE_URL}/api/bugs/${TEST_BUG_ID}/screenshots`, {
      method: 'POST',
      body: form3,
      headers: form3.getHeaders()
    });
    
    // Test deleting non-existent screenshot
    console.log('9c. Delete non-existent screenshot:');
    await makeRequest(`${BASE_URL}/api/bugs/${TEST_BUG_ID}/screenshots/99999`, {
      method: 'DELETE'
    });
    
    // Clean up test file
    fs.unlinkSync(testImagePath);
    console.log('\nTest image cleaned up.');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const result = await makeRequest(`${BASE_URL}/api/health`);
    if (result.data && result.data.status === 'ok') {
      console.log('Server is running. Starting tests...\n');
      return true;
    }
  } catch (error) {
    console.error('Server is not running. Please start the server first.');
    console.error('Run: npm start');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testScreenshotAPI();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testScreenshotAPI, createTestImage };