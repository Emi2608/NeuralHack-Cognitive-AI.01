import React from 'react';
import { Bar } from 'react-chartjs-2';
import { BaseChart } from './BaseChart';
import './ScoreChart.css';

interface ScoreData {
  testType: string;
  score: number;
  maxScore: number;
  date: string;
}

interface ScoreChartProps {
  scores: ScoreData[];
  title?: string;
  showMaxScores?: boolean;
  height?: number;
}

export const ScoreChart: React.FC<ScoreChartProps> = ({
  scores,
  title = 'Puntuaciones de Evaluaciones',
  showMaxScores = true,
  height = 300
}) => {
  if (!scores || scores.length === 0) {
    return (
      <BaseChart title={title} error="No hay datos de evaluaciones disponibles" height={height}>
        <div className="no-data">No hay datos disponibles</div>
      </BaseChart>
    );
  }

  // Prepare data for the chart
  const labels = scores.map(score => {
    const testNames: Record<string, string> = {
      moca: 'MoCA',
      phq9: 'PHQ-9',
      mmse: 'MMSE',
      ad8: 'AD8',
      parkinsons: 'Parkinson'
    };
    return testNames[score.testType] || score.testType.toUpperCase();
  });

  const scoreData = scores.map(score => score.score);
  const maxScoreData = scores.map(score => score.maxScore);
  const percentageData = scores.map(score => Math.round((score.score / score.maxScore) * 100));

  // Color coding based on percentage
  const backgroundColors = percentageData.map(percentage => {
    if (percentage >= 80) return 'rgba(34, 197, 94, 0.8)'; // Green - Good
    if (percentage >= 60) return 'rgba(251, 191, 36, 0.8)'; // Yellow - Moderate
    if (percentage >= 40) return 'rgba(239, 68, 68, 0.8)'; // Red - Low
    return 'rgba(156, 163, 175, 0.8)'; // Gray - Very Low
  });

  const borderColors = percentageData.map(percentage => {
    if (percentage >= 80) return 'rgba(34, 197, 94, 1)';
    if (percentage >= 60) return 'rgba(251, 191, 36, 1)';
    if (percentage >= 40) return 'rgba(239, 68, 68, 1)';
    return 'rgba(156, 163, 175, 1)';
  });

  const datasets = [
    {
      label: 'Puntuación Obtenida',
      data: scoreData,
      backgroundColor: backgroundColors,
      borderColor: borderColors,
      borderWidth: 2,
      borderRadius: 4,
      borderSkipped: false,
    }
  ];

  if (showMaxScores) {
    datasets.push({
      label: 'Puntuación Máxima',
      data: maxScoreData,
      backgroundColor: ['rgba(156, 163, 175, 0.3)'] as any,
      borderColor: ['rgba(156, 163, 175, 0.6)'] as any,
      borderWidth: 1,
      borderRadius: 4,
      borderSkipped: false,
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
        callbacks: {
          label: (context: any) => {
            const score = scoreData[context.dataIndex];
            const maxScore = maxScoreData[context.dataIndex];
            const percentage = Math.round((score / maxScore) * 100);
            return `${context.dataset.label}: ${score}/${maxScore} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
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
    }
  };

  return (
    <BaseChart title={title} height={height}>
      <Bar data={chartData} options={options} />
    </BaseChart>
  );
};