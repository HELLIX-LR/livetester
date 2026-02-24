const Comment = require('./Comment.model');

/**
 * Unit tests for Comment model
 * Requirements: 19.1, 19.4, 19.5
 */

// Mock pool for testing
const mockPool = {
  query: jest.fn()
};

// Replace the real pool with mock
jest.mock('../config/database', () => mockPool);

describe('Comment Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    test('should validate required fields', () => {
      const validData = {
        content: 'Test comment',
        authorId: 1,
        authorName: 'Test Author'
      };

      const result = Comment.validate(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject empty content', () => {
      const invalidData = {
        content: '',
        authorId: 1,
        authorName: 'Test Author'
      };

      const result = Comment.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'content',
        message: 'Содержание комментария обязательно'
      });
    });

    test('should reject missing authorId', () => {
      const invalidData = {
        content: 'Test comment',
        authorName: 'Test Author'
      };

      const result = Comment.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'authorId',
        message: 'ID автора обязательно'
      });
    });

    test('should reject missing authorName', () => {
      const invalidData = {
        content: 'Test comment',
        authorId: 1
      };

      const result = Comment.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'authorName',
        message: 'Имя автора обязательно'
      });
    });

    test('should reject content longer than 5000 characters', () => {
      const invalidData = {
        content: 'a'.repeat(5001),
        authorId: 1,
        authorName: 'Test Author'
      };

      const result = Comment.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'content',
        message: 'Комментарий не может быть длиннее 5000 символов'
      });
    });

    test('should reject invalid authorId', () => {
      const invalidData = {
        content: 'Test comment',
        authorId: 'invalid',
        authorName: 'Test Author'
      };

      const result = Comment.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'authorId',
        message: 'ID автора должен быть числом'
      });
    });

    test('should reject authorName longer than 255 characters', () => {
      const invalidData = {
        content: 'Test comment',
        authorId: 1,
        authorName: 'a'.repeat(256)
      };

      const result = Comment.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'authorName',
        message: 'Имя автора не может быть длиннее 255 символов'
      });
    });
  });

  describe('create', () => {
    test('should create comment with valid data', async () => {
      const commentData = {
        bugId: 1,
        authorId: 1,
        authorName: 'Test Author',
        content: 'Test comment'
      };

      const mockBugResult = { rows: [{ id: 1 }] };
      const mockCommentResult = {
        rows: [{
          id: 1,
          bugId: 1,
          authorId: 1,
          authorName: 'Test Author',
          content: 'Test comment',
          createdAt: new Date(),
          updatedAt: new Date(),
          isEdited: false
        }]
      };

      mockPool.query
        .mockResolvedValueOnce(mockBugResult) // Bug exists check
        .mockResolvedValueOnce(mockCommentResult); // Create comment

      const result = await Comment.create(commentData);

      expect(result).toEqual(mockCommentResult.rows[0]);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    test('should throw error if bug not found', async () => {
      const commentData = {
        bugId: 999,
        authorId: 1,
        authorName: 'Test Author',
        content: 'Test comment'
      };

      const mockBugResult = { rows: [] };
      mockPool.query.mockResolvedValueOnce(mockBugResult);

      await expect(Comment.create(commentData)).rejects.toThrow('Bug not found');
    });

    test('should throw validation error for invalid data', async () => {
      const commentData = {
        bugId: 1,
        authorId: 1,
        authorName: 'Test Author',
        content: '' // Invalid empty content
      };

      await expect(Comment.create(commentData)).rejects.toThrow('Validation failed');
    });
  });

  describe('findById', () => {
    test('should return comment if found', async () => {
      const mockResult = {
        rows: [{
          id: 1,
          bugId: 1,
          authorId: 1,
          authorName: 'Test Author',
          content: 'Test comment',
          createdAt: new Date(),
          updatedAt: new Date(),
          isEdited: false
        }]
      };

      mockPool.query.mockResolvedValueOnce(mockResult);

      const result = await Comment.findById(1);

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
    });

    test('should return null if not found', async () => {
      const mockResult = { rows: [] };
      mockPool.query.mockResolvedValueOnce(mockResult);

      const result = await Comment.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByBugId', () => {
    test('should return comments sorted by created_at', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            bugId: 1,
            authorId: 1,
            authorName: 'Test Author',
            content: 'First comment',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            isEdited: false
          },
          {
            id: 2,
            bugId: 1,
            authorId: 1,
            authorName: 'Test Author',
            content: 'Second comment',
            createdAt: new Date('2024-01-02'),
            updatedAt: new Date('2024-01-02'),
            isEdited: false
          }
        ]
      };

      mockPool.query.mockResolvedValueOnce(mockResult);

      const result = await Comment.findByBugId(1);

      expect(result).toEqual(mockResult.rows);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at ASC'),
        [1]
      );
    });
  });

  describe('canEdit', () => {
    test('should return true if comment is within 15 minutes', async () => {
      const recentDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const mockResult = {
        rows: [{
          id: 1,
          bugId: 1,
          authorId: 1,
          authorName: 'Test Author',
          content: 'Test comment',
          createdAt: recentDate,
          updatedAt: recentDate,
          isEdited: false
        }]
      };

      mockPool.query.mockResolvedValueOnce(mockResult);

      const result = await Comment.canEdit(1);

      expect(result).toBe(true);
    });

    test('should return false if comment is older than 15 minutes', async () => {
      const oldDate = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
      const mockResult = {
        rows: [{
          id: 1,
          bugId: 1,
          authorId: 1,
          authorName: 'Test Author',
          content: 'Test comment',
          createdAt: oldDate,
          updatedAt: oldDate,
          isEdited: false
        }]
      };

      mockPool.query.mockResolvedValueOnce(mockResult);

      const result = await Comment.canEdit(1);

      expect(result).toBe(false);
    });

    test('should return false if comment not found', async () => {
      const mockResult = { rows: [] };
      mockPool.query.mockResolvedValueOnce(mockResult);

      const result = await Comment.canEdit(999);

      expect(result).toBe(false);
    });
  });

  describe('getCountByBugId', () => {
    test('should return comment count for bug', async () => {
      const mockResult = { rows: [{ count: '5' }] };
      mockPool.query.mockResolvedValueOnce(mockResult);

      const result = await Comment.getCountByBugId(1);

      expect(result).toBe(5);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM comments WHERE bug_id = $1',
        [1]
      );
    });
  });
});

console.log('Comment model tests defined successfully');