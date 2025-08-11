import { describe, it, expect } from 'vitest';
import { parkinsonsDefinition } from '../../../constants/parkinsons.definition';

describe('ParkinsonsAssessment', () => {
  it('should have valid Parkinsons definition', () => {
    expect(parkinsonsDefinition).toBeDefined();
    expect(parkinsonsDefinition.id).toBe('parkinsons');
    expect(parkinsonsDefinition.name).toBe("Parkinson's");
    expect(parkinsonsDefinition.sections).toHaveLength(3);
  });

  it('should have correct section structure', () => {
    const sections = parkinsonsDefinition.sections;
    expect(sections[0].id).toBe('motor_symptoms');
    expect(sections[1].id).toBe('non_motor_symptoms');
    expect(sections[2].id).toBe('daily_activities');
  });

  it('should have motor symptoms section with 5 questions', () => {
    const motorSection = parkinsonsDefinition.sections[0];
    expect(motorSection.questions).toHaveLength(5);
    expect(motorSection.name).toBe('Síntomas Motores');
  });

  it('should have non-motor symptoms section with 4 questions', () => {
    const nonMotorSection = parkinsonsDefinition.sections[1];
    expect(nonMotorSection.questions).toHaveLength(4);
    expect(nonMotorSection.name).toBe('Síntomas No Motores');
  });

  it('should have daily activities section with 3 questions', () => {
    const dailySection = parkinsonsDefinition.sections[2];
    expect(dailySection.questions).toHaveLength(3);
    expect(dailySection.name).toBe('Actividades Diarias');
  });

  it('should have likert scale questions', () => {
    const allQuestions = parkinsonsDefinition.sections.flatMap(s => s.questions);
    allQuestions.forEach(question => {
      expect(question.type).toBe('likert_scale');
      expect(question.options).toBeDefined();
      expect(question.options!.length).toBeGreaterThan(2);
    });
  });

  it('should have correct scoring configuration', () => {
    expect(parkinsonsDefinition.scoringConfig.maxScore).toBe(44);
    expect(parkinsonsDefinition.scoringConfig.minScore).toBe(0);
    expect(parkinsonsDefinition.scoringConfig.formula).toBe('weighted_sum');
  });

  it('should have weighted sections', () => {
    const sections = parkinsonsDefinition.scoringConfig.sections;
    expect(sections[0].weight).toBe(2); // Motor symptoms weighted more
    expect(sections[1].weight).toBe(1.5); // Non-motor symptoms
    expect(sections[2].weight).toBe(1); // Daily activities
  });

  it('should have risk mapping ranges', () => {
    expect(parkinsonsDefinition.riskMapping.ranges).toHaveLength(3);
    expect(parkinsonsDefinition.riskMapping.algorithm).toBe('weighted_threshold');
  });

  it('should have proper metadata', () => {
    expect(parkinsonsDefinition.metadata.version).toBe('1.0');
    expect(parkinsonsDefinition.metadata.language).toBe('es');
    expect(parkinsonsDefinition.duration).toBe(8);
  });

  it('should have clinical references', () => {
    expect(parkinsonsDefinition.metadata.clinicalReferences).toBeDefined();
    expect(parkinsonsDefinition.metadata.clinicalReferences.length).toBeGreaterThan(0);
  });

  it('should have important notes', () => {
    expect(parkinsonsDefinition.metadata.notes).toBeDefined();
    expect(parkinsonsDefinition.metadata.notes!.length).toBeGreaterThan(0);
  });
});