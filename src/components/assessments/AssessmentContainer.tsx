import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonButtons,
  IonIcon,
  IonProgressBar,
  IonAlert,
  IonToast,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonSpinner,
  IonFooter,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import {
  arrowBack,
  arrowForward,
  save,
  pause,
  play,
  checkmark,
  warning,
  time
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { useAssessment } from '../../hooks/useAssessment';
import { 
  Question, 
  TestResponse, 
  AssessmentProgress, 
  ValidationResult,
  TestType,
  AssessmentSession
} from '../../types/assessment';
import { QuestionRenderer } from './QuestionRenderer';
import './AssessmentContainer.css';

interface AssessmentContainerProps {
  testType: TestType;
  sessionId?: string;
  onComplete: (sessionId: string) => void;
  onExit: () => void;
  onError: (error: Error) => void;
}

export const AssessmentContainer: React.FC<AssessmentContainerProps> = ({
  testType,
  sessionId: initialSessionId,
  onComplete,
  onExit,
  onError
}) => {
  const { t } = useTranslation();
  const {
    currentSession,
    currentQuestion,
    progress,
    isLoading,
    error,
    createSession,
    getCurrentQuestion,
    submitResponse,
    validateResponse,
    navigateToNext,
    navigateToPrevious,
    saveProgress,
    completeAssessment
  } = useAssessment();

  // Component state
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showExitAlert, setShowExitAlert] = useState(false);
  const [showTimeoutAlert, setShowTimeoutAlert] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Refs for timers
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        if (!sessionId) {
          const newSessionId = await createSession(testType);
          setSessionId(newSessionId);
        } else {
          await getCurrentQuestion(sessionId);
        }
      } catch (err) {
        onError(err as Error);
      }
    };

    initializeSession();
  }, [testType, sessionId, createSession, getCurrentQuestion, onError]);

  // Setup question timer
  useEffect(() => {
    if (currentQuestion?.timeLimit && !isPaused) {
      setTimeRemaining(currentQuestion.timeLimit);
      
      questionTimerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (questionTimerRef.current) {
          clearInterval(questionTimerRef.current);
        }
      };
    }
  }, [currentQuestion, isPaused]);

  // Setup auto-save
  useEffect(() => {
    if (autoSaveEnabled && sessionId && !isPaused) {
      autoSaveTimerRef.current = setInterval(() => {
        handleAutoSave();
      }, 30000); // Auto-save every 30 seconds

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [autoSaveEnabled, sessionId, isPaused]);

  // Handle visibility change (pause when tab is not active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handlePause();
      } else {
        handleResume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
      if (timeUpdateTimerRef.current) clearInterval(timeUpdateTimerRef.current);
    };
  }, []);

  const handleAnswerChange = useCallback((answer: any) => {
    setCurrentAnswer(answer);
    setValidationErrors([]);
  }, []);

  const handleValidateAndNext = useCallback(async () => {
    if (!sessionId || !currentQuestion) return;

    try {
      // Validate current answer
      const validation: ValidationResult = await validateResponse(currentQuestion.id, currentAnswer);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      // Submit response
      const response: TestResponse = {
        questionId: currentQuestion.id,
        answer: currentAnswer,
        timestamp: new Date(),
        responseTime: currentQuestion.timeLimit ? 
          (currentQuestion.timeLimit - (timeRemaining || 0)) : 0,
        metadata: {
          isPaused: isPaused,
          timeRemaining: timeRemaining
        }
      };

      await submitResponse(sessionId, response);

      // Navigate to next question
      const hasNext = await navigateToNext(sessionId);
      
      if (!hasNext) {
        // Assessment completed
        await completeAssessment(sessionId);
        onComplete(sessionId);
      } else {
        // Reset for next question
        setCurrentAnswer(null);
        setValidationErrors([]);
        setTimeRemaining(null);
      }
    } catch (err) {
      onError(err as Error);
    }
  }, [sessionId, currentQuestion, currentAnswer, timeRemaining, isPaused, validateResponse, submitResponse, navigateToNext, completeAssessment, onComplete, onError]);

  const handlePrevious = useCallback(async () => {
    if (!sessionId || !progress?.canGoBack) return;

    try {
      await navigateToPrevious(sessionId);
      setCurrentAnswer(null);
      setValidationErrors([]);
      setTimeRemaining(null);
    } catch (err) {
      onError(err as Error);
    }
  }, [sessionId, progress, navigateToPrevious, onError]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    // Timer will be restarted by useEffect
  }, []);

  const handleAutoSave = useCallback(async () => {
    if (!sessionId) return;

    try {
      await saveProgress(sessionId);
      setShowSaveToast(true);
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  }, [sessionId, saveProgress]);

  const handleTimeOut = useCallback(() => {
    setShowTimeoutAlert(true);
    handlePause();
  }, [handlePause]);

  const handleTimeoutContinue = useCallback(() => {
    setShowTimeoutAlert(false);
    handleValidateAndNext();
  }, [handleValidateAndNext]);

  const handleExit = useCallback(() => {
    setShowExitAlert(true);
  }, []);

  const handleConfirmExit = useCallback(async () => {
    if (sessionId && autoSaveEnabled) {
      try {
        await saveProgress(sessionId);
      } catch (err) {
        console.error('Failed to save progress on exit:', err);
      }
    }
    onExit();
  }, [sessionId, autoSaveEnabled, saveProgress, onExit]);

  // Loading state
  if (isLoading || !currentQuestion || !progress) {
    return (
      <IonContent className="assessment-loading">
        <div className="loading-container">
          <IonSpinner name="crescent" />
          <IonText>
            <p>{t('assessment.loading')}</p>
          </IonText>
        </div>
      </IonContent>
    );
  }

  // Error state
  if (error) {
    return (
      <IonContent className="assessment-error">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle color="danger">
              <IonIcon icon={warning} /> {t('assessment.error.title')}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>{typeof error === 'string' ? error : (error as any)?.message || 'Error desconocido'}</p>
            <IonButton fill="clear" onClick={onExit}>
              {t('common.goBack')}
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    );
  }

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t(`assessments.${testType}.name`)}</IonTitle>
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={handleExit}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            {isPaused ? (
              <IonButton fill="clear" onClick={handleResume}>
                <IonIcon icon={play} />
              </IonButton>
            ) : (
              <IonButton fill="clear" onClick={handlePause}>
                <IonIcon icon={pause} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
        
        {/* Progress bar */}
        <IonProgressBar 
          value={progress.percentComplete / 100} 
          color="primary"
        />
        
        {/* Time remaining indicator */}
        {timeRemaining !== null && (
          <div className="time-indicator">
            <IonIcon icon={time} />
            <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
          </div>
        )}
      </IonHeader>

      <IonContent className="assessment-content">
        {isPaused && (
          <div className="pause-overlay">
            <IonCard>
              <IonCardContent>
                <div className="pause-content">
                  <IonIcon icon={pause} size="large" />
                  <h2>{t('assessment.paused.title')}</h2>
                  <p>{t('assessment.paused.message')}</p>
                  <IonButton onClick={handleResume}>
                    <IonIcon icon={play} slot="start" />
                    {t('assessment.paused.resume')}
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        <div className="question-container">
          {/* Progress info */}
          <div className="progress-info">
            <IonText color="medium">
              <p>
                {t('assessment.progress.question', {
                  current: progress.answeredQuestions + 1,
                  total: progress.totalQuestions
                })}
              </p>
              <p>
                {t('assessment.progress.section', { section: progress.currentSection })}
              </p>
            </IonText>
          </div>

          {/* Question renderer */}
          <QuestionRenderer
            question={currentQuestion}
            value={currentAnswer}
            onChange={handleAnswerChange}
            errors={validationErrors}
            disabled={isPaused}
          />
        </div>
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <IonGrid>
            <IonRow>
              <IonCol size="4">
                <IonButton
                  fill="clear"
                  disabled={!progress.canGoBack || isPaused}
                  onClick={handlePrevious}
                >
                  <IonIcon icon={arrowBack} slot="start" />
                  {t('common.previous')}
                </IonButton>
              </IonCol>
              <IonCol size="4" className="ion-text-center">
                <IonButton
                  fill="clear"
                  onClick={handleAutoSave}
                  disabled={isPaused}
                >
                  <IonIcon icon={save} />
                </IonButton>
              </IonCol>
              <IonCol size="4" className="ion-text-right">
                <IonButton
                  color="primary"
                  disabled={isPaused}
                  onClick={handleValidateAndNext}
                >
                  {progress.answeredQuestions + 1 === progress.totalQuestions ? (
                    <>
                      <IonIcon icon={checkmark} slot="start" />
                      {t('assessment.complete')}
                    </>
                  ) : (
                    <>
                      {t('common.next')}
                      <IonIcon icon={arrowForward} slot="end" />
                    </>
                  )}
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonToolbar>
      </IonFooter>

      {/* Exit confirmation alert */}
      <IonAlert
        isOpen={showExitAlert}
        onDidDismiss={() => setShowExitAlert(false)}
        header={t('assessment.exit.title')}
        message={t('assessment.exit.message')}
        buttons={[
          {
            text: t('common.cancel'),
            role: 'cancel'
          },
          {
            text: t('assessment.exit.confirm'),
            handler: handleConfirmExit
          }
        ]}
      />

      {/* Timeout alert */}
      <IonAlert
        isOpen={showTimeoutAlert}
        onDidDismiss={() => setShowTimeoutAlert(false)}
        header={t('assessment.timeout.title')}
        message={t('assessment.timeout.message')}
        buttons={[
          {
            text: t('assessment.timeout.continue'),
            handler: handleTimeoutContinue
          }
        ]}
      />

      {/* Auto-save toast */}
      <IonToast
        isOpen={showSaveToast}
        onDidDismiss={() => setShowSaveToast(false)}
        message={t('assessment.autoSave.success')}
        duration={2000}
        position="top"
        color="success"
      />
    </>
  );
};