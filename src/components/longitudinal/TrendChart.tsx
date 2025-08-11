import React, { useState, useEffect, useRef } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  IonText,
  IonIcon,
  IonButton,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import {
  trendingUpOutline,
  trendingDownOutline,
  removeOutline,
  analyticsOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { Chart, registerables } from 'chart.js';
import { AssessmentService } from '../../services/assessment.service';
import { LongitudinalService } from '../../services/longitudinal.service';
import { AssessmentResult } from '../../types/assessment';
import { TrendAnalysis } from '../../types/longitudinal';
import './TrendChart.css';

Chart.register(...registerables);

interface TrendChartProps {
  userId: string;
  testType?: string;
  height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  userId,
  testType,
  height = 300
}) => {
  const { t } = useTranslation();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [trends, setTrends] = useState<TrendAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestType, setSelectedTestType] = useState<string>(testType || 'all');
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('quarter');

  useEffect(() => {
    loadData();
  }, [userId, selectedTestType]);

  useEffect(() => {
    if (assessments.length > 0) {
      renderChart();
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [assessments, timeframe]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load assessment history
      const history = await AssessmentService.getAssessmentHistory(userId);
      let filteredHistory = history;
      
      if (selectedTestType !== 'all') {
        filteredHistory = history.filter((a: any) => a.testType === selectedTestType);
      }
      
      setAssessments(filteredHistory);
      
      // Load trend analysis
      const trendAnalysis = await LongitudinalService.generateTrendAnalysis(
        userId, 
        selectedTestType !== 'all' ? selectedTestType : undefined
      );
      setTrends(trendAnalysis);
      
    } catch (error) {
      console.error('Error loading trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!chartRef.current || assessments.length < 2) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Filter assessments by timeframe
    const now = new Date();
    const timeframeDays = {
      month: 30,
      quarter: 90,
      year: 365
    };
    
    const cutoffDate = new Date(now.getTime() - timeframeDays[timeframe] * 24 * 60 * 60 * 1000);
    const filteredAssessments = assessments.filter(a => 
      new Date(a.completedAt) >= cutoffDate
    );

    if (filteredAssessments.length < 2) {
      return;
    }

    // Group by test type
    const testTypes = [...new Set(filteredAssessments.map(a => a.testType))];
    const datasets = testTypes.map((type, index) => {
      const typeAssessments = filteredAssessments
        .filter(a => a.testType === type)
        .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

      const colors = [
        'rgb(54, 162, 235)',   // Blue
        'rgb(255, 99, 132)',   // Red
        'rgb(75, 192, 192)',   // Teal
        'rgb(255, 205, 86)',   // Yellow
        'rgb(153, 102, 255)',  // Purple
      ];

      return {
        label: type.toUpperCase(),
        data: typeAssessments.map(a => ({
          x: new Date(a.completedAt),
          y: a.adjustedScore
        })),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        fill: false,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6
      };
    });

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: { datasets } as any,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: timeframe === 'month' ? 'day' : timeframe === 'quarter' ? 'week' : 'month',
              displayFormats: {
                day: 'MMM dd',
                week: 'MMM dd',
                month: 'MMM yyyy'
              }
            },
            title: {
              display: true,
              text: t('longitudinal.chart.date')
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: t('longitudinal.chart.score')
            }
          }
        },
        plugins: {
          legend: {
            display: testTypes.length > 1,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              title: (context) => {
                const date = new Date(context[0].parsed.x);
                return new Intl.DateTimeFormat('es-MX', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }).format(date);
              },
              label: (context) => {
                return `${context.dataset.label}: ${context.parsed.y}`;
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  };

  const getTrendDirection = (testType: string) => {
    const testTrends = trends.filter(t => 
      t.testType === testType && t.timeframe === timeframe
    );
    
    if (testTrends.length === 0) return null;
    
    const latestTrend = testTrends[testTrends.length - 1];
    return latestTrend.direction;
  };

  const getTrendIcon = (direction: string | null) => {
    switch (direction) {
      case 'improving': return trendingUpOutline;
      case 'declining': return trendingDownOutline;
      case 'stable': return removeOutline;
      default: return informationCircleOutline;
    }
  };

  const getTrendColor = (direction: string | null) => {
    switch (direction) {
      case 'improving': return 'success';
      case 'declining': return 'danger';
      case 'stable': return 'warning';
      default: return 'medium';
    }
  };

  const getAvailableTestTypes = () => {
    const types = [...new Set(assessments.map(a => a.testType))];
    return [{ value: 'all', label: t('longitudinal.chart.allTests') }]
      .concat(types.map(type => ({ value: type, label: type.toUpperCase() })));
  };

  if (loading) {
    return (
      <IonCard className="trend-chart-card">
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={analyticsOutline} />
            {t('longitudinal.chart.title')}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>{t('common.loading')}</IonText>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  if (assessments.length < 2) {
    return (
      <IonCard className="trend-chart-card">
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={analyticsOutline} />
            {t('longitudinal.chart.title')}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="no-data">
            <IonIcon icon={analyticsOutline} size="large" />
            <IonText>
              <h3>{t('longitudinal.chart.noData')}</h3>
              <p>{t('longitudinal.chart.needMoreAssessments')}</p>
            </IonText>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard className="trend-chart-card">
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={analyticsOutline} />
          {t('longitudinal.chart.title')}
        </IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        {/* Controls */}
        <div className="chart-controls">
          <div className="control-group">
            <IonLabel>{t('longitudinal.chart.testType')}:</IonLabel>
            <IonSelect
              value={selectedTestType}
              onIonChange={(e: any) => setSelectedTestType(e.detail.value)}
              interface="popover"
              className="test-type-select"
            >
              {getAvailableTestTypes().map(option => (
                <IonSelectOption key={option.value} value={option.value}>
                  {option.label}
                </IonSelectOption>
              ))}
            </IonSelect>
          </div>
          
          <IonSegment
            value={timeframe}
            onIonChange={(e) => setTimeframe(e.detail.value as any)}
            className="timeframe-segment"
          >
            <IonSegmentButton value="month">
              <IonLabel>{t('longitudinal.chart.month')}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="quarter">
              <IonLabel>{t('longitudinal.chart.quarter')}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="year">
              <IonLabel>{t('longitudinal.chart.year')}</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Trend Summary */}
        {selectedTestType !== 'all' && (
          <div className="trend-summary">
            {(() => {
              const direction = getTrendDirection(selectedTestType);
              return (
                <div className="trend-indicator">
                  <IonIcon 
                    icon={getTrendIcon(direction)}
                    color={getTrendColor(direction)}
                  />
                  <span className={`trend-text ${getTrendColor(direction)}`}>
                    {direction ? t(`longitudinal.trend.${direction}`) : t('longitudinal.trend.unknown')}
                  </span>
                </div>
              );
            })()}
          </div>
        )}

        {/* Chart */}
        <div className="chart-container" style={{ height: `${height}px` }}>
          <canvas ref={chartRef} />
        </div>

        {/* Chart Info */}
        <div className="chart-info">
          <IonText color="medium">
            <p>
              {t('longitudinal.chart.dataPoints', { 
                count: assessments.filter(a => 
                  selectedTestType === 'all' || a.testType === selectedTestType
                ).length 
              })}
            </p>
          </IonText>
        </div>
      </IonCardContent>
    </IonCard>
  );
};