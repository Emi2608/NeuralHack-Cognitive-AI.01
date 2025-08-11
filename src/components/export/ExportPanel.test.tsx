import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExportPanel } from './ExportPanel';

// Mock dependencies
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' }
  })
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

vi.mock('../../services/export.service', () => ({
  ExportService: {
    exportAssessmentData: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('ExportPanel', () => {
  it('should render export panel with title', () => {
    render(<ExportPanel />);
    
    expect(screen.getByText('Exportar Datos de Evaluaciones')).toBeInTheDocument();
  });

  it('should render configuration button', () => {
    render(<ExportPanel />);
    
    expect(screen.getByText('Configurar Exportación')).toBeInTheDocument();
  });

  it('should show description text', () => {
    render(<ExportPanel />);
    
    expect(screen.getByText(/Descarga tus resultados de evaluaciones cognitivas/)).toBeInTheDocument();
  });
});