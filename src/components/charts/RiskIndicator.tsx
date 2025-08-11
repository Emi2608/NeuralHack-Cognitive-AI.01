import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonText, IonIcon, IonBadge } from '@ionic/react';
import { alertCircle, checkmarkCircle, warningOutline, informationCircle } from 'ionicons/icons';
import type { RiskCategory } from '../../types/assessment';
import './RiskIndicator.css';

interface RiskIndicatorProps {
  riskPercentage: number;
  category?: RiskCategory;
  title?: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showDetails?: boolean;
  compact?: boolean;
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  riskPercentage,
  category,
  title,
  size = 'medium',
  showLabel = true,
  showDetails = true,
  compact = false
}) => {
  // Determine category from percentage if not provided
  const riskCategory = category || getRiskCategoryFromPercentage(riskPercentage);
  
  const getRiskConfig = (cat: RiskCategory) => {
    switch (cat) {
      case 'low':
        return {
          color: 'success',
          icon: checkmarkCircle,
          label: 'Riesgo Bajo',
          description: 'Resultados dentro del rango normal',
          bgClass: 'risk-low',
          textColor: '#059669'
        };
      case 'moderate':
        return {
          color: 'warning',
          icon: warningOutline,
          label: 'Riesgo Moderado',
          description: 'Se recomienda seguimiento',
          bgClass: 'risk-moderate',
          textColor: '#d97706'
        };
      case 'high':
        return {
          color: 'danger',
          icon: alertCircle,
          label: 'Riesgo Alto',
          description: 'Se recomienda consulta médica',
          bgClass: 'risk-high',
          textColor: '#dc2626'
        };
      default:
        return {
          color: 'medium',
          icon: informationCircle,
          label: 'Sin Evaluar',
          description: 'No hay datos suficientes',
          bgClass: 'risk-unknown',
          textColor: '#6b7280'
        };
    }
  };

  function getRiskCategoryFromPercentage(percentage: number): RiskCategory {
    if (percentage <= 5) return 'low';
    if (percentage <= 40) return 'moderate';
    return 'high';
  }

  const config = getRiskConfig(riskCategory);
  const sizeClass = `risk-indicator-${size}`;
  const compactClass = compact ? 'risk-indicator-compact' : '';

  if (compact) {
    return (
      <div className={`risk-indicator ${sizeClass} ${compactClass} ${config.bgClass}`}>
        <div className="risk-icon">
          <IonIcon icon={config.icon} color={config.color} />
        </div>
        <div className="risk-content">
          <div className="risk-percentage" style={{ color: config.textColor }}>
            {riskPercentage}%
          </div>
          {showLabel && (
            <div className="risk-label">{config.label}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <IonCard className={`risk-indicator-card ${sizeClass} ${config.bgClass}`}>
      {title && (
        <IonCardHeader>
          <IonCardTitle>{title}</IonCardTitle>
        </IonCardHeader>
      )}
      <IonCardContent>
        <div className="risk-indicator-content">
          <div className="risk-visual">
            <div className="risk-circle" style={{ borderColor: config.textColor }}>
              <IonIcon icon={config.icon} color={config.color} />
              <div className="risk-percentage" style={{ color: config.textColor }}>
                {riskPercentage}%
              </div>
            </div>
          </div>
          
          <div className="risk-info">
            <IonBadge color={config.color} className="risk-badge">
              {config.label}
            </IonBadge>
            
            {showDetails && (
              <IonText color="medium" className="risk-description">
                <p>{config.description}</p>
              </IonText>
            )}
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};