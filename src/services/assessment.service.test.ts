import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssessmentService } from './assessment.service';
import { supabase } from './supabase';
import { AssessmentType } from '../types/assessment';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn()
    }))
  }
}));

describe('AssessmentService', () => {
  let assessmentService: AssessmentService;

  beforeEach(() => {
    assessmentService = new AssessmentService();
    vi.clearAllMocks();
  });

  describe('submitAssessment', () => {
    it('should submit assessment successfully', async () => {
      const mockChain = {
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'assessment-123' }],
          error: null
        })
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue(mockChain),
        select: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        order: vi.fn(),
        limit: vi.fn()
      } as any);

      const assessmentData = {
        userId: 'user-123',
        type: AssessmentType.MOCA,
        responses: { section1: 10, section2: 15 },
        score: 25,
        riskLevel: 'low',
        duration: 600
      };

      const result = await assessmentService.submitAssessment(assessmentData);

      expect(result.success).toBe(true);
      expect(result.assessmentId).toBe('assessment-123');
    });

    it('should handle submission errors', async () => {
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
        order: vi.fn(),
        limit: vi.fn()
      } as any);

      const assessmentData = {
        userId: 'user-123',
        type: AssessmentType.MOCA,
        responses: { section1: 10, section2: 15 },
        score: 25,
        riskLevel: 'low',
        duration: 600
      };

      const result = await assessmentService.submitAssessment(assessmentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error.message);
    });
  });

  describe('getAssessmentHistory', () => {
    it('should retrieve assessment history', async () => {
      const mockAssessments = [
        {
          id: 'assessment-1',
          type: 'moca',
          score: 25,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'assessment-2',
          type: 'phq9',
          score: 8,
          created_at: '2024-01-02T00:00:00Z'
        }
      ];

      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockAssessments,
          error: null
        })
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        order: vi.fn(),
        limit: vi.fn()
      } as any);

      const result = await assessmentService.getAssessmentHistory('user-123');

      expect(result.success).toBe(true);
      expect(result.assessments).toEqual(mockAssessments);
      expect(result.assessments).toHaveLength(2);
    });

    it('should handle history retrieval errors', async () => {
      const error = new Error('Database error');
      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
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
        order: vi.fn(),
        limit: vi.fn()
      } as any);

      const result = await assessmentService.getAssessmentHistory('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe(error.message);
    });
  });

  describe('getAssessmentById', () => {
    it('should retrieve specific assessment', async () => {
      const mockAssessment = {
        id: 'assessment-123',
        type: 'moca',
        responses: { section1: 10, section2: 15 },
        score: 25,
        risk_level: 'low'
      };

      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockAssessment,
          error: null
        })
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        order: vi.fn(),
        limit: vi.fn()
      } as any);

      const result = await assessmentService.getAssessmentById('assessment-123');

      expect(result.success).toBe(true);
      expect(result.assessment).toEqual(mockAssessment);
    });
  });

  describe('updateAssessment', () => {
    it('should update assessment successfully', async () => {
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
        order: vi.fn(),
        limit: vi.fn()
      } as any);

      const updateData = {
        notes: 'Updated assessment notes',
        reviewed: true
      };

      const result = await assessmentService.updateAssessment('assessment-123', updateData);

      expect(result.success).toBe(true);
    });
  });

  describe('deleteAssessment', () => {
    it('should delete assessment successfully', async () => {
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
        order: vi.fn(),
        limit: vi.fn()
      } as any);

      const result = await assessmentService.deleteAssessment('assessment-123');

      expect(result.success).toBe(true);
    });
  });

  describe('getAssessmentStats', () => {
    it('should calculate assessment statistics', async () => {
      const mockAssessments = [
        { score: 25, type: 'moca', created_at: '2024-01-01' },
        { score: 27, type: 'moca', created_at: '2024-01-02' },
        { score: 8, type: 'phq9', created_at: '2024-01-01' },
        { score: 6, type: 'phq9', created_at: '2024-01-02' }
      ];

      const mockChain = {
        eq: vi.fn().mockResolvedValue({
          data: mockAssessments,
          error: null
        })
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockChain),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        order: vi.fn(),
        limit: vi.fn()
      } as any);

      const result = await assessmentService.getAssessmentStats('user-123');

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.totalAssessments).toBe(4);
      expect(result.stats.averageScores).toBeDefined();
    });
  });
});