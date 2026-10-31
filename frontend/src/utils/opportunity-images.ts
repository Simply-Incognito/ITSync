export const opportunityImageChoices = [
  { id: 'technology-network', label: 'Digital technology', group: 'technology', src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85' },
  { id: 'technology-code', label: 'Software development', group: 'technology', src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85' },
  { id: 'finance-growth', label: 'Finance and growth', group: 'finance', src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85' },
  { id: 'healthcare-care', label: 'Healthcare', group: 'healthcare', src: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=85' },
  { id: 'engineering-design', label: 'Engineering', group: 'engineering', src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=85' },
  { id: 'energy-future', label: 'Energy and sustainability', group: 'energy', src: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=85' },
  { id: 'agriculture-fields', label: 'Agriculture', group: 'agriculture', src: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85' },
  { id: 'business-collaboration', label: 'Business collaboration', group: 'general', src: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85' },
] as const

export type OpportunityImageId = (typeof opportunityImageChoices)[number]['id']

const industryGroups: Record<string, OpportunityImageId[]> = {
  technology: ['technology-network', 'technology-code'],
  finance: ['finance-growth'],
  healthcare: ['healthcare-care'],
  engineering: ['engineering-design'],
  energy: ['energy-future'],
  agriculture: ['agriculture-fields'],
  general: ['business-collaboration'],
}

export function getOpportunityImageChoices(industry: string) {
  const value = industry.toLowerCase()
  let group: keyof typeof industryGroups = 'general'

  if (/technology|software|telecommunication|information/.test(value)) group = 'technology'
  else if (/finance|bank|insurance|account/.test(value)) group = 'finance'
  else if (/health|medical|pharma/.test(value)) group = 'healthcare'
  else if (/engineering|manufactur|construction/.test(value)) group = 'engineering'
  else if (/energy|oil|gas|power/.test(value)) group = 'energy'
  else if (/agricultur|farm/.test(value)) group = 'agriculture'

  const preferredIds = industryGroups[group]
  const preferred = opportunityImageChoices.filter((choice) => preferredIds.includes(choice.id))
  const general = opportunityImageChoices.filter((choice) => choice.group === 'general')
  return [...preferred, ...general]
}

export function getOpportunityImageUrl(imageId: string | undefined, industry = '') {
  return (
    opportunityImageChoices.find((choice) => choice.id === imageId)?.src ??
    getOpportunityImageChoices(industry)[0]?.src ??
    opportunityImageChoices[0].src
  )
}
