import { FacilityLocation } from '../types';

export const SWE_FACILITIES: FacilityLocation[] = [
  {
    id: 'rockville-warehouse',
    name: 'Rockville Warehouse & Main Food Hub',
    address: '4924 Wyaconda Rd, Rockville, MD 20852',
    lat: 39.0531,
    lng: -77.1082,
    geofenceMeters: 300,
  },
  {
    id: 'montgomery-village',
    name: 'Montgomery Village Community Food Pantry',
    address: '18201 Contour Rd, Montgomery Village, MD 20879',
    lat: 39.1558,
    lng: -77.2023,
    geofenceMeters: 300,
  },
  {
    id: 'baltimore-hub',
    name: 'Baltimore Regional Distribution Center',
    address: '4801 Leeds Ave, Halethorpe, MD 21227',
    lat: 39.2483,
    lng: -76.6811,
    geofenceMeters: 300,
  },
  {
    id: 'dc-ward8-mobile',
    name: 'DC Ward 8 Community Food Distribution',
    address: '2000 Martin Luther King Jr Ave SE, Washington, DC 20020',
    lat: 38.8687,
    lng: -76.9882,
    geofenceMeters: 300,
  },
];

export const ACTIVITY_TYPES = [
  'Food Pantry Packing & Distribution',
  'Fresh Produce Sorting & Warehouse Logistics',
  'Youth Literacy & After-School Program',
  'Emergency Food Box Drive-Thru',
  'Community Outreach & Donation Intake',
];
