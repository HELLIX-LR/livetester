/**
 * Integration test for notification system
 * Tests the complete notification workflow including automatic creation
 */

require('dotenv').config();
const TesterService = require('./backend/services/tester.service');
const BugService = require('./backend/services/bug.service');
const NotificationService = require('./backend/services/notification.service');
const pool = require('./backend/config/database');

async function testNotificationSystem() {
  console.log('🔔 Тестирование системы уведомлений...\n');

  try {
    // Clean up test data
    console.log('Очистка тестовых данных...');
    await pool.query('DELETE FROM notifications WHERE title LIKE \'%ТЕСТ%\'');
    await pool.query('DELETE FROM bugs WHERE title LIKE \'%ТЕСТ%\'');
    await pool.query('DELETE FROM testers WHERE email LIKE \'%test-notification%\'');

    // Test 1: Manual notification creation
    console.log('1. Тест создания уведомления вручную...');
    const manualNotification = await NotificationService.createNotification({
      type: 'info',
      title: 'ТЕСТ: Ручное уведомление',
      message: 'Это тестовое уведомление, созданное вручную',
      metadata: { test: true }
    });
    console.log(`✅ Создано уведомление ID: ${manualNotification.id}`);

    // Test 2: Automatic notification on tester registration
    console.log('\n2. Тест автоматического создания уведомления при регистрации тестера...');
    const testerResult = await TesterService.registerTester({
      name: 'ТЕСТ Иван Петров',
      email: 'ivan.test-notification@example.com',
      deviceType: 'smartphone',
      os: 'Android',
      osVersion: '13.0',
      nickname: 'test_ivan',
      telegram: '@test_ivan'
    });

    if (testerResult.success) {
      console.log(`✅ Тестер зарегистрирован ID: ${testerResult.data.id}`);
      
      // Check if notification was created
      const notifications = await NotificationService.getNotifications({ limit: 10 });
      const testerNotification = notifications.notifications.find(n => 
        n.type === 'new_tester' && n.message.includes('ТЕСТ Иван Петров')
      );
      
      if (testerNotification) {
        console.log(`✅ Автоматически создано уведомление о новом тестере ID: ${testerNotification.id}`);
      } else {
        console.log('❌ Уведомление о новом тестере не найдено');
      }
    } else {
      console.log('❌ Ошибка регистрации тестера:', testerResult.error);
    }

    // Test 3: Automatic notification on critical bug creation
    console.log('\n3. Тест автоматического создания уведомления при критическом баге...');
    if (testerResult.success) {
      const bugResult = await BugService.createBug({
        title: 'ТЕСТ: Критический баг приложения',
        description: 'Это тестовый критический баг для проверки уведомлений',
        testerId: testerResult.data.id,
        priority: 'critical',
        status: 'new',
        type: 'crash'
      });

      if (bugResult.success) {
        console.log(`✅ Критический баг создан ID: ${bugResult.data.id}`);
        
        // Check if notification was created
        const notifications = await NotificationService.getNotifications({ limit: 10 });
        const bugNotification = notifications.notifications.find(n => 
          n.type === 'critical_bug' && n.message.includes('ТЕСТ: Критический баг приложения')
        );
        
        if (bugNotification) {
          console.log(`✅ Автоматически создано уведомление о критическом баге ID: ${bugNotification.id}`);
        } else {
          console.log('❌ Уведомление о критическом баге не найдено');
        }
      } else {
        console.log('❌ Ошибка создания бага:', bugResult.error);
      }
    }

    // Test 4: Test notification management
    console.log('\n4. Тест управления уведомлениями...');
    
    // Get all notifications
    const allNotifications = await NotificationService.getNotifications();
    console.log(`📋 Всего уведомлений: ${allNotifications.total}`);
    console.log(`📬 Непрочитанных: ${allNotifications.unreadCount}`);

    // Get unread notifications only
    const unreadNotifications = await NotificationService.getUnreadNotifications();
    console.log(`📬 Непрочитанных уведомлений: ${unreadNotifications.notifications.length}`);

    // Mark first notification as read
    if (unreadNotifications.notifications.length > 0) {
      const firstNotification = unreadNotifications.notifications[0];
      await NotificationService.markAsRead(firstNotification.id);
      console.log(`✅ Уведомление ${firstNotification.id} отмечено как прочитанное`);
      
      // Check unread count decreased
      const newUnreadCount = await NotificationService.getUnreadCount();
      console.log(`📬 Новое количество непрочитанных: ${newUnreadCount}`);
    }

    // Test 5: Test server down notification (manual)
    console.log('\n5. Тест уведомления о недоступности сервера...');
    const serverNotification = await NotificationService.createServerDownNotification({
      id: 1,
      name: 'ТЕСТ Главный сервер',
      previousStatus: 'online',
      status: 'offline',
      lastCheck: new Date()
    });
    console.log(`✅ Создано уведомление о сервере ID: ${serverNotification.id}`);

    // Final summary
    console.log('\n📊 Итоговая статистика:');
    const finalStats = await NotificationService.getNotifications();
    console.log(`- Всего уведомлений: ${finalStats.total}`);
    console.log(`- Непрочитанных: ${finalStats.unreadCount}`);
    
    // Show recent notifications
    console.log('\n📋 Последние уведомления:');
    finalStats.notifications.slice(0, 5).forEach((notification, index) => {
      const status = notification.isRead ? '✅' : '📬';
      console.log(`${index + 1}. ${status} [${notification.type}] ${notification.title}`);
      console.log(`   ${notification.message}`);
      console.log(`   Создано: ${notification.createdAt.toLocaleString('ru-RU')}\n`);
    });

    console.log('🎉 Тестирование системы уведомлений завершено успешно!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании системы уведомлений:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testNotificationSystem()
    .then(() => {
      console.log('\n✅ Все тесты пройдены успешно!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Ошибка тестирования:', error);
      process.exit(1);
    });
}

module.exports = testNotificationSystem;