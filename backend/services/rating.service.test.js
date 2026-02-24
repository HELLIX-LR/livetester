const RatingService = require('./rating.service');
const TesterService = require('./tester.service');
const BugService = require('./bug.service');
const pool = require('../config/database');

describe('RatingService', () => {
  let testTester;

  // Set up test tester before each test
  beforeEach(async () => {
    const testerResult = await TesterService.registerTester({
      name: 'Test Tester',
      email: `test-rating-${Date.now()}@example.com`,
      deviceType: 'smartphone',
      os: 'Android',
      osVersion: '13.0'
    });
    testTester = testerResult.data;
  });

  // Clean up test data after each test
  afterEach(async () => {
    if (testTester) {
      await pool.query('DELETE FROM bugs WHERE tester_id = $1', [testTester.id]);
      await pool.query('DELETE FROM testers WHERE id = $1', [testTester.id]);
    }
  });

  describe('calculateRating', () => {
    test('should calculate rating with correct weights', async () => {
      // Create bugs with different priorities
      await BugService.createBug({
        title: 'Critical Bug',
        description: 'Critical issue',
        testerId: testTester.id,
        priority: 'critical',
        status: 'new',
        type: 'crash'
      });

      await BugService.createBug({
        title: 'High Bug',
        description: 'High priority issue',
        testerId: testTester.id,
        priority: 'high',
        status: 'new',
        type: 'functionality'
      });

      await BugService.createBug({
        title: 'Medium Bug',
        description: 'Medium priority issue',
        testerId: testTester.id,
        priority: 'medium',
        status: 'new',
        type: 'UI'
      });

      await BugService.createBug({
        title: 'Low Bug',
        description: 'Low priority issue',
        testerId: testTester.id,
        priority: 'low',
        status: 'new',
        type: 'other'
      });

      const result = await RatingService.calculateRating(testTester.id);

      // Expected rating: critical(4) + high(3) + medium(2) + low(1) = 10
      expect(result.rating).toBe(10);
      expect(result.bugsCount).toBe(4);
      expect(result.testerId).toBe(testTester.id);
      expect(result.breakdown).toEqual({
        critical: 1,
        high: 1,
        medium: 1,
        low: 1
      });
    });

    test('should calculate rating with multiple bugs of same priority', async () => {
      // Create 3 high priority bugs
      for (let i = 0; i < 3; i++) {
        await BugService.createBug({
          title: `High Bug ${i + 1}`,
          description: `High priority issue ${i + 1}`,
          testerId: testTester.id,
          priority: 'high',
          status: 'new',
          type: 'functionality'
        });
      }

      const result = await RatingService.calculateRating(testTester.id);

      // Expected rating: 3 * high(3) = 9
      expect(result.rating).toBe(9);
      expect(result.bugsCount).toBe(3);
      expect(result.breakdown).toEqual({
        high: 3
      });
    });

    test('should return zero rating for tester with no bugs', async () => {
      const result = await RatingService.calculateRating(testTester.id);

      expect(result.rating).toBe(0);
      expect(result.bugsCount).toBe(0);
      expect(result.breakdown).toEqual({});
    });
  });

  describe('updateTesterRating', () => {
    test('should update tester rating in database', async () => {
      // Create a bug to generate rating
      await BugService.createBug({
        title: 'Test Bug',
        description: 'Test issue',
        testerId: testTester.id,
        priority: 'high',
        status: 'new',
        type: 'functionality'
      });

      const result = await RatingService.updateTesterRating(testTester.id);

      expect(result.success).toBe(true);
      expect(result.data.rating).toBe(3); // high priority = 3 points
      expect(result.data.bugsCount).toBe(1);

      // Verify in database
      const testerResult = await TesterService.getTesterById(testTester.id);
      expect(testerResult.data.rating).toBe(3);
      expect(testerResult.data.bugsCount).toBe(1);
    });
  });

  describe('getTopTesters', () => {
    test('should return top testers sorted by rating', async () => {
      // Create another tester with higher rating
      const tester2Result = await TesterService.registerTester({
        name: 'Top Tester',
        email: `test-top-${Date.now()}@example.com`,
        deviceType: 'tablet',
        os: 'iOS',
        osVersion: '16.0'
      });
      const tester2 = tester2Result.data;

      try {
        // Give first tester 1 medium bug (2 points)
        await BugService.createBug({
          title: 'Medium Bug',
          description: 'Medium issue',
          testerId: testTester.id,
          priority: 'medium',
          status: 'new',
          type: 'UI'
        });

        // Give second tester 1 critical bug (4 points)
        await BugService.createBug({
          title: 'Critical Bug',
          description: 'Critical issue',
          testerId: tester2.id,
          priority: 'critical',
          status: 'new',
          type: 'crash'
        });

        // Update ratings
        await RatingService.updateTesterRating(testTester.id);
        await RatingService.updateTesterRating(tester2.id);

        const result = await RatingService.getTopTesters(10);

        expect(result.success).toBe(true);
        expect(result.data.length).toBeGreaterThanOrEqual(2);
        
        // Find our test testers in the results
        const topTester = result.data.find(t => t.id === tester2.id);
        const lowerTester = result.data.find(t => t.id === testTester.id);
        
        expect(topTester).toBeDefined();
        expect(topTester.rating).toBe(4);
        expect(lowerTester).toBeDefined();
        expect(lowerTester.rating).toBe(2);

        // Verify sorting (higher rating should come first)
        const tester2Index = result.data.findIndex(t => t.id === tester2.id);
        const tester1Index = result.data.findIndex(t => t.id === testTester.id);
        expect(tester2Index).toBeLessThan(tester1Index);
      } finally {
        // Clean up second tester
        await pool.query('DELETE FROM bugs WHERE tester_id = $1', [tester2.id]);
        await pool.query('DELETE FROM testers WHERE id = $1', [tester2.id]);
      }
    });

    test('should limit results correctly', async () => {
      const result = await RatingService.getTopTesters(5);

      expect(result.success).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('integration with BugService', () => {
    test('should automatically update rating when bug is created', async () => {
      // Create bug - this should automatically update rating
      const bugResult = await BugService.createBug({
        title: 'Auto Rating Bug',
        description: 'This should auto-update rating',
        testerId: testTester.id,
        priority: 'critical',
        status: 'new',
        type: 'crash'
      });

      expect(bugResult.success).toBe(true);

      // Check that rating was updated
      const testerResult = await TesterService.getTesterById(testTester.id);
      expect(testerResult.data.rating).toBe(4); // critical = 4 points
      expect(testerResult.data.bugsCount).toBe(1);
    });

    test('should automatically update rating when bug priority is changed', async () => {
      // Create a medium priority bug
      const bugResult = await BugService.createBug({
        title: 'Priority Change Bug',
        description: 'This will have priority changed',
        testerId: testTester.id,
        priority: 'medium',
        status: 'new',
        type: 'functionality'
      });

      expect(bugResult.success).toBe(true);
      
      // Verify initial rating
      let testerResult = await TesterService.getTesterById(testTester.id);
      expect(testerResult.data.rating).toBe(2); // medium = 2 points

      // Change priority to critical
      const updateResult = await BugService.updateBugPriority(bugResult.data.id, 'critical');
      expect(updateResult.success).toBe(true);

      // Check that rating was updated
      testerResult = await TesterService.getTesterById(testTester.id);
      expect(testerResult.data.rating).toBe(4); // critical = 4 points
      expect(testerResult.data.bugsCount).toBe(1); // still 1 bug
    });
  });
});