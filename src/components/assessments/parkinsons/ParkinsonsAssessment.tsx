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
  IonList,
  IonBadge
} from '@ionic/react';
import { checkmark, close, time, body, home, medicalOutline } from 'ionicons/icons';
import { useAssessment } from '../../../hooks/useAssessment';
import { AssessmentContainer } from '../AssessmentContainer';
import { QuestionRenderer } from '../QuestionRenderer';
import { parkinsonsDefinition } from '../../../constants/parkinsons.definition';
import type { TestResponse } from '../../../types/assessment';
import './ParkinsonsAssessment.css';

interface ParkinsonsAssessmentProps {
  onComplete: (responses: TestResponse[]) => void;
  onCancel: () => void;
}

export const ParkinsonsAssessment: React.FC<ParkinsonsAssessmentProps> = ({
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
  } = useAssessment(parkinsonsDefinition);

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
    const sectionQuestions = parkinsonsDefinition.sections
      .find(s => s.id === currentSection?.id)?.questions || [];
    const currentQuestionIndex = sectionQuestions.findIndex(q => q.id === currentQuestion.id);
    return {
      current: currentQuestionIndex + 1,
      total: sectionQuestions.length
    };
  };

  const getSectionIcon = (sectionId: string) => {
    switch (sectionId) {
      case 'motor_symptoms':
        return body;
      case 'non_motor_symptoms':
        return brain;
      case 'daily_activities':
        return home;
      default:
        return medicalOutline;
    }
  };

  const getSectionColor = (sectionId: string) => {
    switch (sectionId) {
      case 'motor_symptoms':
        return 'primary';
      case 'non_motor_symptoms':
        return 'secondary';
      case 'daily_activities':
        return 'tertiary';
      default:
        return 'medium';
    }
  };

  if (showInstructions) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Evaluación de Parkinson - Instrucciones</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={medicalOutline} color="primary" />
                Evaluación de Síntomas de Parkinson
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="instructions-content">
                <p>
                  Esta evaluación examina síntomas que pueden estar relacionados con 
                  la enfermedad de Parkinson. Incluye síntomas motores, no motores 
                  y su impacto en las actividades diarias.
                </p>
                
                <div className="sections-overview">
                  <h4>Secciones de la evaluación:</h4>
                  <div className="section-cards">
                    <div className="section-card motor">
                      <IonIcon icon={body} />
                      <h5>Síntomas Motores</h5>
                      <p>Temblor, rigidez, lentitud de movimientos, problemas de equilibrio</p>
                    </div>
                    <div className="section-card non-motor">
                      <IonIcon icon={brain} />
                      <h5>Síntomas No Motores</h5>
                      <p>Olfato, sueño, estreñimiento, cambios de ánimo</p>
                    </div>
                    <div className="section-card daily">
                      <IonIcon icon={home} />
                      <h5>Actividades Diarias</h5>
                      <p>Escritura, voz, expresión facial</p>
                    </div>
                  </div>
                </div>

                <div className="instruction-points">
                  <h4>Instrucciones importantes:</h4>
                  <ul>
                    <li>Piense en los últimos <strong>6 meses</strong></li>
                    <li>Responda con qué frecuencia ha experimentado cada síntoma</li>
                    <li>Sea honesto sobre la frecuencia de los síntomas</li>
                    <li>Si no está seguro, elija la opción más cercana</li>
                    <li>Esta evaluación no reemplaza el diagnóstico médico</li>
                  </ul>
                </div>

                <div className="time-estimate">
                  <IonIcon icon={time} />
                  <span>Tiempo estimado: 8 minutos</span>
                </div>

                <div className="disclaimer">
                  <p>
                    <strong>Importante:</strong> Esta herramienta es solo para detección 
                    temprana. Si tiene síntomas preocupantes, consulte con un neurólogo 
                    para una evaluación completa.
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
            <IonTitle>Evaluación de Parkinson - Completado</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="completion-message">
            <IonIcon icon={checkmark} size="large" color="success" />
            <h2>Evaluación de Parkinson Completada</h2>
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
          <IonTitle>Parkinson - {currentSection?.name}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="parkinsons-assessment">
        {/* Progress indicators */}
        <div className="progress-container">
          <div className="progress-info">
            <div className="section-progress">
              <IonIcon icon={getSectionIcon(currentSection?.id || '')} />
              {currentSection?.name} - Pregunta {getSectionProgress().current} de {getSectionProgress().total}
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
          <IonCard className={`section-info-card ${currentSection.id}`}>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={getSectionIcon(currentSection.id)} />
                {currentSection.name}
                <IonBadge color={getSectionColor(currentSection.id)}>
                  {getSectionProgress().current}/{getSectionProgress().total}
                </IonBadge>
              </IonCardTitle>
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
          <IonCard className="question-card">
            <IonCardContent>
              <div className="question-header">
                <h3>{currentQuestion.text}</h3>
                {currentQuestion.instructions && (
                  <IonText color="medium">
                    <p className="question-instructions">{currentQuestion.instructions}</p>
                  </IonText>
                )}
              </div>

              <IonList className="response-options">
                <IonRadioGroup
                  value={currentResponse}
                  onIonChange={(e) => handleResponseChange(e.detail.value)}
                >
                  {currentQuestion.options?.map((option) => (
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