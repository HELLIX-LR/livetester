/**
 * Test script for Activity History functionality
 * Tests the activity history system implementation
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testActivityHistory() {
  console.log('🧪 Testing Activity History System...\n');

  try {
    // Test 1: Register a new tester (should create registration activity)
    console.log('1. Testing tester registration with activity recording...');
    const testerData = {
      name: 'Тест Активности',
      email: `activity-test-${Date.now()}@example.com`,
      deviceType: 'smartphone',
      os: 'Android',
      nickname: 'activity_tester',
      telegram: '@activity_tester',
      osVersion: '13.0'
    };

    const registerResponse = await axios.post(`${BASE_URL}/testers`, testerData);
    
    if (registerResponse.status === 201 && registerResponse.data.success) {
      console.log('✅ Tester registered successfully');
      console.log(`   Tester ID: ${registerResponse.data.data.id}`);
      
      const testerId = registerResponse.data.data.id;
      
      // Wait a moment for activity to be recorded
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 2: Get tester activity history
      console.log('\n2. Testing activity history retrieval...');
      const activityResponse = await axios.get(`${BASE_URL}/testers/${testerId}/activity`);
      
      if (activityResponse.status === 200 && activityResponse.data.success) {
        console.log('✅ Activity history retrieved successfully');
        console.log(`   Activities found: ${activityResponse.data.count}`);
        
        const activities = activityResponse.data.data;
        if (activities.length > 0) {
          console.log('   Latest activity:');
          console.log(`     Type: ${activities[0].eventType}`);
          console.log(`     Description: ${activities[0].description}`);
          console.log(`     Created: ${activities[0].createdAt}`);
        }
        
        // Test 3: Filter by event type
        console.log('\n3. Testing activity filtering by event type...');
        const filteredResponse = await axios.get(`${BASE_URL}/testers/${testerId}/activity?eventType=registration`);
        
        if (filteredResponse.status === 200 && filteredResponse.data.success) {
          console.log('✅ Activity filtering works');
          console.log(`   Registration activities: ${filteredResponse.data.count}`);
        } else {
          console.log('❌ Activity filtering failed');
        }
        
        // Test 4: Update tester status (should create status_changed activity)
        console.log('\n4. Testing status change with activity recording...');
        const statusResponse = await axios.patch(`${BASE_URL}/testers/${testerId}/status`, {
          status: 'inactive'
        });
        
        if (statusResponse.status === 200 && statusResponse.data.success) {
          console.log('✅ Status updated successfully');
          
          // Wait a moment for activity to be recorded
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if status change activity was recorded
          const updatedActivityResponse = await axios.get(`${BASE_URL}/testers/${testerId}/activity`);
          
          if (updatedActivityResponse.status === 200 && updatedActivityResponse.data.success) {
            const updatedActivities = updatedActivityResponse.data.data;
            const statusChangeActivity = updatedActivities.find(a => a.eventType === 'status_changed');
            
            if (statusChangeActivity) {
              console.log('✅ Status change activity recorded');
              console.log(`   Description: ${statusChangeActivity.description}`);
            } else {
              console.log('❌ Status change activity not found');
            }
          }
        } else {
          console.log('❌ Status update failed');
        }
        
        // Test 5: Create a bug (should create bug_found activity)
        console.log('\n5. Testing bug creation with activity recording...');
        const bugData = {
          title: 'Тестовый баг для активности',
          description: 'Описание тестового бага',
          testerId: testerId,
          priority: 'medium',
          status: 'new',
          type: 'functionality'
        };
        
        const bugResponse = await axios.post(`${BASE_URL}/bugs`, bugData);
        
        if (bugResponse.status === 201 && bugResponse.data.success) {
          console.log('✅ Bug created successfully');
          
          // Wait a moment for activity to be recorded
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if bug found activity was recorded
          const finalActivityResponse = await axios.get(`${BASE_URL}/testers/${testerId}/activity`);
          
          if (finalActivityResponse.status === 200 && finalActivityResponse.data.success) {
            const finalActivities = finalActivityResponse.data.data;
            const bugFoundActivity = finalActivities.find(a => a.eventType === 'bug_found');
            
            if (bugFoundActivity) {
              console.log('✅ Bug found activity recorded');
              console.log(`   Description: ${bugFoundActivity.description}`);
            } else {
              console.log('❌ Bug found activity not found');
            }
            
            console.log(`\n📊 Total activities for tester: ${finalActivities.length}`);
            console.log('   Activity types:');
            const activityCounts = {};
            finalActivities.forEach(a => {
              activityCounts[a.eventType] = (activityCounts[a.eventType] || 0) + 1;
            });
            Object.entries(activityCounts).forEach(([type, count]) => {
              console.log(`     ${type}: ${count}`);
            });
          }
        } else {
          console.log('❌ Bug creation failed');
        }
        
      } else {
        console.log('❌ Failed to retrieve activity history');
      }
      
    } else {
      console.log('❌ Tester registration failed');
    }
    
    console.log('\n🎉 Activity History test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testActivityHistory();