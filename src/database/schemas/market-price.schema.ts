import mongoose, { Schema } from 'mongoose';

export interface MarketPriceDocument extends mongoose.Document {
  item: string;
  category: string;
  marketAvgPrice: number;
  currency: string;
  asOfDate: Date;
}

const MarketPriceSchema = new Schema<MarketPriceDocument>(
  {
    item: { type: String, required: true, index: true },
    category: { type: String, required: true },
    marketAvgPrice: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    asOfDate: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'market_prices' }
);

export const MarketPriceModel =
  mongoose.models.MarketPrice || mongoose.model<MarketPriceDocument>('MarketPrice', MarketPriceSchema);
