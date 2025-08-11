import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonItem,
  IonLabel,
  IonRadio,
  IonRadioGroup,
  IonCheckbox,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon,
  IonRange,
  IonList
} from '@ionic/react';
import { informationCircle, warning } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { Question, QuestionType } from '../../types/assessment';
import { DrawingCanvas } from './DrawingCanvas';
import { MemoryTask } from './MemoryTask';
import { AttentionTask } from './AttentionTask';
import './QuestionRenderer.css';

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  errors?: string[];
  disabled?: boolean;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  onChange,
  errors = [],
  disabled = false
}) => {
  const { t } = useTranslation();

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'multiple_choice':
        return renderMultipleChoice();
      case 'likert_scale':
        return renderLikertScale();
      case 'yes_no':
        return renderYesNo();
      case 'numeric_input':
        return renderNumericInput();
      case 'text_input':
        return renderTextInput();
      case 'drawing_task':
        return renderDrawingTask();
      case 'memory_task':
        return renderMemoryTask();
      case 'attention_task':
        return renderAttentionTask();
      case 'instruction_following':
        return renderInstructionFollowing();
      default:
        return <IonText color="danger">Unsupported question type: {question.type}</IonText>;
    }
  };

  const renderMultipleChoice = () => (
    <IonRadioGroup
      value={value}
      onIonChange={(e) => onChange(e.detail.value)}
    >
      <IonList>
        {question.options?.map((option, index) => (
          <IonItem key={`${question.id}-${index}`} disabled={disabled}>
            <IonLabel className="ion-text-wrap">
              {option.label}
            </IonLabel>
            <IonRadio slot="start" value={option.value} />
          </IonItem>
        ))}
      </IonList>
    </IonRadioGroup>
  );

  const renderLikertScale = () => {
    const scaleLabels = question.options?.map(opt => opt.label) || [];
    const scaleValues = question.options?.map(opt => opt.value) || [];
    
    return (
      <div className="likert-scale">
        <IonRange
          min={0}
          max={scaleValues.length - 1}
          step={1}
          value={scaleValues.indexOf(value)}
          onIonChange={(e) => {
            const index = e.detail.value as number;
            onChange(scaleValues[index]);
          }}
          disabled={disabled}
          snaps={true}
          ticks={true}
          pin={true}
        >
          <IonLabel slot="start">{scaleLabels[0]}</IonLabel>
          <IonLabel slot="end">{scaleLabels[scaleLabels.length - 1]}</IonLabel>
        </IonRange>
        
        <div className="scale-labels">
          {scaleLabels.map((label, index) => (
            <div 
              key={index} 
              className={`scale-label ${scaleValues.indexOf(value) === index ? 'selected' : ''}`}
            >
              <IonButton
                fill="clear"
                size="small"
                onClick={() => onChange(scaleValues[index])}
                disabled={disabled}
              >
                {label}
              </IonButton>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderYesNo = () => (
    <IonRadioGroup
      value={value}
      onIonChange={(e) => onChange(e.detail.value)}
    >
      <IonList>
        <IonItem disabled={disabled}>
          <IonLabel>{t('common.yes')}</IonLabel>
          <IonRadio slot="start" value={true} />
        </IonItem>
        <IonItem disabled={disabled}>
          <IonLabel>{t('common.no')}</IonLabel>
          <IonRadio slot="start" value={false} />
        </IonItem>
      </IonList>
    </IonRadioGroup>
  );

  const renderNumericInput = () => (
    <IonItem>
      <IonInput
        type="number"
        value={value}
        onIonInput={(e) => onChange(Number(e.detail.value!))}
        disabled={disabled}
        placeholder={t('assessment.enterNumber')}
        min={question.validation?.find(v => v.type === 'min')?.value}
        max={question.validation?.find(v => v.type === 'max')?.value}
      />
    </IonItem>
  );

  const renderTextInput = () => (
    <IonItem>
      <IonTextarea
        value={value}
        onIonInput={(e) => onChange(e.detail.value!)}
        disabled={disabled}
        placeholder={t('assessment.enterText')}
        rows={4}
        autoGrow={true}
      />
    </IonItem>
  );

  const renderDrawingTask = () => (
    <DrawingCanvas
      value={value}
      onChange={onChange}
      disabled={disabled}
      instructions={question.instructions}
      timeLimit={question.timeLimit}
    />
  );

  const renderMemoryTask = () => (
    <MemoryTask
      question={question}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );

  const renderAttentionTask = () => (
    <AttentionTask
      question={question}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );

  const renderInstructionFollowing = () => {
    const steps = question.metadata?.steps || [];
    const completedSteps = value?.completedSteps || [];

    return (
      <div className="instruction-following">
        <div className="instruction-text">
          <IonText>
            <p><strong>Instrucciones:</strong> {question.instructions}</p>
          </IonText>
        </div>
        
        <div className="instruction-steps">
          {steps.map((step: string, index: number) => (
            <IonItem 
              key={index} 
              className={`instruction-step ${completedSteps.includes(step) ? 'completed' : ''}`}
              button
              onClick={() => {
                const newCompletedSteps = completedSteps.includes(step)
                  ? completedSteps.filter((s: string) => s !== step)
                  : [...completedSteps, step];
                onChange({ completedSteps: newCompletedSteps });
              }}
              disabled={disabled}
            >
              <IonCheckbox
                slot="start"
                checked={completedSteps.includes(step)}
                disabled={disabled}
              />
              <IonLabel className="ion-text-wrap">
                Paso {index + 1}: {getStepDescription(step)}
              </IonLabel>
            </IonItem>
          ))}
        </div>
        
        <div className="instruction-progress">
          <IonText color="medium">
            <small>
              Completado: {completedSteps.length} de {steps.length} pasos
            </small>
          </IonText>
        </div>
      </div>
    );
  };

  const getStepDescription = (step: string): string => {
    const descriptions: Record<string, string> = {
      'take_paper_right_hand': 'Tome el papel con la mano derecha',
      'fold_in_half': 'Dóblelo por la mitad',
      'put_on_floor': 'Póngalo en el suelo'
    };
    return descriptions[step] || step;
  };

  return (
    <IonCard className="question-card">
      <IonCardHeader>
        <IonCardTitle className="question-title">
          {question.text}
        </IonCardTitle>
        {question.instructions && (
          <div className="question-instructions">
            <IonIcon icon={informationCircle} color="primary" />
            <IonText color="medium">
              <p>{question.instructions}</p>
            </IonText>
          </div>
        )}
      </IonCardHeader>

      <IonCardContent>
        <div className="question-content">
          {renderQuestionContent()}
        </div>

        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="validation-errors">
            {errors.map((error, index) => (
              <IonText key={index} color="danger">
                <p>
                  <IonIcon icon={warning} /> {error}
                </p>
              </IonText>
            ))}
          </div>
        )}

        {/* Question metadata */}
        {question.required && (
          <IonText color="danger" className="required-indicator">
            <small>* {t('assessment.required')}</small>
          </IonText>
        )}

        {question.timeLimit && (
          <IonText color="medium" className="time-limit-indicator">
            <small>{t('assessment.timeLimit', { seconds: question.timeLimit })}</small>
          </IonText>
        )}
      </IonCardContent>
    </IonCard>
  );
};