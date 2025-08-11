import { describe, it, expect } from 'vitest';
import { mmseDefinition } from '../../../constants/mmse.definition';

describe('MMSEAssessment', () => {
  it('should have valid MMSE definition', () => {
    expect(mmseDefinition).toBeDefined();
    expect(mmseDefinition.id).toBe('mmse');
    expect(mmseDefinition.name).toBe('MMSE');
    expect(mmseDefinition.sections).toHaveLength(5);
  });

  it('should have correct section structure', () => {
    const sections = mmseDefinition.sections;
    expect(sections[0].id).toBe('orientation');
    expect(sections[1].id).toBe('registration');
    expect(sections[2].id).toBe('attention_calculation');
    expect(sections[3].id).toBe('recall');
    expect(sections[4].id).toBe('language');
  });

  it('should have correct scoring configuration', () => {
    expect(mmseDefinition.scoringConfig.maxScore).toBe(30);
    expect(mmseDefinition.scoringConfig.minScore).toBe(0);
    expect(mmseDefinition.scoringConfig.sections).toHaveLength(5);
  });

  it('should have risk mapping ranges', () => {
    expect(mmseDefinition.riskMapping.ranges).toHaveLength(4);
    expect(mmseDefinition.riskMapping.algorithm).toBe('threshold');
  });

  it('should have proper metadata', () => {
    expect(mmseDefinition.metadata.version).toBe('1.0');
    expect(mmseDefinition.metadata.language).toBe('es');
    expect(mmseDefinition.duration).toBe(10);
  });
});