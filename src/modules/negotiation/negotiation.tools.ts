import { ToolDecorator as Tool, z, ExecutionContext, Injectable } from '@nitrostack/core';
import { DatabaseService } from '../../database/database.service.js';
import { HistoricalContractModel } from '../../database/schemas/historical-contract.schema.js';
import { VendorModel } from '../../database/schemas/vendor.schema.js';
import { VendorPerformanceModel } from '../../database/schemas/vendor-performance.schema.js';
import { ComplianceModel } from '../../database/schemas/compliance.schema.js';
import { scoreVendors, DEFAULT_WEIGHTS } from '../../procurement/vendor-scoring.util.js';

@Injectable({ deps: [DatabaseService] })
export class NegotiationTools {
  constructor(private db: DatabaseService) {}

  @Tool({
    name: 'contract-history',
    description: 'Fetch historical contracts and past performance for a specific vendor to assist in negotiations.',
    inputSchema: z.object({
      vendorId: z.string().describe('The unique ID of the vendor (e.g., V-DELL-01)'),
    }),
    examples: {
      request: { vendorId: 'V-DELL-01' },
      response: {
        vendorId: 'V-DELL-01',
        contracts: [],
        summary: {
          totalContracts: 0,
          avgDiscount: 0,
          avgDeliveryDelay: 0,
        },
      },
    },
  })
  async contractHistory(input: { vendorId: string }, context: ExecutionContext) {
    await this.db.connect();
    context.logger.info('Fetching contract history', { vendorId: input.vendorId });

    const vendor = await VendorModel.findOne({ vendorId: input.vendorId }).exec();
    if (!vendor) {
      throw new Error(`Vendor with ID ${input.vendorId} not found.`);
    }

    const contracts = await HistoricalContractModel.find({ vendorId: input.vendorId })
      .sort({ contractDate: -1 })
      .exec();

    const totalContracts = contracts.length;
    let avgDiscount = 0;
    let avgDeliveryDelay = 0;

    if (totalContracts > 0) {
      const sumDiscount = contracts.reduce((acc, c) => acc + (c.discountPercent || 0), 0);
      const sumDelay = contracts.reduce((acc, c) => acc + Math.max(0, c.deliveryDaysActual - c.deliveryDaysAgreed), 0);
      avgDiscount = Math.round((sumDiscount / totalContracts) * 100) / 100;
      avgDeliveryDelay = Math.round((sumDelay / totalContracts) * 100) / 100;
    }

    return {
      vendorId: input.vendorId,
      vendorName: vendor.name,
      contracts: contracts.map((c) => ({
        item: c.item,
        contractDate: c.contractDate.toISOString().slice(0, 10),
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        discountPercent: c.discountPercent,
        warrantyMonths: c.warrantyMonths,
        deliveryDaysAgreed: c.deliveryDaysAgreed,
        deliveryDaysActual: c.deliveryDaysActual,
        notes: c.notes,
      })),
      summary: {
        totalContracts,
        avgDiscount,
        avgDeliveryDelay,
      },
    };
  }

  @Tool({
    name: 'explain-decision',
    description: 'Explain the ranking decision for a vendor and run what-if scenarios with custom weights (cost, delivery, quality, compliance).',
    inputSchema: z.object({
      item: z.string().describe('The item name to source'),
      vendorId: z.string().describe('The vendor ID to explain'),
      weights: z.object({
        cost: z.number().min(0).max(1).describe('Weight for cost (0 to 1)'),
        delivery: z.number().min(0).max(1).describe('Weight for delivery (0 to 1)'),
        quality: z.number().min(0).max(1).describe('Weight for quality (0 to 1)'),
        compliance: z.number().min(0).max(1).describe('Weight for compliance (0 to 1)'),
      }).optional().describe('Custom weights for scoring. Must sum to 1.0. If omitted, default weights are used.'),
    }),
  })
  async explainDecision(
    input: { item: string; vendorId: string; weights?: { cost: number; delivery: number; quality: number; compliance: number } },
    context: ExecutionContext
  ) {
    await this.db.connect();
    context.logger.info('Explaining decision', { item: input.item, vendorId: input.vendorId });

    const vendor = await VendorModel.findOne({ vendorId: input.vendorId }).exec();
    if (!vendor) {
      throw new Error(`Vendor with ID ${input.vendorId} not found.`);
    }

    // Find all vendors in the same category to perform ranking
    const categoryVendors = await VendorModel.find({ category: vendor.category }).exec();
    const vendorIds = categoryVendors.map((v) => v.vendorId);

    const perfDocs = await VendorPerformanceModel.find({ vendorId: { $in: vendorIds } }).exec();
    const complianceDocs = await ComplianceModel.find({ vendorId: { $in: vendorIds } }).exec();

    const perfMap = new Map(perfDocs.map((p) => [p.vendorId, p]));
    const complianceMap = new Map(complianceDocs.map((c) => [c.vendorId, c]));

    // Calculate default ranking
    const defaultRankings = scoreVendors(categoryVendors, perfMap, complianceMap, null, DEFAULT_WEIGHTS);
    const defaultMatch = defaultRankings.find((r) => r.vendorId === input.vendorId);

    // Calculate custom ranking if weights are provided
    let customRankings = null;
    let customMatch = null;
    let weightWarning = null;

    if (input.weights) {
      const sum = input.weights.cost + input.weights.delivery + input.weights.quality + input.weights.compliance;
      if (Math.abs(sum - 1.0) > 0.01) {
        weightWarning = `Weights do not sum to 1.0 (sum: ${sum}). Normalizing weights to sum to 1.0.`;
        const normalizedWeights = {
          cost: input.weights.cost / sum,
          delivery: input.weights.delivery / sum,
          quality: input.weights.quality / sum,
          compliance: input.weights.compliance / sum,
        };
        customRankings = scoreVendors(categoryVendors, perfMap, complianceMap, null, normalizedWeights);
      } else {
        customRankings = scoreVendors(categoryVendors, perfMap, complianceMap, null, input.weights);
      }
      customMatch = customRankings.find((r) => r.vendorId === input.vendorId);
    }

    return {
      vendorId: input.vendorId,
      name: vendor.name,
      category: vendor.category,
      defaultScoring: defaultMatch ? {
        rank: defaultMatch.rank,
        finalScore: defaultMatch.finalScore,
        breakdown: {
          costScore: defaultMatch.costScore,
          deliveryScore: defaultMatch.deliveryScore,
          qualityScore: defaultMatch.qualityScore,
          complianceScore: defaultMatch.complianceScore,
        },
        weightsUsed: DEFAULT_WEIGHTS,
      } : null,
      customScoring: customMatch ? {
        rank: customMatch.rank,
        finalScore: customMatch.finalScore,
        breakdown: {
          costScore: customMatch.costScore,
          deliveryScore: customMatch.deliveryScore,
          qualityScore: customMatch.qualityScore,
          complianceScore: customMatch.complianceScore,
        },
        weightsUsed: input.weights,
      } : null,
      weightWarning,
      explanation: `Vendor ${vendor.name} is ranked #${defaultMatch?.rank ?? 'N/A'} out of ${categoryVendors.length} in ${vendor.category} under default weights. ` +
        `Its strongest area is ${
          defaultMatch ? getStrongestArea(defaultMatch) : 'N/A'
        } with a score of ${defaultMatch ? Math.max(defaultMatch.costScore, defaultMatch.deliveryScore, defaultMatch.qualityScore, defaultMatch.complianceScore) : 0}.`,
    };
  }
}

function getStrongestArea(match: any): string {
  const scores = [
    { name: 'Cost', score: match.costScore },
    { name: 'Delivery', score: match.deliveryScore },
    { name: 'Quality', score: match.qualityScore },
    { name: 'Compliance', score: match.complianceScore },
  ];
  scores.sort((a, b) => b.score - a.score);
  return scores[0].name;
}
