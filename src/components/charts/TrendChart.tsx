import React from 'react';
import { Line } from 'react-chartjs-2';
import { BaseChart } from './BaseChart';
import type { AssessmentResult } from '../../types/assessment';
import './TrendChart.css';

interface TrendChartProps {
  data: AssessmentResult[];
  title?: string;
  height?: number;
  showRiskTrend?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title = 'Tendencia de Evaluaciones',
  height = 300,
  showRiskTrend = true
}) => {
  if (!data || data.length < 2) {
    return (
      <BaseChart title={title} error="Se necesitan al menos 2 evaluaciones para mostrar tendencias" height={height}>
        <div className="no-data">Datos insuficientes para mostrar tendencias</div>
      </BaseChart>
    );
  }

  // Sort data by completion date
  const sortedData = [...data].sort((a, b) => 
    new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  if (sortedData.length === 0) {
    return (
      <BaseChart title={title} error="No hay datos disponibles" height={height}>
        <div className="no-data">No hay datos disponibles</div>
      </BaseChart>
    );
  }

  // Prepare chart data
  const labels = sortedData.map(result => {
    const date = new Date(result.completedAt);
    return date.toLocaleDateString('es-MX', { 
      month: 'short', 
      day: 'numeric' 
    });
  });

  const scorePercentages = sortedData.map(result => 
    Math.round((result.totalScore / result.maxScore) * 100)
  );

  const riskPercentages = sortedData.map(result => result.riskPercentage);

  const datasets = [
    {
      label: 'Puntuación (%)',
      data: scorePercentages,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: scorePercentages.map(score => {
        if (score >= 80) return '#10b981'; // Green
        if (score >= 60) return '#f59e0b'; // Yellow
        if (score >= 40) return '#ef4444'; // Red
        return '#6b7280'; // Gray
      }),
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
    }
  ];

  if (showRiskTrend) {
    datasets.push({
      label: 'Riesgo (%)',
      data: riskPercentages,
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      pointBackgroundColor: riskPercentages.map(risk => {
        if (risk <= 5) return '#10b981'; // Low risk - Green
        if (risk <= 40) return '#f59e0b'; // Moderate risk - Yellow
        return '#ef4444'; // High risk - Red
      }),
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
    });
  }

  const chartData = {
    labels,
    datasets
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            const result = sortedData[index];
            const date = new Date(result.completedAt);
            return date.toLocaleDateString('es-MX', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          },
          label: (context: any) => {
            const value = context.parsed.y;
            const label = context.dataset.label;
            return `${label}: ${value}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: (value: any) => `${value}%`,
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  // Calculate trend
  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 0;
    const first = values[0];
    const last = values[values.length - 1];
    return last - first;
  };

  const scoreTrend = calculateTrend(scorePercentages);

  return (
    <BaseChart title={title} height={height}>
      <div className="trend-chart-container">
        <Line data={chartData} options={options} />
        
        <div className="trend-summary">
          <div className={`trend-indicator ${scoreTrend >= 0 ? 'positive' : 'negative'}`}>
            <span className="trend-label">Tendencia de Puntuación:</span>
            <span className="trend-value">
              {scoreTrend >= 0 ? '+' : ''}{scoreTrend.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </BaseChart>
  );
};