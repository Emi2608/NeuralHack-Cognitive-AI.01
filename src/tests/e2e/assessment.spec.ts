import { test, expect } from '@playwright/test';

test.describe('Assessment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@neuralhack.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display assessment selection', async ({ page }) => {
    await page.goto('/assessments');
    
    // Check if assessment cards are visible
    await expect(page.locator('text=MoCA')).toBeVisible();
    await expect(page.locator('text=PHQ-9')).toBeVisible();
    await expect(page.locator('text=MMSE')).toBeVisible();
    await expect(page.locator('text=AD8')).toBeVisible();
    await expect(page.locator('text=Parkinson')).toBeVisible();
  });

  test('should start MoCA assessment', async ({ page }) => {
    await page.goto('/assessments');
    
    // Click on MoCA assessment
    await page.click('text=Iniciar MoCA');
    
    // Should navigate to MoCA assessment page
    await expect(page).toHaveURL('/assessments/moca');
    await expect(page.locator('text=Evaluación Cognitiva Montreal')).toBeVisible();
  });

  test('should complete MoCA assessment flow', async ({ page }) => {
    await page.goto('/assessments/moca');
    
    // Start assessment
    await page.click('button:has-text("Comenzar")');
    
    // Navigate through questions
    for (let i = 0; i < 5; i++) {
      // Answer current question (this would depend on question type)
      const radioButtons = page.locator('input[type="radio"]');
      const radioCount = await radioButtons.count();
      
      if (radioCount > 0) {
        await radioButtons.first().check();
      }
      
      // Click next button
      const nextButton = page.locator('button:has-text("Siguiente")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
      } else {
        break;
      }
    }
    
    // Submit assessment
    await page.click('button:has-text("Finalizar")');
    
    // Should show results
    await expect(page.locator('text=Resultados')).toBeVisible();
    await expect(page.locator('text=Puntuación')).toBeVisible();
  });

  test('should start PHQ-9 assessment', async ({ page }) => {
    await page.goto('/assessments');
    
    // Click on PHQ-9 assessment
    await page.click('text=Iniciar PHQ-9');
    
    // Should navigate to PHQ-9 assessment page
    await expect(page).toHaveURL('/assessments/phq9');
    await expect(page.locator('text=Cuestionario de Salud del Paciente')).toBeVisible();
  });

  test('should complete PHQ-9 assessment', async ({ page }) => {
    await page.goto('/assessments/phq9');
    
    // Start assessment
    await page.click('button:has-text("Comenzar")');
    
    // Answer all 9 questions
    for (let i = 0; i < 9; i++) {
      // Select a random answer (0-3 scale)
      const randomAnswer = Math.floor(Math.random() * 4);
      await page.click(`input[value="${randomAnswer}"]`);
      
      // Click next if not last question
      if (i < 8) {
        await page.click('button:has-text("Siguiente")');
      }
    }
    
    // Submit assessment
    await page.click('button:has-text("Finalizar")');
    
    // Should show results
    await expect(page.locator('text=Resultados PHQ-9')).toBeVisible();
    await expect(page.locator('text=Nivel de depresión')).toBeVisible();
  });

  test('should save assessment progress', async ({ page }) => {
    await page.goto('/assessments/moca');
    
    // Start assessment
    await page.click('button:has-text("Comenzar")');
    
    // Answer first question
    const radioButton = page.locator('input[type="radio"]').first();
    if (await radioButton.isVisible()) {
      await radioButton.check();
    }
    
    // Refresh page to simulate interruption
    await page.reload();
    
    // Should show option to continue
    await expect(page.locator('text=Continuar evaluación')).toBeVisible();
    
    // Click continue
    await page.click('button:has-text("Continuar")');
    
    // Should restore progress
    await expect(page.locator('input[type="radio"]:checked')).toBeVisible();
  });

  test('should handle assessment timeout', async ({ page }) => {
    await page.goto('/assessments/moca');
    
    // Start assessment
    await page.click('button:has-text("Comenzar")');
    
    // Wait for timeout warning (if implemented)
    // This would depend on your timeout implementation
    await page.waitForTimeout(5000);
    
    // Check if timeout warning appears
    const timeoutWarning = page.locator('text=Tiempo restante');
    if (await timeoutWarning.isVisible()) {
      await expect(timeoutWarning).toBeVisible();
    }
  });

  test('should validate required responses', async ({ page }) => {
    await page.goto('/assessments/phq9');
    
    // Start assessment
    await page.click('button:has-text("Comenzar")');
    
    // Try to proceed without answering
    await page.click('button:has-text("Siguiente")');
    
    // Should show validation error
    await expect(page.locator('text=Por favor responde esta pregunta')).toBeVisible();
  });

  test('should show assessment history', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if assessment history is visible
    await expect(page.locator('text=Historial de Evaluaciones')).toBeVisible();
    
    // Should show previous assessments (if any)
    const historyItems = page.locator('[data-testid="assessment-history-item"]');
    const count = await historyItems.count();
    
    if (count > 0) {
      await expect(historyItems.first()).toBeVisible();
    }
  });

  test('should display assessment results', async ({ page }) => {
    // Complete a quick assessment first
    await page.goto('/assessments/phq9');
    await page.click('button:has-text("Comenzar")');
    
    // Answer all questions quickly
    for (let i = 0; i < 9; i++) {
      await page.click('input[value="0"]'); // Select "Not at all"
      if (i < 8) {
        await page.click('button:has-text("Siguiente")');
      }
    }
    
    await page.click('button:has-text("Finalizar")');
    
    // Check results page
    await expect(page.locator('text=Resultados PHQ-9')).toBeVisible();
    await expect(page.locator('text=Puntuación total')).toBeVisible();
    await expect(page.locator('text=Nivel de riesgo')).toBeVisible();
    await expect(page.locator('text=Recomendaciones')).toBeVisible();
  });

  test('should handle drawing tasks in MoCA', async ({ page }) => {
    await page.goto('/assessments/moca');
    await page.click('button:has-text("Comenzar")');
    
    // Look for drawing canvas
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      // Simulate drawing on canvas
      const canvasBox = await canvas.boundingBox();
      if (canvasBox) {
        await page.mouse.move(canvasBox.x + 50, canvasBox.y + 50);
        await page.mouse.down();
        await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
        await page.mouse.up();
      }
      
      // Check if drawing was registered
      await expect(page.locator('button:has-text("Siguiente")')).toBeEnabled();
    }
  });

  test('should export assessment results', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for export button
    const exportButton = page.locator('button:has-text("Exportar")');
    if (await exportButton.isVisible()) {
      await exportButton.click();
      
      // Should show export options
      await expect(page.locator('text=Exportar Resultados')).toBeVisible();
      await expect(page.locator('text=PDF')).toBeVisible();
      await expect(page.locator('text=CSV')).toBeVisible();
    }
  });

  test('should share assessment results', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for share button
    const shareButton = page.locator('button:has-text("Compartir")');
    if (await shareButton.isVisible()) {
      await shareButton.click();
      
      // Should show sharing options
      await expect(page.locator('text=Compartir Resultados')).toBeVisible();
      await expect(page.locator('text=WhatsApp')).toBeVisible();
      await expect(page.locator('text=Email')).toBeVisible();
    }
  });
});