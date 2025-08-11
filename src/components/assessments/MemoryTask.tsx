import React, { useState, useEffect, useCallback } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonInput,
  IonList,
  IonIcon,
  IonProgressBar
} from '@ionic/react';
import { 
  eye, 
  eyeOff, 
  time, 
  checkmark,
  informationCircle 
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { Question } from '../../types/assessment';
import './MemoryTask.css';

interface MemoryTaskProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

interface MemoryTaskData {
  phase: 'instruction' | 'memorization' | 'distraction' | 'recall';
  wordsToRemember?: string[];
  recalledWords?: string[];
  startTime?: number;
  memorizationTime?: number;
  recallTime?: number;
  attempts?: number;
}

export const MemoryTask: React.FC<MemoryTaskProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const { t } = useTranslation();
  const [taskData, setTaskData] = useState<MemoryTaskData>(
    value || { phase: 'instruction', attempts: 0 }
  );
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentInput, setCurrentInput] = useState<string>('');

  // Get task configuration from question metadata
  const config = {
    words: question.metadata?.words || ['FACE', 'VELVET', 'CHURCH', 'DAISY', 'RED'],
    memorizationTime: question.metadata?.memorizationTime || 30, // seconds
    distractionTime: question.metadata?.distractionTime || 60, // seconds
    maxAttempts: question.metadata?.maxAttempts || 3
  };

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !disabled) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handlePhaseComplete();
    }
  }, [timeRemaining, disabled]);

  // Update parent component when task data changes
  useEffect(() => {
    onChange(taskData);
  }, [taskData, onChange]);

  const handlePhaseComplete = useCallback(() => {
    switch (taskData.phase) {
      case 'memorization':
        setTaskData(prev => ({
          ...prev,
          phase: 'distraction',
          memorizationTime: Date.now() - (prev.startTime || 0)
        }));
        setTimeRemaining(config.distractionTime);
        break;
      case 'distraction':
        setTaskData(prev => ({
          ...prev,
          phase: 'recall'
        }));
        break;
    }
  }, [taskData.phase, config.distractionTime]);

  const startMemorization = useCallback(() => {
    setTaskData(prev => ({
      ...prev,
      phase: 'memorization',
      wordsToRemember: config.words,
      startTime: Date.now()
    }));
    setTimeRemaining(config.memorizationTime);
  }, [config.words, config.memorizationTime]);

  const addRecalledWord = useCallback(() => {
    if (!currentInput.trim()) return;

    const word = currentInput.trim().toUpperCase();
    const recalledWords = taskData.recalledWords || [];
    
    if (!recalledWords.includes(word)) {
      setTaskData(prev => ({
        ...prev,
        recalledWords: [...recalledWords, word]
      }));
    }
    
    setCurrentInput('');
  }, [currentInput, taskData.recalledWords]);

  const removeRecalledWord = useCallback((wordToRemove: string) => {
    setTaskData(prev => ({
      ...prev,
      recalledWords: (prev.recalledWords || []).filter(word => word !== wordToRemove)
    }));
  }, []);

  const completeRecall = useCallback(() => {
    setTaskData(prev => ({
      ...prev,
      recallTime: Date.now() - (prev.startTime || 0),
      attempts: (prev.attempts || 0) + 1
    }));
  }, []);

  const resetTask = useCallback(() => {
    setTaskData({
      phase: 'instruction',
      attempts: (taskData.attempts || 0) + 1
    });
    setTimeRemaining(0);
    setCurrentInput('');
  }, [taskData.attempts]);

  const renderInstructionPhase = () => (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>{t('memoryTask.instruction.title')}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="instruction-content">
          <IonIcon icon={informationCircle} color="primary" size="large" />
          <IonText>
            <p>{t('memoryTask.instruction.description')}</p>
            <p>{t('memoryTask.instruction.steps')}</p>
            <ul>
              <li>{t('memoryTask.instruction.step1', { time: config.memorizationTime })}</li>
              <li>{t('memoryTask.instruction.step2', { time: config.distractionTime })}</li>
              <li>{t('memoryTask.instruction.step3')}</li>
            </ul>
          </IonText>
          <IonButton 
            expand="block" 
            onClick={startMemorization}
            disabled={disabled}
          >
            {t('memoryTask.start')}
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  );

  const renderMemorizationPhase = () => (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={eye} /> {t('memoryTask.memorization.title')}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="memorization-content">
          <div className="timer-display">
            <IonIcon icon={time} />
            <span className="time-remaining">{timeRemaining}s</span>
          </div>
          
          <IonProgressBar 
            value={(config.memorizationTime - timeRemaining) / config.memorizationTime}
            color="primary"
          />

          <div className="words-display">
            {config.words.map((word, index) => (
              <div key={index} className="memory-word">
                {word}
              </div>
            ))}
          </div>

          <IonText color="medium">
            <p>{t('memoryTask.memorization.instruction')}</p>
          </IonText>
        </div>
      </IonCardContent>
    </IonCard>
  );

  const renderDistractionPhase = () => (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={eyeOff} /> {t('memoryTask.distraction.title')}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="distraction-content">
          <div className="timer-display">
            <IonIcon icon={time} />
            <span className="time-remaining">{timeRemaining}s</span>
          </div>
          
          <IonProgressBar 
            value={(config.distractionTime - timeRemaining) / config.distractionTime}
            color="warning"
          />

          <div className="distraction-task">
            <IonText>
              <h3>{t('memoryTask.distraction.task')}</h3>
              <p>{t('memoryTask.distraction.instruction')}</p>
            </IonText>
            
            {/* Simple counting task */}
            <div className="counting-task">
              <IonText>
                <p>{t('memoryTask.distraction.countBackwards')}</p>
              </IonText>
              <div className="numbers">
                {Array.from({ length: 10 }, (_, i) => 100 - i * 7).map(num => (
                  <span key={num} className="count-number">{num}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );

  const renderRecallPhase = () => (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={checkmark} /> {t('memoryTask.recall.title')}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="recall-content">
          <IonText>
            <p>{t('memoryTask.recall.instruction')}</p>
          </IonText>

          <div className="word-input">
            <IonItem>
              <IonInput
                value={currentInput}
                onIonInput={(e) => setCurrentInput(e.detail.value!)}
                onKeyPress={(e) => e.key === 'Enter' && addRecalledWord()}
                placeholder={t('memoryTask.recall.placeholder')}
                disabled={disabled}
              />
              <IonButton 
                slot="end" 
                fill="clear" 
                onClick={addRecalledWord}
                disabled={!currentInput.trim() || disabled}
              >
                {t('common.add')}
              </IonButton>
            </IonItem>
          </div>

          <div className="recalled-words">
            <IonText>
              <h4>{t('memoryTask.recall.yourWords')} ({(taskData.recalledWords || []).length})</h4>
            </IonText>
            <IonList>
              {(taskData.recalledWords || []).map((word, index) => (
                <IonItem key={index}>
                  <IonLabel>{word}</IonLabel>
                  <IonButton
                    slot="end"
                    fill="clear"
                    color="danger"
                    onClick={() => removeRecalledWord(word)}
                    disabled={disabled}
                  >
                    {t('common.remove')}
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
          </div>

          <div className="recall-actions">
            <IonButton
              expand="block"
              onClick={completeRecall}
              disabled={disabled}
            >
              {t('memoryTask.recall.complete')}
            </IonButton>
            
            {(taskData.attempts || 0) < config.maxAttempts && (
              <IonButton
                expand="block"
                fill="outline"
                onClick={resetTask}
                disabled={disabled}
              >
                {t('memoryTask.recall.tryAgain')}
              </IonButton>
            )}
          </div>

          <div className="recall-stats">
            <IonText color="medium">
              <small>
                {t('memoryTask.recall.attempts', { 
                  current: (taskData.attempts || 0) + 1, 
                  max: config.maxAttempts 
                })}
              </small>
            </IonText>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );

  switch (taskData.phase) {
    case 'instruction':
      return renderInstructionPhase();
    case 'memorization':
      return renderMemorizationPhase();
    case 'distraction':
      return renderDistractionPhase();
    case 'recall':
      return renderRecallPhase();
    default:
      return renderInstructionPhase();
  }
};