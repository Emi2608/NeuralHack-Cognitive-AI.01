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
  IonList,
  IonItem,
  IonLabel
} from '@ionic/react';
import { arrowBack, arrowForward, checkmark, informationCircle } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { mocaDefinition } from '../../../constants/moca.definition';
import { TrailMakingTask } from './TrailMakingTask';
import { NamingTask } from './NamingTask';
import { DrawingCanvas } from '../DrawingCanvas';
import { MemoryTask } from '../MemoryTask';
import { AttentionTask } from '../AttentionTask';
import { QuestionRenderer } from '../QuestionRenderer';
import { MoCAResult } from '../../../types/assessment';
import './MoCAAssessment.css';

interface MoCAAssessmentProps {
  onComplete: (result: MoCAResult) => void;
  onExit: () => void;
}

interface SectionProgress {
  sectionId: string;
  completed: boolean;
  score: number;
  maxScore: number;
}

export const MoCAAssessment: React.FC<MoCAAssessmentProps> = ({
  onComplete,
  onExit
}) => {
  const { t } = useTranslation();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [sectionProgress, setSectionProgress] = useState<SectionProgress[]>([]);
  const [startTime] = useState<number>(Date.now());
  const [showInstructions, setShowInstructions] = useState(true);

  const currentSection = mocaDefinition.sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  const totalSections = mocaDefinition.sections.length;
  const totalQuestions = mocaDefinition.sections.reduce((sum, section) => sum + section.questions.length, 0);
  const answeredQuestions = Object.keys(responses).length;

  useEffect(() => {
    // Initialize section progress
    const initialProgress = mocaDefinition.sections.map(section => ({
      sectionId: section.id,
      completed: false,
      score: 0,
      maxScore: mocaDefinition.scoringConfig.sections?.find(s => s.sectionId === section.id)?.maxScore || 0
    }));
    setSectionProgress(initialProgress);
  }, []);

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const calculateQuestionScore = (question: any, response: any): number => {
    if (!question.scoring || response === null || response === undefined) {
      return 0;
    }

    switch (question.scoring.type) {
      case 'direct':
        return question.scoring.points || 0;
      
      case 'lookup':
        const lookupValue = typeof response === 'string' ? response.toLowerCase().trim() : response;
        return question.scoring.lookup?.[lookupValue] || 0;
      
      case 'custom':
        if (question.scoring.customScorer) {
          return question.scoring.customScorer(response);
        }
        return 0;
      
      default:
        return 0;
    }
  };

  const calculateSectionScore = (sectionId: string): number => {
    const section = mocaDefinition.sections.find(s => s.id === sectionId);
    if (!section) return 0;

    return section.questions.reduce((score, question) => {
      const response = responses[question.id];
      return score + calculateQuestionScore(question, response);
    }, 0);
  };

  const calculateTotalScore = (): number => {
    return mocaDefinition.sections.reduce((total, section) => {
      return total + calculateSectionScore(section.id);
    }, 0);
  };

  const applyEducationAdjustment = (rawScore: number, educationLevel: number): number => {
    const adjustment = mocaDefinition.scoringConfig.adjustments?.find(adj => 
      adj.type === 'education' && educationLevel <= adj.condition.value
    );
    
    return adjustment ? Math.min(30, rawScore + adjustment.adjustment) : rawScore;
  };

  const getRiskAssessment = (adjustedScore: number) => {
    const riskRange = mocaDefinition.riskMapping.ranges.find(range => 
      adjustedScore >= range.scoreRange.min && adjustedScore <= range.scoreRange.max
    );
    
    return riskRange || mocaDefinition.riskMapping.ranges[0];
  };

  const handleNext = () => {
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSectionIndex < totalSections - 1) {
      // Move to next section
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
      setShowInstructions(true);
    } else {
      // Assessment completed
      completeAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentSectionIndex > 0) {
      // Move to previous section
      const prevSection = mocaDefinition.sections[currentSectionIndex - 1];
      setCurrentSectionIndex(prev => prev - 1);
      setCurrentQuestionIndex(prevSection.questions.length - 1);
      setShowInstructions(false);
    }
  };

  const completeAssessment = () => {
    const rawScore = calculateTotalScore();
    const adjustedScore = applyEducationAdjustment(rawScore, 12); // Assuming 12 years education
    const riskRange = getRiskAssessment(adjustedScore);
    
    // Calculate section scores
    const sectionScores = {
      visuospatial: calculateSectionScore('visuospatial'),
      naming: calculateSectionScore('naming'),
      memory: calculateSectionScore('memory'),
      attention: calculateSectionScore('attention'),
      language: calculateSectionScore('language'),
      abstraction: calculateSectionScore('abstraction'),
      delayed_recall: calculateSectionScore('delayed_recall'),
      orientation: calculateSectionScore('orientation')
    };

    const result: MoCAResult = {
      sessionId: 'moca-' + Date.now(),
      testType: 'moca',
      rawScore,
      adjustedScore,
      sectionScores,
      educationAdjustment: adjustedScore - rawScore,
      riskAssessment: {
        testType: 'moca',
        rawScore,
        adjustedScore,
        riskPercentage: (riskRange.riskRange.min + riskRange.riskRange.max) / 2,
        riskCategory: riskRange.category,
        confidenceInterval: [riskRange.riskRange.min, riskRange.riskRange.max],
        factors: [],
        calculatedAt: new Date(),
        algorithm: 'threshold'
      },
      recommendations: riskRange.recommendations.map((rec, index) => ({
        id: `moca-rec-${index}`,
        type: 'medical',
        category: 'immediate',
        title: rec,
        description: rec,
        priority: riskRange.category === 'high' ? 'urgent' : 'medium'
      })),
      completionTime: Date.now() - startTime,
      metadata: {
        responses,
        version: mocaDefinition.metadata.version
      }
    };

    onComplete(result);
  };

  const renderCurrentQuestion = () => {
    if (!currentQuestion) return null;

    // Special handling for specific MoCA tasks
    switch (currentQuestion.id) {
      case 'moca_trail_making':
        return (
          <TrailMakingTask
            value={responses[currentQuestion.id]}
            onChange={(value) => handleResponseChange(currentQuestion.id, value)}
          />
        );
      
      case 'moca_naming_lion':
      case 'moca_naming_rhino':
      case 'moca_naming_camel':
        return (
          <NamingTask
            question={currentQuestion}
            value={responses[currentQuestion.id]}
            onChange={(value) => handleResponseChange(currentQuestion.id, value)}
          />
        );
      
      case 'moca_cube_copy':
      case 'moca_clock_drawing':
        return (
          <DrawingCanvas
            value={responses[currentQuestion.id]}
            onChange={(value) => handleResponseChange(currentQuestion.id, value)}
            instructions={currentQuestion.instructions}
            timeLimit={currentQuestion.timeLimit}
          />
        );
      
      case 'moca_memory_registration':
      case 'moca_delayed_recall':
        return (
          <MemoryTask
            question={currentQuestion}
            value={responses[currentQuestion.id]}
            onChange={(value) => handleResponseChange(currentQuestion.id, value)}
          />
        );
      
      case 'moca_digit_span_forward':
      case 'moca_digit_span_backward':
      case 'moca_vigilance':
        return (
          <AttentionTask
            question={currentQuestion}
            value={responses[currentQuestion.id]}
            onChange={(value) => handleResponseChange(currentQuestion.id, value)}
          />
        );
      
      default:
        return (
          <QuestionRenderer
            question={currentQuestion}
            value={responses[currentQuestion.id]}
            onChange={(value) => handleResponseChange(currentQuestion.id, value)}
          />
        );
    }
  };

  if (showInstructions && currentSection) {
    return (
      <>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('assessments.moca.name')}</IonTitle>
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
                <IonIcon icon={informationCircle} /> {currentSection.name}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText>
                <p>{currentSection.description}</p>
                <p><strong>{currentSection.instructions}</strong></p>
              </IonText>
              
              <div className="section-info">
                <IonText color="medium">
                  <p>
                    Preguntas en esta sección: {currentSection.questions.length}<br/>
                    Tiempo estimado: {Math.round((currentSection.timeLimit || 0) / 60)} minutos
                  </p>
                </IonText>
              </div>

              <IonButton 
                expand="block" 
                onClick={() => setShowInstructions(false)}
              >
                Comenzar Sección
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
          <IonTitle>{t('assessments.moca.name')}</IonTitle>
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
        <div className="moca-assessment">
          <div className="progress-info">
            <IonText color="medium">
              <p>
                Sección: {currentSection.name} ({currentSectionIndex + 1}/{totalSections})<br/>
                Pregunta: {currentQuestionIndex + 1}/{currentSection.questions.length}
              </p>
            </IonText>
          </div>

          {renderCurrentQuestion()}

          <div className="navigation-controls">
            <IonButton
              fill="outline"
              disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
              onClick={handlePrevious}
            >
              <IonIcon icon={arrowBack} slot="start" />
              Anterior
            </IonButton>

            <IonButton
              color="primary"
              onClick={handleNext}
            >
              {currentSectionIndex === totalSections - 1 && 
               currentQuestionIndex === currentSection.questions.length - 1 ? (
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
      </IonContent>
    </>
  );
};