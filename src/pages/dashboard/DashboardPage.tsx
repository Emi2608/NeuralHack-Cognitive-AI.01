import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonList,
  IonBackButton,
  IonButtons,
} from '@ionic/react';
import {
  heartOutline,
  eyeOutline,
  walkOutline,
  statsChartOutline,
  documentTextOutline,
  medicalOutline,
} from 'ionicons/icons';
import { ResponsiveContainer } from '../../components/layout';
import { ROUTES } from '../../constants/routes';
import './DashboardPage.css';


export const DashboardPage: React.FC = () => {
  const history = useHistory();

  const handleStartAssessment = (assessmentId: string) => {
    // Navigate to the specific assessment
    switch (assessmentId) {
      case 'moca':
        history.push(ROUTES.ASSESSMENT_MOCA);
        break;
      case 'phq9':
        history.push(ROUTES.ASSESSMENT_PHQ9);
        break;
      case 'mmse':
        history.push(ROUTES.ASSESSMENT_MMSE);
        break;
      case 'ad8':
        history.push(ROUTES.ASSESSMENT_AD8);
        break;
      case 'parkinsons':
        history.push(ROUTES.ASSESSMENT_PARKINSONS);
        break;
      default:
        console.warn('Assessment not implemented:', assessmentId);
    }
  };

  const assessmentTypes = [
    {
      id: 'moca',
      name: 'MoCA',
      fullName: 'Evaluación Cognitiva de Montreal',
      description: 'Evaluación cognitiva breve para detectar deterioro cognitivo leve',
      icon: medicalOutline,
      duration: '15 min',
      color: 'primary',
    },
    {
      id: 'phq9',
      name: 'PHQ-9',
      fullName: 'Cuestionario de Salud del Paciente-9',
      description: 'Herramienta de detección y evaluación de la gravedad de la depresión',
      icon: heartOutline,
      duration: '5 min',
      color: 'secondary',
    },
    {
      id: 'mmse',
      name: 'MMSE',
      fullName: 'Mini Examen del Estado Mental',
      description: 'Evaluación cognitiva estándar para detectar demencia',
      icon: eyeOutline,
      duration: '10 min',
      color: 'tertiary',
    },
    {
      id: 'ad8',
      name: 'AD8',
      fullName: 'Entrevista de Detección de Demencia AD8',
      description: 'Cuestionario breve para detectar cambios cognitivos',
      icon: documentTextOutline,
      duration: '3 min',
      color: 'success',
    },
    {
      id: 'parkinsons',
      name: 'Parkinson',
      fullName: 'Evaluación de Síntomas de Parkinson',
      description: 'Cuestionario para detectar síntomas tempranos de Parkinson',
      icon: walkOutline,
      duration: '8 min',
      color: 'warning',
    },
  ];

  return (
    <IonPage className="dashboard-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/test" />
          </IonButtons>
          <IonTitle>Dashboard de Resultados</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <ResponsiveContainer maxWidth="lg">
        {/* Welcome Section */}
        <IonCard className="welcome-section">
          <IonCardHeader>
            <IonCardTitle>¡Bienvenido a NeuralHack Cognitive AI!</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>
              Plataforma de evaluación cognitiva para la detección temprana de 
              enfermedades neurodegenerativas y trastornos del estado de ánimo.
            </p>
            <p>
              <strong>Características principales:</strong>
            </p>
            <IonList>
              <IonItem lines="none">
                <IonIcon icon={medicalOutline} slot="start" color="primary" />
                <IonLabel>Evaluaciones cognitivas validadas científicamente</IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonIcon icon={statsChartOutline} slot="start" color="secondary" />
                <IonLabel>Análisis de riesgo personalizado</IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonIcon icon={documentTextOutline} slot="start" color="tertiary" />
                <IonLabel>Recomendaciones basadas en evidencia</IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Available Assessments */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Evaluaciones Disponibles</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonGrid className="assessment-grid">
              <IonRow>
                {assessmentTypes.map((assessment) => (
                  <IonCol size="12" sizeMd="6" key={assessment.id}>
                    <IonCard button>
                      <IonCardContent>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <IonIcon
                            icon={assessment.icon}
                            size="large"
                            color={assessment.color}
                            style={{ marginRight: '12px' }}
                          />
                          <div>
                            <h3 style={{ margin: '0 0 4px 0' }}>{assessment.name}</h3>
                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--ion-color-medium)' }}>
                              {assessment.duration}
                            </p>
                          </div>
                        </div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                          {assessment.fullName}
                        </h4>
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
                          {assessment.description}
                        </p>
                        <IonButton
                          fill="solid"
                          size="small"
                          color={assessment.color}
                          onClick={() => handleStartAssessment(assessment.id)}
                        >
                          Iniciar Evaluación
                        </IonButton>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Development Status */}
        <IonCard className="status-section">
          <IonCardHeader>
            <IonCardTitle>Estado del Desarrollo</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>
              <strong>✅ Completado:</strong>
            </p>
            <IonList>
              <IonItem lines="none">
                <IonLabel>• Estructura base del proyecto</IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonLabel>• Sistema de autenticación</IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonLabel>• Motor de evaluaciones cognitivas</IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonLabel>• Sistema de cálculo de riesgo</IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonLabel>• Dashboard de resultados</IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonLabel>• Características de accesibilidad completas</IonLabel>
              </IonItem>
            </IonList>
            
            <p style={{ marginTop: '16px' }}>
              <strong>🚧 En desarrollo:</strong>
            </p>
            <IonList>
              <IonItem lines="none">
                <IonLabel>• Funcionalidad offline</IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonLabel>• Exportación de datos</IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonLabel>• Contenido educativo</IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Export and Sharing Section */}
        {/* Export and sharing panels will be added here */}

        {/* Accessibility Note */}
        <IonCard className="accessibility-note">
          <IonCardContent>
            <p style={{ textAlign: 'center', margin: 0 }}>
              <strong>💡 Consejo:</strong> Use el botón de accesibilidad (♿) en la esquina 
              inferior derecha para personalizar la experiencia según sus necesidades.
            </p>
          </IonCardContent>
        </IonCard>
        </ResponsiveContainer>
      </IonContent>
    </IonPage>
  );
};