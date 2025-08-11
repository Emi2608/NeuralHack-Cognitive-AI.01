import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonProgressBar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonAlert,
  IonIcon,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonList
} from '@ionic/react';
import { checkmark, close, time, alertCircle } from 'ionicons/icons';
import { useAssessment } from '../../../hooks/useAssessment';
import { AssessmentContainer } from '../AssessmentContainer';
import { QuestionRenderer } from '../QuestionRenderer';
import { ad8Definition } from '../../../constants/ad8.definition';
import type { TestResponse } from '../../../types/assessment';
import './AD8Assessment.css';

interface AD8AssessmentProps {
  onComplete: (responses: TestResponse[]) => void;
  onCancel: () => void;
}

export const AD8Assessment: React.FC<AD8AssessmentProps> = ({
  onComplete,
  onCancel
}) => {
  const {
    currentSection,
    currentQuestion,
    responses,
    progress,
    timeRemaining,
    isComplete,
    submitResponse,
    nextQuestion,
    previousQuestion,
    canGoNext,
    canGoPrevious
  } = useAssessment(ad8Definition);

  const [showExitAlert, setShowExitAlert] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    if (isComplete) {
      onComplete(responses);
    }
  }, [isComplete, responses, onComplete]);

  const handleResponseChange = (response: any) => {
    setCurrentResponse(response);
  };

  const handleNext = () => {
    if (currentResponse !== null) {
      if (currentQuestion) {
        submitResponse(currentQuestion.id, currentResponse);
      }
      setCurrentResponse(null);
    }
    nextQuestion();
  };

  const handlePrevious = () => {
    previousQuestion();
    setCurrentResponse(null);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionProgress = () => {
    const allQuestions = ad8Definition.sections.flatMap(s => s.questions);
    const currentQuestionIndex = currentQuestion ? allQuestions.findIndex(q => q.id === currentQuestion.id) : -1;
    return {
      current: currentQuestionIndex + 1,
      total: allQuestions.length
    };
  };

  if (showInstructions) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>AD8 - Instrucciones</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={alertCircle} color="primary" />
                Entrevista de Detección de Demencia AD8
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="instructions-content">
                <p>
                  Esta evaluación consiste en 8 preguntas sobre cambios que puede haber 
                  notado en su pensamiento y memoria durante los últimos años.
                </p>
                
                <div className="instruction-points">
                  <h4>Instrucciones importantes:</h4>
                  <ul>
                    <li>Responda <strong>SÍ</strong> si ha notado un cambio en esa área</li>
                    <li>Responda <strong>NO</strong> si no ha habido cambio</li>
                    <li>Piense en cambios que han ocurrido en los últimos años</li>
                    <li>Compare con cómo era antes</li>
                    <li>Sea honesto en sus respuestas</li>
                  </ul>
                </div>

                <div className="time-estimate">
                  <IonIcon icon={time} />
                  <span>Tiempo estimado: 3 minutos</span>
                </div>

                <div className="privacy-note">
                  <p>
                    <strong>Nota:</strong> Esta evaluación es confidencial y sus respuestas 
                    se utilizarán únicamente para proporcionar recomendaciones de salud.
                  </p>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          <div className="start-button-container">
            <IonButton
              expand="block"
              size="large"
              onClick={() => setShowInstructions(false)}
            >
              Comenzar Evaluación
            </IonButton>
            
            <IonButton
              expand="block"
              fill="outline"
              color="medium"
              onClick={onCancel}
            >
              Cancelar
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (isComplete) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>AD8 - Completado</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="completion-message">
            <IonIcon icon={checkmark} size="large" color="success" />
            <h2>Evaluación AD8 Completada</h2>
            <p>Gracias por completar la evaluación. Sus respuestas han sido guardadas.</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>AD8 - Detección de Demencia</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ad8-assessment">
        {/* Progress indicators */}
        <div className="progress-container">
          <div className="progress-info">
            <div className="question-progress">
              Pregunta {getQuestionProgress().current} de {getQuestionProgress().total}
            </div>
            <div className="time-remaining">
              <IonIcon icon={time} />
              {formatTime(timeRemaining)}
            </div>
          </div>
          <IonProgressBar value={typeof progress === 'number' ? progress : 0} />
        </div>

        {/* Question */}
        <AssessmentContainer>
          <IonCard className="question-card">
            <IonCardContent>
              <div className="question-header">
                <h3>{currentQuestion?.text || 'Cargando pregunta...'}</h3>
                {currentQuestion?.instructions && (
                  <IonText color="medium">
                    <p className="question-instructions">{currentQuestion?.instructions}</p>
                  </IonText>
                )}
              </div>

              <IonList className="response-options">
                <IonRadioGroup
                  value={currentResponse}
                  onIonChange={(e) => handleResponseChange(e.detail.value)}
                >
                  {currentQuestion?.options?.map((option) => (
                    <IonItem key={option.value} className="option-item">
                      <IonLabel className="option-label">
                        {option.label}
                      </IonLabel>
                      <IonRadio slot="start" value={option.value} />
                    </IonItem>
                  ))}
                </IonRadioGroup>
              </IonList>
            </IonCardContent>
          </IonCard>
        </AssessmentContainer>

        {/* Navigation buttons */}
        <div className="navigation-buttons">
          <IonButton
            fill="outline"
            onClick={handlePrevious}
            disabled={!canGoPrevious}
          >
            Anterior
          </IonButton>

          <IonButton
            color="danger"
            fill="outline"
            onClick={() => setShowExitAlert(true)}
          >
            <IonIcon icon={close} slot="start" />
            Salir
          </IonButton>

          <IonButton
            onClick={handleNext}
            disabled={currentResponse === null}
          >
            {progress && typeof progress === 'number' && progress >= 1 ? 'Finalizar' : 'Siguiente'}
          </IonButton>
        </div>

        {/* Exit confirmation alert */}
        <IonAlert
          isOpen={showExitAlert}
          onDidDismiss={() => setShowExitAlert(false)}
          header="Confirmar salida"
          message="¿Está seguro de que desea salir? Se perderá todo el progreso."
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Salir',
              role: 'destructive',
              handler: onCancel
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};