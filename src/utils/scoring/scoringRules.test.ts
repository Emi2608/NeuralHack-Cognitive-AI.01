import { describe, it, expect } from 'vitest';
import { 
  scoreMoCA, 
  scorePHQ9, 
  scoreMMSE, 
  scoreAD8, 
  scoreParkinsons,
  validateResponse,
  calculateTotalScore
} from './scoringRules';

describe('ScoringRules', () => {
  describe('scoreMoCA', () => {
    it('should score MoCA correctly with all sections', () => {
      const responses = {
        visuospatial: { clockDrawing: 3, cubeDrawing: 1, trailMaking: 1 },
        naming: { lion: 1, rhinoceros: 1, camel: 1 },
        attention: { digitSpan: 2, vigilance: 1, subtraction: 3 },
        language: { repetition: 2, fluency: 1 },
        abstraction: { similarities: 2 },
        memory: { delayed: 5 },
        orientation: { time: 3, place: 3 }
      };

      const result = scoreMoCA(responses);
      expect(result.totalScore).toBe(30);
      expect(result.maxScore).toBe(30);
      expect(result.sectionScores).toBeDefined();
    });

    it('should apply education adjustment for MoCA', () => {
      const responses = {
        visuospatial: { clockDrawing: 2, cubeDrawing: 1, trailMaking: 1 },
        naming: { lion: 1, rhinoceros: 1, camel: 1 },
        attention: { digitSpan: 2, vigilance: 1, subtraction: 2 },
        language: { repetition: 2, fluency: 1 },
        abstraction: { similarities: 2 },
        memory: { delayed: 4 },
        orientation: { time: 3, place: 3 }
      };

      const resultLowEd = scoreMoCA(responses, { education: 8 });
      const resultHighEd = scoreMoCA(responses, { education: 16 });

      expect(resultLowEd.adjustedScore).toBeGreaterThan(resultHighEd.adjustedScore);
    });
  });

  describe('scorePHQ9', () => {
    it('should score PHQ-9 correctly', () => {
      const responses = [3, 2, 3, 2, 1, 2, 3, 2, 1]; // Total: 19

      const result = scorePHQ9(responses);
      expect(result.totalScore).toBe(19);
      expect(result.severity).toBe('moderate-severe');
      expect(result.maxScore).toBe(27);
    });

    it('should categorize PHQ-9 severity levels', () => {
      const minimal = scorePHQ9([0, 1, 0, 1, 0, 0, 1, 0, 0]); // 3
      const mild = scorePHQ9([1, 1, 1, 1, 1, 1, 1, 1, 0]); // 8
      const moderate = scorePHQ9([2, 2, 2, 2, 2, 2, 2, 1, 1]); // 16
      const severe = scorePHQ9([3, 3, 3, 3, 3, 3, 3, 3, 3]); // 27

      expect(minimal.severity).toBe('minimal');
      expect(mild.severity).toBe('mild');
      expect(moderate.severity).toBe('moderate');
      expect(severe.severity).toBe('severe');
    });
  });

  describe('scoreMMSE', () => {
    it('should score MMSE correctly', () => {
      const responses = {
        orientation: { time: 5, place: 5 },
        registration: 3,
        attention: 5,
        recall: 3,
        language: { naming: 2, repetition: 1, comprehension: 3, reading: 1, writing: 1, drawing: 1 }
      };

      const result = scoreMMSE(responses);
      expect(result.totalScore).toBe(30);
      expect(result.maxScore).toBe(30);
    });

    it('should handle partial MMSE responses', () => {
      const responses = {
        orientation: { time: 3, place: 4 },
        registration: 2,
        attention: 3,
        recall: 1,
        language: { naming: 2, repetition: 1, comprehension: 2, reading: 0, writing: 0, drawing: 0 }
      };

      const result = scoreMMSE(responses);
      expect(result.totalScore).toBe(18);
      expect(result.interpretation).toBe('mild-impairment');
    });
  });

  describe('scoreAD8', () => {
    it('should score AD8 correctly', () => {
      const responses = [1, 1, 0, 1, 0, 1, 1, 0]; // 5 positive responses

      const result = scoreAD8(responses);
      expect(result.totalScore).toBe(5);
      expect(result.riskLevel).toBe('high');
    });

    it('should identify low risk AD8 scores', () => {
      const responses = [0, 1, 0, 0, 0, 0, 1, 0]; // 2 positive responses

      const result = scoreAD8(responses);
      expect(result.totalScore).toBe(2);
      expect(result.riskLevel).toBe('low');
    });
  });

  describe('scoreParkinsons', () => {
    it('should score Parkinson\'s assessment correctly', () => {
      const responses = {
        motor: { tremor: 2, rigidity: 1, bradykinesia: 2, posture: 1 },
        nonMotor: { sleep: 2, mood: 1, cognition: 1, autonomic: 2 }
      };

      const result = scoreParkinsons(responses);
      expect(result.totalScore).toBe(12);
      expect(result.motorScore).toBe(6);
      expect(result.nonMotorScore).toBe(6);
    });
  });

  describe('validateResponse', () => {
    it('should validate numeric responses within range', () => {
      expect(validateResponse(2, 'number', { min: 0, max: 3 })).toBe(true);
      expect(validateResponse(4, 'number', { min: 0, max: 3 })).toBe(false);
      expect(validateResponse(-1, 'number', { min: 0, max: 3 })).toBe(false);
    });

    it('should validate required responses', () => {
      expect(validateResponse(null, 'number', { required: true })).toBe(false);
      expect(validateResponse(0, 'number', { required: true })).toBe(true);
    });

    it('should validate array responses', () => {
      expect(validateResponse([1, 2, 3], 'array', { length: 3 })).toBe(true);
      expect(validateResponse([1, 2], 'array', { length: 3 })).toBe(false);
    });
  });

  describe('calculateTotalScore', () => {
    it('should calculate total score from section scores', () => {
      const sectionScores = { section1: 10, section2: 15, section3: 5 };
      const total = calculateTotalScore(sectionScores);
      expect(total).toBe(30);
    });

    it('should handle nested score objects', () => {
      const sectionScores = {
        section1: { score: 10, maxScore: 15 },
        section2: { score: 8, maxScore: 10 }
      };
      const total = calculateTotalScore(sectionScores, 'score');
      expect(total).toBe(18);
    });
  });
});