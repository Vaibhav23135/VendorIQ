import mongoose, { Schema } from 'mongoose';

export type VendorCategory = 'IT Hardware' | 'Medical' | 'Office Supplies';

export interface VendorDocument extends mongoose.Document {
  vendorId: string;
  name: string;
  category: VendorCategory;
  productLines: string[];
  basePrice: number;
  currency: string;
  deliveryDays: number;
  qualityScore: number; // 0-100
  complianceStatus: 'certified' | 'pending' | 'flagged';
  imageUrl: string;
  city: string;
  notes?: string;
}

const VendorSchema = new Schema<VendorDocument>(
  {
    vendorId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true, enum: ['IT Hardware', 'Medical', 'Office Supplies'] },
    productLines: { type: [String], default: [] },
    basePrice: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    deliveryDays: { type: Number, required: true },
    qualityScore: { type: Number, required: true, min: 0, max: 100 },
    complianceStatus: { type: String, required: true, enum: ['certified', 'pending', 'flagged'] },
    imageUrl: { type: String, required: true },
    city: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true, collection: 'vendor_master' }
);

export const VendorModel = mongoose.models.Vendor || mongoose.model<VendorDocument>('Vendor', VendorSchema);
