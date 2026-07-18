import { Injectable } from '@nitrostack/core';
import { DatabaseService } from './database.service.js';
import { VendorModel } from './schemas/vendor.schema.js';
import { VendorPerformanceModel } from './schemas/vendor-performance.schema.js';
import { ComplianceModel } from './schemas/compliance.schema.js';
import { HistoricalContractModel } from './schemas/historical-contract.schema.js';
import { MarketPriceModel } from './schemas/market-price.schema.js';
import { ProductModel } from './schemas/product.schema.js';
import {
  SEED_VENDORS,
  SEED_PERFORMANCE,
  SEED_COMPLIANCE,
  SEED_CONTRACTS,
  SEED_MARKET_PRICES,
  SEED_PRODUCTS,
} from './seed.data.js';

/**
 * SeedService
 *
 * Idempotently seeds all VendorIQ demo collections on module init if they
 * are empty. Safe to call multiple times — each collection is only
 * populated when its count is 0.
 */
@Injectable({ deps: [DatabaseService] })
export class SeedService {
  private seeded = false;

  constructor(private db: DatabaseService) {}

  async onModuleInit(): Promise<void> {
    await this.db.connect();
    await this.seedIfEmpty();
  }

  async seedIfEmpty(): Promise<{ seeded: boolean }> {
    if (this.seeded) return { seeded: false };

    const vendorCount = await VendorModel.countDocuments();
    if (vendorCount === 0) {
      await VendorModel.insertMany(SEED_VENDORS);
    }

    const perfCount = await VendorPerformanceModel.countDocuments();
    if (perfCount === 0) {
      await VendorPerformanceModel.insertMany(SEED_PERFORMANCE);
    }

    const complianceCount = await ComplianceModel.countDocuments();
    if (complianceCount === 0) {
      await ComplianceModel.insertMany(
        SEED_COMPLIANCE.map((c) => ({ ...c, lastAuditDate: new Date(c.lastAuditDate) }))
      );
    }

    const contractCount = await HistoricalContractModel.countDocuments();
    if (contractCount === 0) {
      await HistoricalContractModel.insertMany(
        SEED_CONTRACTS.map((c) => ({ ...c, contractDate: new Date(c.contractDate) }))
      );
    }

    const marketCount = await MarketPriceModel.countDocuments();
    if (marketCount === 0) {
      await MarketPriceModel.insertMany(
        SEED_MARKET_PRICES.map((m) => ({ ...m, asOfDate: new Date(m.asOfDate) }))
      );
    }

    const productCount = await ProductModel.countDocuments();
    if (productCount === 0) {
      await ProductModel.insertMany(SEED_PRODUCTS);
    }

    this.seeded = true;
    return { seeded: true };
  }
}
