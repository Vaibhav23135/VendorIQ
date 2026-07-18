import { ToolDecorator as Tool, z, ExecutionContext, Injectable } from '@nitrostack/core';
import { DatabaseService } from '../../database/database.service.js';
import { HistoricalContractModel } from '../../database/schemas/historical-contract.schema.js';
import { VendorModel } from '../../database/schemas/vendor.schema.js';
import { VendorPerformanceModel } from '../../database/schemas/vendor-performance.schema.js';
import { ComplianceModel } from '../../database/schemas/compliance.schema.js';
import { MarketPriceModel } from '../../database/schemas/market-price.schema.js';
import { ProductModel } from '../../database/schemas/product.schema.js';
import { scoreVendors, DEFAULT_WEIGHTS } from '../../procurement/vendor-scoring.util.js';
import { formatInr } from '../../procurement/intake-parser.util.js';

// ─── Unique PO ID Generator ────────────────────────────────────────────────────

function generatePoId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PO-${ts}-${rnd}`;
}

@Injectable({ deps: [DatabaseService] })
export class NegotiationTools {
  constructor(private db: DatabaseService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // Tool: contract-history
  // ───────────────────────────────────────────────────────────────────────────

  @Tool({
    name: 'contract-history',
    description:
      'Fetch historical contracts and past performance for a specific vendor to assist in negotiations. Returns raw contracts, avg discount, avg delivery delay, and a negotiation leverage summary.',
    inputSchema: z.object({
      vendorId: z.string().describe('The unique ID of the vendor (e.g., V-DELL-01)'),
    }),
  })
  async contractHistory(input: { vendorId: string }, context: ExecutionContext) {
    await this.db.connect();
    context.logger.info('Fetching contract history', { vendorId: input.vendorId });

    const vendor = await VendorModel.findOne({ vendorId: input.vendorId }).exec();
    if (!vendor) throw new Error(`Vendor with ID ${input.vendorId} not found.`);

    const contracts = await HistoricalContractModel.find({ vendorId: input.vendorId })
      .sort({ contractDate: -1 })
      .exec();

    const totalContracts = contracts.length;
    let avgDiscount = 0;
    let avgDeliveryDelay = 0;
    let maxDiscount = 0;

    if (totalContracts > 0) {
      const sumDiscount = contracts.reduce((acc, c) => acc + (c.discountPercent || 0), 0);
      const sumDelay = contracts.reduce((acc, c) => acc + Math.max(0, c.deliveryDaysActual - c.deliveryDaysAgreed), 0);
      avgDiscount = Math.round((sumDiscount / totalContracts) * 100) / 100;
      avgDeliveryDelay = Math.round((sumDelay / totalContracts) * 100) / 100;
      maxDiscount = Math.max(...contracts.map((c) => c.discountPercent || 0));
    }

    const perf = await VendorPerformanceModel.findOne({ vendorId: input.vendorId }).exec();

    return {
      vendorId: input.vendorId,
      vendorName: vendor.name,
      city: vendor.city,
      contracts: contracts.map((c) => ({
        item: c.item,
        contractDate: c.contractDate.toISOString().slice(0, 10),
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        unitPriceDisplay: formatInr(c.unitPrice),
        discountPercent: c.discountPercent,
        warrantyMonths: c.warrantyMonths,
        deliveryDaysAgreed: c.deliveryDaysAgreed,
        deliveryDaysActual: c.deliveryDaysActual,
        onTime: c.deliveryDaysActual <= c.deliveryDaysAgreed,
        notes: c.notes,
      })),
      summary: {
        totalContracts,
        avgDiscount,
        maxDiscount,
        avgDeliveryDelay,
        onTimeDeliveryRate: perf?.onTimeDeliveryRate ?? null,
        ordersFulfilled: perf?.ordersFulfilled ?? null,
      },
      negotiationLeverage: {
        strongPoints: [
          ...(avgDiscount >= 5 ? [`Has offered up to ${maxDiscount}% discount historically`] : []),
          ...(perf && perf.onTimeDeliveryRate >= 90 ? [`${perf.onTimeDeliveryRate}% on-time delivery rate`] : []),
          ...(totalContracts >= 2 ? [`Repeat customer relationship (${totalContracts} contracts)`] : []),
        ],
        riskPoints: [
          ...(avgDeliveryDelay > 1 ? [`Avg delivery delay: ${avgDeliveryDelay} days`] : []),
          ...(perf && perf.defectRate > 2 ? [`Defect rate: ${perf.defectRate}%`] : []),
        ],
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Tool: simulate-negotiation
  // ───────────────────────────────────────────────────────────────────────────

  @Tool({
    name: 'simulate-negotiation',
    description:
      'Simulate a 3-round price negotiation with a vendor based on their historical contract data, order volume, and market pricing. Returns the negotiation rounds, settled price, discount, warranty terms, and total savings vs market.',
    inputSchema: z.object({
      vendorId: z.string().describe('The vendor to negotiate with'),
      item: z.string().describe('The item being purchased'),
      quantity: z.number().describe('Number of units to purchase'),
      targetUnitPrice: z.number().optional().describe('Your target unit price in INR. If not given, system derives from market avg.'),
    }),
  })
  async simulateNegotiation(
    input: { vendorId: string; item: string; quantity: number; targetUnitPrice?: number },
    context: ExecutionContext
  ) {
    await this.db.connect();
    context.logger.info('Simulating negotiation', { vendorId: input.vendorId, item: input.item });

    const vendor = await VendorModel.findOne({ vendorId: input.vendorId }).exec();
    if (!vendor) throw new Error(`Vendor ${input.vendorId} not found.`);

    const contracts = await HistoricalContractModel.find({ vendorId: input.vendorId }).exec();
    const marketEntry = await MarketPriceModel.findOne({
      item: { $regex: input.item.split(' ').slice(0, 2).join(' '), $options: 'i' },
    }).exec();

    const marketAvgPrice = marketEntry?.marketAvgPrice ?? vendor.basePrice;
    const avgHistoricalDiscount =
      contracts.length > 0
        ? contracts.reduce((s, c) => s + (c.discountPercent || 0), 0) / contracts.length
        : 3;
    const maxHistoricalDiscount = contracts.length > 0
      ? Math.max(...contracts.map((c) => c.discountPercent || 0))
      : 5;

    // Volume-based discount premium
    const volumePremium = input.quantity >= 200 ? 3 : input.quantity >= 100 ? 2 : input.quantity >= 50 ? 1 : 0;
    const baseWarrantyMonths = contracts.length > 0
      ? Math.round(contracts.reduce((s, c) => s + c.warrantyMonths, 0) / contracts.length)
      : 12;

    // Target price defaults to 10% below market avg
    const target = input.targetUnitPrice ?? Math.round(marketAvgPrice * 0.90);

    // ── Round 1: Vendor anchor ─────────────────────────────────────────────────
    const r1VendorOffer = Math.round(vendor.basePrice * (1 - avgHistoricalDiscount / 100));
    const r1Discount = avgHistoricalDiscount;

    // ── Round 2: Buyer counter ─────────────────────────────────────────────────
    const r2BuyerOffer = target;
    // Vendor moves toward buyer by 40% of the gap, + volume concession
    const gap = r1VendorOffer - r2BuyerOffer;
    const vendorMove = Math.round(gap * 0.4);
    const r2VendorOffer = Math.max(target, r1VendorOffer - vendorMove);
    const r2Discount = Math.round((1 - r2VendorOffer / vendor.basePrice) * 100 * 10) / 10;

    // ── Round 3: Closing ───────────────────────────────────────────────────────
    const extraDiscount = Math.min(volumePremium, maxHistoricalDiscount - r2Discount);
    const settledUnitPrice = Math.round(r2VendorOffer * (1 - extraDiscount / 100));
    const settledDiscount = Math.round((1 - settledUnitPrice / vendor.basePrice) * 100 * 10) / 10;
    const warrantyBonus = input.quantity >= 100 ? 12 : input.quantity >= 50 ? 6 : 0;
    const settledWarrantyMonths = baseWarrantyMonths + warrantyBonus;

    const totalAmount = settledUnitPrice * input.quantity;
    const marketTotal = marketAvgPrice * input.quantity;
    const savingsVsMarket = marketTotal - totalAmount;

    const rounds = [
      {
        round: 1,
        actor: 'Vendor',
        offer: r1VendorOffer,
        offerDisplay: formatInr(r1VendorOffer),
        discountFromList: r1Discount,
        message: `${vendor.name} opens with their standard ${avgHistoricalDiscount.toFixed(1)}% discount off list price of ₹${vendor.basePrice.toLocaleString('en-IN')}.`,
      },
      {
        round: 2,
        actor: 'Buyer',
        offer: r2BuyerOffer,
        offerDisplay: formatInr(r2BuyerOffer),
        discountFromList: Math.round((1 - r2BuyerOffer / vendor.basePrice) * 100 * 10) / 10,
        message: `You counter at ${formatInr(r2BuyerOffer)}/unit (${Math.round((1 - r2BuyerOffer / vendor.basePrice) * 100)}% off list). Vendor adjusts to ${formatInr(r2VendorOffer)} — meeting halfway.`,
        vendorCounter: r2VendorOffer,
        vendorCounterDisplay: formatInr(r2VendorOffer),
      },
      {
        round: 3,
        actor: 'Close',
        offer: settledUnitPrice,
        offerDisplay: formatInr(settledUnitPrice),
        discountFromList: settledDiscount,
        message: `Deal closed at ${formatInr(settledUnitPrice)}/unit (${settledDiscount}% off list) with ${settledWarrantyMonths}-month warranty. Volume of ${input.quantity} units earns ${warrantyBonus > 0 ? `+${warrantyBonus} months warranty and ` : ''}${extraDiscount > 0 ? `an extra ${extraDiscount}% volume discount` : 'standard terms'}.`,
      },
    ];

    const recommendation =
      settledUnitPrice <= target
        ? `✅ Deal achieved at or below your target price. Proceed to generate PO.`
        : settledUnitPrice <= marketAvgPrice
        ? `✅ Deal is below market average. Good outcome — proceed to generate PO.`
        : `⚠️ Settled price is above market average. Consider alternative vendors or further negotiation.`;

    return {
      vendorId: input.vendorId,
      vendorName: vendor.name,
      item: input.item,
      quantity: input.quantity,
      listPrice: vendor.basePrice,
      targetPrice: target,
      marketAvgPrice,
      rounds,
      settled: {
        unitPrice: settledUnitPrice,
        unitPriceDisplay: formatInr(settledUnitPrice),
        discountPercent: settledDiscount,
        warrantyMonths: settledWarrantyMonths,
        totalAmount,
        totalAmountDisplay: formatInr(totalAmount),
        savingsVsMarket,
        savingsVsMarketDisplay: formatInr(savingsVsMarket),
        savingsPercent: Math.round((savingsVsMarket / marketTotal) * 100 * 10) / 10,
      },
      recommendation,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Tool: generate-po
  // ───────────────────────────────────────────────────────────────────────────

  @Tool({
    name: 'generate-po',
    description:
      'Generate a structured Purchase Order (PO) after a negotiation is complete. Returns a unique PO ID, a formatted Markdown PO document, total amount, estimated delivery date, and a workflow status timeline (Draft → Negotiated → Approved → Shipped → Delivered).',
    inputSchema: z.object({
      vendorId: z.string().describe('Vendor ID to issue the PO to'),
      item: z.string().describe('Item name being purchased'),
      quantity: z.number().describe('Number of units'),
      negotiatedUnitPrice: z.number().describe('Negotiated unit price in INR (from simulate-negotiation)'),
      warrantyMonths: z.number().optional().describe('Agreed warranty months (from simulate-negotiation)'),
      productId: z.string().optional().describe('Specific product SKU (from search-products)'),
      requesterName: z.string().optional().describe('Name of the requesting department or person'),
      notes: z.string().optional().describe('Additional notes for the PO'),
    }),
  })
  async generatePo(
    input: {
      vendorId: string;
      item: string;
      quantity: number;
      negotiatedUnitPrice: number;
      warrantyMonths?: number;
      productId?: string;
      requesterName?: string;
      notes?: string;
    },
    context: ExecutionContext
  ) {
    await this.db.connect();
    context.logger.info('Generating PO', { vendorId: input.vendorId });

    const vendor = await VendorModel.findOne({ vendorId: input.vendorId }).exec();
    if (!vendor) throw new Error(`Vendor ${input.vendorId} not found.`);

    const product = input.productId
      ? await ProductModel.findOne({ productId: input.productId }).exec()
      : null;

    const poId = generatePoId();
    const today = new Date();
    const estimatedDelivery = new Date(today);
    estimatedDelivery.setDate(today.getDate() + (vendor.leadTimeBaseDays ?? vendor.deliveryDays));

    const totalAmount = input.quantity * input.negotiatedUnitPrice;
    const totalDisplay = formatInr(totalAmount);
    const warrantyMonths = input.warrantyMonths ?? 12;

    // ── Markdown PO Document ───────────────────────────────────────────────────
    const poMarkdown = `
# PURCHASE ORDER

| Field | Value |
|-------|-------|
| **PO Number** | \`${poId}\` |
| **Issue Date** | ${today.toDateString()} |
| **Status** | 🟡 Draft — Pending Approval |

---

## Vendor Details

| | |
|--|--|
| **Vendor Name** | ${vendor.name} |
| **Vendor ID** | ${vendor.vendorId} |
| **City** | ${vendor.city} |
| **Compliance** | ${vendor.complianceStatus.toUpperCase()} |

---

## Order Details

| Field | Value |
|-------|-------|
| **Item** | ${input.item} |
| **Product SKU** | ${product?.name ?? input.productId ?? 'As per vendor catalog'} |
| **Quantity** | ${input.quantity.toLocaleString('en-IN')} units |
| **Unit Price (Negotiated)** | ${formatInr(input.negotiatedUnitPrice)} |
| **Warranty** | ${warrantyMonths} months |
| **Total Amount** | **${totalDisplay}** |
| **Estimated Delivery** | ${estimatedDelivery.toDateString()} (${vendor.leadTimeBaseDays ?? vendor.deliveryDays} days) |

---

## Delivery Timeline

| Stage | Status | Date |
|-------|--------|------|
| 📝 Draft | ✅ Complete | ${today.toDateString()} |
| 🤝 Negotiated | ✅ Complete | ${today.toDateString()} |
| ✅ Approved | ⏳ Pending | — |
| 🚚 Shipped | ⏳ Pending | — |
| 📦 Delivered | ⏳ Pending | ~${estimatedDelivery.toDateString()} |

---

${input.notes ? `## Notes\n\n${input.notes}\n\n---\n` : ''}
${input.requesterName ? `**Requested by:** ${input.requesterName}` : ''}

*Generated by VendorIQ Procurement Intelligence Platform*
`.trim();

    const statusTimeline = [
      { stage: 'Draft',      status: 'complete', icon: '📝', date: today.toISOString().slice(0, 10) },
      { stage: 'Negotiated', status: 'complete', icon: '🤝', date: today.toISOString().slice(0, 10) },
      { stage: 'Approved',   status: 'pending',  icon: '✅', date: null },
      { stage: 'Shipped',    status: 'pending',  icon: '🚚', date: null },
      { stage: 'Delivered',  status: 'pending',  icon: '📦', date: estimatedDelivery.toISOString().slice(0, 10) },
    ];

    return {
      poId,
      vendorId: input.vendorId,
      vendorName: vendor.name,
      item: input.item,
      productId: product?.productId ?? null,
      productName: product?.name ?? null,
      quantity: input.quantity,
      negotiatedUnitPrice: input.negotiatedUnitPrice,
      negotiatedUnitPriceDisplay: formatInr(input.negotiatedUnitPrice),
      warrantyMonths,
      totalAmount,
      totalAmountDisplay: totalDisplay,
      estimatedDeliveryDate: estimatedDelivery.toISOString().slice(0, 10),
      currentStatus: 'draft',
      statusTimeline,
      poMarkdown,
      message: `✅ PO ${poId} generated for ${input.quantity} × ${input.item} from ${vendor.name}. Total: ${totalDisplay}. Estimated delivery: ${estimatedDelivery.toDateString()}. Share the PO Markdown with your finance team for approval.`,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Tool: explain-decision
  // ───────────────────────────────────────────────────────────────────────────

  @Tool({
    name: 'explain-decision',
    description:
      'Explain the ranking decision for a vendor in depth: why each score dimension was computed the way it was, compliance flags and certifications, historical delivery track record, and what-if scenarios with custom weights.',
    inputSchema: z.object({
      item: z.string().describe('The item name to source'),
      vendorId: z.string().describe('The vendor ID to explain'),
      weights: z.object({
        cost: z.number().min(0).max(1).describe('Weight for cost (0 to 1)'),
        delivery: z.number().min(0).max(1).describe('Weight for delivery (0 to 1)'),
        quality: z.number().min(0).max(1).describe('Weight for quality (0 to 1)'),
        compliance: z.number().min(0).max(1).describe('Weight for compliance (0 to 1)'),
      }).optional().describe('Custom weights for what-if scenario. Must sum to 1.0.'),
    }),
  })
  async explainDecision(
    input: { item: string; vendorId: string; weights?: { cost: number; delivery: number; quality: number; compliance: number } },
    context: ExecutionContext
  ) {
    await this.db.connect();
    context.logger.info('Explaining decision', { item: input.item, vendorId: input.vendorId });

    const vendor = await VendorModel.findOne({ vendorId: input.vendorId }).exec();
    if (!vendor) throw new Error(`Vendor with ID ${input.vendorId} not found.`);

    const categoryVendors = await VendorModel.find({ category: vendor.category }).exec();
    const vendorIds = categoryVendors.map((v) => v.vendorId);
    const perfDocs = await VendorPerformanceModel.find({ vendorId: { $in: vendorIds } }).exec();
    const complianceDocs = await ComplianceModel.find({ vendorId: { $in: vendorIds } }).exec();

    const perfMap = new Map(perfDocs.map((p) => [p.vendorId, p]));
    const complianceMap = new Map(complianceDocs.map((c) => [c.vendorId, c]));

    const defaultRankings = scoreVendors(categoryVendors, perfMap, complianceMap, null, DEFAULT_WEIGHTS);
    const defaultMatch = defaultRankings.find((r) => r.vendorId === input.vendorId);

    let customRankings = null;
    let customMatch = null;
    let weightWarning = null;

    if (input.weights) {
      const sum = input.weights.cost + input.weights.delivery + input.weights.quality + input.weights.compliance;
      const normalizedWeights =
        Math.abs(sum - 1.0) > 0.01
          ? ((weightWarning = `Weights sum to ${sum.toFixed(2)}, not 1.0. Normalizing.`),
            {
              cost: input.weights.cost / sum,
              delivery: input.weights.delivery / sum,
              quality: input.weights.quality / sum,
              compliance: input.weights.compliance / sum,
            })
          : input.weights;
      customRankings = scoreVendors(categoryVendors, perfMap, complianceMap, null, normalizedWeights);
      customMatch = customRankings.find((r) => r.vendorId === input.vendorId);
    }

    const perf = perfMap.get(input.vendorId);
    const compliance = complianceMap.get(input.vendorId);

    // ── Rich narrative explanation ─────────────────────────────────────────────
    const narratives: string[] = [];

    // Cost narrative
    if (defaultMatch) {
      const prices = categoryVendors.map((v) => v.basePrice);
      const min = Math.min(...prices), max = Math.max(...prices);
      const pctAboveMin = max > min ? Math.round(((vendor.basePrice - min) / (max - min)) * 100) : 0;
      narratives.push(
        `💰 **Cost (score ${defaultMatch.costScore}/100)**: Base price ₹${vendor.basePrice.toLocaleString('en-IN')} places this vendor ${pctAboveMin === 0 ? 'at the cheapest point' : `${pctAboveMin}% above the cheapest option`} in this category.`
      );
    }

    // Delivery narrative
    if (defaultMatch) {
      narratives.push(
        `🚚 **Delivery (score ${defaultMatch.deliveryScore}/100)**: Standard lead time is ${vendor.deliveryDays} days (stock: ${vendor.currentStock ?? 'N/A'} units, monthly capacity: ${vendor.monthlyCapacity ?? 'N/A'} units). Effective delivery scales with order size.`
      );
    }

    // Quality narrative
    if (defaultMatch && perf) {
      const defectPenalty = Math.min(30, perf.defectRate * 4);
      const onTimeBonus = (perf.onTimeDeliveryRate - 80) * 0.2;
      narratives.push(
        `🏆 **Quality (score ${defaultMatch.qualityScore}/100)**: Master rating ${vendor.qualityScore}/100. Performance adjustment: defect rate ${perf.defectRate}% → -${defectPenalty.toFixed(1)} pts; on-time rate ${perf.onTimeDeliveryRate}% → ${onTimeBonus >= 0 ? '+' : ''}${onTimeBonus.toFixed(1)} pts.`
      );
    } else if (defaultMatch) {
      narratives.push(`🏆 **Quality (score ${defaultMatch.qualityScore}/100)**: No performance history — using vendor master rating of ${vendor.qualityScore}/100.`);
    }

    // Compliance narrative
    if (defaultMatch && compliance) {
      const flagImpact = compliance.flags.length > 0 ? ` Flags (${compliance.flags.join(', ')}) reduce score by ${compliance.flags.length * 10} pts.` : ' No flags.';
      narratives.push(
        `✅ **Compliance (score ${defaultMatch.complianceScore}/100)**: Audit score ${compliance.auditScore}/100 (${compliance.lastAuditDate.toISOString?.().slice(0, 10) ?? compliance.lastAuditDate}). Certifications: ${compliance.certifications.length > 0 ? compliance.certifications.join(', ') : 'None'}.${flagImpact}`
      );
    }

    return {
      vendorId: input.vendorId,
      name: vendor.name,
      category: vendor.category,
      city: vendor.city,
      scoreNarratives: narratives,
      defaultScoring: defaultMatch
        ? {
            rank: defaultMatch.rank,
            finalScore: defaultMatch.finalScore,
            outOf: categoryVendors.length,
            breakdown: {
              costScore: defaultMatch.costScore,
              deliveryScore: defaultMatch.deliveryScore,
              qualityScore: defaultMatch.qualityScore,
              complianceScore: defaultMatch.complianceScore,
            },
            weightsUsed: DEFAULT_WEIGHTS,
            scenarioUsed: defaultMatch.scenarioUsed,
            advisories: defaultMatch.advisories,
            dataGaps: defaultMatch.dataGaps,
          }
        : null,
      customScoring: customMatch
        ? {
            rank: customMatch.rank,
            finalScore: customMatch.finalScore,
            breakdown: {
              costScore: customMatch.costScore,
              deliveryScore: customMatch.deliveryScore,
              qualityScore: customMatch.qualityScore,
              complianceScore: customMatch.complianceScore,
            },
            weightsUsed: input.weights,
          }
        : null,
      weightWarning,
      certifications: compliance?.certifications ?? [],
      complianceFlags: compliance?.flags ?? [],
      performanceSummary: perf
        ? {
            onTimeDeliveryRate: perf.onTimeDeliveryRate,
            defectRate: perf.defectRate,
            avgResponseHours: perf.avgResponseHours,
            ordersFulfilled: perf.ordersFulfilled,
          }
        : null,
    };
  }
}
