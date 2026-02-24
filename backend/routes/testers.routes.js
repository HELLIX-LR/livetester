const express = require('express');
const router = express.Router();
const TesterService = require('../services/tester.service');
const RatingService = require('../services/rating.service');
const ActivityHistoryService = require('../services/activityHistory.service');

/**
 * POST /api/testers
 * Register new tester endpoint
 * 
 * Request body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "deviceType": "smartphone",
 *   "os": "Android",
 *   "nickname": "johndoe",
 *   "telegram": "@johndoe",
 *   "osVersion": "13.0"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "deviceType": "smartphone",
 *     "os": "Android",
 *     "nickname": "johndoe",
 *     "telegram": "@johndoe",
 *     "osVersion": "13.0",
 *     "status": "active",
 *     "registrationDate": "2024-01-15T10:30:00.000Z",
 *     "bugsCount": 0,
 *     "rating": 0
 *   }
 * }
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, deviceType, os, nickname, telegram, osVersion } = req.body;

    const testerData = {
      name,
      email,
      deviceType,
      os,
      nickname,
      telegram,
      osVersion
    };

    const result = await TesterService.registerTester(testerData);

    if (!result.success) {
      // Handle validation errors (400 Bad Request)
      if (result.error.code === 'VALIDATION_ERROR') {
        return res.status(400).json(result);
      }

      // Handle conflict errors (409 Conflict)
      if (result.error.code === 'CONFLICT') {
        return res.status(409).json(result);
      }

      // Handle other errors
      return res.status(500).json(result);
    }

    // Return created tester with 201 Created status
    res.status(201).json(result);
  } catch (error) {
    console.error('Tester registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during tester registration'
      }
    });
  }
});

/**
 * GET /api/testers
 * Get all testers with optional filtering and pagination
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20)
 * - search: Search query for name or email
 * - deviceType: Filter by device type
 * - os: Filter by operating system
 * - status: Filter by status
 * - sortBy: Sort field (default: registration_date)
 * - sortOrder: Sort order ASC/DESC (default: DESC)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "testers": [...],
 *     "total": 150,
 *     "page": 1,
 *     "pageSize": 20,
 *     "totalPages": 8
 *   }
 * }
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      search,
      deviceType,
      os,
      status,
      sortBy = 'registration_date',
      sortOrder = 'DESC'
    } = req.query;

    const options = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      search,
      deviceType,
      os,
      status,
      sortBy,
      sortOrder
    };

    const result = await TesterService.getAllTesters(options);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get testers error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching testers'
      }
    });
  }
});

/**
 * GET /api/testers/:id
 * Get tester by ID
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     ...
 *   }
 * }
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
          message: 'Invalid tester ID',
          details: [{ field: 'id', message: 'ID must be a number' }]
        }
      });
    }

    const result = await TesterService.getTesterById(parseInt(id));

    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return res.status(404).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get tester by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching tester'
      }
    });
  }
});

/**
 * PATCH /api/testers/:id
 * Update tester information
 * 
 * Request body:
 * {
 *   "name": "Updated Name",
 *   "nickname": "newnick",
 *   "status": "inactive"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "name": "Updated Name",
 *     ...
 *   }
 * }
 * 
 * Requirements: 12.6
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid tester ID',
          details: [{ field: 'id', message: 'ID must be a number' }]
        }
      });
    }

    const result = await TesterService.updateTester(parseInt(id), updates);

    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return res.status(404).json(result);
      }
      if (result.error.code === 'VALIDATION_ERROR') {
        return res.status(400).json(result);
      }
      if (result.error.code === 'CONFLICT') {
        return res.status(409).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Update tester error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating tester'
      }
    });
  }
});

/**
 * PATCH /api/testers/:id/status
 * Update tester status
 * 
 * Request body:
 * {
 *   "status": "inactive"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "status": "inactive",
 *     ...
 *   }
 * }
 * 
 * Requirements: 12.6
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
          message: 'Invalid tester ID',
          details: [{ field: 'id', message: 'ID must be a number' }]
        }
      });
    }

    // Validate status is provided
    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status is required',
          details: [{ field: 'status', message: 'Status is required' }]
        }
      });
    }

    const result = await TesterService.updateTesterStatus(parseInt(id), status);

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
    console.error('Update tester status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating tester status'
      }
    });
  }
});

/**
 * DELETE /api/testers/:id
 * Delete tester
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Tester deleted successfully"
 * }
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
          message: 'Invalid tester ID',
          details: [{ field: 'id', message: 'ID must be a number' }]
        }
      });
    }

    const result = await TesterService.deleteTester(parseInt(id));

    if (!result.success) {
      if (result.error.code === 'NOT_FOUND') {
        return res.status(404).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Delete tester error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting tester'
      }
    });
  }
});

/**
 * GET /api/testers/google-sheets/load
 * Load testers from Google Sheets
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [...],
 *   "count": 150
 * }
 * 
 * Requirements: 10.1, 10.2, 10.3
 */
router.get('/google-sheets/load', async (req, res) => {
  try {
    const result = await TesterService.loadTestersFromGoogleSheets();

    if (!result.success) {
      if (result.error.code === 'EXTERNAL_SERVICE_ERROR') {
        return res.status(502).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Load testers from Google Sheets error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while loading testers from Google Sheets'
      }
    });
  }
});

/**
 * POST /api/testers/google-sheets/sync
 * Sync testers from Google Sheets to local database
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "processed": 150,
 *     "created": 10,
 *     "updated": 140,
 *     "errors": []
 *   }
 * }
 */
router.post('/google-sheets/sync', async (req, res) => {
  try {
    const result = await TesterService.syncTestersFromGoogleSheets();

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Sync testers from Google Sheets error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while syncing testers from Google Sheets'
      }
    });
  }
});

/**
 * GET /api/testers/google-sheets/status
 * Check Google Sheets connection status
 * 
 * Response:
 * {
 *   "success": true,
 *   "connected": true,
 *   "service": "google_sheets"
 * }
 */
router.get('/google-sheets/status', async (req, res) => {
  try {
    const result = await TesterService.checkGoogleSheetsConnection();
    res.json(result);
  } catch (error) {
    console.error('Check Google Sheets status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while checking Google Sheets status'
      }
    });
  }
});

/**
 * POST /api/testers/google-sheets/retry
 * Retry failed Google Sheets operations
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "retriedCount": 5,
 *     "remainingCount": 0
 *   }
 * }
 */
router.post('/google-sheets/retry', async (req, res) => {
  try {
    const result = await TesterService.retryGoogleSheetsOperations();

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Retry Google Sheets operations error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while retrying Google Sheets operations'
      }
    });
  }
});

/**
 * GET /api/testers/top
 * Get top testers by rating
 * 
 * Query parameters:
 * - limit: Number of top testers to return (default: 10)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "name": "John Doe",
 *       "email": "john@example.com",
 *       "nickname": "johndoe",
 *       "telegram": "@johndoe",
 *       "rating": 45,
 *       "bugsCount": 15,
 *       "deviceType": "smartphone",
 *       "os": "Android",
 *       "status": "active",
 *       "registrationDate": "2024-01-15T10:30:00.000Z"
 *     }
 *   ]
 * }
 * 
 * Requirements: 14.3, 14.6
 */
router.get('/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Validate limit parameter
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный параметр limit',
          details: [{ field: 'limit', message: 'Limit должен быть числом от 1 до 100' }]
        }
      });
    }

    const result = await RatingService.getTopTesters(limitNum);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get top testers error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при получении топ тестеров'
      }
    });
  }
});

/**
 * GET /api/testers/:id/bugs
 * Get bugs found by a specific tester
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "bugs": [
 *       {
 *         "id": 1,
 *         "title": "Bug title",
 *         "description": "Bug description",
 *         "priority": "high",
 *         "status": "new",
 *         "type": "crash",
 *         "createdAt": "2024-01-15T10:30:00.000Z"
 *       }
 *     ]
 *   }
 * }
 * 
 * Requirements: 12.5
 */
router.get('/:id/bugs', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid tester ID',
          details: [{ field: 'id', message: 'ID must be a number' }]
        }
      });
    }

    // Check if tester exists first
    const testerResult = await TesterService.getTesterById(parseInt(id));
    if (!testerResult.success) {
      if (testerResult.error.code === 'NOT_FOUND') {
        return res.status(404).json(testerResult);
      }
      return res.status(500).json(testerResult);
    }

    // Get bugs for this tester
    const BugService = require('../services/bug.service');
    const result = await BugService.getBugsByTesterId(parseInt(id));

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get tester bugs error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching tester bugs'
      }
    });
  }
});

/**
 * GET /api/testers/:id/activity
 * Get tester activity history
 * 
 * Query parameters:
 * - eventType: Filter by event type (registration, bug_found, status_changed)
 * - limit: Limit number of records
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "testerId": 123,
 *       "eventType": "registration",
 *       "description": "Тестер зарегистрировался в системе",
 *       "metadata": {...},
 *       "createdAt": "2024-01-15T10:30:00.000Z"
 *     }
 *   ],
 *   "count": 5
 * }
 * 
 * Requirements: 18.4, 18.6
 */
router.get('/:id/activity', async (req, res) => {
  try {
    const { id } = req.params;
    const { eventType, limit } = req.query;

    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Неверный ID тестера',
          details: [{ field: 'id', message: 'ID должен быть числом' }]
        }
      });
    }

    // Validate limit if provided
    let limitNum = null;
    if (limit) {
      limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Неверный параметр limit',
            details: [{ field: 'limit', message: 'Limit должен быть числом от 1 до 1000' }]
          }
        });
      }
    }

    // Check if tester exists first
    const testerResult = await TesterService.getTesterById(parseInt(id));
    if (!testerResult.success) {
      if (testerResult.error.code === 'NOT_FOUND') {
        return res.status(404).json(testerResult);
      }
      return res.status(500).json(testerResult);
    }

    // Get activity history
    const options = {};
    if (eventType) options.eventType = eventType;
    if (limitNum) options.limit = limitNum;

    const result = await ActivityHistoryService.getTesterActivity(parseInt(id), options);

    if (!result.success) {
      if (result.error.code === 'VALIDATION_ERROR') {
        return res.status(400).json(result);
      }
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get tester activity error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Произошла ошибка при получении истории активности тестера'
      }
    });
  }
});

module.exports = router;