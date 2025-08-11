import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonButtons,
  IonIcon,
  IonProgressBar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonAlert
} from '@ionic/react';
import { arrowBack, arrowForward, checkmark, warning, informationCircle } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { phq9Definition } from '../../../constants/phq9.definition';
import { PHQ9QuestionCard } from './PHQ9QuestionCard';
import { PHQ9Result } from '../../../types/assessment';
import './PHQ9Assessment.css';

interface PHQ9AssessmentProps {
  onComplete: (result: PHQ9Result) => void;
  onExit: () => void;
}

interface PHQ9Response {
  questionId: string;
  value: number;
  timestamp: Date;
}

export const PHQ9Assessment: React.FC<PHQ9AssessmentProps> = ({
  onComplete,
  onExit
}) => {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [showInstructions, setShowInstructions] = useState(true);
  const [showSuicidalAlert, setShowSuicidalAlert] = useState(false);
  const [startTime] = useState<number>(Date.now());

  // Get all questions from both sections
  const allQuestions = phq9Definition.sections.flatMap(section => section.questions);
  const currentQuestion = allQuestions[currentQuestionIndex];
  const totalQuestions = allQuestions.length;
  const answeredQuestions = Object.keys(responses).length;

  // Check for suicidal ideation (question 9)
  useEffect(() => {
    if (responses['phq9_q9'] && responses['phq9_q9'] > 0) {
      setShowSuicidalAlert(true);
    }
  }, [responses]);

  const handleResponseChange = (questionId: string, value: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const calculatePHQ9Score = (): number => {
    // Only count the first 9 questions (depression symptoms)
    const depressionQuestions = phq9Definition.sections[0].questions;
    return depressionQuestions.reduce((total, question) => {
      const response = responses[question.id];
      return total + (response || 0);
    }, 0);
  };

  const getSeverityLevel = (score: number): 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe' => {
    if (score <= 4) return 'minimal';
    if (score <= 9) return 'mild';
    if (score <= 14) return 'moderate';
    if (score <= 19) return 'moderately_severe';
    return 'severe';
  };

  const getFunctionalImpairment = (): 'none' | 'mild' | 'moderate' | 'severe' => {
    const functionalResponse = responses['phq9_functional'];
    if (!functionalResponse) return 'none';
    
    switch (functionalResponse) {
      case 0: return 'none';
      case 1: return 'mild';
      case 2: return 'moderate';
      case 3: return 'severe';
      default: return 'none';
    }
  };

  const getRiskAssessment = (score: number) => {
    const riskRange = phq9Definition.riskMapping.ranges.find(range => 
      score >= range.scoreRange.min && score <= range.scoreRange.max
    );
    
    return riskRange || phq9Definition.riskMapping.ranges[0];
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const completeAssessment = () => {
    const rawScore = calculatePHQ9Score();
    const severityLevel = getSeverityLevel(rawScore);
    const functionalImpairment = getFunctionalImpairment();
    const riskRange = getRiskAssessment(rawScore);
    const suicidalIdeation = (responses['phq9_q9'] || 0) > 0;

    const result: PHQ9Result = {
      id: 'phq9-' + Date.now(),
      sessionId: 'phq9-' + Date.now(),
      testType: 'phq9',
      totalScore: rawScore,
      maxScore: 27,
      rawScore,
      adjustedScore: rawScore, // PHQ-9 doesn't have adjustments
      sectionScores: [],
      responses: [],
      completedAt: new Date().toISOString(),
      severityLevel,
      suicidalIdeation,
      functionalImpairment,
      riskAssessment: {
        testType: 'phq9',
        rawScore,
        adjustedScore: rawScore,
        riskPercentage: (riskRange.riskRange.min + riskRange.riskRange.max) / 2,
        riskCategory: riskRange.category,
        confidenceInterval: [riskRange.riskRange.min, riskRange.riskRange.max],
        factors: [
          ...(suicidalIdeation ? [{
            factor: 'Ideación suicida',
            impact: 'negative' as const,
            weight: 1.0,
            description: 'Presencia de pensamientos suicidas requiere atención inmediata'
          }] : []),
          {
            factor: 'Deterioro funcional',
            impact: functionalImpairment === 'none' ? 'neutral' as const : 'negative' as const,
            weight: functionalImpairment === 'severe' ? 0.8 : functionalImpairment === 'moderate' ? 0.5 : 0.2,
            description: `Impacto ${functionalImpairment} en el funcionamiento diario`
          }
        ],
        calculatedAt: new Date(),
        algorithm: 'threshold'
      },
      recommendations: riskRange.recommendations.map((rec, index) => ({
        id: `phq9-rec-${index}`,
        testType: 'phq9' as const,
        riskLevel: riskRange.category,
        type: suicidalIdeation ? 'medical' as const : 'lifestyle' as const,
        category: suicidalIdeation ? 'immediate' as const : (severityLevel === 'severe' ? 'immediate' as const : 'short_term' as const),
        title: rec,
        description: rec,
        priority: suicidalIdeation ? 'urgent' as const : (severityLevel === 'severe' ? 'high' as const : 'medium' as const),
        actionSteps: suicidalIdeation ? ['Buscar ayuda inmediata', 'Contactar línea de crisis'] : ['Consultar profesional'],
        followUpDays: suicidalIdeation ? 1 : 14,
        metadata: {}
      })),
      completionTime: Date.now() - startTime,
      metadata: {
        responses,
        version: phq9Definition.metadata.version,
        individualScores: Object.entries(responses).reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, number>)
      }
    };

    onComplete(result);
  };

  const canProceed = () => {
    return responses[currentQuestion?.id] !== undefined;
  };

  if (showInstructions) {
    return (
      <>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('assessments.phq9.name')}</IonTitle>
            <IonButtons slot="start">
              <IonButton fill="clear" onClick={onExit}>
                <IonIcon icon={arrowBack} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={informationCircle} /> {phq9Definition.fullName}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText>
                <p>{phq9Definition.description}</p>
                <p><strong>{phq9Definition.sections[0].instructions}</strong></p>
              </IonText>
              
              <div className="assessment-info">
                <IonText color="medium">
                  <p>
                    Preguntas: {totalQuestions}<br/>
                    Tiempo estimado: {phq9Definition.duration} minutos
                  </p>
                </IonText>
              </div>

              <div className="important-notice">
                <IonText color="warning">
                  <p>
                    <IonIcon icon={warning} /> <strong>Importante:</strong> Esta evaluación incluye preguntas sobre pensamientos suicidas. 
                    Si en cualquier momento siente que necesita ayuda inmediata, contacte a un profesional de la salud o llame a una línea de crisis.
                  </p>
                </IonText>
              </div>

              <IonButton 
                expand="block" 
                onClick={() => setShowInstructions(false)}
              >
                Comenzar Evaluación
              </IonButton>
            </IonCardContent>
          </IonCard>
        </IonContent>
      </>
    );
  }

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('assessments.phq9.name')}</IonTitle>
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={onExit}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        
        <IonProgressBar 
          value={answeredQuestions / totalQuestions} 
          color="primary"
        />
      </IonHeader>

      <IonContent>
        <div className="phq9-assessment">
          <div className="progress-info">
            <IonText color="medium">
              <p>
                Pregunta {currentQuestionIndex + 1} de {totalQuestions}
              </p>
            </IonText>
          </div>

          {currentQuestion && (
            <PHQ9QuestionCard
              question={currentQuestion}
              value={responses[currentQuestion.id]}
              onChange={(value) => handleResponseChange(currentQuestion.id, value)}
              questionNumber={currentQuestionIndex + 1}
            />
          )}

          <div className="navigation-controls">
            <IonButton
              fill="outline"
              disabled={currentQuestionIndex === 0}
              onClick={handlePrevious}
            >
              <IonIcon icon={arrowBack} slot="start" />
              Anterior
            </IonButton>

            <IonButton
              color="primary"
              disabled={!canProceed()}
              onClick={handleNext}
            >
              {currentQuestionIndex === totalQuestions - 1 ? (
                <>
                  <IonIcon icon={checkmark} slot="start" />
                  Finalizar
                </>
              ) : (
                <>
                  Siguiente
                  <IonIcon icon={arrowForward} slot="end" />
                </>
              )}
            </IonButton>
          </div>
        </div>

        {/* Suicidal ideation alert */}
        <IonAlert
          isOpen={showSuicidalAlert}
          onDidDismiss={() => setShowSuicidalAlert(false)}
          header="Atención Importante"
          message="Ha indicado pensamientos sobre la muerte o autolesión. Es muy importante que hable con un profesional de la salud inmediatamente. Si siente que está en peligro inmediato, contacte servicios de emergencia o una línea de crisis."
          buttons={[
            {
              text: 'Entendido',
              role: 'confirm'
            }
          ]}
        />
      </IonContent>
    </>
  );
};