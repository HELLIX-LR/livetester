/**
 * Demo script to showcase the rating system functionality
 * This script demonstrates how the rating system works with different bug priorities
 */

const TesterService = require('./services/tester.service');
const BugService = require('./services/bug.service');
const RatingService = require('./services/rating.service');

async function demoRatingSystem() {
  console.log('🎯 LIVE RUSSIA Tester Dashboard - Rating System Demo');
  console.log('=' .repeat(60));

  try {
    // 1. Create demo testers
    console.log('\n📝 Creating demo testers...');
    
    const tester1 = await TesterService.registerTester({
      name: 'Алексей Иванов',
      email: `demo-tester-1-${Date.now()}@example.com`,
      deviceType: 'smartphone',
      os: 'Android',
      osVersion: '13.0',
      nickname: 'alex_tester',
      telegram: '@alex_tester'
    });

    const tester2 = await TesterService.registerTester({
      name: 'Мария Петрова',
      email: `demo-tester-2-${Date.now()}@example.com`,
      deviceType: 'tablet',
      os: 'iOS',
      osVersion: '16.0',
      nickname: 'maria_tester',
      telegram: '@maria_tester'
    });

    console.log(`✅ Created tester 1: ${tester1.data.name} (ID: ${tester1.data.id})`);
    console.log(`✅ Created tester 2: ${tester2.data.name} (ID: ${tester2.data.id})`);

    // 2. Create bugs with different priorities for tester 1
    console.log('\n🐛 Creating bugs for Алексей Иванов...');
    
    const bugs1 = [
      {
        title: 'Приложение крашится при входе',
        description: 'Критическая ошибка при авторизации',
        priority: 'critical',
        type: 'crash'
      },
      {
        title: 'Неправильное отображение интерфейса',
        description: 'UI элементы накладываются друг на друга',
        priority: 'high',
        type: 'UI'
      },
      {
        title: 'Медленная загрузка данных',
        description: 'Данные загружаются более 10 секунд',
        priority: 'medium',
        type: 'performance'
      },
      {
        title: 'Опечатка в тексте',
        description: 'Неправильное написание слова в меню',
        priority: 'low',
        type: 'other'
      }
    ];

    for (const bugData of bugs1) {
      const bug = await BugService.createBug({
        ...bugData,
        testerId: tester1.data.id,
        status: 'new'
      });
      console.log(`  ✅ Created ${bugData.priority} priority bug: ${bugData.title}`);
    }

    // 3. Create bugs for tester 2
    console.log('\n🐛 Creating bugs for Мария Петрова...');
    
    const bugs2 = [
      {
        title: 'Критическая уязвимость безопасности',
        description: 'Возможность несанкционированного доступа',
        priority: 'critical',
        type: 'security'
      },
      {
        title: 'Еще одна критическая ошибка',
        description: 'Потеря данных пользователя',
        priority: 'critical',
        type: 'functionality'
      },
      {
        title: 'Высокоприоритетная ошибка',
        description: 'Функция не работает корректно',
        priority: 'high',
        type: 'functionality'
      }
    ];

    for (const bugData of bugs2) {
      const bug = await BugService.createBug({
        ...bugData,
        testerId: tester2.data.id,
        status: 'new'
      });
      console.log(`  ✅ Created ${bugData.priority} priority bug: ${bugData.title}`);
    }

    // 4. Show rating calculations
    console.log('\n📊 Rating Calculations:');
    console.log('Priority weights: critical=4, high=3, medium=2, low=1');
    
    const rating1 = await RatingService.calculateRating(tester1.data.id);
    console.log(`\n${tester1.data.name}:`);
    console.log(`  Bugs: ${JSON.stringify(rating1.breakdown)}`);
    console.log(`  Total bugs: ${rating1.bugsCount}`);
    console.log(`  Rating calculation: 1×4 + 1×3 + 1×2 + 1×1 = ${rating1.rating} points`);

    const rating2 = await RatingService.calculateRating(tester2.data.id);
    console.log(`\n${tester2.data.name}:`);
    console.log(`  Bugs: ${JSON.stringify(rating2.breakdown)}`);
    console.log(`  Total bugs: ${rating2.bugsCount}`);
    console.log(`  Rating calculation: 2×4 + 1×3 = ${rating2.rating} points`);

    // 5. Show top testers
    console.log('\n🏆 Top Testers Ranking:');
    const topTesters = await RatingService.getTopTesters(10);
    
    if (topTesters.success) {
      topTesters.data.forEach((tester, index) => {
        if (tester.rating > 0) {
          console.log(`  ${index + 1}. ${tester.name} - ${tester.rating} points (${tester.bugsCount} bugs)`);
        }
      });
    }

    // 6. Demo priority change
    console.log('\n🔄 Demonstrating priority change...');
    
    // Get one of tester1's bugs and change its priority
    const tester1Bugs = await BugService.getBugsByTesterId(tester1.data.id);
    if (tester1Bugs.success && tester1Bugs.data.length > 0) {
      const bugToUpdate = tester1Bugs.data.find(b => b.priority === 'low');
      if (bugToUpdate) {
        console.log(`Changing bug "${bugToUpdate.title}" from low to critical priority...`);
        
        await BugService.updateBugPriority(bugToUpdate.id, 'critical');
        
        // Show updated rating
        const updatedRating = await RatingService.calculateRating(tester1.data.id);
        console.log(`Updated rating for ${tester1.data.name}: ${updatedRating.rating} points`);
        console.log(`Rating change: +3 points (low=1 → critical=4, difference=+3)`);
      }
    }

    console.log('\n✨ Demo completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Rating system automatically calculates points based on bug priorities');
    console.log('- Ratings are updated when bugs are created, modified, or deleted');
    console.log('- Top testers endpoint returns testers sorted by rating');
    console.log('- System supports Russian language error messages');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  demoRatingSystem()
    .then(() => {
      console.log('\n👋 Demo finished. You can now test the API endpoints:');
      console.log('- GET /api/testers/top - Get top testers by rating');
      console.log('- POST /api/bugs - Create bug (automatically updates rating)');
      console.log('- PATCH /api/bugs/:id/priority - Change bug priority (updates rating)');
      process.exit(0);
    })
    .catch(error => {
      console.error('Demo error:', error);
      process.exit(1);
    });
}

module.exports = { demoRatingSystem };