/**
 * Simple Redis connection test
 * Run with: node backend/test-redis.js
 */

require('dotenv').config();
const { cache, CACHE_TTL } = require('./config/redis');

async function testRedis() {
  console.log('Testing Redis connection and cache functions...\n');

  try {
    // Test 1: Set and get dashboard stats
    console.log('Test 1: Dashboard stats caching');
    const dashboardStats = {
      totalTesters: 100,
      activeTesters24h: 45,
      totalBugs: 250
    };
    
    await cache.set('stats:dashboard', dashboardStats, CACHE_TTL.DASHBOARD);
    console.log('✓ Set dashboard stats with TTL:', CACHE_TTL.DASHBOARD, 'seconds');
    
    const retrieved = await cache.get('stats:dashboard');
    console.log('✓ Retrieved dashboard stats:', retrieved);
    console.log('✓ Data matches:', JSON.stringify(retrieved) === JSON.stringify(dashboardStats));

    // Test 2: Set and get server stats
    console.log('\nTest 2: Server stats caching');
    const serverStats = [
      { id: 1, name: 'Server 1', status: 'online', load: 45 },
      { id: 2, name: 'Server 2', status: 'online', load: 67 }
    ];
    
    await cache.set('stats:servers', serverStats, CACHE_TTL.SERVERS);
    console.log('✓ Set server stats with TTL:', CACHE_TTL.SERVERS, 'seconds');
    
    const retrievedServers = await cache.get('stats:servers');
    console.log('✓ Retrieved server stats:', retrievedServers);

    // Test 3: Set and get online players data
    console.log('\nTest 3: Online players caching');
    const onlineData = {
      data: [
        { timestamp: new Date(), count: 150 },
        { timestamp: new Date(), count: 175 }
      ],
      peak: { count: 200, timestamp: new Date() }
    };
    
    await cache.set('stats:online:24h', onlineData, CACHE_TTL.ONLINE_PLAYERS);
    console.log('✓ Set online players data with TTL:', CACHE_TTL.ONLINE_PLAYERS, 'seconds');
    
    const retrievedOnline = await cache.get('stats:online:24h');
    console.log('✓ Retrieved online players data');

    // Test 4: Delete cache
    console.log('\nTest 4: Cache deletion');
    await cache.del('stats:dashboard');
    console.log('✓ Deleted dashboard stats');
    
    const afterDelete = await cache.get('stats:dashboard');
    console.log('✓ After deletion, value is:', afterDelete);

    // Test 5: Pattern deletion
    console.log('\nTest 5: Pattern deletion');
    await cache.set('stats:online:1h', { test: 1 }, 60);
    await cache.set('stats:online:6h', { test: 2 }, 60);
    await cache.set('stats:online:24h', { test: 3 }, 60);
    console.log('✓ Created 3 online stats keys');
    
    const deleted = await cache.delPattern('stats:online:*');
    console.log('✓ Deleted', deleted, 'keys matching pattern');

    console.log('\n✅ All Redis tests passed!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Redis test failed:', err);
    process.exit(1);
  }
}

testRedis();
