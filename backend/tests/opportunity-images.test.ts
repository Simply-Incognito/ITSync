import { describe, expect, it, vi } from 'vitest';
import { chooseOpportunityImageKey } from '../src/modules/opportunities/utils/opportunity-images.js';

const industries = [
  'Agriculture',
  'Construction',
  'Consulting',
  'Education',
  'Energy',
  'Finance',
  'Healthcare',
  'Hospitality',
  'Information Technology',
  'Logistics',
  'Manufacturing',
  'Media and Entertainment',
  'Retail',
  'Telecommunications',
  'Other / not listed',
];

describe('industry opportunity images', () => {
  it('provides three distinct system-selected images for every organization industry', () => {
    for (const industry of industries) {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.34)
        .mockReturnValueOnce(0.67);

      const selectedImages = new Set([
        chooseOpportunityImageKey(industry),
        chooseOpportunityImageKey(industry),
        chooseOpportunityImageKey(industry),
      ]);

      expect(selectedImages.size).toBe(3);
      vi.restoreAllMocks();
    }
  });
});
