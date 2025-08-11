import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonInput,
  IonText,
  IonIcon,
  IonButton
} from '@ionic/react';
import { eye, checkmark, close } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import './NamingTask.css';

interface NamingTaskProps {
  question: any;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

interface AnimalData {
  id: string;
  name: string;
  image: string;
  acceptedAnswers: string[];
}

const animals: AnimalData[] = [
  {
    id: 'lion',
    name: 'León',
    image: '🦁', // Using emoji as placeholder for actual images
    acceptedAnswers: ['león', 'leon', 'leona']
  },
  {
    id: 'rhino',
    name: 'Rinoceronte',
    image: '🦏',
    acceptedAnswers: ['rinoceronte', 'rino']
  },
  {
    id: 'camel',
    name: 'Camello',
    image: '🐪',
    acceptedAnswers: ['camello', 'dromedario']
  }
];

export const NamingTask: React.FC<NamingTaskProps> = ({
  question,
  value,
  onChange,
  disabled = false
}) => {
  const { t } = useTranslation();
  const [currentAnswer, setCurrentAnswer] = useState<string>(value || '');
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  // Get animal data based on question ID
  const getAnimalFromQuestion = () => {
    if (question.id.includes('lion')) return animals[0];
    if (question.id.includes('rhino')) return animals[1];
    if (question.id.includes('camel')) return animals[2];
    return animals[0]; // fallback
  };

  const animal = getAnimalFromQuestion();

  useEffect(() => {
    setCurrentAnswer(value || '');
  }, [value]);

  const handleInputChange = (inputValue: string) => {
    setCurrentAnswer(inputValue);
    onChange(inputValue);
    setShowFeedback(false);
  };

  const checkAnswer = () => {
    const normalizedAnswer = currentAnswer.toLowerCase().trim();
    const correct = animal.acceptedAnswers.some(accepted => 
      accepted.toLowerCase() === normalizedAnswer
    );
    
    setIsCorrect(correct);
    setShowFeedback(true);
  };

  const getHint = () => {
    const hints = {
      lion: 'Es el rey de la selva, tiene melena',
      rhino: 'Es un animal grande con cuerno en la nariz',
      camel: 'Vive en el desierto y tiene jorobas'
    };
    return hints[animal.id as keyof typeof hints];
  };

  return (
    <IonCard className="naming-task">
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={eye} /> {t('moca.tasks.naming.title')}
        </IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        <div className="animal-display">
          <div className="animal-image">
            <span className="animal-emoji">{animal.image}</span>
          </div>
          
          <div className="animal-question">
            <IonText>
              <h3>{question.text}</h3>
              <p>{question.instructions}</p>
            </IonText>
          </div>
        </div>

        <div className="answer-input">
          <IonItem>
            <IonInput
              value={currentAnswer}
              onIonInput={(e) => handleInputChange(e.detail.value!)}
              placeholder="Escriba el nombre del animal..."
              disabled={disabled}
              clearInput
            />
          </IonItem>
        </div>

        {!disabled && (
          <div className="task-controls">
            <IonButton
              fill="outline"
              onClick={checkAnswer}
              disabled={!currentAnswer.trim()}
            >
              Verificar Respuesta
            </IonButton>
          </div>
        )}

        {showFeedback && (
          <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="feedback-icon">
              <IonIcon 
                icon={isCorrect ? checkmark : close} 
                color={isCorrect ? 'success' : 'danger'}
              />
            </div>
            <div className="feedback-text">
              {isCorrect ? (
                <IonText color="success">
                  <p><strong>¡Correcto!</strong> Es un {animal.name.toLowerCase()}.</p>
                </IonText>
              ) : (
                <IonText color="danger">
                  <div>
                    <p><strong>Incorrecto.</strong></p>
                    <p><em>Pista: {getHint()}</em></p>
                    <p>Respuesta correcta: <strong>{animal.name}</strong></p>
                  </div>
                </IonText>
              )}
            </div>
          </div>
        )}

        <div className="task-info">
          <IonText color="medium">
            <small>
              Respuestas aceptadas: {animal.acceptedAnswers.join(', ')}
            </small>
          </IonText>
        </div>
      </IonCardContent>
    </IonCard>
  );
};