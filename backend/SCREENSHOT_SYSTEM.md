# Screenshot Upload System

## Overview

The screenshot upload system allows users to attach image files to bug reports. This system provides secure file upload, validation, storage, and management capabilities.

## Features

- **File Upload**: Support for PNG, JPG, JPEG, GIF formats
- **Size Limits**: Maximum 5 MB per file
- **Quantity Limits**: Maximum 10 screenshots per bug
- **Validation**: MIME type and file size validation
- **Storage**: Local file system storage in `uploads/screenshots/`
- **Metadata**: Database storage of file metadata
- **Security**: Unique filename generation to prevent conflicts

## API Endpoints

### Upload Screenshot
```
POST /api/bugs/:id/screenshots
Content-Type: multipart/form-data

Form Data:
- screenshot: Image file (required)

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "bugId": 1,
    "filename": "screenshot.png",
    "filePath": "/uploads/screenshots/1234567890-123456789-screenshot.png",
    "fileSize": 1024000,
    "mimeType": "image/png",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### List Screenshots
```
GET /api/bugs/:id/screenshots

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "bugId": 1,
      "filename": "screenshot.png",
      "filePath": "/uploads/screenshots/1234567890-123456789-screenshot.png",
      "fileSize": 1024000,
      "mimeType": "image/png",
      "uploadedAt": "2024-01-15T10:30:00.000Z",
      "url": "/uploads/screenshots/1234567890-123456789-screenshot.png",
      "thumbnailUrl": "/uploads/screenshots/1234567890-123456789-screenshot.png"
    }
  ],
  "count": 1,
  "limit": 10,
  "remaining": 9
}
```

### Delete Screenshot
```
DELETE /api/bugs/:id/screenshots/:screenshotId

Response:
{
  "success": true,
  "message": "Скриншот успешно удален"
}
```

### Get Statistics
```
GET /api/bugs/:id/screenshots/statistics

Response:
{
  "success": true,
  "data": {
    "count": 3,
    "totalSize": 2048000,
    "totalSizeMB": 1.95,
    "limit": 10,
    "remaining": 7
  }
}
```

## Error Handling

### File Too Large
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Размер файла превышает максимально допустимый (5 МБ)",
    "details": [{"field": "screenshot", "message": "Максимальный размер файла: 5 МБ"}]
  }
}
```

### Invalid File Type
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Неподдерживаемый формат файла. Разрешены только PNG, JPG, JPEG, GIF",
    "details": [{"field": "screenshot", "message": "Разрешены форматы: PNG, JPG, JPEG, GIF"}]
  }
}
```

### Limit Exceeded
```json
{
  "success": false,
  "error": {
    "code": "LIMIT_EXCEEDED",
    "message": "Достигнуто максимальное количество скриншотов для этого бага (10)",
    "details": [{"field": "bugId", "message": "Максимум 10 скриншотов на баг"}]
  }
}
```

### Bug Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Баг не найден",
    "field": "bugId"
  }
}
```

## File Storage

- **Directory**: `uploads/screenshots/`
- **Naming**: `{timestamp}-{random}-{originalname}`
- **Example**: `1705312200000-123456789-bug-screenshot.png`

## Database Schema

```sql
CREATE TABLE screenshots (
  id SERIAL PRIMARY KEY,
  bug_id INTEGER NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL CHECK (mime_type IN ('image/png', 'image/jpeg', 'image/jpg', 'image/gif')),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_screenshots_bug FOREIGN KEY (bug_id) REFERENCES bugs(id) ON DELETE CASCADE
);
```

## Components

### Upload Middleware (`backend/middleware/upload.middleware.js`)
- Configures multer for file uploads
- Handles file validation and error handling
- Creates upload directory if it doesn't exist

### Screenshot Model (`backend/models/Screenshot.model.js`)
- Database operations for screenshots
- Validation logic
- File deletion handling

### Screenshot Service (`backend/services/screenshot.service.js`)
- Business logic for screenshot management
- Error handling and response formatting
- Integration with file upload

### Routes (`backend/routes/bugs.routes.js`)
- API endpoints for screenshot operations
- Request validation
- Error response handling

## Testing

Use the provided test scripts:
- `verify-screenshots.js` - Verifies system setup
- `test-screenshots.js` - Tests API endpoints

## Security Considerations

1. **File Type Validation**: Only allows image formats
2. **Size Limits**: Prevents large file uploads
3. **Unique Filenames**: Prevents file conflicts and overwrites
4. **Path Validation**: Prevents directory traversal attacks
5. **Database Constraints**: Ensures data integrity

## Requirements Fulfilled

- **20.1**: Screenshot upload and storage functionality
- **20.2**: File format validation (PNG, JPG, JPEG, GIF)
- **20.3**: File size limit (5 MB maximum)
- **20.6**: Quantity limit (10 screenshots per bug)
- **20.7**: Screenshot deletion capability