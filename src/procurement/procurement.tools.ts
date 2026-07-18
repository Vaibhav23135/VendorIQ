import { ToolDecorator as Tool, Widget, Injectable, ExecutionContext, z } from '@nitrostack/core';
import { DatabaseService } from '../database/database.service.js';
import { VendorModel } from '../database/schemas/vendor.schema.js';
import { VendorPerformanceModel } from '../database/schemas/vendor-performance.schema.js';
import { ComplianceModel } from '../database/schemas/compliance.schema.js';
import { MarketPriceModel } from '../database/schemas/market-price.schema.js';
import { ProductModel } from '../database/schemas/product.schema.js';
import { parseFreeTextIntake, matchCatalog, extractBrandToken } from './intake-parser.util.js';
import { scoreVendors, computeEffectiveDelivery, type VendorScoreBreakdown } from './vendor-scoring.util.js';
import { formatInr } from './intake-parser.util.js';

@Injectable({ deps: [DatabaseService] })
export class ProcurementTools {
  constructor(private db: DatabaseService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // Tool: parse-request
  // ───────────────────────────────────────────────────────────────────────────

  @Tool({
    name: 'parse-request',
    description:
      'Parse a free-text procurement request into a structured intake: item, category, quantity, budget, deadline, spec requirements, and intent signals. Always call this before rank-vendors or validate-intake.',
    inputSchema: z.object({
      requestText: z.string().describe('The raw free-text procurement request from the user'),
    }),
    examples: {
      request: { requestText: 'Need 50 laptops with 16GB RAM and i7, ₹30 lakh budget, urgent delivery' },
      response: {
        item: 'Laptop',
        category: 'IT Hardware',
        quantity: 50,
        budgetInr: 3000000,
        budgetDisplay: '₹30.00 Lakh',
        deadline: '',
        specRequirements: { ramGb: 16, cpu: 'Intel Core i7' },
        intentSignals: ['urgent'],
        warnings: ['Deadline not found; no delivery date could be determined.'],
      },
    },
  })
  async parseRequest(input: { requestText: string }, ctx: ExecutionContext) {
    ctx.logger.info('Parsing procurement intake', { length: input.requestText.length });
    const intake = parseFreeTextIntake(input.requestText);
    return intake;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Tool: validate-intake
  // ───────────────────────────────────────────────────────────────────────────

  @Tool({
    name: 'validate-intake',
    description:
      'Validate a parsed procurement intake against market prices and database availability. Checks budget feasibility, spec match availability, and flags impossible requests before running rank-vendors. Returns a marketContext, warnings, and suggestions.',
    inputSchema: z.object({
      item: z.string().describe('Item name from parse-request output'),
      category: z.string().optional().describe('Category from parse-request output'),
      quantity: z.number().optional().describe('Requested quantity'),
      budgetInr: z.number().optional().describe('Total budget in INR'),
      specRequirements: z.object({
        ramGb: z.number().optional(),
        storageGb: z.number().optional(),
        cpu: z.string().optional(),
        osType: z.string().optional(),
        minWarrantyYears: z.number().optional(),
      }).optional().describe('Spec requirements from parse-request'),
    }),
  })
  async validateIntake(
    input: {
      item: string;
      category?: string;
      quantity?: number;
      budgetInr?: number;
      specRequirements?: {
        ramGb?: number;
        storageGb?: number;
        cpu?: string;
        osType?: string;
        minWarrantyYears?: number;
      };
    },
    ctx: ExecutionContext
  ) {
    await this.db.connect();
    ctx.logger.info('Validating intake', { item: input.item });

    const quantity = input.quantity ?? 1;
    const budgetInr = input.budgetInr ?? 0;
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // ── Market price context ───────────────────────────────────────────────────
    const marketEntry = await MarketPriceModel.findOne({
      item: { $regex: input.item.split(' ').slice(0, 3).join(' '), $options: 'i' },
    }).exec();

    const marketAvgPrice = marketEntry?.marketAvgPrice ?? null;
    const budgetPerUnit = budgetInr > 0 && quantity > 0 ? budgetInr / quantity : null;

    let budgetFeasible = true;
    let budgetAdvisory: string | null = null;

    if (marketAvgPrice && budgetPerUnit !== null) {
      const ratio = budgetPerUnit / marketAvgPrice;
      if (ratio < 0.7) {
        budgetFeasible = false;
        const shortfall = (marketAvgPrice * quantity - budgetInr);
        budgetAdvisory = `⚠️ Budget is significantly below market (${Math.round((1 - ratio) * 100)}% short). Market avg is ₹${marketAvgPrice.toLocaleString('en-IN')}/unit → recommended minimum budget: ${formatInr(marketAvgPrice * quantity)}. Shortfall: ${formatInr(shortfall)}.`;
        warnings.push(budgetAdvisory);
        suggestions.push(`Increase budget to at least ${formatInr(Math.ceil(marketAvgPrice * quantity / 100000) * 100000)} to access quality vendors.`);
      } else if (ratio < 0.85) {
        budgetAdvisory = `ℹ️ Budget is slightly below market average (${Math.round((1 - ratio) * 100)}% below ₹${marketAvgPrice.toLocaleString('en-IN')}/unit). Filtering vendors may be limited.`;
        warnings.push(budgetAdvisory);
      }
    }

    // ── Spec-matching availability ─────────────────────────────────────────────
    const resolvedCategory = input.category ?? matchCatalog(input.item)?.category;
    const productFilter: Record<string, unknown> = { isAvailable: true };
    if (resolvedCategory) productFilter.category = resolvedCategory;

    const allProducts = await ProductModel.find(productFilter).exec();
    const specs = input.specRequirements ?? {};
    let specMatchCount = 0;

    const matchedProducts = allProducts.filter((p) => {
      if (specs.ramGb && p.specifications.ramGb && p.specifications.ramGb < specs.ramGb) return false;
      if (specs.storageGb && p.specifications.storageGb && p.specifications.storageGb < specs.storageGb) return false;
      if (specs.minWarrantyYears && p.specifications.warrantyYears < specs.minWarrantyYears) return false;
      if (specs.osType && p.specifications.osType && !p.specifications.osType.toLowerCase().includes(specs.osType.toLowerCase())) return false;
      if (budgetPerUnit && p.unitPrice > budgetPerUnit * 1.15) return false;
      return true;
    });
    specMatchCount = matchedProducts.length;

    if (Object.keys(specs).length > 0 && specMatchCount === 0) {
      warnings.push(`No products found matching all spec requirements (${Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join(', ')}). Consider relaxing requirements.`);
      suggestions.push('Try removing specific CPU or OS requirements to expand vendor options.');
    }

    // ── Capacity check ─────────────────────────────────────────────────────────
    const vendors = resolvedCategory
      ? await VendorModel.find({ category: resolvedCategory }).exec()
      : await VendorModel.find().exec();

    const vendorsThatCanFulfill = vendors.filter((v) => {
      const effective = computeEffectiveDelivery(v, quantity);
      return effective <= 60; // 60-day max window
    });

    if (vendorsThatCanFulfill.length === 0) {
      warnings.push(`⚠️ No single vendor can fulfill ${quantity} units within 60 days. Consider a split order.`);
      suggestions.push('Use rank-vendors to identify top vendors, then split the order between them.');
    } else if (vendorsThatCanFulfill.length < vendors.length) {
      suggestions.push(`${vendors.length - vendorsThatCanFulfill.length} vendor(s) may have extended lead times for qty ${quantity}. Check effectiveDeliveryDays in rank-vendors output.`);
    }

    return {
      item: input.item,
      category: resolvedCategory ?? 'Unknown',
      quantity,
      budgetInr,
      budgetPerUnit,
      marketAvgPrice,
      budgetFeasible,
      budgetAdvisory,
      specMatchCount,
      matchedProductNames: matchedProducts.slice(0, 5).map((p) => p.name),
      vendorCount: vendors.length,
      vendorsFulfillableCount: vendorsThatCanFulfill.length,
      warnings,
      suggestions,
      readyToRank: budgetFeasible && (specMatchCount > 0 || Object.keys(specs).length === 0),
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Tool: rank-vendors
  // ───────────────────────────────────────────────────────────────────────────

  @Tool({
    name: 'rank-vendors',
    description:
      'Rank candidate vendors for a procurement intake by cost, delivery, quality, and compliance. Automatically detects the procurement scenario (urgent/budget/quality/medical/default) and adjusts scoring weights accordingly. Returns a scored, sorted vendor list with scenario context.',
    inputSchema: z.object({
      item: z.string().describe('The item name to source'),
      category: z
        .enum(['IT Hardware', 'Medical', 'Office Supplies'])
        .optional()
        .describe('Optional category filter; if omitted, inferred from item name'),
      quantity: z.number().optional().describe('Quantity requested'),
      budgetInr: z.number().optional().describe('Total budget in INR'),
      deadline: z.string().optional().describe('Requested delivery deadline, ISO date (YYYY-MM-DD)'),
      intentSignals: z
        .array(z.string())
        .optional()
        .describe('Intent signals from parse-request (e.g. ["urgent", "budget"])'),
      enforceHardConstraints: z
        .boolean()
        .optional()
        .describe('If true, vendors failing budget or deadline constraints are excluded. Default: false'),
    }),
  })
  @Widget('vendor-ranking')
  async rankVendors(
    input: {
      item: string;
      category?: string;
      quantity?: number;
      budgetInr?: number;
      deadline?: string;
      intentSignals?: string[];
      enforceHardConstraints?: boolean;
    },
    ctx: ExecutionContext
  ) {
    await this.db.connect();
    ctx.logger.info('Ranking vendors', { item: input.item, category: input.category });

    const quantity = input.quantity ?? 1;

    // Resolve deadline → allowed delivery window in days (relative to today).
    let deadlineDays: number | null = null;
    if (input.deadline) {
      const deadlineDate = new Date(input.deadline);
      if (!isNaN(deadlineDate.getTime())) {
        const diffMs = deadlineDate.getTime() - Date.now();
        deadlineDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      }
    }

    // Resolve category: explicit input wins, else infer from catalog.
    const resolvedCategory = input.category ?? matchCatalog(input.item)?.category;

    let vendors = resolvedCategory
      ? await VendorModel.find({ category: resolvedCategory }).exec()
      : await VendorModel.find().exec();

    // Narrow to vendors whose name/productLines mention a brand token.
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
        intake: { item: input.item, category: input.category ?? 'Unknown', quantity, budgetInr: input.budgetInr ?? 0, deadline: input.deadline ?? '' },
        candidates: [] as VendorScoreBreakdown[],
        topVendorId: null,
        scenarioUsed: 'default',
        weightsApplied: { cost: 0.35, delivery: 0.25, quality: 0.20, compliance: 0.20 },
        splitOrderSuggestion: null,
        budgetAdvisory: null,
        message: `No vendors found matching "${input.item}". Try a broader item name or a category (IT Hardware, Medical, Office Supplies).`,
      };
    }

    const vendorIds = vendors.map((v) => v.vendorId);
    const perfDocs = await VendorPerformanceModel.find({ vendorId: { $in: vendorIds } }).exec();
    const complianceDocs = await ComplianceModel.find({ vendorId: { $in: vendorIds } }).exec();

    const perfMap = new Map(perfDocs.map((p) => [p.vendorId, p]));
    const complianceMap = new Map(complianceDocs.map((c) => [c.vendorId, c]));

    const candidates = scoreVendors(vendors, perfMap, complianceMap, deadlineDays, undefined, {
      deadlineDays,
      quantity,
      budgetInr: input.budgetInr,
      intentSignals: input.intentSignals ?? [],
      enforceHardConstraints: input.enforceHardConstraints ?? false,
    });

    const topVendorId = candidates.find((c) => !c.excluded)?.vendorId ?? null;
    const top = candidates[0];

    // ── Budget advisory ────────────────────────────────────────────────────────
    let budgetAdvisory: string | null = null;
    if (input.budgetInr && input.budgetInr > 0) {
      const marketEntry = await MarketPriceModel.findOne({
        item: { $regex: input.item.split(' ').slice(0, 3).join(' '), $options: 'i' },
      }).exec();
      if (marketEntry) {
        const budgetPerUnit = input.budgetInr / quantity;
        const ratio = budgetPerUnit / marketEntry.marketAvgPrice;
        if (ratio < 0.8) {
          budgetAdvisory = `⚠️ Budget (${formatInr(input.budgetInr)} total, ~₹${Math.round(budgetPerUnit).toLocaleString('en-IN')}/unit) is ${Math.round((1 - ratio) * 100)}% below market avg (₹${marketEntry.marketAvgPrice.toLocaleString('en-IN')}/unit). Results may be limited.`;
        }
      }
    }

    // ── Split-order suggestion ─────────────────────────────────────────────────
    let splitOrderSuggestion: null | { suggestion: string; vendor1: string; vendor2: string; qty1: number; qty2: number } = null;
    const topTwo = candidates.filter((c) => !c.excluded).slice(0, 2);
    if (
      deadlineDays !== null &&
      topTwo.length >= 2 &&
      topTwo[0].effectiveDeliveryDays > deadlineDays &&
      topTwo[0].effectiveDeliveryDays <= deadlineDays * 1.4
    ) {
      const stock1 = vendors.find((v) => v.vendorId === topTwo[0].vendorId)?.currentStock ?? 0;
      const stock2 = vendors.find((v) => v.vendorId === topTwo[1].vendorId)?.currentStock ?? 0;
      const totalStock = stock1 + stock2;
      if (totalStock >= quantity) {
        const q1 = Math.min(stock1, quantity);
        const q2 = quantity - q1;
        splitOrderSuggestion = {
          suggestion: `No single vendor can deliver ${quantity} units by deadline (${deadlineDays} days). Recommended split order:`,
          vendor1: topTwo[0].name,
          vendor2: topTwo[1].name,
          qty1: q1,
          qty2: q2,
        };
      }
    }

    const scenarioUsed = top?.scenarioUsed ?? 'default';
    const weightsApplied = top?.weightsApplied ?? { cost: 0.35, delivery: 0.25, quality: 0.20, compliance: 0.20 };

    return {
      intake: {
        item: input.item,
        category: resolvedCategory ?? candidates[0]?.category ?? 'Unknown',
        quantity,
        budgetInr: input.budgetInr ?? 0,
        deadline: input.deadline ?? '',
      },
      candidates,
      topVendorId,
      scenarioUsed,
      weightsApplied,
      splitOrderSuggestion,
      budgetAdvisory,
      message: `Ranked ${candidates.length} vendor(s) for "${input.item}" [scenario: ${scenarioUsed}]. Top pick: ${top?.name ?? 'n/a'} (score ${top?.finalScore ?? 0}/100). Effective delivery: ${top?.effectiveDeliveryDays ?? '-'} days.`,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Tool: search-products
  // ───────────────────────────────────────────────────────────────────────────

  @Tool({
    name: 'search-products',
    description:
      'Search the vendor product catalog by category and spec requirements (RAM, CPU, storage, warranty, budget per unit). Returns matching SKUs with full specifications sorted by value. Use this to show the user what specific products are available before committing to a vendor.',
    inputSchema: z.object({
      category: z
        .enum(['IT Hardware', 'Medical', 'Office Supplies'])
        .optional()
        .describe('Product category to filter by'),
      minRamGb: z.number().optional().describe('Minimum RAM in GB'),
      minStorageGb: z.number().optional().describe('Minimum storage in GB'),
      cpu: z.string().optional().describe('Partial CPU name to match (e.g. "i7", "M3", "Ryzen")'),
      osType: z.string().optional().describe('OS type to match (e.g. "Windows 11", "macOS")'),
      minWarrantyYears: z.number().optional().describe('Minimum warranty in years'),
      maxUnitPrice: z.number().optional().describe('Maximum unit price in INR'),
      vendorId: z.string().optional().describe('Filter by a specific vendor ID'),
    }),
  })
  async searchProducts(
    input: {
      category?: string;
      minRamGb?: number;
      minStorageGb?: number;
      cpu?: string;
      osType?: string;
      minWarrantyYears?: number;
      maxUnitPrice?: number;
      vendorId?: string;
    },
    ctx: ExecutionContext
  ) {
    await this.db.connect();
    ctx.logger.info('Searching product catalog', input);

    const filter: Record<string, unknown> = { isAvailable: true };
    if (input.category) filter.category = input.category;
    if (input.vendorId) filter.vendorId = input.vendorId;
    if (input.maxUnitPrice) filter.unitPrice = { $lte: input.maxUnitPrice };

    const products = await ProductModel.find(filter).exec();

    const filtered = products.filter((p) => {
      const specs = p.specifications;
      if (input.minRamGb && (!specs.ramGb || specs.ramGb < input.minRamGb)) return false;
      if (input.minStorageGb && (!specs.storageGb || specs.storageGb < input.minStorageGb)) return false;
      if (input.cpu && (!specs.cpu || !specs.cpu.toLowerCase().includes(input.cpu.toLowerCase()))) return false;
      if (input.osType && (!specs.osType || !specs.osType.toLowerCase().includes(input.osType.toLowerCase()))) return false;
      if (input.minWarrantyYears && specs.warrantyYears < input.minWarrantyYears) return false;
      return true;
    });

    // Sort by value (specs per rupee)
    filtered.sort((a, b) => {
      const aScore = ((a.specifications.ramGb ?? 0) + (a.specifications.storageGb ?? 0) / 32) / (a.unitPrice / 10000);
      const bScore = ((b.specifications.ramGb ?? 0) + (b.specifications.storageGb ?? 0) / 32) / (b.unitPrice / 10000);
      return bScore - aScore;
    });

    const results = filtered.map((p) => ({
      productId: p.productId,
      vendorId: p.vendorId,
      name: p.name,
      category: p.category,
      unitPrice: p.unitPrice,
      unitPriceDisplay: formatInr(p.unitPrice),
      stockQty: p.stockQty,
      monthlyCapacity: p.monthlyCapacity,
      specifications: p.specifications,
    }));

    return {
      count: results.length,
      products: results,
      message: results.length > 0
        ? `Found ${results.length} product(s) matching your requirements.`
        : 'No products match the specified requirements. Try relaxing the filters.',
    };
  }
}
