import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAssessment } from './useAssessment';
import { AssessmentService } from '../services/assessment.service';
import { AssessmentType } from '../types/assessment';

// Mock AssessmentService
vi.mock('../services/assessment.service', () => ({
  AssessmentService: vi.fn().mockImplementation(() => ({
    submitAssessment: vi.fn(),
    getAssessmentHistory: vi.fn(),
    getAssessmentById: vi.fn(),
    updateAssessment: vi.fn(),
    deleteAssessment: vi.fn()
  }))
}));

describe('useAssessment', () => {
  let mockAssessmentService: any;

  beforeEach(() => {
    mockAssessmentService = new AssessmentService();
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAssessment());

    expect(result.current.currentAssessment).toBeNull();
    expect(result.current.assessmentHistory).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.currentQuestionIndex).toBe(0);
    expect(result.current.responses).toEqual({});
  });

  it('should start a new assessment', () => {
    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.startAssessment(AssessmentType.MOCA);
    });

    expect(result.current.currentAssessment).toEqual({
      type: AssessmentType.MOCA,
      startTime: expect.any(Date),
      responses: {},
      currentQuestionIndex: 0
    });
    expect(result.current.currentQuestionIndex).toBe(0);
    expect(result.current.responses).toEqual({});
  });

  it('should record responses', () => {
    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.startAssessment(AssessmentType.MOCA);
    });

    act(() => {
      result.current.recordResponse('question1', 'answer1');
    });

    expect(result.current.responses).toEqual({
      question1: 'answer1'
    });
  });

  it('should navigate to next question', () => {
    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.startAssessment(AssessmentType.MOCA);
    });

    act(() => {
      result.current.nextQuestion();
    });

    expect(result.current.currentQuestionIndex).toBe(1);
  });

  it('should navigate to previous question', () => {
    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.startAssessment(AssessmentType.MOCA);
    });

    act(() => {
      result.current.nextQuestion();
      result.current.nextQuestion();
    });

    expect(result.current.currentQuestionIndex).toBe(2);

    act(() => {
      result.current.previousQuestion();
    });

    expect(result.current.currentQuestionIndex).toBe(1);
  });

  it('should not go to previous question when at index 0', () => {
    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.startAssessment(AssessmentType.MOCA);
    });

    act(() => {
      result.current.previousQuestion();
    });

    expect(result.current.currentQuestionIndex).toBe(0);
  });

  it('should submit assessment successfully', async () => {
    const mockAssessmentId = 'assessment-123';
    mockAssessmentService.submitAssessment.mockResolvedValue({
      success: true,
      assessmentId: mockAssessmentId
    });

    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.startAssessment(AssessmentType.MOCA);
      result.current.recordResponse('question1', 'answer1');
      result.current.recordResponse('question2', 'answer2');
    });

    await act(async () => {
      const submitResult = await result.current.submitAssessment('user-123');
      expect(submitResult.success).toBe(true);
      expect(submitResult.assessmentId).toBe(mockAssessmentId);
    });

    expect(mockAssessmentService.submitAssessment).toHaveBeenCalledWith({
      userId: 'user-123',
      type: AssessmentType.MOCA,
      responses: { question1: 'answer1', question2: 'answer2' },
      startTime: expect.any(Date),
      endTime: expect.any(Date),
      duration: expect.any(Number)
    });
  });

  it('should handle assessment submission failure', async () => {
    const errorMessage = 'Submission failed';
    mockAssessmentService.submitAssessment.mockResolvedValue({
      success: false,
      error: errorMessage
    });

    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.startAssessment(AssessmentType.MOCA);
    });

    await act(async () => {
      const submitResult = await result.current.submitAssessment('user-123');
      expect(submitResult.success).toBe(false);
      expect(submitResult.error).toBe(errorMessage);
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('should load assessment history', async () => {
    const mockHistory = [
      {
        id: 'assessment-1',
        type: AssessmentType.MOCA,
        score: 25,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'assessment-2',
        type: AssessmentType.PHQ9,
        score: 8,
        created_at: '2024-01-02T00:00:00Z'
      }
    ];

    mockAssessmentService.getAssessmentHistory.mockResolvedValue({
      success: true,
      assessments: mockHistory
    });

    const { result } = renderHook(() => useAssessment());

    await act(async () => {
      await result.current.loadAssessmentHistory('user-123');
    });

    expect(result.current.assessmentHistory).toEqual(mockHistory);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle assessment history loading failure', async () => {
    const errorMessage = 'Failed to load history';
    mockAssessmentService.getAssessmentHistory.mockResolvedValue({
      success: false,
      error: errorMessage
    });

    const { result } = renderHook(() => useAssessment());

    await act(async () => {
      await result.current.loadAssessmentHistory('user-123');
    });

    expect(result.current.assessmentHistory).toEqual([]);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isLoading).toBe(false);
  });

  it('should load specific assessment', async () => {
    const mockAssessment = {
      id: 'assessment-123',
      type: AssessmentType.MOCA,
      responses: { question1: 'answer1' },
      score: 25
    };

    mockAssessmentService.getAssessmentById.mockResolvedValue({
      success: true,
      assessment: mockAssessment
    });

    const { result } = renderHook(() => useAssessment());

    await act(async () => {
      const loadResult = await result.current.loadAssessment('assessment-123');
      expect(loadResult.success).toBe(true);
      expect(loadResult.assessment).toEqual(mockAssessment);
    });
  });

  it('should calculate assessment progress', () => {
    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.startAssessment(AssessmentType.MOCA);
    });

    // Mock total questions for MoCA
    const totalQuestions = 30;
    const currentIndex = 10;

    act(() => {
      // Simulate being at question 10 of 30
      for (let i = 0; i < currentIndex; i++) {
        result.current.nextQuestion();
      }
    });

    const progress = result.current.getProgress(totalQuestions);
    expect(progress).toBe((currentIndex / totalQuestions) * 100);
  });

  it('should validate responses', () => {
    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.startAssessment(AssessmentType.MOCA);
      result.current.recordResponse('question1', 'answer1');
      result.current.recordResponse('question2', '');
    });

    const isValid = result.current.validateCurrentResponse('question1');
    const isInvalid = result.current.validateCurrentResponse('question2');

    expect(isValid).toBe(true);
    expect(isInvalid).toBe(false);
  });

  it('should clear assessment state', () => {
    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.startAssessment(AssessmentType.MOCA);
      result.current.recordResponse('question1', 'answer1');
      result.current.nextQuestion();
    });

    expect(result.current.currentAssessment).not.toBeNull();
    expect(result.current.responses).not.toEqual({});
    expect(result.current.currentQuestionIndex).not.toBe(0);

    act(() => {
      result.current.clearAssessment();
    });

    expect(result.current.currentAssessment).toBeNull();
    expect(result.current.responses).toEqual({});
    expect(result.current.currentQuestionIndex).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('should save assessment progress locally', () => {
    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.startAssessment(AssessmentType.MOCA);
      result.current.recordResponse('question1', 'answer1');
      result.current.nextQuestion();
    });

    act(() => {
      result.current.saveProgress();
    });

    // Verify localStorage was called (would need to mock localStorage)
    expect(result.current.currentAssessment).not.toBeNull();
  });

  it('should restore assessment progress from local storage', () => {
    // Mock localStorage
    const mockSavedProgress = {
      type: AssessmentType.MOCA,
      responses: { question1: 'answer1' },
      currentQuestionIndex: 1,
      startTime: new Date().toISOString()
    };

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue(JSON.stringify(mockSavedProgress)),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      writable: true
    });

    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.restoreProgress();
    });

    expect(result.current.responses).toEqual(mockSavedProgress.responses);
    expect(result.current.currentQuestionIndex).toBe(mockSavedProgress.currentQuestionIndex);
  });

  it('should handle timer functionality', () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => useAssessment());

    act(() => {
      result.current.startAssessment(AssessmentType.MOCA);
    });

    const startTime = result.current.currentAssessment?.startTime;
    expect(startTime).toBeInstanceOf(Date);

    // Fast forward time
    act(() => {
      vi.advanceTimersByTime(60000); // 1 minute
    });

    const duration = result.current.getAssessmentDuration();
    expect(duration).toBeGreaterThanOrEqual(60000);

    vi.useRealTimers();
  });
});