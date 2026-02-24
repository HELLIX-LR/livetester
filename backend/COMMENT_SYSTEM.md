# Comment System Documentation

## Overview

The comment system allows administrators to add, edit, and delete comments on bug reports. Comments are associated with bugs and include author information, timestamps, and edit tracking.

## Features

- ✅ **Comment Creation**: Add comments to any bug with author information
- ✅ **Comment Retrieval**: Get all comments for a bug, sorted chronologically
- ✅ **Comment Editing**: Edit comments within 15 minutes of creation
- ✅ **Comment Deletion**: Delete own comments
- ✅ **Authorization**: Only comment authors can edit/delete their comments
- ✅ **Bug Timestamp Update**: Bug's `updated_at` is updated when comments are added
- ✅ **Edit Tracking**: Comments show if they have been edited

## Database Schema

```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  bug_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_edited BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_comments_bug FOREIGN KEY (bug_id) REFERENCES bugs(id) ON DELETE CASCADE
);
```

## API Endpoints

### 1. Add Comment to Bug
```http
POST /api/bugs/:id/comments
Content-Type: application/json

{
  "content": "This is a comment about the bug",
  "authorId": 1,
  "authorName": "Administrator Name"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "bugId": 1,
    "authorId": 1,
    "authorName": "Administrator Name",
    "content": "This is a comment about the bug",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "isEdited": false
  }
}
```

### 2. Get All Comments for Bug
```http
GET /api/bugs/:id/comments
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "bugId": 1,
      "authorId": 1,
      "authorName": "Administrator Name",
      "content": "This is a comment about the bug",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "isEdited": false
    }
  ],
  "count": 1
}
```

### 3. Edit Comment (within 15 minutes)
```http
PUT /api/bugs/:id/comments/:commentId
Content-Type: application/json

{
  "content": "Updated comment content",
  "authorId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "bugId": 1,
    "authorId": 1,
    "authorName": "Administrator Name",
    "content": "Updated comment content",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z",
    "isEdited": true
  }
}
```

### 4. Delete Comment
```http
DELETE /api/bugs/:id/comments/:commentId
Content-Type: application/json

{
  "authorId": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Комментарий успешно удален"
}
```

## Business Rules

### 1. Comment Creation
- All fields (content, authorId, authorName) are required
- Content cannot be empty or exceed 5000 characters
- Author name cannot exceed 255 characters
- Bug must exist to add comments
- When a comment is added, the parent bug's `updated_at` timestamp is updated

### 2. Comment Editing
- Comments can only be edited within 15 minutes of creation
- Only the original author can edit their comments
- Edited comments are marked with `isEdited: true`
- Content validation applies (non-empty, max 5000 characters)

### 3. Comment Deletion
- Only the original author can delete their comments
- Deletion is permanent (no soft delete)
- Comments are automatically deleted when parent bug is deleted (CASCADE)

### 4. Comment Retrieval
- Comments are sorted by `created_at` in ascending order (chronological)
- All comments for a bug are returned in a single request
- Comment count is included in the response

## Error Handling

### Validation Errors (400 Bad Request)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ошибка валидации",
    "details": [
      {
        "field": "content",
        "message": "Содержание комментария обязательно"
      }
    ]
  }
}
```

### Not Found Errors (404 Not Found)
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Комментарий не найден",
    "resource": "comment",
    "id": 123
  }
}
```

### Authorization Errors (403 Forbidden)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Нет прав для редактирования этого комментария"
  }
}
```

### Edit Window Expired (409 Conflict)
```json
{
  "success": false,
  "error": {
    "code": "EDIT_WINDOW_EXPIRED",
    "message": "Комментарий можно редактировать только в течение 15 минут после создания"
  }
}
```

## Testing

### Unit Tests
Run the comment model tests:
```bash
# If Jest is available
npm test Comment.model.test.js
```

### Integration Tests
Run the full integration test:
```bash
# Make sure server is running on localhost:3000
npm start

# In another terminal
node test-comments.js
```

### Manual Testing
1. Start the server: `npm start`
2. Use a tool like Postman or curl to test the endpoints
3. Follow the API documentation above for request formats

## Files Created/Modified

### New Files
- `backend/models/Comment.model.js` - Comment data model
- `backend/services/comment.service.js` - Comment business logic
- `backend/models/Comment.model.test.js` - Unit tests
- `test-comments.js` - Integration test
- `backend/COMMENT_SYSTEM.md` - This documentation

### Modified Files
- `backend/routes/bugs.routes.js` - Added comment endpoints

## Requirements Fulfilled

- ✅ **19.1**: Comment creation with author_id and author_name
- ✅ **19.3**: Comments sorted by created_at in chronological order
- ✅ **19.4**: Comment editing within 15 minutes of creation
- ✅ **19.5**: Comment deletion and edit flag setting
- ✅ **19.7**: Bug updated_at timestamp update when comments are added

## Next Steps

1. **Frontend Integration**: Create UI components for displaying and managing comments
2. **Real-time Updates**: Add WebSocket support for live comment updates
3. **Rich Text**: Consider supporting markdown or rich text formatting
4. **Attachments**: Allow file attachments to comments
5. **Notifications**: Notify relevant users when comments are added
6. **Audit Trail**: Track comment history and changes