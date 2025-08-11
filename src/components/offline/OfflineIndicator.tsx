// OfflineIndicator Component - Shows offline status and sync information
import React, { useState } from 'react';
import {
  IonBadge,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonProgressBar,
  IonNote,
  IonAlert,
} from '@ionic/react';
import {
  cloudOfflineOutline,
  cloudDoneOutline,
  syncOutline,
  informationCircleOutline,
  trashOutline,
  closeOutline,
} from 'ionicons/icons';
import { useOffline } from '../../hooks/useOffline';
import './OfflineIndicator.css';

interface OfflineIndicatorProps {
  showDetails?: boolean;
  position?: 'top' | 'bottom';
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showDetails = true,
  position = 'top',
}) => {
  const {
    isOnline,
    pendingOperations,
    syncInProgress,
    lastSyncAttempt,
    storageInfo,
    syncNow,
    clearOfflineData,
    getFormattedStorageInfo,
    isStorageNearlyFull,
  } = useOffline();

  const [showModal, setShowModal] = useState(false);
  const [showClearAlert, setShowClearAlert] = useState(false);

  const formattedStorage = getFormattedStorageInfo();
  const storageNearlyFull = isStorageNearlyFull();

  const handleSync = async () => {
    const success = await syncNow();
    if (success) {
      console.log('Manual sync completed');
    }
  };

  const handleClearData = async () => {
    const success = await clearOfflineData();
    if (success) {
      console.log('Offline data cleared');
      setShowClearAlert(false);
    }
  };

  const getLastSyncText = () => {
    if (!lastSyncAttempt) return 'Nunca';
    
    const now = Date.now();
    const diff = now - lastSyncAttempt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Hace un momento';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'warning';
    if (pendingOperations > 0) return 'medium';
    return 'success';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Sin conexión';
    if (syncInProgress) return 'Sincronizando...';
    if (pendingOperations > 0) return `${pendingOperations} pendiente${pendingOperations > 1 ? 's' : ''}`;
    return 'Sincronizado';
  };

  if (!showDetails && isOnline && pendingOperations === 0) {
    return null; // Don't show indicator when everything is fine
  }

  return (
    <>
      <div className={`offline-indicator offline-indicator-${position}`}>
        <IonButton
          fill="clear"
          size="small"
          onClick={() => setShowModal(true)}
          className="offline-status-button"
        >
          <IonIcon
            icon={isOnline ? cloudDoneOutline : cloudOfflineOutline}
            color={getStatusColor()}
            slot="start"
          />
          <span className="offline-status-text">
            {getStatusText()}
          </span>
          {pendingOperations > 0 && (
            <IonBadge color="medium" className="offline-badge">
              {pendingOperations}
            </IonBadge>
          )}
        </IonButton>
      </div>

      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Estado de Sincronización</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModal(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            {/* Connection Status */}
            <IonItem>
              <IonIcon
                icon={isOnline ? cloudDoneOutline : cloudOfflineOutline}
                color={isOnline ? 'success' : 'warning'}
                slot="start"
              />
              <IonLabel>
                <h3>Estado de Conexión</h3>
                <p>{isOnline ? 'Conectado' : 'Sin conexión'}</p>
              </IonLabel>
            </IonItem>

            {/* Pending Operations */}
            <IonItem>
              <IonIcon icon={syncOutline} color="medium" slot="start" />
              <IonLabel>
                <h3>Operaciones Pendientes</h3>
                <p>{pendingOperations} operación{pendingOperations !== 1 ? 'es' : ''} esperando sincronización</p>
              </IonLabel>
              {pendingOperations > 0 && (
                <IonBadge color="medium">{pendingOperations}</IonBadge>
              )}
            </IonItem>

            {/* Sync Status */}
            <IonItem>
              <IonLabel>
                <h3>Última Sincronización</h3>
                <p>{getLastSyncText()}</p>
              </IonLabel>
            </IonItem>

            {/* Sync Progress */}
            {syncInProgress && (
              <IonItem>
                <IonLabel>
                  <h3>Sincronizando...</h3>
                  <IonProgressBar type="indeterminate" />
                </IonLabel>
              </IonItem>
            )}

            {/* Storage Information */}
            <IonItem>
              <IonIcon icon={informationCircleOutline} color="primary" slot="start" />
              <IonLabel>
                <h3>Almacenamiento Local</h3>
                <p>Datos offline: {formattedStorage.offlineDataSize}</p>
                <p>Total usado: {formattedStorage.totalSize}</p>
                <p>Uso: {formattedStorage.usagePercentage}%</p>
                {storageNearlyFull && (
                  <IonNote color="warning">
                    ⚠️ Almacenamiento casi lleno
                  </IonNote>
                )}
              </IonLabel>
            </IonItem>

            {/* Storage Usage Bar */}
            <IonItem lines="none">
              <IonLabel>
                <IonProgressBar 
                  value={formattedStorage.usagePercentage / 100}
                  color={storageNearlyFull ? 'warning' : 'primary'}
                />
              </IonLabel>
            </IonItem>
          </IonList>

          {/* Action Buttons */}
          <div className="offline-actions">
            <IonButton
              expand="block"
              fill="outline"
              onClick={handleSync}
              disabled={!isOnline || syncInProgress}
              className="offline-action-button"
            >
              <IonIcon icon={syncOutline} slot="start" />
              {syncInProgress ? 'Sincronizando...' : 'Sincronizar Ahora'}
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              color="danger"
              onClick={() => setShowClearAlert(true)}
              className="offline-action-button"
            >
              <IonIcon icon={trashOutline} slot="start" />
              Limpiar Datos Offline
            </IonButton>
          </div>

          {/* Information */}
          <div className="offline-info">
            <IonNote>
              <strong>Información:</strong> Los datos se guardan localmente cuando no hay conexión 
              y se sincronizan automáticamente cuando la conexión se restaura.
            </IonNote>
          </div>
        </IonContent>
      </IonModal>

      {/* Clear Data Confirmation */}
      <IonAlert
        isOpen={showClearAlert}
        onDidDismiss={() => setShowClearAlert(false)}
        header="Confirmar Limpieza"
        message="¿Está seguro de que desea eliminar todos los datos offline? Esta acción no se puede deshacer."
        buttons={[
          {
            text: 'Cancelar',
            role: 'cancel',
          },
          {
            text: 'Eliminar',
            role: 'destructive',
            handler: handleClearData,
          },
        ]}
      />
    </>
  );
};