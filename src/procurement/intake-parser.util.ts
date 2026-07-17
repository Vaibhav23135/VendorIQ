/**
 * Deterministic free-text → structured intake parser.
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
  { keywords: ['dell latitude', 'latitude'], item: 'Dell Latitude Laptop', category: 'IT Hardware' },
  { keywords: ['dell optiplex', 'optiplex'], item: 'Dell OptiPlex', category: 'IT Hardware' },
  { keywords: ['dell'], item: 'Dell Laptop', category: 'IT Hardware' },
  { keywords: ['hp elitebook', 'elitebook'], item: 'HP EliteBook Laptop', category: 'IT Hardware' },
  { keywords: ['hp probook', 'probook'], item: 'HP ProBook Laptop', category: 'IT Hardware' },
  { keywords: [' hp ', 'hp laptop', 'hewlett'], item: 'HP EliteBook Laptop', category: 'IT Hardware' },
  { keywords: ['lenovo thinkpad', 'thinkpad'], item: 'Lenovo ThinkPad Laptop', category: 'IT Hardware' },
  { keywords: ['lenovo'], item: 'Lenovo ThinkPad Laptop', category: 'IT Hardware' },
  { keywords: ['acer travelmate', 'acer'], item: 'Acer TravelMate Laptop', category: 'IT Hardware' },
  { keywords: ['macbook', 'apple laptop'], item: 'MacBook Air', category: 'IT Hardware' },
  { keywords: ['laptop', 'notebook computer'], item: 'Laptop', category: 'IT Hardware' },
  { keywords: ['surgical glove'], item: 'Surgical Gloves (case)', category: 'Medical' },
  { keywords: ['patient monitor'], item: 'Patient Monitor', category: 'Medical' },
  { keywords: ['stethoscope'], item: 'Stethoscope', category: 'Medical' },
  { keywords: ['infusion pump', 'defibrillator'], item: 'Patient Monitor', category: 'Medical' },
  { keywords: ['iv fluid'], item: 'IV Fluids', category: 'Medical' },
  { keywords: ['ppe kit', 'ppe'], item: 'PPE Kits', category: 'Medical' },
  { keywords: ['copy paper', 'printer paper'], item: 'Copy Paper (ream)', category: 'Office Supplies' },
  { keywords: ['ergonomic chair', 'office chair'], item: 'Ergonomic Chair', category: 'Office Supplies' },
  { keywords: ['notebook', 'stationery'], item: 'Notebooks', category: 'Office Supplies' },
  { keywords: ['whiteboard', 'desk organizer'], item: 'Desk Organizers', category: 'Office Supplies' },
];

export interface ParsedIntake {
  item: string;
  category: VendorCategory | 'Unknown';
  quantity: number;
  budgetInr: number;
  budgetDisplay: string;
  deadline: string;
  deliveryWindowDays: number | null;
  rawText: string;
  warnings: string[];
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
  const knownBrands = ['dell', 'hp', 'hewlett', 'lenovo', 'acer', 'apple', 'macbook'];
  const matched = knownBrands.find((brand) => lower.includes(` ${brand} `) || lower.includes(brand));
  if (!matched) return null;
  if (matched === 'hewlett') return 'hp';
  if (matched === 'macbook') return 'apple';
  return matched;
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

  return {
    item,
    category,
    quantity,
    budgetInr,
    budgetDisplay: formatInr(budgetInr),
    deadline,
    deliveryWindowDays,
    rawText: text,
    warnings,
  };
}
