import type { OpportunityImageKey } from '../models/opportunity.model.js';

type OpportunityImageGroup =
  | 'technology'
  | 'finance'
  | 'healthcare'
  | 'engineering'
  | 'energy'
  | 'agriculture'
  | 'general';

const imageKeysByIndustryGroup: Record<OpportunityImageGroup, OpportunityImageKey[]> = {
  technology: ['technology-network', 'technology-code', 'technology-team'],
  finance: ['finance-growth', 'finance-market', 'finance-analysis'],
  healthcare: ['healthcare-care', 'healthcare-team', 'healthcare-lab'],
  engineering: ['engineering-design', 'engineering-build', 'engineering-lab'],
  energy: ['energy-future', 'energy-solar', 'energy-wind'],
  agriculture: ['agriculture-fields', 'agriculture-crops', 'agriculture-greenhouse'],
  general: ['business-collaboration', 'business-office', 'business-education'],
};

function getIndustryGroup(industry: string): OpportunityImageGroup {
  const value = industry.toLowerCase();
  if (/technology|software|telecommunication|information/.test(value)) return 'technology';
  if (/finance|bank|insurance|account/.test(value)) return 'finance';
  if (/health|medical|pharma/.test(value)) return 'healthcare';
  if (/engineering|manufactur|construction/.test(value)) return 'engineering';
  if (/energy|oil|gas|power/.test(value)) return 'energy';
  if (/agricultur|farm/.test(value)) return 'agriculture';
  return 'general';
}

export function chooseOpportunityImageKey(industry: string): OpportunityImageKey {
  const keys = imageKeysByIndustryGroup[getIndustryGroup(industry)];
  const selected = keys[Math.floor(Math.random() * keys.length)];
  if (!selected) throw new Error('No opportunity images are configured for this industry.');
  return selected;
}
