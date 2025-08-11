import type { TestType } from '../types/assessment';

// Assessment configurations
export const ASSESSMENT_CONFIG = {
  moca: {
    name: 'MoCA',
    fullName: 'Montreal Cognitive Assessment',
    duration: 15, // minutes
    maxScore: 30,
    sections: [
      'visuospatial',
      'naming',
      'memory',
      'attention',
      'language',
      'abstraction',
      'delayed_recall',
      'orientation',
    ],
    educationAdjustment: {
      threshold: 12, // years of education
      adjustment: 1, // points to add
    },
    riskMapping: {
      normal: { min: 26, max: 30, risk: [0, 5] },
      mild: { min: 18, max: 25, risk: [5, 40] },
      severe: { min: 0, max: 17, risk: [40, 100] },
    },
  },
  phq9: {
    name: 'PHQ-9',
    fullName: 'Patient Health Questionnaire-9',
    duration: 5, // minutes
    maxScore: 27,
    questions: 9,
    riskMapping: {
      minimal: { min: 0, max: 4, risk: [0, 5] },
      mild: { min: 5, max: 9, risk: [5, 20] },
      moderate: { min: 10, max: 14, risk: [20, 40] },
      moderately_severe: { min: 15, max: 19, risk: [40, 70] },
      severe: { min: 20, max: 27, risk: [70, 100] },
    },
  },
  mmse: {
    name: 'MMSE',
    fullName: 'Mini-Mental State Examination',
    duration: 10, // minutes
    maxScore: 30,
    sections: [
      'orientation',
      'registration',
      'attention_calculation',
      'recall',
      'language',
    ],
    riskMapping: {
      normal: { min: 24, max: 30, risk: [0, 5] },
      mild: { min: 18, max: 23, risk: [5, 40] },
      moderate: { min: 12, max: 17, risk: [40, 70] },
      severe: { min: 0, max: 11, risk: [70, 100] },
    },
  },
  ad8: {
    name: 'AD8',
    fullName: 'AD8 Dementia Screening Interview',
    duration: 3, // minutes
    maxScore: 8,
    questions: 8,
    riskMapping: {
      normal: { min: 0, max: 1, risk: [0, 5] },
      possible: { min: 2, max: 8, risk: [20, 80] },
    },
  },
  parkinsons: {
    name: "Parkinson's",
    fullName: "Parkinson's Disease Screening",
    duration: 8, // minutes
    maxScore: 20,
    sections: ['motor_symptoms', 'non_motor_symptoms', 'daily_activities'],
    riskMapping: {
      low: { min: 0, max: 5, risk: [0, 10] },
      moderate: { min: 6, max: 12, risk: [10, 50] },
      high: { min: 13, max: 20, risk: [50, 90] },
    },
  },
} as const;

// Test type array for iteration
export const TEST_TYPES: TestType[] = [
  'moca',
  'phq9',
  'mmse',
  'ad8',
  'parkinsons',
];

// Risk categories
export const RISK_CATEGORIES = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
} as const;

// Risk thresholds (percentages)
export const RISK_THRESHOLDS = {
  LOW_MAX: 5,
  MODERATE_MAX: 40,
  HIGH_MIN: 40,
} as const;
