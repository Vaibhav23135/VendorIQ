import mongoose, { Schema } from 'mongoose';

export interface HistoricalContractDocument extends mongoose.Document {
  vendorId: string;
  item: string;
  contractDate: Date;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  warrantyMonths: number;
  deliveryDaysAgreed: number;
  deliveryDaysActual: number;
  notes?: string;
}

const HistoricalContractSchema = new Schema<HistoricalContractDocument>(
  {
    vendorId: { type: String, required: true, index: true },
    item: { type: String, required: true },
    contractDate: { type: Date, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    warrantyMonths: { type: Number, default: 12 },
    deliveryDaysAgreed: { type: Number, required: true },
    deliveryDaysActual: { type: Number, required: true },
    notes: { type: String },
  },
  { timestamps: true, collection: 'historical_contracts' }
);

export const HistoricalContractModel =
  mongoose.models.HistoricalContract ||
  mongoose.model<HistoricalContractDocument>('HistoricalContract', HistoricalContractSchema);
