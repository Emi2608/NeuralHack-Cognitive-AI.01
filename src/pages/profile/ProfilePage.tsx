import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonModal,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonIcon,
  IonList,
  IonAlert,
  IonBackButton,
  IonButtons,
} from '@ionic/react';
import {
  settingsOutline,
  keyOutline,
  downloadOutline,
  trashOutline,
  logOutOutline,
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { ProfileSettingsForm } from '../../components/forms/ProfileSettingsForm';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { user, signOut } = useAuth();

  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showSignOutAlert, setShowSignOutAlert] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    history.push(ROUTES.LOGIN);
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion
    console.log('Delete account requested');
    setShowDeleteAlert(false);
  };

  const handleExportData = () => {
    // TODO: Implement data export
    console.log('Export data requested');
  };

  const calculateAge = (dateOfBirth: Date): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  if (!user) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonText>
            <p>{t('auth.notAuthenticated')}</p>
          </IonText>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/test" />
          </IonButtons>
          <IonTitle>{t('profile.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        {/* User Information Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{t('profile.personalInfo')}</IonCardTitle>
          </IonCardHeader>
          
          <IonCardContent>
            <IonText>
              <p><strong>{t('auth.email')}:</strong> {user.email}</p>
              <p><strong>{t('profile.age')}:</strong> {calculateAge(user.dateOfBirth)} {t('auth.years')}</p>
              <p><strong>{t('auth.educationLevel')}:</strong> {user.educationLevel} {t('auth.years')}</p>
              <p><strong>{t('profile.memberSince')}:</strong> {user.createdAt.toLocaleDateString('es-MX')}</p>
            </IonText>
          </IonCardContent>
        </IonCard>

        {/* Accessibility Status Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{t('accessibility.title')}</IonCardTitle>
          </IonCardHeader>
          
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonLabel>
                  <h3>{t('accessibility.highContrast.title')}</h3>
                  <p>{user.accessibilitySettings.highContrast ? t('common.yes') : t('common.no')}</p>
                </IonLabel>
              </IonItem>
              
              <IonItem>
                <IonLabel>
                  <h3>{t('accessibility.fontSize.title')}</h3>
                  <p>{t(`accessibility.fontSize.${user.accessibilitySettings.fontSize}`)}</p>
                </IonLabel>
              </IonItem>
              
              <IonItem>
                <IonLabel>
                  <h3>{t('accessibility.voiceGuidance.title')}</h3>
                  <p>{user.accessibilitySettings.voiceGuidance ? t('common.yes') : t('common.no')}</p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Actions Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{t('profile.actions')}</IonCardTitle>
          </IonCardHeader>
          
          <IonCardContent>
            <IonList>
              {/* Settings */}
              <IonItem button onClick={() => setShowSettings(true)}>
                <IonIcon icon={settingsOutline} slot="start" />
                <IonLabel>
                  <h3>{t('profile.settings')}</h3>
                  <p>{t('profile.settingsDescription')}</p>
                </IonLabel>
              </IonItem>

              {/* Change Password */}
              <IonItem button onClick={() => history.push(ROUTES.PROFILE + '/change-password')}>
                <IonIcon icon={keyOutline} slot="start" />
                <IonLabel>
                  <h3>{t('profile.changePassword')}</h3>
                  <p>{t('profile.changePasswordDescription')}</p>
                </IonLabel>
              </IonItem>

              {/* Export Data */}
              <IonItem button onClick={handleExportData}>
                <IonIcon icon={downloadOutline} slot="start" />
                <IonLabel>
                  <h3>{t('profile.exportData')}</h3>
                  <p>{t('profile.exportDataDescription')}</p>
                </IonLabel>
              </IonItem>

              {/* Sign Out */}
              <IonItem button onClick={() => setShowSignOutAlert(true)}>
                <IonIcon icon={logOutOutline} slot="start" />
                <IonLabel>
                  <h3>{t('auth.signOut')}</h3>
                  <p>{t('profile.signOutDescription')}</p>
                </IonLabel>
              </IonItem>

              {/* Delete Account */}
              <IonItem button onClick={() => setShowDeleteAlert(true)}>
                <IonIcon icon={trashOutline} slot="start" color="danger" />
                <IonLabel color="danger">
                  <h3>{t('profile.deleteAccount')}</h3>
                  <p>{t('profile.deleteAccountDescription')}</p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Settings Modal */}
        <IonModal isOpen={showSettings} onDidDismiss={() => setShowSettings(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('profile.settings')}</IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={() => setShowSettings(false)}
              >
                {t('common.close')}
              </IonButton>
            </IonToolbar>
          </IonHeader>
          
          <IonContent className="ion-padding">
            <ProfileSettingsForm
              onSave={() => setShowSettings(false)}
              onCancel={() => setShowSettings(false)}
            />
          </IonContent>
        </IonModal>

        {/* Sign Out Alert */}
        <IonAlert
          isOpen={showSignOutAlert}
          onDidDismiss={() => setShowSignOutAlert(false)}
          header={t('auth.signOut')}
          message={t('profile.signOutConfirmation')}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel',
            },
            {
              text: t('auth.signOut'),
              handler: handleSignOut,
            },
          ]}
        />

        {/* Delete Account Alert */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={t('profile.deleteAccount')}
          message={t('profile.deleteAccountConfirmation')}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel',
            },
            {
              text: t('profile.deleteAccount'),
              handler: handleDeleteAccount,
              cssClass: 'alert-button-danger',
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};