/**
 * Static seed data for the VendorIQ demo database.
 *
 * 15 vendors across IT Hardware / Medical / Office Supplies with deliberate
 * diversity of strengths: HP wins speed, Lenovo wins cost, Dell wins reliability,
 * Apple wins premium quality, etc.  Performance, compliance, contracts, market
 * prices and product SKUs are all seeded here.
 */

// ─── Vendor Master ────────────────────────────────────────────────────────────

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
  monthlyCapacity: number;
  currentStock: number;
  leadTimeBaseDays: number;
  notes?: string;
}

export const SEED_VENDORS: SeedVendor[] = [
  // ── IT Hardware ─────────────────────────────────────────────────────────────
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
    monthlyCapacity: 600,
    currentStock: 220,
    leadTimeBaseDays: 12,
    notes: 'Enterprise reliability leader. Best for large-scale, audit-sensitive procurement.',
  },
  {
    vendorId: 'V-HP-01',
    name: 'HP Enterprise Solutions',
    category: 'IT Hardware',
    productLines: ['HP EliteBook', 'HP ProBook', 'HP LaserJet'],
    basePrice: 49500,
    currency: 'INR',
    // Fastest IT Hardware vendor — wins urgent scenarios
    deliveryDays: 9,
    qualityScore: 87,
    complianceStatus: 'certified',
    imageUrl: 'https://images.unsplash.com/photo-1576057122708-9608db46b2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Gurugram',
    monthlyCapacity: 450,
    currentStock: 180,
    leadTimeBaseDays: 9,
    notes: 'Fastest fulfillment in category. Preferred for time-critical deployments.',
  },
  {
    vendorId: 'V-LENOVO-01',
    name: 'Lenovo India Distribution',
    category: 'IT Hardware',
    productLines: ['Lenovo ThinkPad', 'Lenovo IdeaPad', 'Lenovo Legion'],
    // Lowest base price — wins budget scenarios
    basePrice: 36000,
    currency: 'INR',
    deliveryDays: 20,
    qualityScore: 82,
    complianceStatus: 'pending',
    imageUrl: 'https://images.unsplash.com/photo-1667308274522-886ce9a3f0cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Pune',
    monthlyCapacity: 400,
    currentStock: 310,
    leadTimeBaseDays: 20,
    notes: 'Most cost-efficient IT Hardware option. Compliance audit overdue by 2 quarters.',
  },
  {
    vendorId: 'V-ACER-01',
    name: 'Acer Business Systems',
    category: 'IT Hardware',
    productLines: ['Acer TravelMate', 'Acer Aspire'],
    basePrice: 41000,
    currency: 'INR',
    deliveryDays: 22,
    qualityScore: 74,
    complianceStatus: 'flagged',
    imageUrl: 'https://images.unsplash.com/photo-1643453690293-d35fcf9850c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Chennai',
    monthlyCapacity: 200,
    currentStock: 75,
    leadTimeBaseDays: 22,
    notes: 'Flagged for late deliveries in last two contracts. Suitable only for non-critical purchases.',
  },
  {
    vendorId: 'V-APPLE-01',
    name: 'Apple Authorised Reseller — Redington',
    category: 'IT Hardware',
    productLines: ['MacBook Air', 'MacBook Pro', 'iPad'],
    basePrice: 98000,
    currency: 'INR',
    // Second-fastest, highest quality
    deliveryDays: 10,
    qualityScore: 95,
    complianceStatus: 'certified',
    imageUrl: 'https://images.unsplash.com/photo-1742119971773-57e0131095b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Mumbai',
    monthlyCapacity: 120,
    currentStock: 55,
    leadTimeBaseDays: 10,
    notes: 'Premium quality, top compliance scores. Wins for executive/design procurement.',
  },
  {
    vendorId: 'V-SAMSUNG-01',
    name: 'Samsung India Electronics',
    category: 'IT Hardware',
    productLines: ['Samsung Galaxy Book', 'Samsung Monitor', 'Samsung SSD'],
    basePrice: 46000,
    currency: 'INR',
    deliveryDays: 11,
    qualityScore: 86,
    complianceStatus: 'certified',
    imageUrl: 'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Noida',
    monthlyCapacity: 350,
    currentStock: 130,
    leadTimeBaseDays: 11,
    notes: 'Strong balance of cost and speed. Good alternative to HP for mid-range procurement.',
  },

  // ── Medical ─────────────────────────────────────────────────────────────────
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
    monthlyCapacity: 25000,
    currentStock: 8000,
    leadTimeBaseDays: 7,
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
    monthlyCapacity: 25,
    currentStock: 18,
    leadTimeBaseDays: 21,
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
    monthlyCapacity: 600,
    currentStock: 250,
    leadTimeBaseDays: 9,
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
    monthlyCapacity: 35000,
    currentStock: 12000,
    leadTimeBaseDays: 6,
    notes: 'One prior compliance flag for expired-stock complaint.',
  },
  {
    vendorId: 'V-LIFESIGN-01',
    name: 'LifeSign Medical Systems',
    category: 'Medical',
    productLines: ['ECG Machines', 'Ultrasound Units', 'Surgical Instruments'],
    basePrice: 152000,
    currency: 'INR',
    deliveryDays: 14,
    qualityScore: 92,
    complianceStatus: 'certified',
    imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Bengaluru',
    monthlyCapacity: 18,
    currentStock: 10,
    leadTimeBaseDays: 14,
    notes: 'Highest quality medical equipment, strong regulatory track record.',
  },

  // ── Office Supplies ─────────────────────────────────────────────────────────
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
    monthlyCapacity: 60000,
    currentStock: 20000,
    leadTimeBaseDays: 5,
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
    monthlyCapacity: 25000,
    currentStock: 8000,
    leadTimeBaseDays: 8,
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
    monthlyCapacity: 200,
    currentStock: 80,
    leadTimeBaseDays: 14,
  },
  {
    vendorId: 'V-STAPLES-01',
    name: 'Staples India Business Supplies',
    category: 'Office Supplies',
    productLines: ['Paper & Stationery', 'Ink & Toner', 'Breakroom Supplies'],
    // Cheapest and fastest Office Supplies vendor
    basePrice: 340,
    currency: 'INR',
    deliveryDays: 3,
    qualityScore: 83,
    complianceStatus: 'certified',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    city: 'Mumbai',
    monthlyCapacity: 80000,
    currentStock: 30000,
    leadTimeBaseDays: 3,
    notes: 'Fastest delivery in Office Supplies. Strong for urgent bulk stationery orders.',
  },
];

// ─── Performance Records ──────────────────────────────────────────────────────

export interface SeedPerformance {
  vendorId: string;
  onTimeDeliveryRate: number;
  defectRate: number;
  avgResponseHours: number;
  ordersFulfilled: number;
}

// CarePlus and PaperNest deliberately omitted to simulate data gaps.
export const SEED_PERFORMANCE: SeedPerformance[] = [
  { vendorId: 'V-DELL-01',     onTimeDeliveryRate: 96, defectRate: 1.2, avgResponseHours: 4,  ordersFulfilled: 142 },
  { vendorId: 'V-HP-01',       onTimeDeliveryRate: 95, defectRate: 1.5, avgResponseHours: 4,  ordersFulfilled: 110 },
  { vendorId: 'V-LENOVO-01',   onTimeDeliveryRate: 80, defectRate: 3.6, avgResponseHours: 11, ordersFulfilled: 78  },
  { vendorId: 'V-ACER-01',     onTimeDeliveryRate: 68, defectRate: 5.8, avgResponseHours: 18, ordersFulfilled: 40  },
  { vendorId: 'V-APPLE-01',    onTimeDeliveryRate: 98, defectRate: 0.5, avgResponseHours: 3,  ordersFulfilled: 61  },
  { vendorId: 'V-SAMSUNG-01',  onTimeDeliveryRate: 93, defectRate: 1.8, avgResponseHours: 5,  ordersFulfilled: 85  },
  { vendorId: 'V-MEDLIFE-01',  onTimeDeliveryRate: 94, defectRate: 1.0, avgResponseHours: 5,  ordersFulfilled: 210 },
  { vendorId: 'V-APOLLO-01',   onTimeDeliveryRate: 90, defectRate: 1.5, avgResponseHours: 8,  ordersFulfilled: 54  },
  { vendorId: 'V-VITALCARE-01',onTimeDeliveryRate: 77, defectRate: 4.2, avgResponseHours: 14, ordersFulfilled: 88  },
  { vendorId: 'V-LIFESIGN-01', onTimeDeliveryRate: 92, defectRate: 0.8, avgResponseHours: 6,  ordersFulfilled: 38  },
  { vendorId: 'V-OFFICEPRO-01',onTimeDeliveryRate: 92, defectRate: 1.8, avgResponseHours: 6,  ordersFulfilled: 305 },
  { vendorId: 'V-DESKMART-01', onTimeDeliveryRate: 86, defectRate: 2.6, avgResponseHours: 9,  ordersFulfilled: 120 },
  { vendorId: 'V-STAPLES-01',  onTimeDeliveryRate: 97, defectRate: 1.2, avgResponseHours: 3,  ordersFulfilled: 420 },
];

// ─── Compliance Records ───────────────────────────────────────────────────────

export interface SeedCompliance {
  vendorId: string;
  certifications: string[];
  lastAuditDate: string;
  auditScore: number;
  flags: string[];
}

// PaperNest deliberately omitted to simulate data gap.
export const SEED_COMPLIANCE: SeedCompliance[] = [
  { vendorId: 'V-DELL-01',     certifications: ['ISO 9001', 'ISO 14001', 'EPEAT Gold'], lastAuditDate: '2026-02-10', auditScore: 96, flags: [] },
  { vendorId: 'V-HP-01',       certifications: ['ISO 9001', 'RoHS'],                    lastAuditDate: '2026-03-15', auditScore: 91, flags: [] },
  { vendorId: 'V-LENOVO-01',   certifications: ['ISO 9001'],                            lastAuditDate: '2025-06-15', auditScore: 72, flags: ['Audit overdue'] },
  { vendorId: 'V-ACER-01',     certifications: [],                                      lastAuditDate: '2025-03-01', auditScore: 54, flags: ['Late deliveries', 'Audit overdue'] },
  { vendorId: 'V-APPLE-01',    certifications: ['ISO 9001', 'ISO 14001', 'EPEAT Gold', 'RoHS'], lastAuditDate: '2026-04-10', auditScore: 98, flags: [] },
  { vendorId: 'V-SAMSUNG-01',  certifications: ['ISO 9001', 'RoHS', 'EPEAT Silver'],    lastAuditDate: '2026-02-28', auditScore: 90, flags: [] },
  { vendorId: 'V-MEDLIFE-01',  certifications: ['ISO 13485', 'CE Mark'],               lastAuditDate: '2026-02-18', auditScore: 93, flags: [] },
  { vendorId: 'V-APOLLO-01',   certifications: ['ISO 13485', 'CE Mark', 'FDA 510k'],   lastAuditDate: '2026-01-30', auditScore: 95, flags: [] },
  { vendorId: 'V-CAREPLUS-01', certifications: ['ISO 13485'],                           lastAuditDate: '2025-11-11', auditScore: 80, flags: [] },
  { vendorId: 'V-VITALCARE-01',certifications: ['CE Mark'],                             lastAuditDate: '2025-05-20', auditScore: 61, flags: ['Expired stock complaint'] },
  { vendorId: 'V-LIFESIGN-01', certifications: ['ISO 13485', 'CE Mark', 'FDA 510k', 'CDSCO'],lastAuditDate: '2026-04-05', auditScore: 96, flags: [] },
  { vendorId: 'V-OFFICEPRO-01',certifications: ['ISO 9001'],                            lastAuditDate: '2026-02-01', auditScore: 88, flags: [] },
  { vendorId: 'V-DESKMART-01', certifications: ['ISO 9001', 'FSC Certified'],           lastAuditDate: '2026-01-15', auditScore: 90, flags: [] },
  { vendorId: 'V-STAPLES-01',  certifications: ['ISO 9001', 'FSC Certified'],           lastAuditDate: '2026-03-20', auditScore: 89, flags: [] },
];

// ─── Historical Contracts ─────────────────────────────────────────────────────

export interface SeedHistoricalContract {
  vendorId: string;
  item: string;
  contractDate: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  warrantyMonths: number;
  deliveryDaysAgreed: number;
  deliveryDaysActual: number;
  notes?: string;
}

export const SEED_CONTRACTS: SeedHistoricalContract[] = [
  { vendorId: 'V-DELL-01',     item: 'Dell Latitude 5450',    contractDate: '2025-11-02', quantity: 80,   unitPrice: 53500, discountPercent: 6,  warrantyMonths: 36, deliveryDaysAgreed: 14, deliveryDaysActual: 13, notes: 'Bulk order, met SLA.' },
  { vendorId: 'V-DELL-01',     item: 'Dell Latitude 5450',    contractDate: '2026-03-18', quantity: 120,  unitPrice: 52000, discountPercent: 8,  warrantyMonths: 36, deliveryDaysAgreed: 12, deliveryDaysActual: 12, notes: 'Repeat customer discount applied.' },
  { vendorId: 'V-DELL-01',     item: 'Dell OptiPlex 7010',    contractDate: '2025-09-05', quantity: 50,   unitPrice: 49500, discountPercent: 5,  warrantyMonths: 36, deliveryDaysAgreed: 12, deliveryDaysActual: 11 },
  { vendorId: 'V-HP-01',       item: 'HP EliteBook 840 G11',  contractDate: '2025-09-10', quantity: 60,   unitPrice: 50500, discountPercent: 4,  warrantyMonths: 24, deliveryDaysAgreed: 10, deliveryDaysActual: 10, notes: 'Met SLA comfortably.' },
  { vendorId: 'V-HP-01',       item: 'HP ProBook 450 G11',    contractDate: '2026-01-22', quantity: 200,  unitPrice: 43500, discountPercent: 6,  warrantyMonths: 24, deliveryDaysAgreed: 9,  deliveryDaysActual: 9  },
  { vendorId: 'V-LENOVO-01',   item: 'Lenovo ThinkPad L15',   contractDate: '2025-12-05', quantity: 50,   unitPrice: 35000, discountPercent: 3,  warrantyMonths: 12, deliveryDaysAgreed: 20, deliveryDaysActual: 23, notes: 'Slight delay flagged.' },
  { vendorId: 'V-LENOVO-01',   item: 'Lenovo ThinkPad X1',    contractDate: '2026-02-14', quantity: 30,   unitPrice: 38500, discountPercent: 4,  warrantyMonths: 24, deliveryDaysAgreed: 18, deliveryDaysActual: 20 },
  { vendorId: 'V-ACER-01',     item: 'Acer TravelMate P6',    contractDate: '2025-08-14', quantity: 40,   unitPrice: 41500, discountPercent: 2,  warrantyMonths: 12, deliveryDaysAgreed: 20, deliveryDaysActual: 30 },
  { vendorId: 'V-APPLE-01',    item: 'MacBook Air M3',         contractDate: '2026-01-20', quantity: 25,   unitPrice: 99500, discountPercent: 3,  warrantyMonths: 12, deliveryDaysAgreed: 10, deliveryDaysActual: 9  },
  { vendorId: 'V-SAMSUNG-01',  item: 'Samsung Galaxy Book4',   contractDate: '2026-02-10', quantity: 45,   unitPrice: 46500, discountPercent: 4,  warrantyMonths: 24, deliveryDaysAgreed: 11, deliveryDaysActual: 11 },
  { vendorId: 'V-MEDLIFE-01',  item: 'Surgical Gloves (case)', contractDate: '2025-10-01', quantity: 500,  unitPrice: 1180,  discountPercent: 5,  warrantyMonths: 0,  deliveryDaysAgreed: 7,  deliveryDaysActual: 6  },
  { vendorId: 'V-APOLLO-01',   item: 'Patient Monitor',        contractDate: '2025-07-22', quantity: 15,   unitPrice: 182000,discountPercent: 4,  warrantyMonths: 24, deliveryDaysAgreed: 21, deliveryDaysActual: 23 },
  { vendorId: 'V-LIFESIGN-01', item: 'ECG Machine 12-Lead',    contractDate: '2026-01-08', quantity: 8,    unitPrice: 148000,discountPercent: 5,  warrantyMonths: 24, deliveryDaysAgreed: 14, deliveryDaysActual: 14 },
  { vendorId: 'V-OFFICEPRO-01',item: 'Copy Paper (ream)',       contractDate: '2026-02-11', quantity: 2000, unitPrice: 365,   discountPercent: 6,  warrantyMonths: 0,  deliveryDaysAgreed: 5,  deliveryDaysActual: 5  },
  { vendorId: 'V-DESKMART-01', item: 'Ergonomic Chair',         contractDate: '2025-12-28', quantity: 100,  unitPrice: 4050,  discountPercent: 4,  warrantyMonths: 12, deliveryDaysAgreed: 14, deliveryDaysActual: 16 },
  { vendorId: 'V-STAPLES-01',  item: 'Copy Paper A4 (ream)',    contractDate: '2026-04-01', quantity: 5000, unitPrice: 340,   discountPercent: 7,  warrantyMonths: 0,  deliveryDaysAgreed: 3,  deliveryDaysActual: 3  },
  { vendorId: 'V-STAPLES-01',  item: 'Printer Ink Cartridges',  contractDate: '2026-01-15', quantity: 200,  unitPrice: 850,   discountPercent: 5,  warrantyMonths: 0,  deliveryDaysAgreed: 3,  deliveryDaysActual: 3  },
];

// ─── Market Prices ────────────────────────────────────────────────────────────

export interface SeedMarketPrice {
  item: string;
  category: string;
  marketAvgPrice: number;
  currency: string;
  asOfDate: string;
}

export const SEED_MARKET_PRICES: SeedMarketPrice[] = [
  { item: 'Dell Latitude Laptop',        category: 'IT Hardware',     marketAvgPrice: 54000,  currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'HP EliteBook Laptop',         category: 'IT Hardware',     marketAvgPrice: 51500,  currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'Lenovo ThinkPad Laptop',      category: 'IT Hardware',     marketAvgPrice: 38000,  currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'Acer TravelMate Laptop',      category: 'IT Hardware',     marketAvgPrice: 42000,  currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'MacBook Air',                 category: 'IT Hardware',     marketAvgPrice: 101000, currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'Samsung Galaxy Book Laptop',  category: 'IT Hardware',     marketAvgPrice: 48000,  currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'Laptop',                      category: 'IT Hardware',     marketAvgPrice: 52000,  currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'Surgical Gloves (case)',      category: 'Medical',         marketAvgPrice: 1250,   currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'Patient Monitor',            category: 'Medical',         marketAvgPrice: 190000, currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'IV Fluids',                  category: 'Medical',         marketAvgPrice: 1000,   currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'Stethoscope',               category: 'Medical',         marketAvgPrice: 2600,   currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'PPE Kits',                  category: 'Medical',         marketAvgPrice: 1900,   currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'ECG Machine',               category: 'Medical',         marketAvgPrice: 155000, currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'Copy Paper (ream)',          category: 'Office Supplies', marketAvgPrice: 390,    currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'Ergonomic Chair',           category: 'Office Supplies', marketAvgPrice: 4300,   currency: 'INR', asOfDate: '2026-06-01' },
  { item: 'Notebook',                  category: 'Office Supplies', marketAvgPrice: 200,    currency: 'INR', asOfDate: '2026-06-01' },
];

// ─── Product SKU Catalog ──────────────────────────────────────────────────────

export interface SeedProduct {
  productId: string;
  vendorId: string;
  name: string;
  category: 'IT Hardware' | 'Medical' | 'Office Supplies';
  specifications: {
    ramGb?: number;
    cpu?: string;
    storageGb?: number;
    screenInch?: number;
    osType?: string;
    warrantyYears: number;
    weight?: string;
    resolution?: string;
    batteryHours?: number;
    connectivity?: string;
  };
  unitPrice: number;
  stockQty: number;
  monthlyCapacity: number;
  isAvailable: boolean;
}

export const SEED_PRODUCTS: SeedProduct[] = [
  // ── Dell IT Hardware SKUs ────────────────────────────────────────────────────
  {
    productId: 'P-DELL-L5450-16',
    vendorId: 'V-DELL-01',
    name: 'Dell Latitude 5450 (16GB/512GB)',
    category: 'IT Hardware',
    specifications: { ramGb: 16, cpu: 'Intel Core i7-1355U', storageGb: 512, screenInch: 14, osType: 'Windows 11 Pro', warrantyYears: 3, weight: '1.55 kg', batteryHours: 12 },
    unitPrice: 54000,
    stockQty: 120,
    monthlyCapacity: 300,
    isAvailable: true,
  },
  {
    productId: 'P-DELL-L5350-8',
    vendorId: 'V-DELL-01',
    name: 'Dell Latitude 5350 (8GB/256GB)',
    category: 'IT Hardware',
    specifications: { ramGb: 8, cpu: 'Intel Core i5-1335U', storageGb: 256, screenInch: 13.3, osType: 'Windows 11 Pro', warrantyYears: 3, weight: '1.36 kg', batteryHours: 10 },
    unitPrice: 47000,
    stockQty: 80,
    monthlyCapacity: 200,
    isAvailable: true,
  },
  {
    productId: 'P-DELL-OPT7010',
    vendorId: 'V-DELL-01',
    name: 'Dell OptiPlex 7010 Desktop (16GB/512GB)',
    category: 'IT Hardware',
    specifications: { ramGb: 16, cpu: 'Intel Core i7-13700', storageGb: 512, osType: 'Windows 11 Pro', warrantyYears: 3 },
    unitPrice: 49000,
    stockQty: 60,
    monthlyCapacity: 150,
    isAvailable: true,
  },

  // ── HP IT Hardware SKUs ──────────────────────────────────────────────────────
  {
    productId: 'P-HP-EB840-16',
    vendorId: 'V-HP-01',
    name: 'HP EliteBook 840 G11 (16GB/512GB)',
    category: 'IT Hardware',
    specifications: { ramGb: 16, cpu: 'Intel Core Ultra 7 155U', storageGb: 512, screenInch: 14, osType: 'Windows 11 Pro', warrantyYears: 2, weight: '1.44 kg', batteryHours: 13 },
    unitPrice: 51000,
    stockQty: 90,
    monthlyCapacity: 250,
    isAvailable: true,
  },
  {
    productId: 'P-HP-PB450-8',
    vendorId: 'V-HP-01',
    name: 'HP ProBook 450 G11 (8GB/256GB)',
    category: 'IT Hardware',
    specifications: { ramGb: 8, cpu: 'Intel Core i5-1335U', storageGb: 256, screenInch: 15.6, osType: 'Windows 11 Home', warrantyYears: 2, weight: '1.74 kg', batteryHours: 9 },
    unitPrice: 43000,
    stockQty: 60,
    monthlyCapacity: 180,
    isAvailable: true,
  },

  // ── Lenovo IT Hardware SKUs ──────────────────────────────────────────────────
  {
    productId: 'P-LENOVO-X1-16',
    vendorId: 'V-LENOVO-01',
    name: 'Lenovo ThinkPad X1 Carbon (16GB/512GB)',
    category: 'IT Hardware',
    specifications: { ramGb: 16, cpu: 'Intel Core i7-1355U', storageGb: 512, screenInch: 14, osType: 'Windows 11 Pro', warrantyYears: 2, weight: '1.12 kg', batteryHours: 15 },
    unitPrice: 40000,
    stockQty: 150,
    monthlyCapacity: 200,
    isAvailable: true,
  },
  {
    productId: 'P-LENOVO-L15-8',
    vendorId: 'V-LENOVO-01',
    name: 'Lenovo ThinkPad L15 (8GB/256GB)',
    category: 'IT Hardware',
    specifications: { ramGb: 8, cpu: 'Intel Core i5-1345U', storageGb: 256, screenInch: 15.6, osType: 'Windows 11 Pro', warrantyYears: 1, weight: '1.70 kg', batteryHours: 8 },
    unitPrice: 33000,
    stockQty: 200,
    monthlyCapacity: 300,
    isAvailable: true,
  },

  // ── Apple IT Hardware SKUs ───────────────────────────────────────────────────
  {
    productId: 'P-APPLE-MA-M3-16',
    vendorId: 'V-APPLE-01',
    name: 'MacBook Air M3 (16GB/512GB)',
    category: 'IT Hardware',
    specifications: { ramGb: 16, cpu: 'Apple M3', storageGb: 512, screenInch: 13.6, osType: 'macOS Sonoma', warrantyYears: 1, weight: '1.24 kg', batteryHours: 18 },
    unitPrice: 99000,
    stockQty: 40,
    monthlyCapacity: 80,
    isAvailable: true,
  },
  {
    productId: 'P-APPLE-MP-M3P-18',
    vendorId: 'V-APPLE-01',
    name: 'MacBook Pro M3 Pro (18GB/512GB)',
    category: 'IT Hardware',
    specifications: { ramGb: 18, cpu: 'Apple M3 Pro', storageGb: 512, screenInch: 14.2, osType: 'macOS Sonoma', warrantyYears: 1, weight: '1.61 kg', batteryHours: 22 },
    unitPrice: 175000,
    stockQty: 20,
    monthlyCapacity: 40,
    isAvailable: true,
  },

  // ── Samsung IT Hardware SKUs ─────────────────────────────────────────────────
  {
    productId: 'P-SAMSUNG-GB4-16',
    vendorId: 'V-SAMSUNG-01',
    name: 'Samsung Galaxy Book4 Pro (16GB/512GB)',
    category: 'IT Hardware',
    specifications: { ramGb: 16, cpu: 'Intel Core Ultra 7', storageGb: 512, screenInch: 14, osType: 'Windows 11 Pro', warrantyYears: 2, weight: '1.17 kg', batteryHours: 14 },
    unitPrice: 47000,
    stockQty: 90,
    monthlyCapacity: 200,
    isAvailable: true,
  },
  {
    productId: 'P-SAMSUNG-GB4-8',
    vendorId: 'V-SAMSUNG-01',
    name: 'Samsung Galaxy Book4 (8GB/256GB)',
    category: 'IT Hardware',
    specifications: { ramGb: 8, cpu: 'Intel Core i5-1335U', storageGb: 256, screenInch: 15.6, osType: 'Windows 11 Home', warrantyYears: 2, weight: '1.59 kg', batteryHours: 11 },
    unitPrice: 41000,
    stockQty: 70,
    monthlyCapacity: 150,
    isAvailable: true,
  },

  // ── Medical SKUs ─────────────────────────────────────────────────────────────
  {
    productId: 'P-MEDLIFE-SG-100',
    vendorId: 'V-MEDLIFE-01',
    name: 'Surgical Gloves Latex (case/100 pairs)',
    category: 'Medical',
    specifications: { warrantyYears: 0 },
    unitPrice: 1200,
    stockQty: 8000,
    monthlyCapacity: 25000,
    isAvailable: true,
  },
  {
    productId: 'P-MEDLIFE-PPE-10',
    vendorId: 'V-MEDLIFE-01',
    name: 'PPE Full-Body Kit (box/10)',
    category: 'Medical',
    specifications: { warrantyYears: 0 },
    unitPrice: 1800,
    stockQty: 3000,
    monthlyCapacity: 15000,
    isAvailable: true,
  },
  {
    productId: 'P-APOLLO-PM-PRIMUS',
    vendorId: 'V-APOLLO-01',
    name: 'Apollo Primus ICU Patient Monitor',
    category: 'Medical',
    specifications: { warrantyYears: 2, connectivity: 'WiFi + LAN' },
    unitPrice: 185000,
    stockQty: 18,
    monthlyCapacity: 20,
    isAvailable: true,
  },
  {
    productId: 'P-APOLLO-IP-FUSION',
    vendorId: 'V-APOLLO-01',
    name: 'Apollo Fusion IV Infusion Pump',
    category: 'Medical',
    specifications: { warrantyYears: 2 },
    unitPrice: 145000,
    stockQty: 12,
    monthlyCapacity: 15,
    isAvailable: true,
  },
  {
    productId: 'P-CAREPLUS-DS-PRO',
    vendorId: 'V-CAREPLUS-01',
    name: 'CarePlus Digital Stethoscope Pro',
    category: 'Medical',
    specifications: { warrantyYears: 1 },
    unitPrice: 2400,
    stockQty: 250,
    monthlyCapacity: 500,
    isAvailable: true,
  },
  {
    productId: 'P-VITALCARE-IV-NS',
    vendorId: 'V-VITALCARE-01',
    name: 'IV Normal Saline 500ml (case/12 bottles)',
    category: 'Medical',
    specifications: { warrantyYears: 0 },
    unitPrice: 950,
    stockQty: 12000,
    monthlyCapacity: 35000,
    isAvailable: true,
  },
  {
    productId: 'P-LIFESIGN-ECG-12',
    vendorId: 'V-LIFESIGN-01',
    name: 'LifeSign CardioStar 12-Lead ECG Machine',
    category: 'Medical',
    specifications: { warrantyYears: 2, connectivity: 'WiFi + Bluetooth', resolution: '1024×768 Touchscreen' },
    unitPrice: 152000,
    stockQty: 10,
    monthlyCapacity: 18,
    isAvailable: true,
  },

  // ── Office Supplies SKUs ─────────────────────────────────────────────────────
  {
    productId: 'P-OFFICEPRO-CP-500',
    vendorId: 'V-OFFICEPRO-01',
    name: 'JK Copier A4 Paper (ream/500 sheets)',
    category: 'Office Supplies',
    specifications: { warrantyYears: 0 },
    unitPrice: 380,
    stockQty: 20000,
    monthlyCapacity: 60000,
    isAvailable: true,
  },
  {
    productId: 'P-PAPERNEST-NB-A5',
    vendorId: 'V-PAPERNEST-01',
    name: 'PaperNest Premium Spiral Notebook A5 (pack/5)',
    category: 'Office Supplies',
    specifications: { warrantyYears: 0 },
    unitPrice: 550,
    stockQty: 4000,
    monthlyCapacity: 15000,
    isAvailable: true,
  },
  {
    productId: 'P-DESKMART-EC-BAS',
    vendorId: 'V-DESKMART-01',
    name: 'DeskMart ErgoFlex Office Chair (Basic)',
    category: 'Office Supplies',
    specifications: { warrantyYears: 1 },
    unitPrice: 3800,
    stockQty: 150,
    monthlyCapacity: 100,
    isAvailable: true,
  },
  {
    productId: 'P-DESKMART-EC-PRO',
    vendorId: 'V-DESKMART-01',
    name: 'DeskMart ErgoFlex Office Chair (Premium Mesh)',
    category: 'Office Supplies',
    specifications: { warrantyYears: 2 },
    unitPrice: 6200,
    stockQty: 80,
    monthlyCapacity: 60,
    isAvailable: true,
  },
  {
    productId: 'P-DESKMART-WB-4X3',
    vendorId: 'V-DESKMART-01',
    name: 'DeskMart Magnetic Whiteboard 4×3 ft',
    category: 'Office Supplies',
    specifications: { warrantyYears: 1 },
    unitPrice: 2800,
    stockQty: 100,
    monthlyCapacity: 80,
    isAvailable: true,
  },
  {
    productId: 'P-STAPLES-CP-500',
    vendorId: 'V-STAPLES-01',
    name: 'Staples Pro A4 Paper (ream/500 sheets)',
    category: 'Office Supplies',
    specifications: { warrantyYears: 0 },
    unitPrice: 340,
    stockQty: 30000,
    monthlyCapacity: 80000,
    isAvailable: true,
  },
  {
    productId: 'P-STAPLES-INK-BLK',
    vendorId: 'V-STAPLES-01',
    name: 'Staples Compatible Ink Cartridge — Black (twin pack)',
    category: 'Office Supplies',
    specifications: { warrantyYears: 0 },
    unitPrice: 850,
    stockQty: 5000,
    monthlyCapacity: 20000,
    isAvailable: true,
  },
];
