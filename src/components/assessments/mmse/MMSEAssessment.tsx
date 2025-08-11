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
  IonIcon
} from '@ionic/react';
import { checkmark, close, time } from 'ionicons/icons';
import { useAssessment } from '../../../hooks/useAssessment';
import { AssessmentContainer } from '../AssessmentContainer';
import { QuestionRenderer } from '../QuestionRenderer';
import { mmseDefinition } from '../../../constants/mmse.definition';
import type { TestResponse } from '../../../types/assessment';
import './MMSEAssessment.css';

interface MMSEAssessmentProps {
  onComplete: (responses: TestResponse[]) => void;
  onCancel: () => void;
}

export const MMSEAssessment: React.FC<MMSEAssessmentProps> = ({
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
  } = useAssessment(mmseDefinition);

  const [showExitAlert, setShowExitAlert] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<any>(null);

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
      submitResponse(currentQuestion.id, currentResponse);
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

  const getSectionProgress = () => {
    const sectionQuestions = mmseDefinition.sections
      .find(s => s.id === currentSection?.id)?.questions || [];
    const currentQuestionIndex = sectionQuestions.findIndex(q => q.id === currentQuestion.id);
    return {
      current: currentQuestionIndex + 1,
      total: sectionQuestions.length
    };
  };

  if (isComplete) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>MMSE - Completado</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="completion-message">
            <IonIcon icon={checkmark} size="large" color="success" />
            <h2>Evaluación MMSE Completada</h2>
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
          <IonTitle>MMSE - {currentSection?.name}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="mmse-assessment">
        {/* Progress indicators */}
        <div className="progress-container">
          <div className="progress-info">
            <div className="section-progress">
              Pregunta {getSectionProgress().current} de {getSectionProgress().total}
            </div>
            <div className="time-remaining">
              <IonIcon icon={time} />
              {formatTime(timeRemaining)}
            </div>
          </div>
          <IonProgressBar value={progress} />
        </div>

        {/* Current section info */}
        {currentSection && (
          <IonCard className="section-info-card">
            <IonCardHeader>
              <IonCardTitle>{currentSection.name}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText color="medium">
                <p>{currentSection.description}</p>
                {currentSection.instructions && (
                  <p><strong>Instrucciones:</strong> {currentSection.instructions}</p>
                )}
              </IonText>
            </IonCardContent>
          </IonCard>
        )}

        {/* Question */}
        <AssessmentContainer>
          <QuestionRenderer
            question={currentQuestion}
            onResponseChange={handleResponseChange}
            currentResponse={currentResponse}
          />
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
            disabled={!canGoNext && currentResponse === null}
          >
            {progress === 1 ? 'Finalizar' : 'Siguiente'}
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