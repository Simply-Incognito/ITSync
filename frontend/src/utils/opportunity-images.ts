export const opportunityImageChoices = [
  { id: 'technology-network', label: 'Digital technology', group: 'technology', src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85' },
  { id: 'technology-code', label: 'Software development', group: 'technology', src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85' },
  { id: 'technology-team', label: 'Technology team', group: 'technology', src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=85' },
  { id: 'finance-growth', label: 'Finance and growth', group: 'finance', src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85' },
  { id: 'finance-market', label: 'Financial markets', group: 'finance', src: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=85' },
  { id: 'finance-analysis', label: 'Business analytics', group: 'finance', src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=85' },
  { id: 'healthcare-care', label: 'Healthcare', group: 'healthcare', src: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=85' },
  { id: 'healthcare-team', label: 'Healthcare team', group: 'healthcare', src: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=85' },
  { id: 'healthcare-lab', label: 'Medical research', group: 'healthcare', src: 'https://images.unsplash.com/photo-1581093458791-9d42e3c9a8b2?auto=format&fit=crop&w=1200&q=85' },
  { id: 'engineering-design', label: 'Engineering', group: 'engineering', src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=85' },
  { id: 'engineering-build', label: 'Construction and design', group: 'engineering', src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=85' },
  { id: 'engineering-lab', label: 'Engineering lab', group: 'engineering', src: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=85' },
  { id: 'energy-future', label: 'Energy and sustainability', group: 'energy', src: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=85' },
  { id: 'energy-solar', label: 'Solar energy', group: 'energy', src: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=85' },
  { id: 'energy-wind', label: 'Wind energy', group: 'energy', src: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=85' },
  { id: 'agriculture-fields', label: 'Agriculture', group: 'agriculture', src: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85' },
  { id: 'agriculture-crops', label: 'Crops and farming', group: 'agriculture', src: 'https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?auto=format&fit=crop&w=1200&q=85' },
  { id: 'agriculture-greenhouse', label: 'Modern agriculture', group: 'agriculture', src: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1200&q=85' },
  { id: 'business-collaboration', label: 'Business collaboration', group: 'general', src: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85' },
  { id: 'business-office', label: 'Professional workplace', group: 'general', src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85' },
  { id: 'business-education', label: 'Education and learning', group: 'general', src: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=85' },
] as const

export type OpportunityImageId = (typeof opportunityImageChoices)[number]['id']

const industryGroups: Record<string, OpportunityImageId[]> = {
  technology: ['technology-network', 'technology-code', 'technology-team'],
  finance: ['finance-growth', 'finance-market', 'finance-analysis'],
  healthcare: ['healthcare-care', 'healthcare-team', 'healthcare-lab'],
  engineering: ['engineering-design', 'engineering-build', 'engineering-lab'],
  energy: ['energy-future', 'energy-solar', 'energy-wind'],
  agriculture: ['agriculture-fields', 'agriculture-crops', 'agriculture-greenhouse'],
  general: ['business-collaboration', 'business-office', 'business-education'],
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
  return opportunityImageChoices.filter((choice) => preferredIds.includes(choice.id))
}

export function getOpportunityImageUrl(imageId: string | undefined, industry = '') {
  return (
    opportunityImageChoices.find((choice) => choice.id === imageId)?.src ??
    getOpportunityImageChoices(industry)[0]?.src ??
    opportunityImageChoices[0].src
  )
}
