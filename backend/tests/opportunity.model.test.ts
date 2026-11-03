import { describe, expect, it } from 'vitest';
import { Opportunity } from '../src/modules/opportunities/models/opportunity.model.js';

describe('opportunity model capacity validation', () => {
  it('allows zero remaining slots after applications use all available places', () => {
    const opportunity = new Opportunity({
      organizationId: '68d2c50a8c4e1c843a39a202',
      createdBy: '68d2c50a8c4e1c843a39a204',
      title: 'Software Engineering SIWES Placement',
      description: 'Work with the product engineering team on supervised software projects.',
      fieldOfStudy: 'Computer Science',
      location: { city: 'Lagos', state: 'Lagos', country: 'Nigeria' },
      workArrangement: 'hybrid',
      durationWeeks: 24,
      availableSlots: 0,
      applicationDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });

    expect(opportunity.validateSync()).toBeUndefined();
  });
});
