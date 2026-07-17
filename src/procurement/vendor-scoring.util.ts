import type { VendorDocument } from '../database/schemas/vendor.schema.js';
import type { VendorPerformanceDocument } from '../database/schemas/vendor-performance.schema.js';
import type { ComplianceDocument } from '../database/schemas/compliance.schema.js';

export interface VendorScoreBreakdown {
  vendorId: string;
  name: string;
  category: string;
  imageUrl: string;
  city: string;
  unitPrice: number;
  deliveryDays: number;
  costScore: number;
  deliveryScore: number;
  qualityScore: number;
  complianceScore: number;
  finalScore: number;
  rank: number;
  dataGaps: string[];
}

export interface ScoringWeights {
  cost: number;
  delivery: number;
  quality: number;
  compliance: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  cost: 0.35,
  delivery: 0.25,
  quality: 0.2,
  compliance: 0.2,
};

/** Higher-is-better normalisation of price: cheapest vendor in the candidate set scores 100. */
function scoreCost(price: number, minPrice: number, maxPrice: number): number {
  if (maxPrice === minPrice) return 100;
  return Math.round(100 - ((price - minPrice) / (maxPrice - minPrice)) * 100);
}

/** Higher-is-better normalisation of delivery days: fastest vendor scores 100. */
function scoreDelivery(days: number, minDays: number, maxDays: number, deadlineDays: number | null): number {
  let base: number;
  if (maxDays === minDays) base = 100;
  else base = Math.round(100 - ((days - minDays) / (maxDays - minDays)) * 100);
  // Penalize vendors that can't meet the requested deadline.
  if (deadlineDays !== null && days > deadlineDays) {
    base = Math.max(0, base - 30);
  }
  return base;
}

export function scoreVendors(
  vendors: VendorDocument[],
  performanceByVendor: Map<string, VendorPerformanceDocument>,
  complianceByVendor: Map<string, ComplianceDocument>,
  deadlineDays: number | null,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): VendorScoreBreakdown[] {
  if (vendors.length === 0) return [];

  const prices = vendors.map((v) => v.basePrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const deliveries = vendors.map((v) => v.deliveryDays);
  const minDelivery = Math.min(...deliveries);
  const maxDelivery = Math.max(...deliveries);

  const results: VendorScoreBreakdown[] = vendors.map((v) => {
    const dataGaps: string[] = [];
    const perf = performanceByVendor.get(v.vendorId);
    const compliance = complianceByVendor.get(v.vendorId);

    const costScore = scoreCost(v.basePrice, minPrice, maxPrice);
    const deliveryScore = scoreDelivery(v.deliveryDays, minDelivery, maxDelivery, deadlineDays);

    // Quality: blend vendor master qualityScore with performance defect rate if available.
    let qualityScore = v.qualityScore;
    if (perf) {
      const defectPenalty = Math.min(30, perf.defectRate * 4);
      const onTimeBonus = (perf.onTimeDeliveryRate - 80) * 0.2;
      qualityScore = Math.max(0, Math.min(100, Math.round(v.qualityScore - defectPenalty + onTimeBonus)));
    } else {
      dataGaps.push('No performance history on file — quality score uses vendor master rating only.');
    }

    // Compliance: use audit score if available, else fall back to complianceStatus heuristic.
    let complianceScore: number;
    if (compliance) {
      complianceScore = compliance.auditScore;
      if (compliance.flags.length > 0) {
        complianceScore = Math.max(0, complianceScore - compliance.flags.length * 10);
      }
    } else {
      dataGaps.push('No compliance/audit record on file — using vendor status as a proxy.');
      complianceScore = v.complianceStatus === 'certified' ? 75 : v.complianceStatus === 'pending' ? 55 : 30;
    }

    const finalScore = Math.round(
      costScore * weights.cost +
        deliveryScore * weights.delivery +
        qualityScore * weights.quality +
        complianceScore * weights.compliance
    );

    return {
      vendorId: v.vendorId,
      name: v.name,
      category: v.category,
      imageUrl: v.imageUrl,
      city: v.city,
      unitPrice: v.basePrice,
      deliveryDays: v.deliveryDays,
      costScore,
      deliveryScore,
      qualityScore,
      complianceScore,
      finalScore,
      rank: 0,
      dataGaps,
    };
  });

  results.sort((a, b) => b.finalScore - a.finalScore);
  results.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return results;
}
