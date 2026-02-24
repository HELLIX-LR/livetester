/**
 * Database Migration Runner
 * 
 * This script runs all SQL migration files in the migrations directory
 * in sequential order to set up the database schema.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tester_dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Migration files directory
const migrationsDir = path.join(__dirname, 'migrations');

/**
 * Get all migration files sorted by name
 */
function getMigrationFiles() {
  const files = fs.readdirSync(migrationsDir);
  return files
    .filter(file => file.endsWith('.sql'))
    .sort();
}

/**
 * Run a single migration file
 */
async function runMigration(filename) {
  const filePath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`Running migration: ${filename}`);
  
  try {
    await pool.query(sql);
    console.log(`✓ Successfully executed: ${filename}`);
    return true;
  } catch (error) {
    console.error(`✗ Error executing ${filename}:`, error.message);
    return false;
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log('Starting database migrations...\n');
  
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful\n');
    
    // Get migration files
    const migrationFiles = getMigrationFiles();
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }
    
    console.log(`Found ${migrationFiles.length} migration file(s)\n`);
    
    // Run each migration
    let successCount = 0;
    let failCount = 0;
    
    for (const file of migrationFiles) {
      const success = await runMigration(file);
      if (success) {
        successCount++;
      } else {
        failCount++;
        // Stop on first error
        break;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`Migration Summary:`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${failCount}`);
    console.log('='.repeat(50));
    
    if (failCount === 0) {
      console.log('\n✓ All migrations completed successfully!');
    } else {
      console.log('\n✗ Migrations stopped due to errors.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
