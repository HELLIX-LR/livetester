/**
 * Database Migration Rollback Script
 * 
 * This script drops all tables created by the migrations
 * in reverse order to respect foreign key constraints.
 */

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

// Tables to drop in reverse order (respecting foreign key dependencies)
const tables = [
  'notifications',
  'admins',
  'activity_history',
  'comments',
  'screenshots',
  'bugs',
  'testers'
];

/**
 * Drop a single table
 */
async function dropTable(tableName) {
  console.log(`Dropping table: ${tableName}`);
  
  try {
    await pool.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
    console.log(`✓ Successfully dropped: ${tableName}`);
    return true;
  } catch (error) {
    console.error(`✗ Error dropping ${tableName}:`, error.message);
    return false;
  }
}

/**
 * Main rollback function
 */
async function rollbackMigrations() {
  console.log('Starting database rollback...\n');
  
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful\n');
    
    // Confirm rollback
    console.log('WARNING: This will drop all tables and delete all data!');
    console.log('Tables to be dropped:', tables.join(', '));
    console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Drop each table
    let successCount = 0;
    let failCount = 0;
    
    for (const table of tables) {
      const success = await dropTable(table);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`Rollback Summary:`);
    console.log(`  Tables dropped: ${successCount}`);
    console.log(`  Failed: ${failCount}`);
    console.log('='.repeat(50));
    
    if (failCount === 0) {
      console.log('\n✓ All tables dropped successfully!');
    } else {
      console.log('\n✗ Some tables could not be dropped.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run rollback
rollbackMigrations().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
