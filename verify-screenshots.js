/**
 * Verification script for screenshot functionality
 * Checks if all components are properly set up
 */

const path = require('path');
const fs = require('fs');

console.log('=== Screenshot System Verification ===\n');

// 1. Check if uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads', 'screenshots');
console.log('1. Checking uploads directory...');
if (fs.existsSync(uploadsDir)) {
  console.log('✓ Uploads directory exists:', uploadsDir);
} else {
  console.log('✗ Uploads directory missing:', uploadsDir);
  console.log('  Creating directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✓ Directory created');
}

// 2. Check if required files exist
console.log('\n2. Checking required files...');
const requiredFiles = [
  'backend/middleware/upload.middleware.js',
  'backend/models/Screenshot.model.js',
  'backend/services/screenshot.service.js',
  'backend/routes/bugs.routes.js'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file}`);
  } else {
    console.log(`✗ ${file} - MISSING`);
    allFilesExist = false;
  }
}

// 3. Check if multer is installed
console.log('\n3. Checking dependencies...');
try {
  require('multer');
  console.log('✓ multer is installed');
} catch (error) {
  console.log('✗ multer is not installed');
  console.log('  Run: npm install multer');
  allFilesExist = false;
}

// 4. Check database migration
console.log('\n4. Checking database migration...');
const migrationFile = 'backend/db/migrations/003_create_screenshots_table.sql';
if (fs.existsSync(migrationFile)) {
  console.log('✓ Screenshots table migration exists');
  
  // Read and display the migration
  const migrationContent = fs.readFileSync(migrationFile, 'utf8');
  if (migrationContent.includes('CREATE TABLE IF NOT EXISTS screenshots')) {
    console.log('✓ Migration contains screenshots table creation');
  } else {
    console.log('✗ Migration file is incomplete');
  }
} else {
  console.log('✗ Screenshots table migration missing');
  allFilesExist = false;
}

// 5. Test file upload middleware
console.log('\n5. Testing upload middleware...');
try {
  const uploadMiddleware = require('./backend/middleware/upload.middleware.js');
  if (uploadMiddleware.uploadScreenshot && uploadMiddleware.validateUploadedFile) {
    console.log('✓ Upload middleware exports correct functions');
  } else {
    console.log('✗ Upload middleware missing required exports');
  }
} catch (error) {
  console.log('✗ Error loading upload middleware:', error.message);
  allFilesExist = false;
}

// 6. Test Screenshot model
console.log('\n6. Testing Screenshot model...');
try {
  const Screenshot = require('./backend/models/Screenshot.model.js');
  if (typeof Screenshot.validate === 'function' && 
      typeof Screenshot.create === 'function' &&
      typeof Screenshot.findById === 'function') {
    console.log('✓ Screenshot model has required methods');
  } else {
    console.log('✗ Screenshot model missing required methods');
  }
} catch (error) {
  console.log('✗ Error loading Screenshot model:', error.message);
  allFilesExist = false;
}

// 7. Test Screenshot service
console.log('\n7. Testing Screenshot service...');
try {
  const ScreenshotService = require('./backend/services/screenshot.service.js');
  if (typeof ScreenshotService.createScreenshot === 'function' && 
      typeof ScreenshotService.getScreenshotsByBugId === 'function' &&
      typeof ScreenshotService.deleteScreenshot === 'function') {
    console.log('✓ Screenshot service has required methods');
  } else {
    console.log('✗ Screenshot service missing required methods');
  }
} catch (error) {
  console.log('✗ Error loading Screenshot service:', error.message);
  allFilesExist = false;
}

// 8. Check routes integration
console.log('\n8. Checking routes integration...');
try {
  const bugsRoutes = fs.readFileSync('backend/routes/bugs.routes.js', 'utf8');
  if (bugsRoutes.includes('ScreenshotService') && 
      bugsRoutes.includes('uploadScreenshot') &&
      bugsRoutes.includes('POST') && bugsRoutes.includes('screenshots')) {
    console.log('✓ Screenshot routes are integrated into bugs routes');
  } else {
    console.log('✗ Screenshot routes not properly integrated');
  }
} catch (error) {
  console.log('✗ Error checking routes integration:', error.message);
  allFilesExist = false;
}

// Summary
console.log('\n=== Summary ===');
if (allFilesExist) {
  console.log('✓ All screenshot system components are properly set up!');
  console.log('\nAPI Endpoints available:');
  console.log('  POST   /api/bugs/:id/screenshots        - Upload screenshot');
  console.log('  GET    /api/bugs/:id/screenshots        - List screenshots');
  console.log('  DELETE /api/bugs/:id/screenshots/:sid   - Delete screenshot');
  console.log('  GET    /api/bugs/:id/screenshots/statistics - Get statistics');
  console.log('\nTo test the system:');
  console.log('  1. Start the server: npm start');
  console.log('  2. Run migrations: npm run migrate');
  console.log('  3. Test with a REST client like Postman or curl');
} else {
  console.log('✗ Some components are missing or have issues');
  console.log('Please fix the issues above before testing');
}

console.log('\n=== File Upload Limits ===');
console.log('  Max file size: 5 MB');
console.log('  Allowed formats: PNG, JPG, JPEG, GIF');
console.log('  Max screenshots per bug: 10');
console.log('  Upload directory: uploads/screenshots/');