import React from 'react';
import { IonPage } from '@ionic/react';
import { MMSEAssessment } from '../../components/assessments/mmse/MMSEAssessment';

export const MMSEPage: React.FC = () => {
  return (
    <IonPage>
      <MMSEAssessment />
    </IonPage>
  );
};