import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');

  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the development server to be ready
    console.log('⏳ Waiting for development server...');
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:5173');
    await page.waitForSelector('body', { timeout: 30000 });
    console.log('✅ Development server is ready');

    // Set up test database or mock data if needed
    console.log('🗄️ Setting up test data...');
    
    // You can add database seeding or API mocking here
    // For example:
    // await setupTestDatabase();
    // await seedTestData();

    console.log('✅ Test data setup complete');

    // Create test user if needed
    console.log('👤 Creating test user...');
    
    // Navigate to registration page and create test user
    await page.goto('/auth/register');
    
    // Check if registration form exists
    const registrationForm = await page.locator('form').first();
    if (await registrationForm.isVisible()) {
      await page.fill('input[type="email"]', 'test@neuralhack.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.fill('input[name="age"]', '45');
      await page.fill('input[name="education"]', '16');
      await page.selectOption('select[name="language"]', 'es');
      
      // Submit form (but don't wait for success as it might fail if user exists)
      await page.click('button[type="submit"]');
      
      // Wait a bit for the request to complete
      await page.waitForTimeout(2000);
    }

    console.log('✅ Test user setup complete');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('🎉 Global setup completed successfully');
}

export default globalSetup;