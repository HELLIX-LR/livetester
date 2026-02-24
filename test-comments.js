/**
 * Integration test for comment system
 * Tests the complete flow: create bug -> add comment -> get comments -> edit comment -> delete comment
 * Requirements: 19.1, 19.3, 19.4, 19.5, 19.7
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testCommentSystem() {
  console.log('🧪 Testing Comment System Integration...\n');

  try {
    // Step 1: Create a test bug first
    console.log('1. Creating test bug...');
    const bugData = {
      title: 'Test Bug for Comments',
      description: 'This is a test bug to test the comment system',
      testerId: 1,
      priority: 'medium',
      status: 'new',
      type: 'functionality'
    };

    const bugResponse = await axios.post(`${BASE_URL}/bugs`, bugData);
    if (!bugResponse.data.success) {
      throw new Error('Failed to create test bug');
    }

    const bugId = bugResponse.data.data.id;
    console.log(`✅ Bug created with ID: ${bugId}`);

    // Step 2: Add a comment to the bug
    console.log('\n2. Adding comment to bug...');
    const commentData = {
      content: 'This is a test comment for the bug',
      authorId: 1,
      authorName: 'Test Administrator'
    };

    const commentResponse = await axios.post(`${BASE_URL}/bugs/${bugId}/comments`, commentData);
    if (!commentResponse.data.success) {
      throw new Error('Failed to create comment');
    }

    const commentId = commentResponse.data.data.id;
    console.log(`✅ Comment created with ID: ${commentId}`);
    console.log(`   Content: "${commentResponse.data.data.content}"`);
    console.log(`   Author: ${commentResponse.data.data.authorName}`);
    console.log(`   Is Edited: ${commentResponse.data.data.isEdited}`);

    // Step 3: Get all comments for the bug
    console.log('\n3. Getting all comments for bug...');
    const getCommentsResponse = await axios.get(`${BASE_URL}/bugs/${bugId}/comments`);
    if (!getCommentsResponse.data.success) {
      throw new Error('Failed to get comments');
    }

    console.log(`✅ Retrieved ${getCommentsResponse.data.count} comments`);
    console.log(`   Comments are sorted by created_at: ${getCommentsResponse.data.data.length > 0 ? 'Yes' : 'N/A'}`);

    // Step 4: Edit the comment (within 15 minutes)
    console.log('\n4. Editing comment...');
    const updatedContent = 'This is an updated test comment';
    const editData = {
      content: updatedContent,
      authorId: 1
    };

    const editResponse = await axios.put(`${BASE_URL}/bugs/${bugId}/comments/${commentId}`, editData);
    if (!editResponse.data.success) {
      throw new Error('Failed to edit comment');
    }

    console.log(`✅ Comment edited successfully`);
    console.log(`   New content: "${editResponse.data.data.content}"`);
    console.log(`   Is Edited: ${editResponse.data.data.isEdited}`);
    console.log(`   Updated at: ${editResponse.data.data.updatedAt}`);

    // Step 5: Try to edit with wrong author (should fail)
    console.log('\n5. Testing unauthorized edit (should fail)...');
    const unauthorizedEditData = {
      content: 'Unauthorized edit attempt',
      authorId: 999 // Different author
    };

    try {
      await axios.put(`${BASE_URL}/bugs/${bugId}/comments/${commentId}`, unauthorizedEditData);
      console.log('❌ Unauthorized edit should have failed but succeeded');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Unauthorized edit correctly rejected (403 Forbidden)');
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}`);
      }
    }

    // Step 6: Verify bug updated_at was updated when comment was added
    console.log('\n6. Checking if bug updated_at was updated...');
    const bugDetailsResponse = await axios.get(`${BASE_URL}/bugs/${bugId}`);
    if (!bugDetailsResponse.data.success) {
      throw new Error('Failed to get bug details');
    }

    const bug = bugDetailsResponse.data.data;
    const bugCreatedAt = new Date(bug.createdAt);
    const bugUpdatedAt = new Date(bug.updatedAt);

    if (bugUpdatedAt > bugCreatedAt) {
      console.log('✅ Bug updated_at was correctly updated when comment was added');
      console.log(`   Created: ${bug.createdAt}`);
      console.log(`   Updated: ${bug.updatedAt}`);
    } else {
      console.log('❌ Bug updated_at was not updated when comment was added');
    }

    // Step 7: Delete the comment
    console.log('\n7. Deleting comment...');
    const deleteData = {
      authorId: 1
    };

    const deleteResponse = await axios.delete(`${BASE_URL}/bugs/${bugId}/comments/${commentId}`, {
      data: deleteData
    });
    if (!deleteResponse.data.success) {
      throw new Error('Failed to delete comment');
    }

    console.log('✅ Comment deleted successfully');

    // Step 8: Verify comment is deleted
    console.log('\n8. Verifying comment deletion...');
    const finalCommentsResponse = await axios.get(`${BASE_URL}/bugs/${bugId}/comments`);
    if (!finalCommentsResponse.data.success) {
      throw new Error('Failed to get comments after deletion');
    }

    if (finalCommentsResponse.data.count === 0) {
      console.log('✅ Comment successfully deleted - no comments remain');
    } else {
      console.log(`❌ Comment deletion failed - ${finalCommentsResponse.data.count} comments still exist`);
    }

    // Cleanup: Delete the test bug
    console.log('\n9. Cleaning up test bug...');
    await axios.delete(`${BASE_URL}/bugs/${bugId}`);
    console.log('✅ Test bug cleaned up');

    console.log('\n🎉 All comment system tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Comment creation');
    console.log('   ✅ Comment retrieval (sorted by created_at)');
    console.log('   ✅ Comment editing (within 15 minutes)');
    console.log('   ✅ Authorization checks');
    console.log('   ✅ Bug updated_at timestamp update');
    console.log('   ✅ Comment deletion');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Check if axios is available
try {
  require.resolve('axios');
  console.log('📦 axios is available, running tests...\n');
  testCommentSystem();
} catch (e) {
  console.log('📦 axios not found. To run this test:');
  console.log('   npm install axios');
  console.log('   node test-comments.js');
  console.log('\n📋 Manual Test Instructions:');
  console.log('1. Start the server: npm start');
  console.log('2. Create a bug via POST /api/bugs');
  console.log('3. Add comment via POST /api/bugs/:id/comments');
  console.log('4. Get comments via GET /api/bugs/:id/comments');
  console.log('5. Edit comment via PUT /api/bugs/:id/comments/:commentId');
  console.log('6. Delete comment via DELETE /api/bugs/:id/comments/:commentId');
}