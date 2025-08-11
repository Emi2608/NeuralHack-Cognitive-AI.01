import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonText } from '@ionic/react';
import './BaseChart.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface BaseChartProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
  height?: number;
}

export const BaseChart: React.FC<BaseChartProps> = ({
  title,
  subtitle,
  children,
  className = '',
  loading = false,
  error,
  height = 300
}) => {
  if (loading) {
    return (
      <IonCard className={`base-chart loading ${className}`}>
        <IonCardContent>
          <div className="chart-loading">
            <div className="loading-spinner"></div>
            <IonText color="medium">
              <p>Cargando gráfico...</p>
            </IonText>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  if (error) {
    return (
      <IonCard className={`base-chart error ${className}`}>
        <IonCardContent>
          <div className="chart-error">
            <IonText color="danger">
              <h3>Error al cargar gráfico</h3>
              <p>{error}</p>
            </IonText>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard className={`base-chart ${className}`}>
      {(title || subtitle) && (
        <IonCardHeader>
          {title && <IonCardTitle>{title}</IonCardTitle>}
          {subtitle && (
            <IonText color="medium">
              <p className="chart-subtitle">{subtitle}</p>
            </IonText>
          )}
        </IonCardHeader>
      )}
      <IonCardContent>
        <div className="chart-container" style={{ height: `${height}px` }}>
          {children}
        </div>
      </IonCardContent>
    </IonCard>
  );
};