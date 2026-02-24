# Database Migrations

This directory contains SQL migration files for the LIVE RUSSIA Tester Dashboard database.

## Migration Files

Migrations are numbered sequentially and should be executed in order:

1. **001_create_testers_table.sql** - Creates the testers table with indexes
2. **002_create_bugs_table.sql** - Creates the bugs table with foreign key to testers
3. **003_create_screenshots_table.sql** - Creates the screenshots table for bug attachments
4. **004_create_comments_table.sql** - Creates the comments table for bug discussions
5. **005_create_activity_history_table.sql** - Creates the activity history tracking table
6. **006_create_admins_table.sql** - Creates the admins table for authentication
7. **007_create_notifications_table.sql** - Creates the notifications table

## Running Migrations

### Option 1: Using psql command line

```bash
# Run all migrations in order
psql -U your_username -d your_database -f backend/db/migrations/001_create_testers_table.sql
psql -U your_username -d your_database -f backend/db/migrations/002_create_bugs_table.sql
psql -U your_username -d your_database -f backend/db/migrations/003_create_screenshots_table.sql
psql -U your_username -d your_database -f backend/db/migrations/004_create_comments_table.sql
psql -U your_username -d your_database -f backend/db/migrations/005_create_activity_history_table.sql
psql -U your_username -d your_database -f backend/db/migrations/006_create_admins_table.sql
psql -U your_username -d your_database -f backend/db/migrations/007_create_notifications_table.sql
```

### Option 2: Using the migration runner script

```bash
# Run the migration script
node backend/db/run-migrations.js
```

### Option 3: Run all migrations at once

```bash
# Concatenate and run all migrations
cat backend/db/migrations/*.sql | psql -U your_username -d your_database
```

## Database Schema Overview

### Tables

- **testers** - Stores tester registration and profile information
- **bugs** - Stores bug reports with priority, status, and type
- **screenshots** - Stores screenshot attachments for bugs
- **comments** - Stores comments on bug reports
- **activity_history** - Tracks tester activity events
- **admins** - Stores administrator accounts
- **notifications** - Stores system notifications

### Relationships

- bugs.tester_id → testers.id (CASCADE DELETE)
- screenshots.bug_id → bugs.id (CASCADE DELETE)
- comments.bug_id → bugs.id (CASCADE DELETE)
- activity_history.tester_id → testers.id (CASCADE DELETE)

### Indexes

All tables include optimized indexes for common query patterns:
- Foreign key columns
- Status and type columns for filtering
- Timestamp columns for sorting
- Email and username columns for lookups

## Requirements Mapping

Each migration file includes comments mapping to specific requirements from the requirements document:

- Requirement 1.3: Tester registration
- Requirement 11.2: Admin authentication
- Requirement 13.1: Bug management
- Requirement 17.1: Notifications
- Requirement 18.1: Activity history
- Requirement 19.1: Comments
- Requirement 20.1: Screenshot attachments

## Notes

- All migrations use `CREATE TABLE IF NOT EXISTS` to be idempotent
- Foreign keys use `ON DELETE CASCADE` to maintain referential integrity
- CHECK constraints enforce valid enum values
- Timestamps use `CURRENT_TIMESTAMP` for automatic timestamping
- JSONB columns store flexible metadata for extensibility
