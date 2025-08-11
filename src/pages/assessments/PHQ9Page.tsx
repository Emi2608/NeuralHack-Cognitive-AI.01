import React from 'react';
import { IonPage } from '@ionic/react';
import { PHQ9Assessment } from '../../components/assessments/phq9/PHQ9Assessment';

export const PHQ9Page: React.FC = () => {
  return (
    <IonPage>
      <PHQ9Assessment />
    </IonPage>
  );
};