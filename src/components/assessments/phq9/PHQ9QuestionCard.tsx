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
  IonList,
  IonIcon,
  IonBadge
} from '@ionic/react';
import { warning, informationCircle } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { Question } from '../../../types/assessment';
import './PHQ9QuestionCard.css';

interface PHQ9QuestionCardProps {
  question: Question;
  value: number | undefined;
  onChange: (value: number) => void;
  questionNumber: number;
}

export const PHQ9QuestionCard: React.FC<PHQ9QuestionCardProps> = ({
  question,
  value,
  onChange,
  questionNumber
}) => {
  const { t } = useTranslation();

  const isCriticalQuestion = question.metadata?.criticalQuestion;
  const isSuicidalQuestion = question.metadata?.suicidalIdeation;

  const getFrequencyDescription = (optionValue: number): string => {
    switch (optionValue) {
      case 0: return 'Nunca en las últimas 2 semanas';
      case 1: return '2-6 días en las últimas 2 semanas';
      case 2: return '7-11 días en las últimas 2 semanas';
      case 3: return '12-14 días en las últimas 2 semanas';
      default: return '';
    }
  };

  const getSelectedOptionLabel = (): string => {
    if (value === undefined) return '';
    const option = question.options?.find(opt => opt.value === value);
    return option?.label || '';
  };

  return (
    <IonCard className={`phq9-question-card ${isCriticalQuestion ? 'critical-question' : ''}`}>
      <IonCardHeader>
        <div className="question-header">
          <IonBadge color="primary" className="question-number">
            {questionNumber}
          </IonBadge>
          <IonCardTitle className="question-title">
            {question.text}
          </IonCardTitle>
        </div>
        
        {isSuicidalQuestion && (
          <div className="critical-notice">
            <IonIcon icon={warning} color="danger" />
            <IonText color="danger">
              <small><strong>Pregunta crítica:</strong> Esta pregunta es muy importante para su seguridad</small>
            </IonText>
          </div>
        )}
      </IonCardHeader>

      <IonCardContent>
        {question.instructions && (
          <div className="question-instructions">
            <IonIcon icon={informationCircle} color="primary" />
            <IonText color="medium">
              <p>{question.instructions}</p>
            </IonText>
          </div>
        )}

        <div className="response-section">
          <IonText>
            <h4>Seleccione la frecuencia que mejor describe su experiencia:</h4>
          </IonText>

          <IonRadioGroup
            value={value}
            onIonChange={(e) => onChange(e.detail.value)}
          >
            <IonList>
              {question.options?.map((option, index) => (
                <IonItem 
                  key={`${question.id}-${index}`}
                  className={`option-item ${value === option.value ? 'selected' : ''}`}
                >
                  <IonRadio slot="start" value={option.value} />
                  <IonLabel className="option-label">
                    <div className="option-main">
                      <strong>{option.label}</strong>
                    </div>
                    <div className="option-description">
                      <IonText color="medium">
                        <small>{getFrequencyDescription(option.value as number)}</small>
                      </IonText>
                    </div>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          </IonRadioGroup>
        </div>

        {value !== undefined && (
          <div className="selection-summary">
            <IonText color="primary">
              <p>
                <strong>Seleccionado:</strong> {getSelectedOptionLabel()}
              </p>
            </IonText>
          </div>
        )}

        {isSuicidalQuestion && value !== undefined && value > 0 && (
          <div className="crisis-resources">
            <IonCard color="danger">
              <IonCardContent>
                <IonText color="danger">
                  <h4>Recursos de Crisis Inmediatos</h4>
                  <p><strong>México:</strong></p>
                  <ul>
                    <li>Línea de la Vida: 800 911 2000</li>
                    <li>SAPTEL: 55 5259 8121</li>
                    <li>Emergencias: 911</li>
                  </ul>
                  <p><strong>Si está en peligro inmediato, busque ayuda ahora.</strong></p>
                </IonText>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        <div className="question-context">
          <IonText color="medium">
            <small>
              Recuerde: Considere solo las últimas 2 semanas al responder esta pregunta.
            </small>
          </IonText>
        </div>
      </IonCardContent>
    </IonCard>
  );
};