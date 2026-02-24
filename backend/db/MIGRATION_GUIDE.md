# Database Migration Guide

## Overview

This guide explains how to set up and manage the database schema for the LIVE RUSSIA Tester Dashboard.

## Prerequisites

- PostgreSQL 12 or higher installed
- Node.js 14 or higher installed
- Database created (e.g., `live_russia_dashboard`)
- Environment variables configured in `.env` file

## Quick Start

### 1. Configure Environment

Copy `.env.example` to `.env` and update the database credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=live_russia_dashboard
DB_USER=postgres
DB_PASSWORD=your_password
```

### 2. Create Database

```bash
# Using psql
psql -U postgres -c "CREATE DATABASE live_russia_dashboard;"
```

### 3. Run Migrations

```bash
# Using the Node.js migration runner (recommended)
node backend/db/run-migrations.js

# Or using psql directly
cat backend/db/migrations/*.sql | psql -U postgres -d live_russia_dashboard
```

## Database Schema

### Tables Created

1. **testers** - Tester profiles and registration data
   - Primary key: `id` (SERIAL)
   - Unique constraint: `email`
   - Indexes: email, status, rating, registration_date

2. **bugs** - Bug reports from testers
   - Primary key: `id` (SERIAL)
   - Foreign key: `tester_id` → testers(id)
   - Indexes: tester_id, status, priority, type, created_at, updated_at

3. **screenshots** - Screenshot attachments for bugs
   - Primary key: `id` (SERIAL)
   - Foreign key: `bug_id` → bugs(id)
   - Indexes: bug_id, uploaded_at

4. **comments** - Comments on bug reports
   - Primary key: `id` (SERIAL)
   - Foreign key: `bug_id` → bugs(id)
   - Indexes: bug_id, created_at, author_id

5. **activity_history** - Tester activity tracking
   - Primary key: `id` (SERIAL)
   - Foreign key: `tester_id` → testers(id)
   - Indexes: tester_id, created_at, event_type

6. **admins** - Administrator accounts
   - Primary key: `id` (SERIAL)
   - Unique constraint: `username`
   - Indexes: username, email

7. **notifications** - System notifications
   - Primary key: `id` (SERIAL)
   - Indexes: is_read, created_at, type

### Entity Relationship Diagram

```
testers (1) ──< (N) bugs
bugs (1) ──< (N) screenshots
bugs (1) ──< (N) comments
testers (1) ──< (N) activity_history
```

## Data Constraints

### Testers
- `status`: 'active', 'inactive', or 'suspended'
- `email`: Must be unique and valid format
- `bugs_count`: Default 0
- `rating`: Default 0

### Bugs
- `priority`: 'low', 'medium', 'high', or 'critical'
- `status`: 'new', 'in_progress', 'fixed', or 'closed'
- `type`: 'ui', 'functionality', 'performance', 'crash', 'security', or 'other'

### Screenshots
- `mime_type`: 'image/png', 'image/jpeg', 'image/jpg', or 'image/gif'
- `file_size`: Maximum 5MB (5242880 bytes)

### Activity History
- `event_type`: 'registration', 'bug_found', 'status_changed', or 'rating_updated'

### Notifications
- `type`: 'new_tester', 'critical_bug', 'server_offline', or 'info'

## Rollback

To drop all tables and start fresh:

```bash
# Using the rollback script (with 5-second warning)
node backend/db/rollback-migrations.js

# Or using psql directly
psql -U postgres -d live_russia_dashboard -c "
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS activity_history CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS screenshots CASCADE;
DROP TABLE IF EXISTS bugs CASCADE;
DROP TABLE IF EXISTS testers CASCADE;
"
```

## Verification

After running migrations, verify the schema:

```bash
# List all tables
psql -U postgres -d live_russia_dashboard -c "\dt"

# Describe a specific table
psql -U postgres -d live_russia_dashboard -c "\d testers"

# Check indexes
psql -U postgres -d live_russia_dashboard -c "\di"
```

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check connection settings in `.env`

### Permission Denied
- Ensure the database user has CREATE privileges
- Grant privileges: `GRANT ALL PRIVILEGES ON DATABASE live_russia_dashboard TO your_user;`

### Table Already Exists
- Migrations use `CREATE TABLE IF NOT EXISTS`, so they're safe to re-run
- To start fresh, use the rollback script first

### Foreign Key Violations
- Ensure migrations run in order (001, 002, 003, etc.)
- Parent tables must exist before child tables

## Requirements Mapping

Each migration satisfies specific requirements from the requirements document:

- **001_create_testers_table.sql**: Requirements 1.3, 13.1
- **002_create_bugs_table.sql**: Requirements 13.1, 20.1
- **003_create_screenshots_table.sql**: Requirement 20.1
- **004_create_comments_table.sql**: Requirement 19.1
- **005_create_activity_history_table.sql**: Requirement 18.1
- **006_create_admins_table.sql**: Requirement 11.2
- **007_create_notifications_table.sql**: Requirement 17.1

## Next Steps

After running migrations:

1. Create an initial admin user:
   ```sql
   INSERT INTO admins (username, password_hash, email)
   VALUES ('admin', '$2b$10$...', 'admin@example.com');
   ```

2. Verify the schema matches the design document

3. Run backend tests to ensure database connectivity

4. Set up database backups

## Support

For issues or questions, refer to:
- Design document: `.kiro/specs/live-russia-tester-dashboard/design.md`
- Requirements: `.kiro/specs/live-russia-tester-dashboard/requirements.md`
- Migration files: `backend/db/migrations/`
