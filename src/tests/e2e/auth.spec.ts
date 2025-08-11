import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check if login form is visible
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation messages
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill form with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill form with valid credentials
    await page.fill('input[type="email"]', 'test@neuralhack.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Bienvenido')).toBeVisible();
  });

  test('should display registration page', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Check if registration form is visible
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[name="age"]')).toBeVisible();
    await expect(page.locator('input[name="education"]')).toBeVisible();
    await expect(page.locator('select[name="language"]')).toBeVisible();
  });

  test('should validate registration form', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation messages
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
    await expect(page.locator('text=Age is required')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Fill form with weak password
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', '123');
    
    // Check for password strength indicator
    await expect(page.locator('text=Password is too weak')).toBeVisible();
  });

  test('should successfully register new user', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Fill form with valid data
    const timestamp = Date.now();
    await page.fill('input[type="email"]', `newuser${timestamp}@example.com`);
    await page.fill('input[type="password"]', 'StrongPassword123!');
    await page.fill('input[name="age"]', '35');
    await page.fill('input[name="education"]', '16');
    await page.selectOption('select[name="language"]', 'es');
    
    // Accept terms and conditions
    await page.check('input[type="checkbox"]');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show success message or redirect
    await expect(page.locator('text=Registration successful')).toBeVisible();
  });

  test('should handle logout', async ({ page }) => {
    // First login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@neuralhack.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Click logout button
    await page.click('button:has-text("Cerrar sesión")');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/auth/login');
  });

  test('should handle password reset', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Click forgot password link
    await page.click('text=¿Olvidaste tu contraseña?');
    
    // Should navigate to password reset page
    await expect(page).toHaveURL('/auth/reset-password');
    
    // Fill email and submit
    await page.fill('input[type="email"]', 'test@neuralhack.com');
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('text=Password reset email sent')).toBeVisible();
  });

  test('should persist authentication state', async ({ page, context }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@neuralhack.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Create new page in same context
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');
    
    // Should still be authenticated
    await expect(newPage.locator('text=Bienvenido')).toBeVisible();
  });

  test('should redirect unauthenticated users', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth/login');
  });
});