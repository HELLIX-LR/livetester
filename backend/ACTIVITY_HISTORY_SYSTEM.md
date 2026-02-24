# Activity History System

## Overview

The Activity History System tracks important events for each tester in the LIVE RUSSIA tester dashboard. This provides an audit trail and helps administrators understand tester behavior patterns.

## Features

- **Automatic Event Recording**: Events are automatically recorded when key actions occur
- **Event Filtering**: Filter activity by event type
- **Chronological Sorting**: Activities are sorted by timestamp (newest first)
- **Metadata Support**: Additional event data stored as JSON
- **Russian Language**: All messages and descriptions in Russian

## Event Types

### 1. Registration (`registration`)
- **When**: Tester registers in the system
- **Description**: "Тестер зарегистрировался в системе"
- **Metadata**: Device type, OS, OS version

### 2. Bug Found (`bug_found`)
- **When**: Tester creates a new bug
- **Description**: "Найден баг: {bug_title}"
- **Metadata**: Bug ID, title, priority, type, status

### 3. Status Changed (`status_changed`)
- **When**: Tester status is modified by admin
- **Description**: "Статус изменен с "{old_status}" на "{new_status}""
- **Metadata**: Old status, new status

## Database Schema

```sql
CREATE TABLE activity_history (
  id SERIAL PRIMARY KEY,
  tester_id INTEGER NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('registration', 'bug_found', 'status_changed')),
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_tester FOREIGN KEY (tester_id) REFERENCES testers(id) ON DELETE CASCADE
);
```

## API Endpoints

### GET /api/testers/:id/activity

Get activity history for a specific tester.

**Query Parameters:**
- `eventType` (optional): Filter by event type (`registration`, `bug_found`, `status_changed`)
- `limit` (optional): Limit number of records (1-1000)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "testerId": 123,
      "eventType": "registration",
      "description": "Тестер зарегистрировался в системе",
      "metadata": {
        "deviceType": "smartphone",
        "os": "Android",
        "osVersion": "13.0",
        "timestamp": "2024-01-15T10:30:00.000Z"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

## Service Methods

### ActivityHistoryService

#### recordActivity(activityData)
Records a new activity event.

#### recordRegistration(testerId, metadata)
Records a registration event for a tester.

#### recordBugFound(testerId, bugId, bugTitle, priority, metadata)
Records a bug found event for a tester.

#### recordStatusChanged(testerId, oldStatus, newStatus, metadata)
Records a status change event for a tester.

#### getTesterActivity(testerId, options)
Gets activity history for a specific tester with optional filtering.

#### getAllActivity(options)
Gets all activity records with optional filtering.

#### getActivityById(id)
Gets a specific activity record by ID.

#### deleteActivity(id)
Deletes an activity record.

#### getActivityStatistics()
Gets activity statistics (total, recent 24h, by event type).

## Integration Points

The activity history system is automatically integrated with:

1. **Tester Registration** (`TesterService.registerTester`)
   - Automatically records registration activity
   - Includes device and OS information in metadata

2. **Status Changes** (`TesterService.updateTesterStatus`)
   - Records status change activity when tester status is modified
   - Includes old and new status in metadata

3. **Bug Creation** (`BugService.createBug`)
   - Records bug found activity when tester creates a bug
   - Includes bug details in metadata

## Error Handling

- **Validation Errors**: Invalid event types, missing required fields
- **Not Found Errors**: Tester doesn't exist
- **Russian Error Messages**: All error messages in Russian for consistency

## Usage Examples

### Manual Activity Recording

```javascript
// Record a custom activity
const result = await ActivityHistoryService.recordActivity({
  testerId: 123,
  eventType: 'registration',
  description: 'Тестер зарегистрировался в системе',
  metadata: {
    deviceType: 'smartphone',
    os: 'Android'
  }
});
```

### Get Tester Activity

```javascript
// Get all activities for a tester
const activities = await ActivityHistoryService.getTesterActivity(123);

// Get only registration activities
const registrations = await ActivityHistoryService.getTesterActivity(123, {
  eventType: 'registration'
});

// Get last 10 activities
const recent = await ActivityHistoryService.getTesterActivity(123, {
  limit: 10
});
```

### Filter by Event Type

```javascript
// Get only bug found activities
const bugActivities = await ActivityHistoryService.getTesterActivity(123, {
  eventType: 'bug_found'
});
```

## Requirements Fulfilled

- **18.1**: Records when a tester registers ✅
- **18.2**: Records when a tester finds a bug ✅
- **18.3**: Records when a tester's status changes ✅
- **18.4**: Displays all activity events in chronological order ✅
- **18.6**: Allows filtering by event type ✅

## Testing

Run the activity history tests:

```bash
node backend/services/activityHistory.service.test.js
node test-activity-history.js
```

## Future Enhancements

- **Real-time Updates**: WebSocket notifications for new activities
- **Activity Aggregation**: Daily/weekly activity summaries
- **Export**: Export activity history to CSV/PDF
- **Advanced Filtering**: Date range filtering, multiple event types
- **Activity Analytics**: Charts and graphs of tester activity patterns