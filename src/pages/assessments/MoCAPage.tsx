import React from 'react';
import { IonPage } from '@ionic/react';
import { MoCAAssessment } from '../../components/assessments/moca/MoCAAssessment';

export const MoCAPage: React.FC = () => {
  return (
    <IonPage>
      <MoCAAssessment />
    </IonPage>
  );
};