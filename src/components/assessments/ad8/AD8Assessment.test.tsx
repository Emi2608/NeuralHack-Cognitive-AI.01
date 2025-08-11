import { describe, it, expect } from 'vitest';
import { ad8Definition } from '../../../constants/ad8.definition';

describe('AD8Assessment', () => {
  it('should have valid AD8 definition', () => {
    expect(ad8Definition).toBeDefined();
    expect(ad8Definition.id).toBe('ad8');
    expect(ad8Definition.name).toBe('AD8');
    expect(ad8Definition.sections).toHaveLength(1);
  });

  it('should have correct section structure', () => {
    const section = ad8Definition.sections[0];
    expect(section.id).toBe('cognitive_changes');
    expect(section.questions).toHaveLength(8);
  });

  it('should have yes/no questions', () => {
    const questions = ad8Definition.sections[0].questions;
    questions.forEach(question => {
      expect(question.type).toBe('yes_no');
      expect(question.options).toHaveLength(2);
      expect(question.options?.[0].label).toBe('No');
      expect(question.options?.[1].label).toBe('Sí');
    });
  });

  it('should have correct scoring configuration', () => {
    expect(ad8Definition.scoringConfig.maxScore).toBe(8);
    expect(ad8Definition.scoringConfig.minScore).toBe(0);
    expect(ad8Definition.scoringConfig.formula).toBe('sum_of_yes_responses');
  });

  it('should have risk mapping ranges', () => {
    expect(ad8Definition.riskMapping.ranges).toHaveLength(3);
    expect(ad8Definition.riskMapping.algorithm).toBe('threshold');
  });

  it('should have proper metadata', () => {
    expect(ad8Definition.metadata.version).toBe('1.0');
    expect(ad8Definition.metadata.language).toBe('es');
    expect(ad8Definition.duration).toBe(3);
  });

  it('should have clinical references', () => {
    expect(ad8Definition.metadata.clinicalReferences).toBeDefined();
    expect(ad8Definition.metadata.clinicalReferences.length).toBeGreaterThan(0);
  });
});