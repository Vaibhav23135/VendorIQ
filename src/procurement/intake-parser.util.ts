/**
 * Deterministic free-text → structured intake parser with spec extraction and
 * scenario intent detection.
 *
 * Rule-based (no external LLM dependency) so the auto-test replay is
 * deterministic. Recognises a small catalog of procurement items/categories
 * matching the seeded VendorIQ vendor master data.
 */

export type VendorCategory = 'IT Hardware' | 'Medical' | 'Office Supplies';

export interface CatalogEntry {
  keywords: string[];
  item: string;
  category: VendorCategory;
}

export const ITEM_CATALOG: CatalogEntry[] = [
  { keywords: ['dell latitude', 'latitude'],        item: 'Dell Latitude Laptop',      category: 'IT Hardware' },
  { keywords: ['dell optiplex', 'optiplex'],        item: 'Dell OptiPlex',             category: 'IT Hardware' },
  { keywords: ['dell precision'],                   item: 'Dell Precision Workstation', category: 'IT Hardware' },
  { keywords: ['dell'],                             item: 'Dell Laptop',               category: 'IT Hardware' },
  { keywords: ['hp elitebook', 'elitebook'],        item: 'HP EliteBook Laptop',       category: 'IT Hardware' },
  { keywords: ['hp probook', 'probook'],            item: 'HP ProBook Laptop',         category: 'IT Hardware' },
  { keywords: [' hp ', 'hp laptop', 'hewlett'],     item: 'HP EliteBook Laptop',       category: 'IT Hardware' },
  { keywords: ['lenovo thinkpad', 'thinkpad'],      item: 'Lenovo ThinkPad Laptop',    category: 'IT Hardware' },
  { keywords: ['lenovo ideapad', 'ideapad'],        item: 'Lenovo IdeaPad Laptop',     category: 'IT Hardware' },
  { keywords: ['lenovo'],                           item: 'Lenovo ThinkPad Laptop',    category: 'IT Hardware' },
  { keywords: ['acer travelmate', 'travelmate'],    item: 'Acer TravelMate Laptop',    category: 'IT Hardware' },
  { keywords: ['acer aspire', 'acer'],              item: 'Acer TravelMate Laptop',    category: 'IT Hardware' },
  { keywords: ['macbook air'],                      item: 'MacBook Air',               category: 'IT Hardware' },
  { keywords: ['macbook pro'],                      item: 'MacBook Pro',               category: 'IT Hardware' },
  { keywords: ['macbook', 'apple laptop'],          item: 'MacBook Air',               category: 'IT Hardware' },
  { keywords: ['samsung galaxy book', 'galaxy book'],item: 'Samsung Galaxy Book Laptop',category: 'IT Hardware' },
  { keywords: ['samsung'],                          item: 'Samsung Galaxy Book Laptop', category: 'IT Hardware' },
  { keywords: ['laptop', 'notebook computer', 'laptops'], item: 'Laptop',             category: 'IT Hardware' },
  { keywords: ['desktop', 'desktop computer', 'pc'], item: 'Desktop Computer',        category: 'IT Hardware' },
  // Medical
  { keywords: ['surgical glove', 'latex glove'],   item: 'Surgical Gloves (case)',    category: 'Medical' },
  { keywords: ['patient monitor', 'icu monitor'],  item: 'Patient Monitor',           category: 'Medical' },
  { keywords: ['stethoscope'],                     item: 'Stethoscope',               category: 'Medical' },
  { keywords: ['infusion pump'],                   item: 'Infusion Pump',             category: 'Medical' },
  { keywords: ['defibrillator'],                   item: 'Defibrillator',             category: 'Medical' },
  { keywords: ['iv fluid', 'saline', 'normal saline'], item: 'IV Fluids',            category: 'Medical' },
  { keywords: ['ppe kit', 'ppe', 'protective equipment'], item: 'PPE Kits',          category: 'Medical' },
  { keywords: ['ecg', 'electrocardiogram'],        item: 'ECG Machine',               category: 'Medical' },
  { keywords: ['bp monitor', 'blood pressure'],    item: 'BP Monitor',                category: 'Medical' },
  // Office Supplies
  { keywords: ['copy paper', 'printer paper', 'a4 paper', 'paper ream', 'ream'], item: 'Copy Paper (ream)', category: 'Office Supplies' },
  { keywords: ['ergonomic chair', 'office chair'], item: 'Ergonomic Chair',           category: 'Office Supplies' },
  { keywords: ['notebook', 'notepad', 'stationery'], item: 'Notebooks',              category: 'Office Supplies' },
  { keywords: ['whiteboard', 'white board'],       item: 'Whiteboard',               category: 'Office Supplies' },
  { keywords: ['desk organizer'],                  item: 'Desk Organizers',           category: 'Office Supplies' },
  { keywords: ['ink cartridge', 'toner', 'printer ink'], item: 'Printer Ink & Toner', category: 'Office Supplies' },
];

export interface ParsedIntake {
  item: string;
  category: VendorCategory | 'Unknown';
  quantity: number;
  budgetInr: number;
  budgetDisplay: string;
  deadline: string;
  deliveryWindowDays: number | null;
  /** Extracted spec requirements from the free text. */
  specRequirements: SpecRequirements;
  /** Scenario intent signals detected from the text. */
  intentSignals: string[];
  rawText: string;
  warnings: string[];
}

export interface SpecRequirements {
  ramGb?: number;
  storageGb?: number;
  cpu?: string;
  screenInch?: number;
  osType?: string;
  warrantyYears?: number;
  minWarrantyYears?: number;
}

export function matchCatalog(text: string): CatalogEntry | undefined {
  const lower = ` ${text.toLowerCase()} `;
  return ITEM_CATALOG.find((c) => c.keywords.some((k) => lower.includes(k)));
}

export function formatInr(amount: number): string {
  if (!amount) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} Lakh`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function extractBrandToken(text: string): string | null {
  const lower = ` ${text.toLowerCase()} `;
  const knownBrands = ['dell', 'hp', 'hewlett', 'lenovo', 'acer', 'apple', 'macbook', 'samsung'];
  const matched = knownBrands.find((brand) => lower.includes(` ${brand} `) || lower.includes(brand));
  if (!matched) return null;
  if (matched === 'hewlett') return 'hp';
  if (matched === 'macbook') return 'apple';
  return matched;
}

/**
 * Extracts hardware specification requirements from free text.
 * e.g. "16GB RAM", "512GB SSD", "Intel i7", "Windows 11", "3 year warranty"
 */
export function extractSpecRequirements(text: string): SpecRequirements {
  const lower = text.toLowerCase();
  const specs: SpecRequirements = {};

  // RAM
  const ramMatch = lower.match(/(\d+)\s*gb\s*ram/);
  if (ramMatch) specs.ramGb = parseInt(ramMatch[1], 10);

  // Storage / SSD / HDD
  const storageMatch = lower.match(/(\d+)\s*gb\s*(?:ssd|hdd|nvme|storage)/);
  if (storageMatch) specs.storageGb = parseInt(storageMatch[1], 10);

  // CPU hints
  if (lower.includes('i9') || lower.includes('core i9')) specs.cpu = 'Intel Core i9';
  else if (lower.includes('i7') || lower.includes('core i7')) specs.cpu = 'Intel Core i7';
  else if (lower.includes('i5') || lower.includes('core i5')) specs.cpu = 'Intel Core i5';
  else if (lower.includes('m3 pro') || lower.includes('m3pro')) specs.cpu = 'Apple M3 Pro';
  else if (lower.includes('apple m3') || lower.includes('m3 chip')) specs.cpu = 'Apple M3';
  else if (lower.includes('ryzen 7') || lower.includes('r7')) specs.cpu = 'AMD Ryzen 7';
  else if (lower.includes('ryzen 5') || lower.includes('r5')) specs.cpu = 'AMD Ryzen 5';

  // Screen size
  const screenMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:inch|in\b|")\s*(?:screen|display|laptop)?/);
  if (screenMatch) specs.screenInch = parseFloat(screenMatch[1]);

  // OS
  if (lower.includes('macos') || lower.includes('mac os')) specs.osType = 'macOS';
  else if (lower.includes('windows 11')) specs.osType = 'Windows 11';
  else if (lower.includes('windows 10')) specs.osType = 'Windows 10';
  else if (lower.includes('linux')) specs.osType = 'Linux';

  // Warranty
  const warrantyMatch = lower.match(/(\d+)\s*(?:-\s*)?year\s*warranty/);
  if (warrantyMatch) specs.minWarrantyYears = parseInt(warrantyMatch[1], 10);

  return specs;
}

/**
 * Detects procurement intent signals from free text for the scenario engine.
 * Returns an array of signal strings.
 */
export function detectIntentSignals(text: string): string[] {
  const lower = text.toLowerCase();
  const signals: string[] = [];

  const urgentKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'rush', 'quick', 'fast delivery', 'expedite', 'today'];
  const budgetKeywords = ['budget', 'cheap', 'cheapest', 'affordable', 'lowest cost', 'cost-effective', 'economical', 'save money'];
  const qualityKeywords = ['reliable', 'best quality', 'premium', 'high-end', 'certified only', 'trusted', 'critical', 'quality'];

  if (urgentKeywords.some((k) => lower.includes(k))) signals.push('urgent');
  if (budgetKeywords.some((k) => lower.includes(k))) signals.push('budget');
  if (qualityKeywords.some((k) => lower.includes(k))) signals.push('quality');

  return signals;
}

export function parseFreeTextIntake(text: string): ParsedIntake {
  const warnings: string[] = [];
  const lower = text.toLowerCase();

  // Quantity — first standalone integer in the text.
  const qtyMatch = text.match(/\b(\d{1,6})\b/);
  const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
  if (!qtyMatch) warnings.push('Quantity not found in request text; defaulted to 1.');

  // Item + category via keyword catalog.
  const matched = matchCatalog(text);
  const item = matched?.item ?? 'Unspecified Item';
  const category: VendorCategory | 'Unknown' = matched?.category ?? 'Unknown';
  if (!matched) warnings.push('Could not confidently identify item/category from request text.');

  // Budget — ₹ / Rs / INR followed by a number and optional lakh/crore unit.
  const budgetMatch = lower.match(/(?:₹|rs\.?|inr)\s*([\d,.]+)\s*(lakh|lac|crore|cr)?/i);
  let budgetInr = 0;
  if (budgetMatch) {
    const num = parseFloat(budgetMatch[1].replace(/,/g, ''));
    const unit = budgetMatch[2]?.toLowerCase();
    if (unit === 'lakh' || unit === 'lac') budgetInr = num * 100000;
    else if (unit === 'crore' || unit === 'cr') budgetInr = num * 10000000;
    else budgetInr = num;
  } else {
    warnings.push('Budget not found in request text.');
  }

  // Deadline — explicit ISO date takes precedence; else derive from "N-day delivery".
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  const dayMatch = lower.match(/(\d{1,3})\s*-?\s*day/);
  const deliveryWindowDays = dayMatch ? parseInt(dayMatch[1], 10) : null;

  let deadline = '';
  if (isoMatch) {
    deadline = isoMatch[1];
  } else if (deliveryWindowDays) {
    const d = new Date();
    d.setDate(d.getDate() + deliveryWindowDays);
    deadline = d.toISOString().slice(0, 10);
  } else {
    warnings.push('Deadline not found; no delivery date could be determined.');
  }

  // Extract spec requirements and intent signals
  const specRequirements = extractSpecRequirements(text);
  const intentSignals = detectIntentSignals(text);

  return {
    item,
    category,
    quantity,
    budgetInr,
    budgetDisplay: formatInr(budgetInr),
    deadline,
    deliveryWindowDays,
    specRequirements,
    intentSignals,
    rawText: text,
    warnings,
  };
}
