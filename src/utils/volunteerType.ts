import { FormRequirement, Volunteer, VolunteerType } from '../types';

export interface VolunteerTypeOption {
  id: VolunteerType;
  label: string;
  shortLabel: string;
  badge: string;
  badgeClass: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  pillClass: string;
  needsSSL: boolean;
  defaultFormRequirement: FormRequirement;
  formTitle: string;
  description: string;
  iconName: 'student' | 'adult' | 'court' | 'corporate' | 'other';
}

export const VOLUNTEER_TYPE_OPTIONS: VolunteerTypeOption[] = [
  {
    id: 'student_ssl',
    label: 'Student (Needs MCPS SSL Form)',
    shortLabel: 'Student (SSL)',
    badge: '🎓 Student (SSL)',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200',
    pillClass: 'bg-orange-500 text-white',
    needsSSL: true,
    defaultFormRequirement: 'ssl_mcps',
    formTitle: 'MCPS Form 560-51 (Official SSL)',
    description: 'Montgomery County Public Schools student completing required graduation SSL hours.',
    iconName: 'student',
  },
  {
    id: 'adult',
    label: 'Adult Volunteer (General Community Service)',
    shortLabel: 'Adult Volunteer',
    badge: '👤 Adult Volunteer',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-800',
    borderColor: 'border-emerald-200',
    pillClass: 'bg-emerald-600 text-white',
    needsSSL: false,
    defaultFormRequirement: 'none',
    formTitle: 'General Service Record (No Form Needed)',
    description: 'Adult community member giving back. Lifetime service hours are logged and verified without school forms.',
    iconName: 'adult',
  },
  {
    id: 'court_mandated',
    label: 'Court-Mandated / Restitution Service',
    shortLabel: 'Court Mandated',
    badge: '⚖️ Court Mandated',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200',
    pillClass: 'bg-purple-600 text-white',
    needsSSL: false,
    defaultFormRequirement: 'court_ordered',
    formTitle: 'Court Community Service Letter',
    description: 'Community service hours completed toward legal restitution or court orders.',
    iconName: 'court',
  },
  {
    id: 'corporate',
    label: 'Corporate / Workplace Group',
    shortLabel: 'Corporate / Group',
    badge: '🏢 Corporate Group',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    pillClass: 'bg-blue-600 text-white',
    needsSSL: false,
    defaultFormRequirement: 'corporate_verification',
    formTitle: 'Employer Match / Grant Verification',
    description: 'Workplace volunteer days, employer hours matching grants, or corporate CSR programs.',
    iconName: 'corporate',
  },
  {
    id: 'other',
    label: 'Other Program / Custom Verification',
    shortLabel: 'Other Program',
    badge: '📋 Other Program',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-200',
    bgColor: 'bg-stone-100',
    textColor: 'text-stone-800',
    borderColor: 'border-stone-200',
    pillClass: 'bg-stone-600 text-white',
    needsSSL: false,
    defaultFormRequirement: 'other',
    formTitle: 'Custom Verification Letter',
    description: 'Honor societies, scout troops, religious groups, or university service requirements.',
    iconName: 'other',
  },
];

export function getVolunteerTypeConfig(
  type?: VolunteerType,
  explicitNeedsSSL?: boolean
): VolunteerTypeOption {
  if (type) {
    const found = VOLUNTEER_TYPE_OPTIONS.find((opt) => opt.id === type);
    if (found) return found;
  }
  // If needsSSL is explicitly false, it is an adult volunteer
  if (explicitNeedsSSL === false) {
    return VOLUNTEER_TYPE_OPTIONS[1]; // adult
  }
  // Default legacy/unspecified is student needing SSL
  return VOLUNTEER_TYPE_OPTIONS[0]; // student_ssl
}

export function isCommunityServiceVolunteer(
  vol?: Partial<Volunteer> | { volunteerType?: VolunteerType; needsSSL?: boolean; formRequirement?: FormRequirement } | null
): boolean {
  if (!vol) return false;
  return (
    vol.volunteerType === 'adult' ||
    vol.needsSSL === false ||
    vol.formRequirement === 'none'
  );
}

export function isVolunteerNeedingSSL(
  vol?: Partial<Volunteer> | null
): boolean {
  if (!vol) return false;
  if (vol.volunteerType === 'adult') return false;
  if (vol.needsSSL === false) return false;
  if (vol.formRequirement === 'none') return false;
  if (vol.needsSSL === true) return true;
  if (vol.volunteerType === 'student_ssl') return true;
  if (vol.formRequirement === 'ssl_mcps') return true;
  // If school or grade is present and not adult, default to true
  return Boolean(vol.school || (vol.grade && !vol.grade.toLowerCase().includes('adult')));
}

export function getFormRequirementTitle(req?: FormRequirement): string {
  switch (req) {
    case 'ssl_mcps':
      return 'MCPS Form 560-51 SSL';
    case 'court_ordered':
      return 'Court Mandated Service Letter';
    case 'corporate_verification':
      return 'Employer Volunteer Grant Form';
    case 'other':
      return 'Custom Service Verification';
    case 'none':
    default:
      return 'General Service Record (No Form)';
  }
}
