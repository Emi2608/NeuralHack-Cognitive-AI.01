import { useState, useEffect, useCallback } from 'react';
import { AssessmentService } from '../services/service.factory';
import type { 
  AssessmentSession,
  TestType,
  Question,
  TestResponse,
  AssessmentResult,
  AssessmentProgress,
  ValidationResult
} from '../types/assessment';
import { useAuth } from './useAuth';

interface AssessmentState {
  session: AssessmentSession | null;
  currentQuestion: Question | null;
  progress: AssessmentProgress | null;
  result: AssessmentResult | null;
  loading: boolean;
  error: string | null;
  isCompleted: boolean;
  canGoBack: boolean;
  canGoNext: boolean;
}

export const useAssessment = (sessionId?: string) => {
  const { user } = useAuth();
  
  const [state, setState] = useState<AssessmentState>({
    session: null,
    currentQuestion: null,
    progress: null,
    result: null,
    loading: false,
    error: null,
    isCompleted: false,
    canGoBack: false,
    canGoNext: false
  });

  // Auto-save timer
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Load session data
  const loadSession = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const session = await AssessmentService.getSession(id);
      if (!session) {
        throw new Error('Sesión de evaluación no encontrada');
      }

      const currentQuestion = await AssessmentService.getCurrentQuestion(id);
      const progress = await AssessmentService.getProgress(id);

      setState(prev => ({
        ...prev,
        session,
        currentQuestion,
        progress,
        isCompleted: session.status === 'completed',
        canGoBack: session.currentQuestionIndex > 0,
        canGoNext: currentQuestion !== null,
        loading: false
      }));

      // Load result if completed
      if (session.status === 'completed' && session.result) {
        setState(prev => ({ ...prev, result: session.result! }));
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar la evaluación'
      }));
    }
  }, []);

  // Initialize session
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);

  // Auto-save functionality
  useEffect(() => {
    if (state.session && state.session.status === 'in_progress') {
      // Clear existing timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      // Set new timer for auto-save every 30 seconds
      const timer = setTimeout(() => {
        AssessmentService.saveProgress(state.session!.id);
      }, 30000);

      setAutoSaveTimer(timer);

      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }
  }, [state.session, autoSaveTimer]);

  // Start new assessment
  const startAssessment = useCallback(async (testType: TestType): Promise<string> => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const session = await AssessmentService.createSession(user.id, testType);
      const currentQuestion = await AssessmentService.getCurrentQuestion(session.id);
      const progress = await AssessmentService.getProgress(session.id);

      setState(prev => ({
        ...prev,
        session,
        currentQuestion,
        progress,
        isCompleted: false,
        canGoBack: false,
        canGoNext: currentQuestion !== null,
        loading: false
      }));

      return session.id;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al iniciar la evaluación'
      }));
      throw error;
    }
  }, [user]);

  // Submit response
  const submitResponse = useCallback(async (answer: any): Promise<void> => {
    if (!state.session || !state.currentQuestion) {
      throw new Error('No hay sesión activa o pregunta actual');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response: TestResponse = {
        questionId: state.currentQuestion.id,
        answer,
        timestamp: new Date(),
        responseTime: Date.now() - (state.session?.lastActivityAt.getTime() || Date.now())
      };

      await AssessmentService.submitResponse(state.session.id, response);

      // Reload session data
      await loadSession(state.session.id);

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al enviar respuesta'
      }));
      throw error;
    }
  }, [state.session, state.currentQuestion, loadSession]);

  // Go to next question
  const goToNext = useCallback(async (): Promise<void> => {
    if (!state.session) {
      throw new Error('No hay sesión activa');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const nextQuestion = await AssessmentService.getNextQuestion(state.session.id);
      
      if (nextQuestion) {
        // Update session to move to next question
        await AssessmentService.updateSession(state.session.id, {
          currentQuestionIndex: state.session.currentQuestionIndex + 1
        });

        // Reload session data
        await loadSession(state.session.id);
      } else {
        // Assessment completed
        setState(prev => ({ ...prev, isCompleted: true, loading: false }));
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al avanzar'
      }));
    }
  }, [state.session, loadSession]);

  // Go to previous question
  const goToPrevious = useCallback(async (): Promise<void> => {
    if (!state.session || state.session.currentQuestionIndex <= 0) {
      throw new Error('No se puede retroceder');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Update session to move to previous question
      await AssessmentService.updateSession(state.session.id, {
        currentQuestionIndex: state.session.currentQuestionIndex - 1
      });

      // Reload session data
      await loadSession(state.session.id);

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al retroceder'
      }));
    }
  }, [state.session, loadSession]);

  // Complete assessment and calculate score
  const completeAssessment = useCallback(async (): Promise<AssessmentResult> => {
    if (!state.session) {
      throw new Error('No hay sesión activa');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await AssessmentService.calculateScore(state.session.id);
      
      setState(prev => ({
        ...prev,
        result,
        isCompleted: true,
        loading: false
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al completar la evaluación'
      }));
      throw error;
    }
  }, [state.session]);

  // Validate response
  const validateResponse = useCallback(async (answer: any): Promise<ValidationResult> => {
    if (!state.currentQuestion) {
      return { isValid: false, errors: ['No hay pregunta actual'] };
    }

    try {
      return await AssessmentService.validateResponse(state.currentQuestion.id, answer);
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Error de validación']
      };
    }
  }, [state.currentQuestion]);

  // Pause assessment
  const pauseAssessment = useCallback(async (): Promise<void> => {
    if (!state.session) return;

    try {
      // Add interruption record
      const interruption = {
        type: 'pause' as const,
        timestamp: new Date(),
        reason: 'user_initiated'
      };

      const updatedMetadata = {
        ...state.session.metadata,
        interruptions: [...state.session.metadata.interruptions, interruption]
      };

      await AssessmentService.updateSession(state.session.id, {
        metadata: updatedMetadata
      });

    } catch (error) {
      console.error('Error pausing assessment:', error);
    }
  }, [state.session]);

  // Resume assessment
  const resumeAssessment = useCallback(async (): Promise<void> => {
    if (!state.session) return;

    try {
      // Add resume interruption record
      const interruption = {
        type: 'resume' as const,
        timestamp: new Date(),
        reason: 'user_initiated'
      };

      const updatedMetadata = {
        ...state.session.metadata,
        interruptions: [...state.session.metadata.interruptions, interruption]
      };

      await AssessmentService.updateSession(state.session.id, {
        metadata: updatedMetadata
      });

      // Reload session data
      await loadSession(state.session.id);

    } catch (error) {
      console.error('Error resuming assessment:', error);
    }
  }, [state.session, loadSession]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Get available tests
  const getAvailableTests = useCallback(async () => {
    try {
      return await AssessmentService.getAvailableTests();
    } catch (error) {
      console.error('Error getting available tests:', error);
      return [];
    }
  }, []);

  return {
    // State
    session: state.session,
    currentQuestion: state.currentQuestion,
    progress: state.progress,
    result: state.result,
    loading: state.loading,
    error: state.error,
    isCompleted: state.isCompleted,
    canGoBack: state.canGoBack,
    canGoNext: state.canGoNext,

    // Actions
    startAssessment,
    submitResponse,
    goToNext,
    goToPrevious,
    completeAssessment,
    validateResponse,
    pauseAssessment,
    resumeAssessment,
    clearError,
    getAvailableTests,

    // Utilities
    loadSession
  };
};