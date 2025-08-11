import React from 'react';
import { IonPage } from '@ionic/react';
import { AD8Assessment } from '../../components/assessments/ad8/AD8Assessment';

export const AD8Page: React.FC = () => {
  return (
    <IonPage>
      <AD8Assessment />
    </IonPage>
  );
};