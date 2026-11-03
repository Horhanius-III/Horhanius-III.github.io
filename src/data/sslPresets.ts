export interface PresetOption {
  id: string;
  label: string;
  text: string;
}

export const ACADEMIC_PREPARATION_PRESETS: PresetOption[] = [
  {
    id: 'empty',
    label: '(Leave Empty / Manual Fill Placeholder)',
    text: '',
  },
  {
    id: 'food-insecurity',
    label: 'Food Insecurity & Rescue Logistics (Recommended)',
    text: 'Staff provided on-site orientation on Montgomery County food insecurity, food rescue supply chains, USDA food storage guidelines, and safe packaging standards.',
  },
  {
    id: 'nutrition-equity',
    label: 'Nutrition Equity & Waste Prevention Briefing',
    text: 'Student participated in an educational briefing on local hunger statistics, nutrition equity, and how So What Else recovers surplus food to support local families.',
  },
  {
    id: 'safety-allergen',
    label: 'Food Safety, Allergen Handling & Distribution Logistics',
    text: 'Pre-service briefing covered volunteer safety, food allergen handling, equitable food distribution logistics, and community engagement principles.',
  },
  {
    id: 'youth-literacy',
    label: 'Youth Literacy & Social-Emotional Mentoring Orientation',
    text: 'Youth program orientation regarding mentoring best practices, literacy support, and social-emotional learning for elementary students.',
  },
];

export const SERVICE_ACTIVITY_PRESETS: PresetOption[] = [
  {
    id: 'empty',
    label: '(Leave Empty / Manual Fill Placeholder)',
    text: '',
  },
  {
    id: 'produce-packing',
    label: 'Produce Sorting & Emergency Pantry Packing (Recommended)',
    text: 'Inspected, sorted, and packed emergency farm produce and grocery pantry boxes for direct distribution to low-income children and families in Montgomery County.',
  },
  {
    id: 'mobile-distribution',
    label: 'Curbside Mobile Food Distribution & Car Loading',
    text: 'Loaded food delivery vehicles and assisted in curbside mobile pantry distribution, providing nutritious grocery packages to local community members.',
  },
  {
    id: 'warehouse-logistics',
    label: 'Warehouse Non-Perishable Inventory & Meal Kits',
    text: 'Assisted in warehouse logistics, organizing non-perishable food inventory, verifying expiration dates, and assembling family-sized meal kits.',
  },
  {
    id: 'after-school-mentoring',
    label: 'After-School Tutoring & Youth Academic Enrichment',
    text: 'Supported after-school academic tutoring, reading enrichment, and positive recreational activities for youth participants.',
  },
];
