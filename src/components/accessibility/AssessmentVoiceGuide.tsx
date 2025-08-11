// AssessmentVoiceGuide Component - Voice guidance for cognitive assessments
import React, { useEffect } from 'react';
import { useVoiceAnnouncement } from './VoiceGuidance';

interface AssessmentVoiceGuideProps {
  testName: string;
  currentQuestion: number;
  totalQuestions: number;
  questionText: string;
  instructions?: string;
  timeRemaining?: number;
  onQuestionChange?: boolean;
}

export const AssessmentVoiceGuide: React.FC<AssessmentVoiceGuideProps> = ({
  testName,
  currentQuestion,
  totalQuestions,
  questionText,
  instructions,
  timeRemaining,
  onQuestionChange = false,
}) => {
  const {
    announce,
    announceProgress,
    isVoiceEnabled,
  } = useVoiceAnnouncement();

  // Announce when starting the assessment
  useEffect(() => {
    if (currentQuestion === 1 && isVoiceEnabled) {
      const welcomeMessage = `Iniciando evaluación ${testName}. Total de preguntas: ${totalQuestions}. Puede navegar usando las teclas Tab y Enter, o tocar los botones en pantalla.`;
      announce(welcomeMessage, 1000);
    }
  }, [testName, totalQuestions, currentQuestion, announce, isVoiceEnabled]);

  // Announce question changes
  useEffect(() => {
    if (onQuestionChange && isVoiceEnabled && currentQuestion > 0) {
      announceProgress(currentQuestion, totalQuestions, 'Pregunta');
      
      // Announce instructions if provided
      if (instructions) {
        announce(instructions, 1500);
      }
      
      // Announce the question text
      announce(`Pregunta: ${questionText}`, instructions ? 3000 : 2000);
    }
  }, [
    currentQuestion,
    totalQuestions,
    questionText,
    instructions,
    onQuestionChange,
    announce,
    announceProgress,
    isVoiceEnabled,
  ]);

  // Announce time warnings
  useEffect(() => {
    if (timeRemaining && isVoiceEnabled) {
      if (timeRemaining === 60) {
        announce('Queda 1 minuto para completar esta sección');
      } else if (timeRemaining === 30) {
        announce('Quedan 30 segundos');
      } else if (timeRemaining === 10) {
        announce('Quedan 10 segundos');
      }
    }
  }, [timeRemaining, announce, isVoiceEnabled]);

  // This component doesn't render anything visible
  return null;
};

// Voice guidance for assessment completion
export const AssessmentCompletionVoiceGuide: React.FC<{
  testName: string;
  score?: number;
  maxScore?: number;
  riskLevel?: string;
}> = ({ testName, score, maxScore, riskLevel }) => {
  const { announce, isVoiceEnabled } = useVoiceAnnouncement();

  useEffect(() => {
    if (isVoiceEnabled) {
      let completionMessage = `Evaluación ${testName} completada.`;
      
      if (score !== undefined && maxScore !== undefined) {
        completionMessage += ` Puntuación obtenida: ${score} de ${maxScore}.`;
      }
      
      if (riskLevel) {
        const riskMessages = {
          low: 'Nivel de riesgo bajo',
          moderate: 'Nivel de riesgo moderado',
          high: 'Nivel de riesgo alto',
        };
        completionMessage += ` ${riskMessages[riskLevel as keyof typeof riskMessages] || riskLevel}.`;
      }
      
      completionMessage += ' Puede revisar los resultados detallados en la pantalla o continuar con otras evaluaciones.';
      
      announce(completionMessage, 1000);
    }
  }, [testName, score, maxScore, riskLevel, announce, isVoiceEnabled]);

  return null;
};

// Voice guidance for navigation
export const NavigationVoiceGuide: React.FC<{
  currentPage: string;
  availableActions?: string[];
}> = ({ currentPage, availableActions = [] }) => {
  const { announceNavigation, announce, isVoiceEnabled } = useVoiceAnnouncement();

  useEffect(() => {
    if (isVoiceEnabled) {
      announceNavigation(currentPage);
      
      if (availableActions.length > 0) {
        const actionsText = `Acciones disponibles: ${availableActions.join(', ')}`;
        announce(actionsText, 2000);
      }
    }
  }, [currentPage, availableActions, announceNavigation, announce, isVoiceEnabled]);

  return null;
};

// Voice guidance for form validation
export const FormValidationVoiceGuide: React.FC<{
  errors: Record<string, string>;
  fieldLabels: Record<string, string>;
}> = ({ errors, fieldLabels }) => {
  const { announceFormValidation, isVoiceEnabled } = useVoiceAnnouncement();

  useEffect(() => {
    if (isVoiceEnabled && Object.keys(errors).length > 0) {
      // Announce each error
      Object.entries(errors).forEach(([fieldName, errorMessage], index) => {
        const fieldLabel = fieldLabels[fieldName] || fieldName;
        const delay = index * 1500; // Stagger announcements
        setTimeout(() => {
          announceFormValidation(fieldLabel, errorMessage);
        }, delay);
      });
    }
  }, [errors, fieldLabels, announceFormValidation, isVoiceEnabled]);

  return null;
};