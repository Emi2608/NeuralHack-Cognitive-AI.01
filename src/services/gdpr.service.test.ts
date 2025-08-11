import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GDPRService } from './gdpr.service';
import { supabase } from './supabase';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      order: vi.fn()
    }))
  }
}));

describe('GDPRService', () => {
  let gdprService: GDPRService;

  beforeEach(() => {
    gdprService = new GDPRService();
    vi.clearAllMocks();
  });

  describe('recordConsent', () => {
    it('should record user consent successfully', async () => {
      const mockChain = {
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'consent-123' }],
          error: null
        })
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue(mockChain),
        select: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        order: vi.fn()
      } as any);

      const consentData = {
        userId: 'user-123',
        consentType: 'data_processing',
        granted: true,
        version: '1.0'
      };

      const result = await gdprService.recordConsent(consentData);

      expect(result.success).toBe(true);
      expect(result.consentId).toBe('consent-123');
    });

    it('should handle consent recording errors', async () => {
      const error = new Error('Database error');
      const mockChain = {
        select: vi.fn().mockResolvedValue({
          data: null,
          error
        })
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue(mockChain),
        select: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        order: vi.fn()
      } as any);

      const consentData = {
        userId: 'user-123',
        consentType: 'data_processing',
        granted: true,
        version: '1.0'
      };

      const result = await gdprService.recordConsent(consentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error.message);
    });
  });

  describe('exportUserData', () => {
    it('should export all user data', async () => {
      const mockUserData = {
        profile: { id: 'user-123', email: 'test@example.com' },
        assessments: [{ id: 'assessment-1', score: 25 }],
        consents: [{ id: 'consent-1', granted: true }]
      };

      // Mock multiple table queries
      const mockProfileChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUserData.profile,
          error: null
        })
      };

      const mockAssessmentsChain = {
        eq: vi.fn().mockResolvedValue({
          data: mockUserData.assessments,
          error: null
        })
      };

      const mockConsentsChain = {
        eq: vi.fn().mockResolvedValue({
          data: mockUserData.consents,
          error: null
        })
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockProfileChain),
          insert: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
          eq: vi.fn(),
          order: vi.fn()
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockAssessmentsChain),
          insert: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
          eq: vi.fn(),
          order: vi.fn()
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockConsentsChain),
          insert: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
          eq: vi.fn(),
          order: vi.fn()
        } as any);

      const result = await gdprService.exportUserData('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.profile).toEqual(mockUserData.profile);
      expect(result.data.assessments).toEqual(mockUserData.assessments);
      expect(result.data.consents).toEqual(mockUserData.consents);
    });

    it('should handle export errors', async () => {
      const error = new Error('Export failed');
      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error
        })
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        order: vi.fn()
      } as any);

      const result = await gdprService.exportUserData('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe(error.message);
    });
  });

  describe('anonymizeUserData', () => {
    it('should anonymize user data successfully', async () => {
      const mockChain = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue(mockChain),
        insert: vi.fn(),
        select: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        order: vi.fn()
      } as any);

      const result = await gdprService.anonymizeUserData('user-123');

      expect(result.success).toBe(true);
    });

    it('should handle anonymization errors', async () => {
      const error = new Error('Anonymization failed');
      const mockChain = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error
        })
      };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue(mockChain),
        insert: vi.fn(),
        select: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        order: vi.fn()
      } as any);

      const result = await gdprService.anonymizeUserData('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe(error.message);
    });
  });

  describe('deleteUserData', () => {
    it('should delete all user data (right to be forgotten)', async () => {
      const mockChain = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      };

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue(mockChain),
        insert: vi.fn(),
        select: vi.fn(),
        update: vi.fn(),
        eq: vi.fn(),
        order: vi.fn()
      } as any);

      const result = await gdprService.deleteUserData('user-123');

      expect(result.success).toBe(true);
    });

    it('should handle deletion errors', async () => {
      const error = new Error('Deletion failed');
      const mockChain = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error
        })
      };

      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue(mockChain),
        insert: vi.fn(),
        select: vi.fn(),
        update: vi.fn(),
        eq: vi.fn(),
        order: vi.fn()
      } as any);

      const result = await gdprService.deleteUserData('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe(error.message);
    });
  });

  describe('getConsentHistory', () => {
    it('should retrieve consent history', async () => {
      const mockConsents = [
        {
          id: 'consent-1',
          consent_type: 'data_processing',
          granted: true,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'consent-2',
          consent_type: 'marketing',
          granted: false,
          created_at: '2024-01-02T00:00:00Z'
        }
      ];

      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockConsents,
          error: null
        })
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        order: vi.fn()
      } as any);

      const result = await gdprService.getConsentHistory('user-123');

      expect(result.success).toBe(true);
      expect(result.consents).toEqual(mockConsents);
      expect(result.consents).toHaveLength(2);
    });
  });

  describe('updateConsent', () => {
    it('should update existing consent', async () => {
      const mockChain = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue(mockChain),
        insert: vi.fn(),
        select: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        order: vi.fn()
      } as any);

      const result = await gdprService.updateConsent('user-123', 'marketing', false);

      expect(result.success).toBe(true);
    });
  });

  describe('validateDataProcessingLawfulness', () => {
    it('should validate data processing is lawful', async () => {
      const mockConsents = [
        {
          consent_type: 'data_processing',
          granted: true,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockChain = {
        eq: vi.fn().mockResolvedValue({
          data: mockConsents,
          error: null
        })
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        order: vi.fn()
      } as any);

      const result = await gdprService.validateDataProcessingLawfulness('user-123');

      expect(result.isLawful).toBe(true);
      expect(result.basis).toBe('consent');
    });

    it('should identify unlawful data processing', async () => {
      const mockConsents = [
        {
          consent_type: 'data_processing',
          granted: false,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockChain = {
        eq: vi.fn().mockResolvedValue({
          data: mockConsents,
          error: null
        })
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        order: vi.fn()
      } as any);

      const result = await gdprService.validateDataProcessingLawfulness('user-123');

      expect(result.isLawful).toBe(false);
    });
  });
});