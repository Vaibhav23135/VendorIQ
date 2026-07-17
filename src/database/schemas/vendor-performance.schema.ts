import mongoose, { Schema } from 'mongoose';

export interface VendorPerformanceDocument extends mongoose.Document {
  vendorId: string;
  onTimeDeliveryRate: number; // 0-100
  defectRate: number; // 0-100 (lower is better)
  avgResponseHours: number;
  ordersFulfilled: number;
  lastUpdated: Date;
}

const VendorPerformanceSchema = new Schema<VendorPerformanceDocument>(
  {
    vendorId: { type: String, required: true, index: true },
    onTimeDeliveryRate: { type: Number, required: true, min: 0, max: 100 },
    defectRate: { type: Number, required: true, min: 0, max: 100 },
    avgResponseHours: { type: Number, required: true },
    ordersFulfilled: { type: Number, required: true },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'vendor_performance' }
);

export const VendorPerformanceModel =
  mongoose.models.VendorPerformance ||
  mongoose.model<VendorPerformanceDocument>('VendorPerformance', VendorPerformanceSchema);
