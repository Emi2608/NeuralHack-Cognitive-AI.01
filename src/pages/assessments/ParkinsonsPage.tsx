import React from 'react';
import { IonPage } from '@ionic/react';
import { ParkinsonsAssessment } from '../../components/assessments/parkinsons/ParkinsonsAssessment';

export const ParkinsonsPage: React.FC = () => {
  return (
    <IonPage>
      <ParkinsonsAssessment />
    </IonPage>
  );
};