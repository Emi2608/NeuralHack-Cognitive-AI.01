import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');

  try {
    // Clean up test data
    console.log('🗑️ Cleaning up test data...');
    
    // You can add cleanup logic here
    // For example:
    // await cleanupTestDatabase();
    // await removeTestFiles();

    console.log('✅ Test data cleanup complete');

    // Clean up any temporary files or resources
    console.log('📁 Cleaning up temporary resources...');
    
    // Clean up screenshots, videos, traces if needed
    // This is usually handled by Playwright automatically
    
    console.log('✅ Resource cleanup complete');

  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }

  console.log('🎉 Global teardown completed');
}

export default globalTeardown;