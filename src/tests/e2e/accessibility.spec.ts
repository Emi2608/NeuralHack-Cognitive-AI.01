import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@neuralhack.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should not have accessibility violations on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility violations on assessment page', async ({ page }) => {
    await page.goto('/assessments');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/assessments');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Continue tabbing through interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/assessments/moca');
    
    // Check for proper ARIA labels
    await expect(page.locator('[aria-label]')).toHaveCount(1, { timeout: 5000 });
    
    // Check for proper headings structure
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Check for proper form labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      
      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        await expect(label).toBeVisible();
      }
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Run axe-core with color contrast rules
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    expect(colorContrastViolations).toEqual([]);
  });

  test('should support high contrast mode', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Enable high contrast mode
    await page.click('button[aria-label="Accessibility options"]');
    await page.click('button:has-text("Alto contraste")');
    
    // Check if high contrast styles are applied
    const body = page.locator('body');
    const className = await body.getAttribute('class');
    expect(className).toContain('high-contrast');
  });

  test('should support large font size', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Enable large font size
    await page.click('button[aria-label="Accessibility options"]');
    await page.click('button:has-text("Texto grande")');
    
    // Check if large font styles are applied
    const body = page.locator('body');
    const className = await body.getAttribute('class');
    expect(className).toContain('large-font');
  });

  test('should support voice guidance', async ({ page }) => {
    await page.goto('/assessments/moca');
    
    // Enable voice guidance
    await page.click('button[aria-label="Accessibility options"]');
    await page.click('button:has-text("Guía de voz")');
    
    // Check if voice guidance is enabled
    const voiceButton = page.locator('button[aria-label="Play voice guidance"]');
    await expect(voiceButton).toBeVisible();
    
    // Test voice guidance playback
    await voiceButton.click();
    
    // Check if audio is playing (this might need to be mocked)
    await page.waitForTimeout(1000);
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/assessments/phq9');
    
    // Start assessment
    await page.click('button:has-text("Comenzar")');
    
    // Check if focus moves to first question
    const firstQuestion = page.locator('input[type="radio"]').first();
    await expect(firstQuestion).toBeFocused();
    
    // Navigate to next question
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Tab');
    await page.click('button:has-text("Siguiente")');
    
    // Focus should move to next question
    const nextQuestion = page.locator('input[type="radio"]').first();
    await expect(nextQuestion).toBeFocused();
  });

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/assessments/moca');
    
    // Start assessment
    await page.click('button:has-text("Comenzar")');
    
    // Check for aria-live regions
    const liveRegion = page.locator('[aria-live]');
    await expect(liveRegion).toBeVisible();
    
    // Make a change that should be announced
    await page.click('input[type="radio"]');
    await page.click('button:has-text("Siguiente")');
    
    // Check if live region content updated
    await expect(liveRegion).toHaveText(/Pregunta \d+ de \d+/);
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/dashboard');
    
    // Check if animations are disabled
    const animatedElement = page.locator('.animated');
    if (await animatedElement.isVisible()) {
      const animationDuration = await animatedElement.evaluate(
        el => getComputedStyle(el).animationDuration
      );
      expect(animationDuration).toBe('0s');
    }
  });

  test('should have proper error announcements', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Submit form with invalid data
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    
    // Check for error announcement
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
  });

  test('should support skip links', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Press Tab to focus skip link
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('a:has-text("Skip to main content")');
    if (await skipLink.isVisible()) {
      await expect(skipLink).toBeFocused();
      
      // Activate skip link
      await page.keyboard.press('Enter');
      
      // Check if focus moved to main content
      const mainContent = page.locator('main');
      await expect(mainContent).toBeFocused();
    }
  });

  test('should have proper landmark roles', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for main landmark
    await expect(page.locator('main')).toBeVisible();
    
    // Check for navigation landmark
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for banner landmark (header)
    await expect(page.locator('header')).toBeVisible();
    
    // Check for contentinfo landmark (footer)
    const footer = page.locator('footer');
    if (await footer.isVisible()) {
      await expect(footer).toBeVisible();
    }
  });

  test('should support touch accessibility', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('Touch accessibility test only runs on mobile');
    }
    
    await page.goto('/assessments/moca');
    
    // Check minimum touch target size (44x44px)
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});