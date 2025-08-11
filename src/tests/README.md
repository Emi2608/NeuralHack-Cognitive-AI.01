# Testing Guide - NeuralHack Cognitive AI

Este directorio contiene todas las pruebas para la aplicación NeuralHack Cognitive AI.

## Estructura de Testing

```
src/tests/
├── e2e/                    # Tests End-to-End con Playwright
│   ├── auth.spec.ts       # Tests de autenticación
│   ├── assessment.spec.ts # Tests de evaluaciones
│   ├── accessibility.spec.ts # Tests de accesibilidad
│   ├── global-setup.ts   # Configuración global E2E
│   └── global-teardown.ts # Limpieza global E2E
└── README.md              # Esta guía
```

## Tipos de Tests

### 1. Tests Unitarios (Vitest)
- **Ubicación**: Junto a los archivos fuente (`.test.ts/.tsx`)
- **Propósito**: Probar funciones y componentes individuales
- **Herramientas**: Vitest, Testing Library, Jest DOM

### 2. Tests End-to-End (Playwright)
- **Ubicación**: `src/tests/e2e/`
- **Propósito**: Probar flujos completos de usuario
- **Herramientas**: Playwright, Axe-core

### 3. Tests de Accesibilidad
- **Ubicación**: `src/tests/e2e/accessibility.spec.ts`
- **Propósito**: Verificar cumplimiento WCAG 2.1 AA
- **Herramientas**: Axe-core, Playwright

## Comandos de Testing

### Tests Unitarios
```bash
# Ejecutar todos los tests unitarios
npm run test

# Ejecutar tests con coverage
npm run test:coverage

# Ejecutar tests en modo watch
npm run test -- --watch

# Ejecutar tests con UI
npm run test:ui
```

### Tests End-to-End
```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar tests E2E con UI
npm run test:e2e:ui

# Ejecutar tests E2E en modo headed (visible)
npm run test:e2e:headed

# Ejecutar solo tests de accesibilidad
npm run test:accessibility
```

## Configuración de Tests

### Vitest (Tests Unitarios)
- **Configuración**: `vitest.config.ts`
- **Setup**: Configurado para React y DOM testing
- **Coverage**: V8 coverage provider
- **Mocking**: MSW para mocking de APIs

### Playwright (Tests E2E)
- **Configuración**: `playwright.config.ts`
- **Browsers**: Chrome, Firefox, Safari, Mobile
- **Reports**: HTML, JSON, JUnit
- **Screenshots**: Solo en fallos
- **Videos**: Solo en fallos

## Escribir Tests

### Tests Unitarios - Ejemplo
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
```

### Tests E2E - Ejemplo
```typescript
import { test, expect } from '@playwright/test';

test('should complete assessment flow', async ({ page }) => {
  await page.goto('/assessments/moca');
  await page.click('button:has-text("Comenzar")');
  
  // Complete assessment...
  
  await expect(page.locator('text=Resultados')).toBeVisible();
});
```

### Tests de Accesibilidad - Ejemplo
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/dashboard');
  
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## Mejores Prácticas

### Tests Unitarios
1. **Aislamiento**: Cada test debe ser independiente
2. **Mocking**: Mock dependencias externas (APIs, servicios)
3. **Descriptivos**: Nombres de tests claros y descriptivos
4. **AAA Pattern**: Arrange, Act, Assert

### Tests E2E
1. **Datos de Test**: Usar datos de test consistentes
2. **Selectores**: Usar selectores estables (data-testid)
3. **Esperas**: Usar esperas explícitas, no timeouts fijos
4. **Limpieza**: Limpiar estado entre tests

### Tests de Accesibilidad
1. **WCAG Compliance**: Verificar niveles A, AA
2. **Keyboard Navigation**: Probar navegación por teclado
3. **Screen Readers**: Verificar compatibilidad
4. **Color Contrast**: Validar contraste de colores

## Datos de Test

### Usuario de Test
- **Email**: `test@neuralhack.com`
- **Password**: `TestPassword123!`
- **Edad**: 45
- **Educación**: 16 años

### Configuración de Base de Datos
Los tests E2E usan una base de datos de test separada configurada en `global-setup.ts`.

## Debugging Tests

### Tests Unitarios
```bash
# Debug con VS Code
# Usar breakpoints en archivos .test.ts

# Debug con console.log
console.log('Debug info:', variable);
```

### Tests E2E
```bash
# Ejecutar en modo debug
npm run test:e2e -- --debug

# Ejecutar con headed browser
npm run test:e2e:headed

# Ver trace de fallos
npx playwright show-trace trace.zip
```

## CI/CD Integration

Los tests están configurados para ejecutarse en GitHub Actions:

1. **Tests Unitarios**: Se ejecutan en cada push
2. **Tests E2E**: Se ejecutan en PRs y main branch
3. **Coverage Reports**: Se generan y suben a codecov
4. **Accessibility Reports**: Se generan como artifacts

## Reportes

### Coverage Report
- **Ubicación**: `coverage/index.html`
- **Threshold**: 80% mínimo
- **Incluye**: Statements, Branches, Functions, Lines

### E2E Reports
- **HTML Report**: `playwright-report/index.html`
- **JSON Report**: `playwright-report/results.json`
- **Screenshots**: `test-results/`
- **Videos**: `test-results/`

## Troubleshooting

### Problemas Comunes

1. **Tests Flaky**: Usar esperas explícitas
2. **Timeouts**: Aumentar timeout en configuración
3. **Selectores**: Usar selectores más específicos
4. **Estado**: Limpiar estado entre tests

### Logs Útiles
```bash
# Ver logs detallados de Playwright
DEBUG=pw:api npm run test:e2e

# Ver logs de red
DEBUG=pw:api,pw:browser npm run test:e2e
```

## Contribuir

1. Escribir tests para nuevas funcionalidades
2. Mantener coverage > 80%
3. Seguir convenciones de naming
4. Documentar tests complejos
5. Revisar tests en PRs