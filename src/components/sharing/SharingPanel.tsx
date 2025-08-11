import React, { useState } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel, IonInput, IonSpinner, IonToast, IonIcon } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { share, logoWhatsapp, mail, link } from 'ionicons/icons';
import './SharingPanel.css';

interface SharingPanelProps {
  assessmentData: any;
  onShare?: (platform: string, shareLink: string) => void;
}

export const SharingPanel: React.FC<SharingPanelProps> = ({ assessmentData, onShare }) => {
  const { t } = useTranslation();
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const generateSecureLink = async () => {
    setIsGeneratingLink(true);
    try {
      // Generate a secure, time-limited link
      const linkId = Math.random().toString(36).substring(2, 15);
      const expirationTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      
      const secureLink = `${window.location.origin}/shared/${linkId}?expires=${expirationTime}`;
      
      // In a real implementation, this would be stored in the database
      // with proper encryption and access controls
      localStorage.setItem(`share_${linkId}`, JSON.stringify({
        data: assessmentData,
        expires: expirationTime,
        created: Date.now()
      }));
      
      setShareLink(secureLink);
      setToastMessage(t('sharing.linkGenerated'));
      setShowToast(true);
    } catch (error) {
      console.error('Error generating share link:', error);
      setToastMessage(t('sharing.linkError'));
      setShowToast(true);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const shareViaWhatsApp = () => {
    if (!shareLink) {
      generateSecureLink().then(() => {
        const message = encodeURIComponent(`${t('sharing.whatsappMessage')}: ${shareLink}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
        onShare?.('whatsapp', shareLink);
      });
    } else {
      const message = encodeURIComponent(`${t('sharing.whatsappMessage')}: ${shareLink}`);
      window.open(`https://wa.me/?text=${message}`, '_blank');
      onShare?.('whatsapp', shareLink);
    }
  };

  const shareViaEmail = () => {
    if (!shareLink) {
      generateSecureLink().then(() => {
        const subject = encodeURIComponent(t('sharing.emailSubject'));
        const body = encodeURIComponent(`${t('sharing.emailBody')}\n\n${shareLink}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        onShare?.('email', shareLink);
      });
    } else {
      const subject = encodeURIComponent(t('sharing.emailSubject'));
      const body = encodeURIComponent(`${t('sharing.emailBody')}\n\n${shareLink}`);
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      onShare?.('email', shareLink);
    }
  };

  const copyToClipboard = async () => {
    if (!shareLink) {
      await generateSecureLink();
    }
    
    try {
      await navigator.clipboard.writeText(shareLink);
      setToastMessage(t('sharing.linkCopied'));
      setShowToast(true);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      setToastMessage(t('sharing.copyError'));
      setShowToast(true);
    }
  };

  return (
    <>
      <IonCard className="sharing-panel">
        <IonCardHeader>
          <IonCardTitle>{t('sharing.title')}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="sharing-options">
            <IonButton 
              expand="block" 
              fill="outline"
              onClick={generateSecureLink}
              disabled={isGeneratingLink}
            >
              {isGeneratingLink ? <IonSpinner /> : t('sharing.generateLink')}
            </IonButton>

            {shareLink && (
              <IonItem>
                <IonLabel position="stacked">{t('sharing.secureLink')}</IonLabel>
                <IonInput 
                  value={shareLink} 
                  readonly 
                  className="share-link-input"
                />
              </IonItem>
            )}

            <div className="sharing-buttons">
              <IonButton 
                expand="block" 
                color="success"
                onClick={shareViaWhatsApp}
                disabled={!shareLink && !isGeneratingLink}
              >
                <IonIcon icon={logoWhatsapp} slot="start" />
                {t('sharing.whatsapp')}
              </IonButton>

              <IonButton 
                expand="block" 
                color="primary"
                onClick={shareViaEmail}
                disabled={!shareLink && !isGeneratingLink}
              >
                <IonIcon icon={mail} slot="start" />
                {t('sharing.email')}
              </IonButton>

              <IonButton 
                expand="block" 
                fill="outline"
                onClick={copyToClipboard}
                disabled={!shareLink && !isGeneratingLink}
              >
                <IonIcon icon={link} slot="start" />
                {t('sharing.copyLink')}
              </IonButton>
            </div>

            <div className="sharing-info">
              <p className="sharing-disclaimer">
                {t('sharing.disclaimer')}
              </p>
              <p className="sharing-expiry">
                {t('sharing.expiryInfo')}
              </p>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="bottom"
      />
    </>
  );
};