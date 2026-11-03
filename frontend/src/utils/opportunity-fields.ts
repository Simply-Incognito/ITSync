export function getOpportunityFields(fieldOfStudy: string[] | string | undefined) {
  if (Array.isArray(fieldOfStudy)) return fieldOfStudy
  return fieldOfStudy ? [fieldOfStudy] : []
}
