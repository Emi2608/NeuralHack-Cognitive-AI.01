import { describe, it, expect } from 'vitest';
import { calculateRisk, RiskLevel, AssessmentType } from './riskCalculator';

describe('RiskCalculator', () => {
  describe('calculateRisk', () => {
    it('should calculate low risk for MoCA score above 26', () => {
      const result = calculateRisk(AssessmentType.MOCA, 28, { age: 45, education: 16 });
      
      expect(result.riskLevel).toBe(RiskLevel.LOW);
      expect(result.riskPercentage).toBeLessThan(5);
    });

    it('should calculate moderate risk for MoCA score 20-25', () => {
      const result = calculateRisk(AssessmentType.MOCA, 23, { age: 65, education: 12 });
      
      expect(result.riskLevel).toBe(RiskLevel.MODERATE);
      expect(result.riskPercentage).toBeGreaterThanOrEqual(5);
      expect(result.riskPercentage).toBeLessThan(40);
    });

    it('should calculate high risk for MoCA score below 20', () => {
      const result = calculateRisk(AssessmentType.MOCA, 18, { age: 70, education: 8 });
      
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
      expect(result.riskPercentage).toBeGreaterThanOrEqual(40);
    });

    it('should apply age adjustment for older adults', () => {
      const youngResult = calculateRisk(AssessmentType.MOCA, 25, { age: 45, education: 12 });
      const oldResult = calculateRisk(AssessmentType.MOCA, 25, { age: 75, education: 12 });
      
      expect(oldResult.riskPercentage).toBeGreaterThan(youngResult.riskPercentage);
    });

    it('should apply education adjustment', () => {
      const highEdResult = calculateRisk(AssessmentType.MOCA, 25, { age: 65, education: 16 });
      const lowEdResult = calculateRisk(AssessmentType.MOCA, 25, { age: 65, education: 8 });
      
      expect(lowEdResult.riskPercentage).toBeGreaterThan(highEdResult.riskPercentage);
    });

    it('should calculate PHQ-9 depression risk correctly', () => {
      const mildResult = calculateRisk(AssessmentType.PHQ9, 8, { age: 45, education: 12 });
      const severeResult = calculateRisk(AssessmentType.PHQ9, 22, { age: 45, education: 12 });
      
      expect(mildResult.riskLevel).toBe(RiskLevel.LOW);
      expect(severeResult.riskLevel).toBe(RiskLevel.HIGH);
    });

    it('should handle MMSE scoring correctly', () => {
      const normalResult = calculateRisk(AssessmentType.MMSE, 28, { age: 65, education: 12 });
      const impairedResult = calculateRisk(AssessmentType.MMSE, 20, { age: 65, education: 12 });
      
      expect(normalResult.riskLevel).toBe(RiskLevel.LOW);
      expect(impairedResult.riskLevel).toBe(RiskLevel.HIGH);
    });

    it('should provide confidence intervals', () => {
      const result = calculateRisk(AssessmentType.MOCA, 25, { age: 65, education: 12 });
      
      expect(result.confidenceInterval).toBeDefined();
      expect(result.confidenceInterval.lower).toBeLessThan(result.riskPercentage);
      expect(result.confidenceInterval.upper).toBeGreaterThan(result.riskPercentage);
    });

    it('should include relevant factors in result', () => {
      const result = calculateRisk(AssessmentType.MOCA, 25, { age: 75, education: 8 });
      
      expect(result.factors).toContain('age');
      expect(result.factors).toContain('education');
    });
  });
});