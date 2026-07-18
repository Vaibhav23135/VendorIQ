import { ResourceDecorator as Resource, ExecutionContext } from '@nitrostack/core';
import mongoose from 'mongoose';
import { MarketPriceModel } from '../../database/schemas/market-price.schema.js';
import { VendorModel } from '../../database/schemas/vendor.schema.js';
import { VendorPerformanceModel } from '../../database/schemas/vendor-performance.schema.js';
import { ComplianceModel } from '../../database/schemas/compliance.schema.js';
import { HistoricalContractModel } from '../../database/schemas/historical-contract.schema.js';
import { formatInr } from '../../procurement/intake-parser.util.js';

/**
 * Negotiation Resources
 *
 * Two rich MCP resources:
 * 1. negotiation://market-rates  — Live market pricing intelligence for all categories.
 * 2. negotiation://vendor-intelligence — Full intelligence card for all vendors.
 */
export class NegotiationResources {

  /**
   * Market Rates Overview
   *
   * Returns a Markdown document with market-average prices for all tracked items
   * across categories. Use this as reference when evaluating vendor pricing.
   */
  @Resource({
    uri: 'negotiation://market-rates',
    name: 'Market Rates Overview',
    description:
      'Live market-average prices for all tracked procurement items across IT Hardware, Medical, and Office Supplies. Use this as a reference benchmark when evaluating vendor bids and running negotiations.',
    mimeType: 'text/markdown',
  })
  async marketRatesResource(context: ExecutionContext) {
    // Connect if mongoose is not already connected
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/vendoriq';
      await mongoose.connect(uri);
    }

    const prices = await MarketPriceModel.find().sort({ category: 1, item: 1 }).exec();

    const byCategory: Record<string, typeof prices> = {};
    for (const p of prices) {
      if (!byCategory[p.category]) byCategory[p.category] = [];
      byCategory[p.category].push(p);
    }

    const sections = Object.entries(byCategory).map(([cat, items]) => {
      const rows = items
        .map((p) => `| ${p.item} | ${formatInr(p.marketAvgPrice)} | ${p.asOfDate instanceof Date ? p.asOfDate.toISOString().slice(0, 10) : String(p.asOfDate)} |`)
        .join('\n');
      return `## ${cat}\n\n| Item | Market Avg Price | As Of |\n|------|-----------------|-------|\n${rows}`;
    });

    const markdown = `# VendorIQ Market Rates Reference

*Benchmark prices for procurement negotiations. Vendors pricing within 10% of market avg are considered competitive.*

---

${sections.join('\n\n---\n\n')}

---

*Source: VendorIQ Market Intelligence Database. Updated ${new Date().toDateString()}.*
`;

    return {
      type: 'text' as const,
      text: markdown,
    };
  }

  /**
   * Vendor Intelligence Cards
   *
   * Returns a comprehensive Markdown intelligence report for all vendors —
   * scores, certifications, performance, contract history summary, and risk flags.
   */
  @Resource({
    uri: 'negotiation://vendor-intelligence',
    name: 'Vendor Intelligence Cards',
    description:
      'Comprehensive intelligence cards for all VendorIQ vendors: scoring breakdown, certifications, performance metrics, contract history summary, risk flags, and negotiation leverage. Use this as a reference during vendor evaluation and negotiation.',
    mimeType: 'text/markdown',
  })
  async vendorIntelligenceResource(context: ExecutionContext) {
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/vendoriq';
      await mongoose.connect(uri);
    }

    const vendors = await VendorModel.find().sort({ category: 1, name: 1 }).exec();
    const perfDocs = await VendorPerformanceModel.find().exec();
    const complianceDocs = await ComplianceModel.find().exec();
    const contracts = await HistoricalContractModel.find().exec();

    const perfMap = new Map(perfDocs.map((p) => [p.vendorId, p]));
    const complianceMap = new Map(complianceDocs.map((c) => [c.vendorId, c]));

    const contractsByVendor: Record<string, typeof contracts> = {};
    for (const c of contracts) {
      if (!contractsByVendor[c.vendorId]) contractsByVendor[c.vendorId] = [];
      contractsByVendor[c.vendorId].push(c);
    }

    const byCategory: Record<string, typeof vendors> = {};
    for (const v of vendors) {
      if (!byCategory[v.category]) byCategory[v.category] = [];
      byCategory[v.category].push(v);
    }

    const sections = Object.entries(byCategory).map(([cat, vendorList]) => {
      const cards = vendorList.map((v) => {
        const perf = perfMap.get(v.vendorId);
        const comp = complianceMap.get(v.vendorId);
        const vContracts = contractsByVendor[v.vendorId] ?? [];
        const avgDiscount = vContracts.length > 0
          ? (vContracts.reduce((s, c) => s + (c.discountPercent || 0), 0) / vContracts.length).toFixed(1)
          : 'N/A';
        const avgDelay = vContracts.length > 0
          ? (vContracts.reduce((s, c) => s + Math.max(0, c.deliveryDaysActual - c.deliveryDaysAgreed), 0) / vContracts.length).toFixed(1)
          : 'N/A';

        const riskFlags = [
          ...(comp?.flags ?? []),
          ...(v.complianceStatus === 'flagged' ? ['⚠️ Compliance flagged'] : []),
          ...(v.complianceStatus === 'pending' ? ['⏳ Audit pending'] : []),
          ...(perf && perf.defectRate > 3 ? [`High defect rate: ${perf.defectRate}%`] : []),
          ...(Number(avgDelay) > 2 ? [`Avg delivery delay: ${avgDelay} days`] : []),
        ];

        return `### ${v.name} (\`${v.vendorId}\`)

| Field | Value |
|-------|-------|
| **City** | ${v.city} |
| **Base Price** | ${formatInr(v.basePrice)}/unit |
| **Lead Time** | ${v.leadTimeBaseDays ?? v.deliveryDays} days |
| **Monthly Capacity** | ${(v.monthlyCapacity ?? 0).toLocaleString('en-IN')} units |
| **Current Stock** | ${(v.currentStock ?? 0).toLocaleString('en-IN')} units |
| **Quality Score** | ${v.qualityScore}/100 |
| **Compliance** | ${v.complianceStatus.toUpperCase()} |
| **Certifications** | ${comp?.certifications?.join(', ') || 'None on file'} |
| **Last Audit Score** | ${comp?.auditScore ?? 'N/A'}/100 |
| **On-Time Delivery** | ${perf?.onTimeDeliveryRate ?? 'N/A'}% |
| **Defect Rate** | ${perf?.defectRate ?? 'N/A'}% |
| **Avg Response** | ${perf?.avgResponseHours ?? 'N/A'} hrs |
| **Contracts on file** | ${vContracts.length} |
| **Avg Historical Discount** | ${avgDiscount}% |
| **Avg Delivery Delay** | ${avgDelay} days |

${riskFlags.length > 0 ? `**⚠️ Risk Flags:** ${riskFlags.join(' | ')}` : '**✅ No risk flags.**'}
`;
      });

      return `## ${cat}\n\n${cards.join('\n---\n')}`;
    });

    const markdown = `# VendorIQ Vendor Intelligence Report

*Comprehensive vendor profiles for procurement evaluation and negotiation support.*

---

${sections.join('\n\n---\n\n')}

---

*Generated by VendorIQ Procurement Intelligence Platform · ${new Date().toDateString()}*
`;

    return {
      type: 'text' as const,
      text: markdown,
    };
  }
}
