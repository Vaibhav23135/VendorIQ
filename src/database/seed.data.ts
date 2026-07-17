/**
 * Static seed data for the VendorIQ demo database.
 * 12 vendors spread across IT Hardware / Medical / Office Supplies with
 * deliberate data gaps (some vendors are missing compliance/perf rows,
 * simulating real-world messy vendor master data).
 */

export interface SeedVendor {
  vendorId: string;
  name: string;
  category: 'IT Hardware' | 'Medical' | 'Office Supplies';
  productLines: string[];
  basePrice: number;
  currency: string;
  deliveryDays: number;
  qualityScore: number;
  complianceStatus: 'certified' | 'pending' | 'flagged';
  imageUrl: string;
  city: string;
  notes?: string;
}

export const SEED_VENDORS: SeedVendor[] = [
  {
    vendorId: 'V-DELL-01',
    name: 'Dell Technologies India',
    category: 'IT Hardware',
    productLines: ['Dell Latitude', 'Dell OptiPlex', 'Dell Precision'],
    basePrice: 52000,
    currency: 'INR',
    deliveryDays: 12,
    qualityScore: 91,
    complianceStatus: 'certified',
    imageUrl: 'https://images.unsplash.com/photo-1742119897876-67e9935ac375?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Bengaluru',
    notes: 'Preferred vendor for enterprise laptop fleets.',
  },
  {
    vendorId: 'V-HP-01',
    name: 'HP Enterprise Solutions',
    category: 'IT Hardware',
    productLines: ['HP EliteBook', 'HP ProBook', 'HP LaserJet'],
    basePrice: 49500,
    currency: 'INR',
    deliveryDays: 18,
    qualityScore: 87,
    complianceStatus: 'certified',
    imageUrl: 'https://images.unsplash.com/photo-1576057122708-9608db46b2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Gurugram',
  },
  {
    vendorId: 'V-LENOVO-01',
    name: 'Lenovo India Distribution',
    category: 'IT Hardware',
    productLines: ['Lenovo ThinkPad', 'Lenovo IdeaPad', 'Lenovo Legion'],
    basePrice: 47800,
    currency: 'INR',
    deliveryDays: 22,
    qualityScore: 84,
    complianceStatus: 'pending',
    imageUrl: 'https://images.unsplash.com/photo-1667308274522-886ce9a3f0cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Pune',
    notes: 'Compliance audit overdue by 2 quarters.',
  },
  {
    vendorId: 'V-ACER-01',
    name: 'Acer Business Systems',
    category: 'IT Hardware',
    productLines: ['Acer TravelMate', 'Acer Aspire'],
    basePrice: 41000,
    currency: 'INR',
    deliveryDays: 25,
    qualityScore: 74,
    complianceStatus: 'flagged',
    imageUrl: 'https://images.unsplash.com/photo-1643453690293-d35fcf9850c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Chennai',
    notes: 'Flagged for late deliveries in last two contracts.',
  },
  {
    vendorId: 'V-APPLE-01',
    name: 'Apple Authorised Reseller — Redington',
    category: 'IT Hardware',
    productLines: ['MacBook Air', 'MacBook Pro', 'iPad'],
    basePrice: 98000,
    currency: 'INR',
    deliveryDays: 10,
    qualityScore: 95,
    complianceStatus: 'certified',
    imageUrl: 'https://images.unsplash.com/photo-1742119971773-57e0131095b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Mumbai',
  },
  {
    vendorId: 'V-MEDLIFE-01',
    name: 'MedLife Surgical Supplies',
    category: 'Medical',
    productLines: ['Surgical Gloves', 'Sterile Gauze', 'PPE Kits'],
    basePrice: 1200,
    currency: 'INR',
    deliveryDays: 7,
    qualityScore: 90,
    complianceStatus: 'certified',
    imageUrl: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Hyderabad',
  },
  {
    vendorId: 'V-APOLLO-01',
    name: 'Apollo MedTech Devices',
    category: 'Medical',
    productLines: ['Patient Monitors', 'Infusion Pumps', 'Defibrillators'],
    basePrice: 185000,
    currency: 'INR',
    deliveryDays: 21,
    qualityScore: 88,
    complianceStatus: 'certified',
    imageUrl: 'https://images.unsplash.com/photo-1551601651-05a4836d25c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Chennai',
  },
  {
    vendorId: 'V-CAREPLUS-01',
    name: 'CarePlus Diagnostics Supply',
    category: 'Medical',
    productLines: ['Stethoscopes', 'BP Monitors', 'Thermometers'],
    basePrice: 2400,
    currency: 'INR',
    deliveryDays: 9,
    qualityScore: 79,
    complianceStatus: 'pending',
    imageUrl: 'https://images.unsplash.com/photo-1546659934-038aab8f3f3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Ahmedabad',
    notes: 'Missing latest performance data.',
  },
  {
    vendorId: 'V-VITALCARE-01',
    name: 'VitalCare Pharma Distributors',
    category: 'Medical',
    productLines: ['IV Fluids', 'Wound Care', 'First Aid Kits'],
    basePrice: 950,
    currency: 'INR',
    deliveryDays: 6,
    qualityScore: 82,
    complianceStatus: 'flagged',
    imageUrl: 'https://images.unsplash.com/photo-1708685627299-81bfac32402d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Delhi',
    notes: 'One prior compliance flag for expired-stock complaint.',
  },
  {
    vendorId: 'V-OFFICEPRO-01',
    name: 'OfficePro Stationery Warehouse',
    category: 'Office Supplies',
    productLines: ['Copy Paper', 'Pens & Markers', 'Filing Supplies'],
    basePrice: 380,
    currency: 'INR',
    deliveryDays: 5,
    qualityScore: 80,
    complianceStatus: 'certified',
    imageUrl: 'https://images.unsplash.com/photo-1635468609223-4e59675ac96d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Noida',
  },
  {
    vendorId: 'V-PAPERNEST-01',
    name: 'PaperNest Office Essentials',
    category: 'Office Supplies',
    productLines: ['Notebooks', 'Printer Paper', 'Desk Organizers'],
    basePrice: 310,
    currency: 'INR',
    deliveryDays: 8,
    qualityScore: 76,
    complianceStatus: 'pending',
    imageUrl: 'https://images.unsplash.com/photo-1663422546192-1ad145383009?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Kolkata',
    notes: 'No compliance record on file.',
  },
  {
    vendorId: 'V-DESKMART-01',
    name: 'DeskMart Supply Co.',
    category: 'Office Supplies',
    productLines: ['Ergonomic Chairs', 'Desk Accessories', 'Whiteboards'],
    basePrice: 4200,
    currency: 'INR',
    deliveryDays: 14,
    qualityScore: 85,
    complianceStatus: 'certified',
    imageUrl: 'https://images.unsplash.com/photo-1583156944331-6c4d9e32a863?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Pune',
  },
];

export interface SeedPerformance {
  vendorId: string;
  onTimeDeliveryRate: number;
  defectRate: number;
  avgResponseHours: number;
  ordersFulfilled: number;
}

// Deliberately omit performance rows for V-CAREPLUS-01 and V-PAPERNEST-01 (data gap).
export const SEED_PERFORMANCE: SeedPerformance[] = [
  { vendorId: 'V-DELL-01', onTimeDeliveryRate: 96, defectRate: 1.2, avgResponseHours: 4, ordersFulfilled: 142 },
  { vendorId: 'V-HP-01', onTimeDeliveryRate: 89, defectRate: 2.1, avgResponseHours: 6, ordersFulfilled: 98 },
  { vendorId: 'V-LENOVO-01', onTimeDeliveryRate: 81, defectRate: 3.4, avgResponseHours: 10, ordersFulfilled: 76 },
  { vendorId: 'V-ACER-01', onTimeDeliveryRate: 68, defectRate: 5.8, avgResponseHours: 18, ordersFulfilled: 40 },
  { vendorId: 'V-APPLE-01', onTimeDeliveryRate: 98, defectRate: 0.5, avgResponseHours: 3, ordersFulfilled: 61 },
  { vendorId: 'V-MEDLIFE-01', onTimeDeliveryRate: 94, defectRate: 1.0, avgResponseHours: 5, ordersFulfilled: 210 },
  { vendorId: 'V-APOLLO-01', onTimeDeliveryRate: 90, defectRate: 1.5, avgResponseHours: 8, ordersFulfilled: 54 },
  { vendorId: 'V-VITALCARE-01', onTimeDeliveryRate: 77, defectRate: 4.2, avgResponseHours: 14, ordersFulfilled: 88 },
  { vendorId: 'V-OFFICEPRO-01', onTimeDeliveryRate: 92, defectRate: 1.8, avgResponseHours: 6, ordersFulfilled: 305 },
  { vendorId: 'V-DESKMART-01', onTimeDeliveryRate: 86, defectRate: 2.6, avgResponseHours: 9, ordersFulfilled: 120 },
];

export interface SeedCompliance {
  vendorId: string;
  certifications: string[];
  lastAuditDate: string; // ISO date
  auditScore: number;
  flags: string[];
}

// Deliberately omit compliance rows for V-PAPERNEST-01 (data gap).
export const SEED_COMPLIANCE: SeedCompliance[] = [
  { vendorId: 'V-DELL-01', certifications: ['ISO 9001', 'ISO 14001', 'EPEAT Gold'], lastAuditDate: '2026-02-10', auditScore: 96, flags: [] },
  { vendorId: 'V-HP-01', certifications: ['ISO 9001', 'RoHS'], lastAuditDate: '2026-01-22', auditScore: 91, flags: [] },
  { vendorId: 'V-LENOVO-01', certifications: ['ISO 9001'], lastAuditDate: '2025-06-15', auditScore: 72, flags: ['Audit overdue'] },
  { vendorId: 'V-ACER-01', certifications: [], lastAuditDate: '2025-03-01', auditScore: 54, flags: ['Late deliveries', 'Audit overdue'] },
  { vendorId: 'V-APPLE-01', certifications: ['ISO 9001', 'ISO 14001', 'EPEAT Gold', 'RoHS'], lastAuditDate: '2026-03-05', auditScore: 98, flags: [] },
  { vendorId: 'V-MEDLIFE-01', certifications: ['ISO 13485', 'CE Mark'], lastAuditDate: '2026-02-18', auditScore: 93, flags: [] },
  { vendorId: 'V-APOLLO-01', certifications: ['ISO 13485', 'CE Mark', 'FDA 510k'], lastAuditDate: '2026-01-30', auditScore: 95, flags: [] },
  { vendorId: 'V-CAREPLUS-01', certifications: ['ISO 13485'], lastAuditDate: '2025-11-11', auditScore: 80, flags: [] },
  { vendorId: 'V-VITALCARE-01', certifications: ['CE Mark'], lastAuditDate: '2025-05-20', auditScore: 61, flags: ['Expired stock complaint'] },
  { vendorId: 'V-OFFICEPRO-01', certifications: ['ISO 9001'], lastAuditDate: '2026-02-01', auditScore: 88, flags: [] },
  { vendorId: 'V-DESKMART-01', certifications: ['ISO 9001', 'FSC Certified'], lastAuditDate: '2026-01-15', auditScore: 90, flags: [] },
];

export interface SeedHistoricalContract {
  vendorId: string;
  item: string;
  contractDate: string; // ISO date
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  warrantyMonths: number;
  deliveryDaysAgreed: number;
  deliveryDaysActual: number;
  notes?: string;
}

export const SEED_CONTRACTS: SeedHistoricalContract[] = [
  { vendorId: 'V-DELL-01', item: 'Dell Latitude Laptop', contractDate: '2025-11-02', quantity: 80, unitPrice: 53500, discountPercent: 6, warrantyMonths: 36, deliveryDaysAgreed: 14, deliveryDaysActual: 13, notes: 'Bulk order, met SLA.' },
  { vendorId: 'V-DELL-01', item: 'Dell Latitude Laptop', contractDate: '2026-03-18', quantity: 120, unitPrice: 52000, discountPercent: 8, warrantyMonths: 36, deliveryDaysAgreed: 12, deliveryDaysActual: 12, notes: 'Repeat customer discount applied.' },
  { vendorId: 'V-HP-01', item: 'HP EliteBook Laptop', contractDate: '2025-09-10', quantity: 60, unitPrice: 50500, discountPercent: 4, warrantyMonths: 24, deliveryDaysAgreed: 18, deliveryDaysActual: 21, notes: 'Slight delay due to customs.' },
  { vendorId: 'V-LENOVO-01', item: 'Lenovo ThinkPad Laptop', contractDate: '2025-12-05', quantity: 50, unitPrice: 48200, discountPercent: 3, warrantyMonths: 24, deliveryDaysAgreed: 20, deliveryDaysActual: 26, notes: 'Delivery delay flagged.' },
  { vendorId: 'V-ACER-01', item: 'Acer TravelMate Laptop', contractDate: '2025-08-14', quantity: 40, unitPrice: 41500, discountPercent: 2, warrantyMonths: 12, deliveryDaysAgreed: 20, deliveryDaysActual: 30 },
  { vendorId: 'V-APPLE-01', item: 'MacBook Air', contractDate: '2026-01-20', quantity: 25, unitPrice: 99500, discountPercent: 3, warrantyMonths: 12, deliveryDaysAgreed: 10, deliveryDaysActual: 9 },
  { vendorId: 'V-MEDLIFE-01', item: 'Surgical Gloves (case)', contractDate: '2025-10-01', quantity: 500, unitPrice: 1180, discountPercent: 5, warrantyMonths: 0, deliveryDaysAgreed: 7, deliveryDaysActual: 6 },
  { vendorId: 'V-APOLLO-01', item: 'Patient Monitor', contractDate: '2025-07-22', quantity: 15, unitPrice: 182000, discountPercent: 4, warrantyMonths: 24, deliveryDaysAgreed: 21, deliveryDaysActual: 23 },
  { vendorId: 'V-OFFICEPRO-01', item: 'Copy Paper (ream)', contractDate: '2026-02-11', quantity: 2000, unitPrice: 365, discountPercent: 6, warrantyMonths: 0, deliveryDaysAgreed: 5, deliveryDaysActual: 5 },
  { vendorId: 'V-DESKMART-01', item: 'Ergonomic Chair', contractDate: '2025-12-28', quantity: 100, unitPrice: 4050, discountPercent: 4, warrantyMonths: 12, deliveryDaysAgreed: 14, deliveryDaysActual: 16 },
];

export interface SeedMarketPrice {
  item: string;
  category: string;
  marketAvgPrice: number;
  currency: string;
  asOfDate: string;
}

export const SEED_MARKET_PRICES: SeedMarketPrice[] = [
  { item: 'Dell Latitude Laptop', category: 'IT Hardware', marketAvgPrice: 54000, currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'HP EliteBook Laptop', category: 'IT Hardware', marketAvgPrice: 51500, currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'Lenovo ThinkPad Laptop', category: 'IT Hardware', marketAvgPrice: 49000, currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'Acer TravelMate Laptop', category: 'IT Hardware', marketAvgPrice: 43000, currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'MacBook Air', category: 'IT Hardware', marketAvgPrice: 101000, currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'Surgical Gloves (case)', category: 'Medical', marketAvgPrice: 1250, currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'Patient Monitor', category: 'Medical', marketAvgPrice: 190000, currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'Copy Paper (ream)', category: 'Office Supplies', marketAvgPrice: 390, currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'Ergonomic Chair', category: 'Office Supplies', marketAvgPrice: 4300, currency: 'INR', asOfDate: '2026-06-01' },
];
