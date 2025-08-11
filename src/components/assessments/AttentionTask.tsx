import React, { useState, useEffect, useCallback } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonIcon,
  IonProgressBar,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { 
  play, 
  pause, 
  refresh, 
  checkmark,
  time,
  eye,
  finger
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { Question } from '../../types/assessment';
import './AttentionTask.css';

interface AttentionTaskProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

interface AttentionTaskData {
  taskType: 'digit_span' | 'trail_making' | 'sustained_attention';
  phase: 'instruction' | 'practice' | 'test' | 'completed';
  currentSequence?: number[];
  userSequence?: number[];
  currentLevel?: number;
  correctResponses?: number;
  totalResponses?: number;
  reactionTimes?: number[];
  errors?: number;
  startTime?: number;
  completionTime?: number;
}

export const AttentionTask: React.FC<AttentionTaskProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const { t } = useTranslation();
  const [taskData, setTaskData] = useState<AttentionTaskData>(
    value || { 
      taskType: question.metadata?.taskType || 'digit_span',
      phase: 'instruction',
      currentLevel: 1,
      correctResponses: 0,
      totalResponses: 0,
      errors: 0
    }
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDigit, setCurrentDigit] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Task configuration
  const config = {
    digit_span: {
      startLevel: 3,
      maxLevel: 9,
      sequenceDelay: 1000, // ms between digits
      responseTime: 5000 // ms to respond
    },
    trail_making: {
      targets: 25,
      timeLimit: 300 // seconds
    },
    sustained_attention: {
      duration: 180, // seconds
      targetFrequency: 0.2 // 20% of stimuli are targets
    }
  };

  // Update parent component when task data changes
  useEffect(() => {
    onChange(taskData);
  }, [taskData, onChange]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !disabled) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, disabled]);

  const generateDigitSequence = useCallback((length: number): number[] => {
    return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
  }, []);

  const playDigitSequence = useCallback(async (sequence: number[]) => {
    setIsPlaying(true);
    
    for (let i = 0; i < sequence.length; i++) {
      setCurrentDigit(sequence[i]);
      await new Promise(resolve => setTimeout(resolve, config.digit_span.sequenceDelay));
      setCurrentDigit(null);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsPlaying(false);
    setTimeRemaining(config.digit_span.responseTime / 1000);
  }, []);

  const startDigitSpanTest = useCallback(() => {
    const level = taskData.currentLevel || config.digit_span.startLevel;
    const sequence = generateDigitSequence(level);
    
    setTaskData(prev => ({
      ...prev,
      phase: 'test',
      currentSequence: sequence,
      userSequence: [],
      startTime: Date.now()
    }));
    
    playDigitSequence(sequence);
  }, [taskData.currentLevel, generateDigitSequence, playDigitSequence]);

  const addDigitToSequence = useCallback((digit: number) => {
    if (isPlaying || disabled) return;
    
    const userSequence = [...(taskData.userSequence || []), digit];
    setTaskData(prev => ({
      ...prev,
      userSequence
    }));
  }, [isPlaying, disabled, taskData.userSequence]);

  const removeLastDigit = useCallback(() => {
    if (isPlaying || disabled) return;
    
    const userSequence = (taskData.userSequence || []).slice(0, -1);
    setTaskData(prev => ({
      ...prev,
      userSequence
    }));
  }, [isPlaying, disabled, taskData.userSequence]);

  const submitDigitSequence = useCallback(() => {
    const isCorrect = JSON.stringify(taskData.currentSequence) === JSON.stringify(taskData.userSequence);
    const newLevel = isCorrect ? (taskData.currentLevel || 3) + 1 : (taskData.currentLevel || 3);
    
    setTaskData(prev => ({
      ...prev,
      correctResponses: (prev.correctResponses || 0) + (isCorrect ? 1 : 0),
      totalResponses: (prev.totalResponses || 0) + 1,
      currentLevel: newLevel,
      errors: (prev.errors || 0) + (isCorrect ? 0 : 1),
      phase: newLevel > config.digit_span.maxLevel ? 'completed' : 'test'
    }));

    if (newLevel <= config.digit_span.maxLevel) {
      setTimeout(() => startDigitSpanTest(), 2000);
    }
  }, [taskData, startDigitSpanTest]);

  const renderInstructionPhase = () => (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          {t(`attentionTask.${taskData.taskType}.title`)}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="instruction-content">
          <IonText>
            <p>{t(`attentionTask.${taskData.taskType}.instruction`)}</p>
            <p>{t(`attentionTask.${taskData.taskType}.example`)}</p>
          </IonText>
          
          <IonButton 
            expand="block" 
            onClick={() => setTaskData(prev => ({ ...prev, phase: 'practice' }))}
            disabled={disabled}
          >
            {t('attentionTask.startPractice')}
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  );

  const renderDigitSpanTest = () => (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={eye} /> {t('attentionTask.digit_span.title')}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="digit-span-content">
          {/* Level indicator */}
          <div className="level-indicator">
            <IonText>
              <h3>{t('attentionTask.level', { level: taskData.currentLevel })}</h3>
            </IonText>
          </div>

          {/* Current digit display */}
          {isPlaying && (
            <div className="digit-display">
              <div className="current-digit">
                {currentDigit}
              </div>
              <IonText color="medium">
                <p>{t('attentionTask.digit_span.watching')}</p>
              </IonText>
            </div>
          )}

          {/* Response phase */}
          {!isPlaying && taskData.phase === 'test' && (
            <div className="response-phase">
              <div className="timer-display">
                <IonIcon icon={time} />
                <span>{timeRemaining}s</span>
              </div>

              <IonText>
                <p>{t('attentionTask.digit_span.enterSequence')}</p>
              </IonText>

              {/* User sequence display */}
              <div className="user-sequence">
                {(taskData.userSequence || []).map((digit, index) => (
                  <span key={index} className="sequence-digit">
                    {digit}
                  </span>
                ))}
              </div>

              {/* Number pad */}
              <IonGrid className="number-pad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                  <IonRow key={Math.ceil(digit / 3)}>
                    {[1, 2, 3].map(col => {
                      const num = (Math.ceil(digit / 3) - 1) * 3 + col;
                      if (num > 9) return null;
                      return (
                        <IonCol key={num}>
                          <IonButton
                            expand="block"
                            fill="outline"
                            onClick={() => addDigitToSequence(num)}
                            disabled={disabled}
                          >
                            {num}
                          </IonButton>
                        </IonCol>
                      );
                    })}
                  </IonRow>
                ))}
              </IonGrid>

              {/* Controls */}
              <div className="sequence-controls">
                <IonButton
                  fill="clear"
                  onClick={removeLastDigit}
                  disabled={!taskData.userSequence?.length || disabled}
                >
                  {t('common.undo')}
                </IonButton>
                
                <IonButton
                  color="primary"
                  onClick={submitDigitSequence}
                  disabled={!taskData.userSequence?.length || disabled}
                >
                  <IonIcon icon={checkmark} slot="start" />
                  {t('common.submit')}
                </IonButton>
              </div>
            </div>
          )}

          {/* Progress indicator */}
          <div className="progress-info">
            <IonText color="medium">
              <small>
                {t('attentionTask.progress', {
                  correct: taskData.correctResponses,
                  total: taskData.totalResponses
                })}
              </small>
            </IonText>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );

  const renderCompletedPhase = () => (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={checkmark} color="success" /> {t('attentionTask.completed')}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="completion-content">
          <IonText>
            <h3>{t('attentionTask.results')}</h3>
            <p>{t('attentionTask.maxLevel', { level: (taskData.currentLevel || 3) - 1 })}</p>
            <p>{t('attentionTask.accuracy', { 
              accuracy: Math.round(((taskData.correctResponses || 0) / (taskData.totalResponses || 1)) * 100)
            })}</p>
            <p>{t('attentionTask.completionTime', {
              time: Math.round(((taskData.completionTime || Date.now()) - (taskData.startTime || Date.now())) / 1000)
            })}</p>
          </IonText>
        </div>
      </IonCardContent>
    </IonCard>
  );

  switch (taskData.phase) {
    case 'instruction':
      return renderInstructionPhase();
    case 'practice':
      return renderDigitSpanTest();
    case 'test':
      return renderDigitSpanTest();
    case 'completed':
      return renderCompletedPhase();
    default:
      return renderInstructionPhase();
  }
};