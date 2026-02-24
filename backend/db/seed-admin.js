require('dotenv').config();
const AuthService = require('../services/auth.service');
const Admin = require('../models/Admin.model');
const pool = require('../config/database');

/**
 * Seed script to create initial admin user
 * Usage: npm run seed
 */

async function seedAdmin() {
  try {
    console.log('Starting admin seed...');

    // Check if admin already exists
    const existingAdmin = await Admin.findByUsername('admin');
    
    if (existingAdmin) {
      console.log('Admin user already exists. Skipping seed.');
      process.exit(0);
    }

    // Create admin with default credentials
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const email = process.env.ADMIN_EMAIL || 'admin@liverussia.com';

    console.log(`Creating admin user: ${username}`);

    // Hash password
    const passwordHash = await AuthService.hashPassword(password);

    // Create admin
    const admin = await Admin.create({
      username,
      password_hash: passwordHash,
      email
    });

    console.log('✓ Admin user created successfully');
    console.log(`  Username: ${admin.username}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  ID: ${admin.id}`);
    console.log('\nIMPORTANT: Change the default password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run seed
seedAdmin();
