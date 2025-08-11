import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SharingPanel } from './SharingPanel';

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

vi.mock('../../services/sharing.service', () => ({
  SharingService: {
    createShareLink: vi.fn().mockResolvedValue({
      id: 'test-link',
      url: 'https://test.com/share/token',
      token: 'token',
      expiresAt: new Date(),
      accessCount: 0,
      isActive: true,
      createdAt: new Date()
    }),
    getUserShareLinks: vi.fn().mockResolvedValue([]),
    isWebShareSupported: vi.fn().mockReturnValue(true)
  }
}));

describe('SharingPanel', () => {
  it('should render sharing panel with title', () => {
    render(<SharingPanel assessmentIds={['test-1', 'test-2']} />);
    
    expect(screen.getByText('Compartir Resultados')).toBeInTheDocument();
  });

  it('should render configuration button', () => {
    render(<SharingPanel assessmentIds={['test-1', 'test-2']} />);
    
    expect(screen.getByText('Configurar Compartición')).toBeInTheDocument();
  });

  it('should show description text', () => {
    render(<SharingPanel assessmentIds={['test-1', 'test-2']} />);
    
    expect(screen.getByText(/Comparte tus resultados de evaluación de forma segura/)).toBeInTheDocument();
  });

  it('should show quick share button when Web Share API is supported', () => {
    render(<SharingPanel assessmentIds={['test-1', 'test-2']} />);
    
    expect(screen.getByText('Compartir Rápido')).toBeInTheDocument();
  });
});