import { ToolDecorator as Tool, Widget, Injectable, ExecutionContext, z } from '@nitrostack/core';
import { DatabaseService } from '../database/database.service.js';
import { VendorModel } from '../database/schemas/vendor.schema.js';
import { VendorPerformanceModel } from '../database/schemas/vendor-performance.schema.js';
import { ComplianceModel } from '../database/schemas/compliance.schema.js';
import { parseFreeTextIntake, matchCatalog, extractBrandToken } from './intake-parser.util.js';
import { scoreVendors, type VendorScoreBreakdown } from './vendor-scoring.util.js';

@Injectable({ deps: [DatabaseService] })
export class ProcurementTools {
  constructor(private db: DatabaseService) {}

  @Tool({
    name: 'parse-request',
    description:
      'Parse a free-text procurement request (e.g. "Need 100 Dell Latitude laptops, ₹55 lakh budget, 15-day delivery") into a structured intake: item, category, quantity, budget, and deadline.',
    inputSchema: z.object({
      requestText: z.string().describe('The raw free-text procurement request from the user'),
    }),
    examples: {
      request: { requestText: 'Need 100 Dell Latitude laptops, ₹55 lakh budget, 15-day delivery by 2026-08-01.' },
      response: {
        item: 'Dell Latitude Laptop',
        category: 'IT Hardware',
        quantity: 100,
        budgetInr: 5500000,
        budgetDisplay: '₹55.00 Lakh',
        deadline: '2026-08-01',
        deliveryWindowDays: 15,
        warnings: [],
      },
    },
  })
  async parseRequest(input: { requestText: string }, ctx: ExecutionContext) {
    ctx.logger.info('Parsing procurement intake', { length: input.requestText.length });
    const intake = parseFreeTextIntake(input.requestText);
    return intake;
  }

  @Tool({
    name: 'rank-vendors',
    description:
      'Rank candidate vendors for a structured procurement intake (item, quantity, budget, deadline) by cost, delivery, quality, and compliance. Returns a scored, sorted vendor list.',
    inputSchema: z.object({
      item: z.string().describe('The item name to source, e.g. "Dell Latitude Laptop"'),
      category: z
        .enum(['IT Hardware', 'Medical', 'Office Supplies'])
        .optional()
        .describe('Optional category filter; if omitted, inferred from the item name'),
      quantity: z.number().optional().describe('Quantity requested'),
      budgetInr: z.number().optional().describe('Total budget in INR'),
      deadline: z.string().optional().describe('Requested delivery deadline, ISO date (YYYY-MM-DD)'),
    }),
    examples: {
      request: { item: 'Dell Latitude Laptop', category: 'IT Hardware', quantity: 100, budgetInr: 5500000, deadline: '2026-08-01' },
      response: {
        intake: { item: 'Dell Latitude Laptop', category: 'IT Hardware', quantity: 100 },
        candidates: [],
        topVendorId: 'V-DELL-01',
      },
    },
  })
  @Widget('vendor-ranking')
  async rankVendors(
    input: { item: string; category?: string; quantity?: number; budgetInr?: number; deadline?: string },
    ctx: ExecutionContext
  ) {
    await this.db.connect();
    ctx.logger.info('Ranking vendors', { item: input.item, category: input.category });

    // Resolve deadline → allowed delivery window in days (relative to today).
    let deadlineDays: number | null = null;
    if (input.deadline) {
      const deadlineDate = new Date(input.deadline);
      if (!isNaN(deadlineDate.getTime())) {
        const diffMs = deadlineDate.getTime() - Date.now();
        deadlineDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      }
    }

    // Resolve category: explicit input wins, else infer from the item catalog.
    const resolvedCategory = input.category ?? matchCatalog(input.item)?.category;

    let vendors = resolvedCategory ? await VendorModel.find({ category: resolvedCategory }).exec() : await VendorModel.find().exec();

    // Narrow further to vendors whose name/productLines mention a brand token from the item text
    // (e.g. "Dell" in "Dell Latitude Laptop"), when such a token exists.
    const brandToken = extractBrandToken(input.item);
    if (brandToken && vendors.length > 1) {
      const narrowed = vendors.filter(
        (v) =>
          v.name.toLowerCase().includes(brandToken) ||
          v.productLines.some((line: string) => line.toLowerCase().includes(brandToken))
      );
      if (narrowed.length > 0) vendors = narrowed;
    }

    if (vendors.length === 0) {
      return {
        intake: { item: input.item, category: input.category ?? 'Unknown', quantity: input.quantity ?? 0, budgetInr: input.budgetInr ?? 0, deadline: input.deadline ?? '' },
        candidates: [] as VendorScoreBreakdown[],
        topVendorId: null,
        message: `No vendors found matching "${input.item}". Try a broader item name or a category (IT Hardware, Medical, Office Supplies).`,
      };
    }

    const vendorIds = vendors.map((v) => v.vendorId);
    const perfDocs = await VendorPerformanceModel.find({ vendorId: { $in: vendorIds } }).exec();
    const complianceDocs = await ComplianceModel.find({ vendorId: { $in: vendorIds } }).exec();

    const perfMap = new Map(perfDocs.map((p) => [p.vendorId, p]));
    const complianceMap = new Map(complianceDocs.map((c) => [c.vendorId, c]));

    const candidates = scoreVendors(vendors, perfMap, complianceMap, deadlineDays);

    const topVendorId = candidates[0]?.vendorId ?? null;

    return {
      intake: {
        item: input.item,
        category: input.category ?? candidates[0]?.category ?? 'Unknown',
        quantity: input.quantity ?? 0,
        budgetInr: input.budgetInr ?? 0,
        deadline: input.deadline ?? '',
      },
      candidates,
      topVendorId,
      message: `Ranked ${candidates.length} vendor(s) for "${input.item}". Top pick: ${candidates[0]?.name ?? 'n/a'} (score ${candidates[0]?.finalScore ?? 0}/100).`,
    };
  }
}


