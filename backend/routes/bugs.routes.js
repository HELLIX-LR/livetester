const express = require('express');
const router = express.Router();
const BugService = require('../services/bug.service');
const CommentService = require('../services/comment.service');
const ScreenshotService = require('../services/screenshot.service');
const { uploadScreenshot, validateUploadedFile } = require('../middleware/upload.middleware');

/**
 * POST /api/bugs
 * Create new bug endpoint
 * 
 * Request body:
 * {
 *   "title": "Приложение крашится при входе",
 *   "description": "При попытке войти в аккаунт приложение закрывается",
 *   "testerId": 1,
 *   "priority": "high",
 *   "status": "new",
 *   "type": "crash"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "title": "Приложение крашится при входе",
 *     "description": "При попытке войти в аккаунт приложение закрывается",
 *     "testerId": 1,
 *     "priority": "high",
 *     "status": "new",
 *     "type": "crash",
 *     "createdAt": "2024-01-15T10:30:00.000Z",
 *     "updatedAt": "2024-01-15T10:30:00.000Z",
 *     "fixedAt": null
 *   }
 * }
 * 
 * Requirements: 13.1
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, testerId, priority, status, type } = req.body;

    const bugData = {
      title,
      description,
      testerId: parseInt(testerId),
      priority,
      status,
      type
    };

    const result = await BugService.createBug(bugData);

    if (!result.success) {
      // Handle validation errors (400 Bad Request)
      if (result.error.code === 'VALIDATION_ERROR') {
        return res.status(400).json(result);
      }

      // Handle not found errors (404 Not Found)
      if (result.error.code === 'NOT_FOUND') {
        return res.status(404).json(result);
      }

      // Handle other errors
      return res.status(500).json(result);
    }

    // Return created bug with 201 Created status
    res.status(201).json(result);
  } catch (error) {
    console.error('Bug creation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при создании бага'
      }
    });
  }
});

/**
 * GET /api/bugs
 * Get all bugs with optional filtering and pagination
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20)
 * - search: Search query for title or description
 * - status: Filter by status (new, in_progress, fixed, closed)
 * - priority: Filter by priority (low, medium, high, critical)
 * - type: Filter by type (ui, functionality, performance, crash, security, other)
 * - testerId: Filter by tester ID
 * - sortBy: Sort field (default: created_at)
 * - sortOrder: Sort order ASC/DESC (default: DESC)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "bugs": [...],
 *     "total": 150,
 *     "page": 1,
 *     "pageSize": 20,
 *     "totalPages": 8
 *   }
 * }
 * 
 * Requirements: 13.4
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      search,
      status,
      priority,
      type,
      testerId,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const options = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      search,
      status,
      priority,
      type,
      testerId: testerId ? parseInt(testerId) : undefined,
      sortBy,
      sortOrder
    };

    const result = await BugService.getAllBugs(options);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get bugs error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при получении списка багов'
      }
    });
  }
});

/**
 * GET /api/bugs/:id
 * Get bug by ID
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "title": "Приложение крашится при входе",
 *     "description": "При попытке войти в аккаунт приложение закрывается",
 *     "testerId": 1,
 *     "testerName": "Иван Петров",
 *     "priority": "high",
 *     "status": "new",
 *     "type": "crash",
 *     "createdAt": "2024-01-15T10:30:00.000Z",
 *     "updatedAt": "2024-01-15T10:30:00.000Z",
 *     "fixedAt": null
 *   }
 * }
 * 
 * Requirements: 13.4
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID бага',
          details: [{ field: 'id', message: 'ID должен быть числом' }]
        }
      });
    }

    const result = await BugService.getBugById(parseInt(id));

    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return res.status(404).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get bug by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при получении бага'
      }
    });
  }
});

/**
 * PUT /api/bugs/:id
 * Update bug information
 * 
 * Request body:
 * {
 *   "title": "Обновленное название",
 *   "description": "Обновленное описание",
 *   "priority": "critical",
 *   "status": "in_progress",
 *   "type": "crash"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "title": "Обновленное название",
 *     ...
 *   }
 * }
 * 
 * Requirements: 13.5
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID бага',
          details: [{ field: 'id', message: 'ID должен быть числом' }]
        }
      });
    }

    const result = await BugService.updateBug(parseInt(id), updates);

    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return res.status(404).json(result);
      }
      if (result.error.code === 'VALIDATION_ERROR') {
        return res.status(400).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Update bug error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при обновлении бага'
      }
    });
  }
});

/**
 * DELETE /api/bugs/:id
 * Delete bug
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Баг успешно удален"
 * }
 * 
 * Requirements: 13.5
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID бага',
          details: [{ field: 'id', message: 'ID должен быть числом' }]
        }
      });
    }

    const result = await BugService.deleteBug(parseInt(id));

    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return res.status(404).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Delete bug error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при удалении бага'
      }
    });
  }
});

/**
 * PATCH /api/bugs/:id/status
 * Update bug status
 * 
 * Request body:
 * {
 *   "status": "in_progress"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "status": "in_progress",
 *     ...
 *   }
 * }
 * 
 * Requirements: 13.5
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID бага',
          details: [{ field: 'id', message: 'ID должен быть числом' }]
        }
      });
    }

    // Validate status is provided
    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Статус обязателен',
          details: [{ field: 'status', message: 'Статус обязателен' }]
        }
      });
    }

    const result = await BugService.updateBugStatus(parseInt(id), status);

    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return res.status(404).json(result);
      }
      if (result.error.code === 'VALIDATION_ERROR') {
        return res.status(400).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Update bug status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при обновлении статуса бага'
      }
    });
  }
});

/**
 * PATCH /api/bugs/:id/priority
 * Update bug priority
 * 
 * Request body:
 * {
 *   "priority": "critical"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "priority": "critical",
 *     ...
 *   }
 * }
 * 
 * Requirements: 13.5
 */
router.patch('/:id/priority', async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID бага',
          details: [{ field: 'id', message: 'ID должен быть числом' }]
        }
      });
    }

    // Validate priority is provided
    if (!priority) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Приоритет обязателен',
          details: [{ field: 'priority', message: 'Приоритет обязателен' }]
        }
      });
    }

    const result = await BugService.updateBugPriority(parseInt(id), priority);

    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return res.status(404).json(result);
      }
      if (result.error.code === 'VALIDATION_ERROR') {
        return res.status(400).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Update bug priority error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при обновлении приоритета бага'
      }
    });
  }
});

/**
 * GET /api/bugs/tester/:testerId
 * Get bugs by tester ID
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [...],
 *   "count": 5
 * }
 */
router.get('/tester/:testerId', async (req, res) => {
  try {
    const { testerId } = req.params;

    // Validate testerId is a number
    if (isNaN(parseInt(testerId))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID тестера',
          details: [{ field: 'testerId', message: 'ID тестера должен быть числом' }]
        }
      });
    }

    const result = await BugService.getBugsByTesterId(parseInt(testerId));

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get bugs by tester ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при получении багов тестера'
      }
    });
  }
});

/**
 * GET /api/bugs/statistics
 * Get bug statistics
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "total": 150,
 *     "byStatus": {
 *       "new": 50,
 *       "in_progress": 30,
 *       "fixed": 60,
 *       "closed": 10
 *     },
 *     "byPriority": {
 *       "low": 40,
 *       "medium": 60,
 *       "high": 35,
 *       "critical": 15
 *     },
 *     "byType": {
 *       "ui": 30,
 *       "functionality": 45,
 *       "performance": 20,
 *       "crash": 25,
 *       "security": 10,
 *       "other": 20
 *     }
 *   }
 * }
 */
router.get('/statistics', async (req, res) => {
  try {
    const result = await BugService.getBugStatistics();

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get bug statistics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при получении статистики багов'
      }
    });
  }
});

/**
 * POST /api/bugs/:id/comments
 * Add comment to bug
 * 
 * Request body:
 * {
 *   "content": "Это комментарий к багу",
 *   "authorId": 1,
 *   "authorName": "Администратор"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "bugId": 1,
 *     "authorId": 1,
 *     "authorName": "Администратор",
 *     "content": "Это комментарий к багу",
 *     "createdAt": "2024-01-15T10:30:00.000Z",
 *     "updatedAt": "2024-01-15T10:30:00.000Z",
 *     "isEdited": false
 *   }
 * }
 * 
 * Requirements: 19.1
 */
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, authorId, authorName } = req.body;

    // Validate bug ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID бага',
          details: [{ field: 'id', message: 'ID должен быть числом' }]
        }
      });
    }

    const commentData = {
      bugId: parseInt(id),
      authorId: parseInt(authorId),
      authorName,
      content
    };

    const result = await CommentService.createComment(commentData);

    if (!result.success) {
      // Handle validation errors (400 Bad Request)
      if (result.error.code === 'VALIDATION_ERROR') {
        return res.status(400).json(result);
      }

      // Handle not found errors (404 Not Found)
      if (result.error.code === 'NOT_FOUND') {
        return res.status(404).json(result);
      }

      // Handle other errors
      return res.status(500).json(result);
    }

    // Return created comment with 201 Created status
    res.status(201).json(result);
  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при создании комментария'
      }
    });
  }
});

/**
 * GET /api/bugs/:id/comments
 * Get all comments for a bug (sorted by created_at)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "bugId": 1,
 *       "authorId": 1,
 *       "authorName": "Администратор",
 *       "content": "Это комментарий к багу",
 *       "createdAt": "2024-01-15T10:30:00.000Z",
 *       "updatedAt": "2024-01-15T10:30:00.000Z",
 *       "isEdited": false
 *     }
 *   ],
 *   "count": 1
 * }
 * 
 * Requirements: 19.1, 19.3
 */
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate bug ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID бага',
          details: [{ field: 'id', message: 'ID должен быть числом' }]
        }
      });
    }

    const result = await CommentService.getCommentsByBugId(parseInt(id));

    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return res.status(404).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при получении комментариев'
      }
    });
  }
});

/**
 * PUT /api/bugs/:id/comments/:commentId
 * Edit comment (only within 15 minutes of creation)
 * 
 * Request body:
 * {
 *   "content": "Обновленный комментарий",
 *   "authorId": 1
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "bugId": 1,
 *     "authorId": 1,
 *     "authorName": "Администратор",
 *     "content": "Обновленный комментарий",
 *     "createdAt": "2024-01-15T10:30:00.000Z",
 *     "updatedAt": "2024-01-15T10:35:00.000Z",
 *     "isEdited": true
 *   }
 * }
 * 
 * Requirements: 19.4, 19.5
 */
router.put('/:id/comments/:commentId', async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { content, authorId } = req.body;

    // Validate IDs are numbers
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID бага',
          details: [{ field: 'id', message: 'ID должен быть числом' }]
        }
      });
    }

    if (isNaN(parseInt(commentId))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID комментария',
          details: [{ field: 'commentId', message: 'ID должен быть числом' }]
        }
      });
    }

    // Validate required fields
    if (!content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Содержание комментария обязательно',
          details: [{ field: 'content', message: 'Содержание комментария обязательно' }]
        }
      });
    }

    if (!authorId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ID автора обязательно',
          details: [{ field: 'authorId', message: 'ID автора обязательно' }]
        }
      });
    }

    const result = await CommentService.updateComment(parseInt(commentId), content, parseInt(authorId));

    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return res.status(404).json(result);
      }
      if (result.error.code === 'UNAUTHORIZED') {
        return res.status(403).json(result);
      }
      if (result.error.code === 'EDIT_WINDOW_EXPIRED') {
        return res.status(409).json(result);
      }
      if (result.error.code === 'VALIDATION_ERROR') {
        return res.status(400).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при обновлении комментария'
      }
    });
  }
});

/**
 * DELETE /api/bugs/:id/comments/:commentId
 * Delete comment
 * 
 * Request body:
 * {
 *   "authorId": 1
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Комментарий успешно удален"
 * }
 * 
 * Requirements: 19.5
 */
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { authorId } = req.body;

    // Validate IDs are numbers
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID бага',
          details: [{ field: 'id', message: 'ID должен быть числом' }]
        }
      });
    }

    if (isNaN(parseInt(commentId))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID комментария',
          details: [{ field: 'commentId', message: 'ID должен быть числом' }]
        }
      });
    }

    // Validate authorId is provided
    if (!authorId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ID автора обязательно',
          details: [{ field: 'authorId', message: 'ID автора обязательно' }]
        }
      });
    }

    const result = await CommentService.deleteComment(parseInt(commentId), parseInt(authorId));

    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return res.status(404).json(result);
      }
      if (result.error.code === 'UNAUTHORIZED') {
        return res.status(403).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при удалении комментария'
      }
    });
  }
});

/**
 * POST /api/bugs/:id/screenshots
 * Upload screenshot to bug
 * 
 * Form data:
 * - screenshot: Image file (PNG, JPG, JPEG, GIF, max 5MB)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "bugId": 1,
 *     "filename": "screenshot.png",
 *     "filePath": "/uploads/screenshots/1234567890-123456789-screenshot.png",
 *     "fileSize": 1024000,
 *     "mimeType": "image/png",
 *     "uploadedAt": "2024-01-15T10:30:00.000Z"
 *   }
 * }
 * 
 * Requirements: 20.1
 */
router.post('/:id/screenshots', uploadScreenshot, validateUploadedFile, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate bug ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID бага',
          details: [{ field: 'id', message: 'ID должен быть числом' }]
        }
      });
    }

    const result = await ScreenshotService.createScreenshotFromFile(parseInt(id), req.file);

    if (!result.success) {
      // Handle validation errors (400 Bad Request)
      if (result.error.code === 'VALIDATION_ERROR') {
        return res.status(400).json(result);
      }

      // Handle not found errors (404 Not Found)
      if (result.error.code === 'NOT_FOUND') {
        return res.status(404).json(result);
      }

      // Handle limit exceeded errors (409 Conflict)
      if (result.error.code === 'LIMIT_EXCEEDED') {
        return res.status(409).json(result);
      }

      // Handle other errors
      return res.status(500).json(result);
    }

    // Return created screenshot with 201 Created status
    res.status(201).json(result);
  } catch (error) {
    console.error('Screenshot upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при загрузке скриншота'
      }
    });
  }
});

/**
 * GET /api/bugs/:id/screenshots
 * Get all screenshots for a bug
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "bugId": 1,
 *       "filename": "screenshot.png",
 *       "filePath": "/uploads/screenshots/1234567890-123456789-screenshot.png",
 *       "fileSize": 1024000,
 *       "mimeType": "image/png",
 *       "uploadedAt": "2024-01-15T10:30:00.000Z",
 *       "url": "/uploads/screenshots/1234567890-123456789-screenshot.png",
 *       "thumbnailUrl": "/uploads/screenshots/1234567890-123456789-screenshot.png"
 *     }
 *   ],
 *   "count": 1,
 *   "limit": 10,
 *   "remaining": 9
 * }
 * 
 * Requirements: 20.1
 */
router.get('/:id/screenshots', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate bug ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID бага',
          details: [{ field: 'id', message: 'ID должен быть числом' }]
        }
      });
    }

    const result = await ScreenshotService.getScreenshotsByBugId(parseInt(id));

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get screenshots error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при получении скриншотов'
      }
    });
  }
});

/**
 * DELETE /api/bugs/:id/screenshots/:screenshotId
 * Delete screenshot from bug
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Скриншот успешно удален"
 * }
 * 
 * Requirements: 20.7
 */
router.delete('/:id/screenshots/:screenshotId', async (req, res) => {
  try {
    const { id, screenshotId } = req.params;

    // Validate IDs are numbers
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID бага',
          details: [{ field: 'id', message: 'ID должен быть числом' }]
        }
      });
    }

    if (isNaN(parseInt(screenshotId))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID скриншота',
          details: [{ field: 'screenshotId', message: 'ID должен быть числом' }]
        }
      });
    }

    // Verify screenshot belongs to the bug
    const screenshotResult = await ScreenshotService.getScreenshotById(parseInt(screenshotId));
    if (!screenshotResult.success) {
      if (screenshotResult.error.code === 'NOT_FOUND') {
        return res.status(404).json(screenshotResult);
      }
      return res.status(500).json(screenshotResult);
    }

    // Check if screenshot belongs to the specified bug
    if (screenshotResult.data.bugId !== parseInt(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ASSOCIATION',
          message: 'Скриншот не принадлежит указанному багу',
          details: [{ field: 'screenshotId', message: 'Скриншот не найден для этого бага' }]
        }
      });
    }

    const result = await ScreenshotService.deleteScreenshot(parseInt(screenshotId));

    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return res.status(404).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Delete screenshot error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при удалении скриншота'
      }
    });
  }
});

/**
 * GET /api/bugs/:id/screenshots/statistics
 * Get screenshot statistics for a bug
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "count": 3,
 *     "totalSize": 2048000,
 *     "totalSizeMB": 1.95,
 *     "limit": 10,
 *     "remaining": 7
 *   }
 * }
 */
router.get('/:id/screenshots/statistics', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate bug ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID бага',
          details: [{ field: 'id', message: 'ID должен быть числом' }]
        }
      });
    }

    const result = await ScreenshotService.getScreenshotStatistics(parseInt(id));

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get screenshot statistics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при получении статистики скриншотов'
      }
    });
  }
});

module.exports = router;