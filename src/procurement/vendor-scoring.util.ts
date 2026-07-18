import type { VendorDocument } from '../database/schemas/vendor.schema.js';
import type { VendorPerformanceDocument } from '../database/schemas/vendor-performance.schema.js';
import type { ComplianceDocument } from '../database/schemas/compliance.schema.js';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface VendorScoreBreakdown {
  vendorId: string;
  name: string;
  category: string;
  imageUrl: string;
  city: string;
  unitPrice: number;
  deliveryDays: number;
  effectiveDeliveryDays: number;
  costScore: number;
  deliveryScore: number;
  qualityScore: number;
  complianceScore: number;
  finalScore: number;
  rank: number;
  dataGaps: string[];
  scenarioUsed: string;
  weightsApplied: ScoringWeights;
  /** True if vendor was excluded due to hard constraints (budget / deadline). */
  excluded?: boolean;
  excludedReason?: string;
  /** Certifications held by this vendor (from compliance record). */
  certifications: string[];
  /** Compliance flags. */
  complianceFlags: string[];
  /** Negotiation leverage data for downstream use. */
  negotiationLeverage: {
    avgHistoricalDiscount: number;
    avgDeliveryDelay: number;
    totalContractsFulfilled: number;
  };
  /** Advisory messages to display to the user. */
  advisories: string[];
}

export interface ScoringWeights {
  cost: number;
  delivery: number;
  quality: number;
  compliance: number;
}

export type ScenarioIntent =
  | 'urgent'
  | 'budget'
  | 'quality'
  | 'medical'
  | 'default';

// ─── Scenario Engine ───────────────────────────────────────────────────────────

/**
 * Detects the procurement scenario from intent signals and returns the
 * appropriate scoring weights. This is the core fix for the "Dell always wins"
 * problem — different scenarios produce different winners.
 */
export function detectScenario(
  intentSignals: string[],
  category?: string
): { scenario: ScenarioIntent; weights: ScoringWeights } {
  const signals = intentSignals.map((s) => s.toLowerCase());

  const isUrgent = signals.some((s) =>
    ['urgent', 'asap', 'immediately', 'emergency', 'rush', 'today', 'fast', 'quick', 'expedite'].some((k) => s.includes(k))
  );
  const isBudget = signals.some((s) =>
    ['budget', 'cheap', 'cheapest', 'affordable', 'lowest cost', 'cost-effective', 'economical', 'save money', 'low price'].some((k) => s.includes(k))
  );
  const isQuality = signals.some((s) =>
    ['reliable', 'quality', 'best quality', 'premium', 'high-end', 'certified only', 'trusted', 'critical'].some((k) => s.includes(k))
  );
  const isMedical = category?.toLowerCase() === 'medical';

  if (isMedical) {
    return {
      scenario: 'medical',
      weights: { cost: 0.10, delivery: 0.10, quality: 0.35, compliance: 0.45 },
    };
  }
  if (isUrgent) {
    return {
      scenario: 'urgent',
      weights: { cost: 0.10, delivery: 0.65, quality: 0.15, compliance: 0.10 },
    };
  }
  if (isBudget) {
    return {
      scenario: 'budget',
      weights: { cost: 0.65, delivery: 0.15, quality: 0.12, compliance: 0.08 },
    };
  }
  if (isQuality) {
    return {
      scenario: 'quality',
      weights: { cost: 0.10, delivery: 0.15, quality: 0.40, compliance: 0.35 },
    };
  }

  // Default balanced weights
  return {
    scenario: 'default',
    weights: { cost: 0.35, delivery: 0.25, quality: 0.20, compliance: 0.20 },
  };
}

// ─── Scoring Helpers ──────────────────────────────────────────────────────────

export const DEFAULT_WEIGHTS: ScoringWeights = {
  cost: 0.35,
  delivery: 0.25,
  quality: 0.20,
  compliance: 0.20,
};

/** Higher-is-better cost normalisation: cheapest vendor scores 100. */
function scoreCost(price: number, minPrice: number, maxPrice: number): number {
  if (maxPrice === minPrice) return 100;
  return Math.round(100 - ((price - minPrice) / (maxPrice - minPrice)) * 100);
}

/** Higher-is-better delivery normalisation: fastest effective delivery scores 100. */
function scoreDelivery(
  effectiveDays: number,
  minDays: number,
  maxDays: number,
  deadlineDays: number | null
): number {
  let base: number;
  if (maxDays === minDays) base = 100;
  else base = Math.round(100 - ((effectiveDays - minDays) / (maxDays - minDays)) * 100);
  // Hard penalty for vendors that cannot meet the deadline at all.
  if (deadlineDays !== null && effectiveDays > deadlineDays) {
    base = Math.max(0, base - 40);
  }
  return base;
}

/**
 * Capacity-aware effective delivery estimate.
 *
 * If quantity > currentStock, additional units must be manufactured.
 * Extra days = ceil((qty - stock) / (monthlyCapacity / 30))
 */
export function computeEffectiveDelivery(
  vendor: VendorDocument,
  quantity: number
): number {
  const overage = Math.max(0, quantity - (vendor.currentStock ?? 0));
  const dailyRate = (vendor.monthlyCapacity ?? 200) / 30;
  const extraDays = dailyRate > 0 ? Math.ceil(overage / dailyRate) : 0;
  return (vendor.leadTimeBaseDays ?? vendor.deliveryDays) + extraDays;
}

// ─── Main Scoring Function ────────────────────────────────────────────────────

export interface ScoringOptions {
  deadlineDays?: number | null;
  quantity?: number;
  budgetInr?: number;
  intentSignals?: string[];
  customWeights?: ScoringWeights;
  /** If true, vendors that exceed budget by >20% or miss deadline are excluded. */
  enforceHardConstraints?: boolean;
}

export function scoreVendors(
  vendors: VendorDocument[],
  performanceByVendor: Map<string, VendorPerformanceDocument>,
  complianceByVendor: Map<string, ComplianceDocument>,
  /** @deprecated Pass deadlineDays inside options. Kept for backwards compat. */
  deadlineDaysLegacy: number | null,
  /** @deprecated Pass as part of options. Kept for backwards compat. */
  weightsLegacy: ScoringWeights = DEFAULT_WEIGHTS,
  options: ScoringOptions = {}
): VendorScoreBreakdown[] {
  if (vendors.length === 0) return [];

  const deadlineDays = options.deadlineDays ?? deadlineDaysLegacy;
  const quantity = options.quantity ?? 1;
  const budgetInr = options.budgetInr;
  const intentSignals = options.intentSignals ?? [];
  const enforce = options.enforceHardConstraints ?? false;

  // Determine scenario + weights
  const { scenario, weights: scenarioWeights } = detectScenario(
    intentSignals,
    vendors[0]?.category
  );
  const weights = options.customWeights ?? scenarioWeights;

  // Compute effective delivery for each vendor (capacity-aware)
  const effectiveDeliveries = vendors.map((v) =>
    computeEffectiveDelivery(v, quantity)
  );
  const minDelivery = Math.min(...effectiveDeliveries);
  const maxDelivery = Math.max(...effectiveDeliveries);

  const prices = vendors.map((v) => v.basePrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const results: VendorScoreBreakdown[] = vendors.map((v, idx) => {
    const advisories: string[] = [];
    const dataGaps: string[] = [];
    const perf = performanceByVendor.get(v.vendorId);
    const compliance = complianceByVendor.get(v.vendorId);

    const effectiveDays = effectiveDeliveries[idx];
    const costScore = scoreCost(v.basePrice, minPrice, maxPrice);
    const deliveryScore = scoreDelivery(effectiveDays, minDelivery, maxDelivery, deadlineDays);

    // ── Quality ────────────────────────────────────────────────────────────────
    let qualityScore = v.qualityScore;
    if (perf) {
      const defectPenalty = Math.min(30, perf.defectRate * 4);
      const onTimeBonus = (perf.onTimeDeliveryRate - 80) * 0.2;
      qualityScore = Math.max(0, Math.min(100, Math.round(v.qualityScore - defectPenalty + onTimeBonus)));
    } else {
      dataGaps.push('No performance history — quality score uses vendor master rating only.');
    }

    // ── Compliance ─────────────────────────────────────────────────────────────
    let complianceScore: number;
    const certifications: string[] = compliance?.certifications ?? [];
    const complianceFlags: string[] = compliance?.flags ?? [];
    if (compliance) {
      complianceScore = compliance.auditScore;
      if (compliance.flags.length > 0) {
        complianceScore = Math.max(0, complianceScore - compliance.flags.length * 10);
        advisories.push(`⚠️ ${compliance.flags.length} compliance flag(s): ${compliance.flags.join(', ')}.`);
      }
    } else {
      dataGaps.push('No compliance/audit record — using vendor status as a proxy.');
      complianceScore = v.complianceStatus === 'certified' ? 75 : v.complianceStatus === 'pending' ? 55 : 30;
    }

    // ── Hard Constraint Checks ─────────────────────────────────────────────────
    let excluded = false;
    let excludedReason: string | undefined;

    if (enforce) {
      const budgetPerUnit = budgetInr && quantity ? budgetInr / quantity : null;
      if (budgetPerUnit !== null && v.basePrice > budgetPerUnit * 1.2) {
        excluded = true;
        excludedReason = `Unit price ₹${v.basePrice.toLocaleString('en-IN')} exceeds per-unit budget ₹${Math.round(budgetPerUnit).toLocaleString('en-IN')} by >20%.`;
      } else if (deadlineDays !== null && effectiveDays > deadlineDays * 1.5) {
        excluded = true;
        excludedReason = `Effective delivery (${effectiveDays} days) exceeds deadline (${deadlineDays} days) by >50%.`;
      }
    }

    // ── Advisories ─────────────────────────────────────────────────────────────
    if (effectiveDays > v.deliveryDays) {
      advisories.push(`⏳ Effective delivery extended to ${effectiveDays} days (qty ${quantity} exceeds stock of ${v.currentStock ?? 0}).`);
    }
    if (v.complianceStatus === 'flagged') {
      advisories.push('🚩 Vendor has a flagged compliance status.');
    }
    if (v.complianceStatus === 'pending') {
      advisories.push('⏳ Compliance certification is pending audit.');
    }

    const finalScore = Math.round(
      costScore * weights.cost +
      deliveryScore * weights.delivery +
      qualityScore * weights.quality +
      complianceScore * weights.compliance
    );

    // Negotiation leverage (for downstream tools)
    const negotiationLeverage = {
      avgHistoricalDiscount: 0,
      avgDeliveryDelay: 0,
      totalContractsFulfilled: perf?.ordersFulfilled ?? 0,
    };

    return {
      vendorId: v.vendorId,
      name: v.name,
      category: v.category,
      imageUrl: v.imageUrl,
      city: v.city,
      unitPrice: v.basePrice,
      deliveryDays: v.deliveryDays,
      effectiveDeliveryDays: effectiveDays,
      costScore,
      deliveryScore,
      qualityScore,
      complianceScore,
      finalScore,
      rank: 0,
      dataGaps,
      scenarioUsed: scenario,
      weightsApplied: weights,
      excluded,
      excludedReason,
      certifications,
      complianceFlags,
      negotiationLeverage,
      advisories,
    };
  });

  // Excluded vendors go to the bottom
  const active = results.filter((r) => !r.excluded);
  const excluded = results.filter((r) => r.excluded);

  active.sort((a, b) => b.finalScore - a.finalScore);
  excluded.sort((a, b) => b.finalScore - a.finalScore);

  const ranked = [...active, ...excluded];
  ranked.forEach((r, idx) => { r.rank = idx + 1; });

  return ranked;
}
