// AccessibilityButton Component - Floating accessibility button
import React, { useState } from 'react';
import {
  IonFab,
  IonFabButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
} from '@ionic/react';
import { accessibilityOutline, closeOutline } from 'ionicons/icons';
import { AccessibilityPanel } from './AccessibilityPanel';
import { useAccessibility } from '../../hooks/useAccessibility';

interface AccessibilityButtonProps {
  position?: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start';
}

export const AccessibilityButton: React.FC<AccessibilityButtonProps> = ({
  position = 'bottom-end',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { speak } = useAccessibility();

  const handleOpenModal = () => {
    setIsModalOpen(true);
    speak('Panel de accesibilidad abierto');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    speak('Panel de accesibilidad cerrado');
  };

  return (
    <>
      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton
          onClick={handleOpenModal}
          aria-label="Abrir configuración de accesibilidad"
          title="Configuración de Accesibilidad"
        >
          <IonIcon icon={accessibilityOutline} />
        </IonFabButton>
      </IonFab>

      <IonModal isOpen={isModalOpen} onDidDismiss={handleCloseModal}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Accesibilidad</IonTitle>
            <IonButtons slot="end">
              <IonButton
                onClick={handleCloseModal}
                aria-label="Cerrar panel de accesibilidad"
              >
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <AccessibilityPanel />
        </IonContent>
      </IonModal>
    </>
  );
};