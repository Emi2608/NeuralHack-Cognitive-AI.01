import React, { useState, useEffect } from 'react';
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
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonAlert,
} from '@ionic/react';
import {
  checkmarkCircle,
  warningOutline,
  alertCircle,
  pulse,
  speedometer,
  bug,
  people,
  analytics,
} from 'ionicons/icons';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { monitoringService } from '../../services/monitoring.service';
import { analyticsService } from '../../services/analytics.service';
import './MonitoringDashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

interface SystemHealth {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  services: any[];
  metrics: any;
  active_alerts: any[];
}

interface UsageMetrics {
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  total_assessments: number;
  assessments_by_type: Record<string, number>;
  average_session_duration: number;
  bounce_rate: number;
  completion_rates: Record<string, number>;
}

export const MonitoringDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics | null>(null);
  const [errorMetrics, setErrorMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    loadDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

      const [healthData, usageData, errorData] = await Promise.all([
        monitoringService.getSystemHealth(),
        analyticsService.getUsageMetrics(startDate, endDate),
        analyticsService.getErrorMetrics(startDate, endDate),
      ]);

      setSystemHealth(healthData);
      setUsageMetrics(usageData);
      setErrorMetrics(errorData);

      // Check for critical alerts
      if (healthData.active_alerts.some(alert => alert.severity === 'critical')) {
        setAlertMessage('Sistema tiene alertas críticas que requieren atención inmediata');
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setAlertMessage('Error al cargar datos del dashboard');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadDashboardData();
    event.detail.complete();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'unhealthy':
        return 'danger';
      default:
        return 'medium';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return checkmarkCircle;
      case 'degraded':
        return warningOutline;
      case 'unhealthy':
        return alertCircle;
      default:
        return pulse;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'danger';
      case 'critical':
        return 'danger';
      default:
        return 'medium';
    }
  };

  // Chart data for response times
  const responseTimeData = {
    labels: systemHealth?.services.map(s => s.service) || [],
    datasets: [
      {
        label: 'Tiempo de Respuesta (ms)',
        data: systemHealth?.services.map(s => s.response_time) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  // Chart data for assessment types
  const assessmentTypeData = {
    labels: Object.keys(usageMetrics?.assessments_by_type || {}),
    datasets: [
      {
        label: 'Evaluaciones por Tipo',
        data: Object.values(usageMetrics?.assessments_by_type || {}),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
      },
    ],
  };

  if (loading && !systemHealth) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Dashboard de Monitoreo</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Cargando datos del sistema...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dashboard de Monitoreo</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="monitoring-dashboard">
          {/* System Health Overview */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={pulse} /> Estado General del Sistema
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="system-status">
                <IonBadge 
                  color={getStatusColor(systemHealth?.overall_status || 'medium')}
                  className="status-badge"
                >
                  <IonIcon icon={getStatusIcon(systemHealth?.overall_status || '')} />
                  {systemHealth?.overall_status === 'healthy' && 'Saludable'}
                  {systemHealth?.overall_status === 'degraded' && 'Degradado'}
                  {systemHealth?.overall_status === 'unhealthy' && 'No Saludable'}
                </IonBadge>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Key Metrics */}
          <IonGrid>
            <IonRow>
              <IonCol size="6" sizeMd="3">
                <IonCard className="metric-card">
                  <IonCardContent>
                    <div className="metric">
                      <IonIcon icon={people} className="metric-icon" />
                      <div className="metric-value">{usageMetrics?.daily_active_users || 0}</div>
                      <div className="metric-label">Usuarios Activos Hoy</div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              
              <IonCol size="6" sizeMd="3">
                <IonCard className="metric-card">
                  <IonCardContent>
                    <div className="metric">
                      <IonIcon icon={analytics} className="metric-icon" />
                      <div className="metric-value">{usageMetrics?.total_assessments || 0}</div>
                      <div className="metric-label">Evaluaciones Hoy</div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              
              <IonCol size="6" sizeMd="3">
                <IonCard className="metric-card">
                  <IonCardContent>
                    <div className="metric">
                      <IonIcon icon={speedometer} className="metric-icon" />
                      <div className="metric-value">
                        {systemHealth?.metrics.response_time_avg 
                          ? `${Math.round(systemHealth.metrics.response_time_avg)}ms`
                          : 'N/A'
                        }
                      </div>
                      <div className="metric-label">Tiempo Respuesta Promedio</div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              
              <IonCol size="6" sizeMd="3">
                <IonCard className="metric-card">
                  <IonCardContent>
                    <div className="metric">
                      <IonIcon icon={bug} className="metric-icon" />
                      <div className="metric-value">{errorMetrics?.total_errors || 0}</div>
                      <div className="metric-label">Errores Hoy</div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Service Health */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Estado de Servicios</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                {systemHealth?.services.map((service, index) => (
                  <IonItem key={index}>
                    <IonIcon 
                      icon={getStatusIcon(service.status)} 
                      color={getStatusColor(service.status)}
                      slot="start"
                    />
                    <IonLabel>
                      <h3>{service.service}</h3>
                      <p>Tiempo de respuesta: {service.response_time}ms</p>
                      {service.error_message && (
                        <p className="error-message">{service.error_message}</p>
                      )}
                    </IonLabel>
                    <IonBadge color={getStatusColor(service.status)} slot="end">
                      {service.status}
                    </IonBadge>
                  </IonItem>
                ))}
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Active Alerts */}
          {systemHealth?.active_alerts && systemHealth.active_alerts.length > 0 && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={alertCircle} /> Alertas Activas
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList>
                  {systemHealth.active_alerts.map((alert, index) => (
                    <IonItem key={index}>
                      <IonIcon 
                        icon={alertCircle} 
                        color={getSeverityColor(alert.severity)}
                        slot="start"
                      />
                      <IonLabel>
                        <h3>{alert.message}</h3>
                        <p>Tipo: {alert.alert_type}</p>
                        <p>Activada: {new Date(alert.triggered_at).toLocaleString()}</p>
                      </IonLabel>
                      <IonBadge color={getSeverityColor(alert.severity)} slot="end">
                        {alert.severity}
                      </IonBadge>
                    </IonItem>
                  ))}
                </IonList>
              </IonCardContent>
            </IonCard>
          )}

          {/* Charts */}
          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="6">
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Tiempos de Respuesta por Servicio</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="chart-container">
                      <Line 
                        data={responseTimeData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            },
                          },
                        }}
                      />
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              
              <IonCol size="12" sizeMd="6">
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Evaluaciones por Tipo</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="chart-container">
                      <Doughnut 
                        data={assessmentTypeData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom' as const,
                            },
                          },
                        }}
                      />
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Usage Statistics */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Estadísticas de Uso</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol size="6" sizeMd="3">
                    <div className="stat">
                      <div className="stat-value">{usageMetrics?.weekly_active_users || 0}</div>
                      <div className="stat-label">Usuarios Semanales</div>
                    </div>
                  </IonCol>
                  <IonCol size="6" sizeMd="3">
                    <div className="stat">
                      <div className="stat-value">{usageMetrics?.monthly_active_users || 0}</div>
                      <div className="stat-label">Usuarios Mensuales</div>
                    </div>
                  </IonCol>
                  <IonCol size="6" sizeMd="3">
                    <div className="stat">
                      <div className="stat-value">
                        {usageMetrics?.average_session_duration 
                          ? `${Math.round(usageMetrics.average_session_duration / 1000)}s`
                          : 'N/A'
                        }
                      </div>
                      <div className="stat-label">Duración Promedio Sesión</div>
                    </div>
                  </IonCol>
                  <IonCol size="6" sizeMd="3">
                    <div className="stat">
                      <div className="stat-value">
                        {usageMetrics?.bounce_rate 
                          ? `${Math.round(usageMetrics.bounce_rate * 100)}%`
                          : 'N/A'
                        }
                      </div>
                      <div className="stat-label">Tasa de Rebote</div>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        </div>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Alerta del Sistema"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};