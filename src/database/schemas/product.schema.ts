import mongoose, { Schema } from 'mongoose';

export type ProductCategory = 'IT Hardware' | 'Medical' | 'Office Supplies';

export interface ProductSpecifications {
  ramGb?: number;
  cpu?: string;
  storageGb?: number;
  screenInch?: number;
  osType?: string;
  warrantyYears: number;
  weight?: string;
  resolution?: string;
  batteryHours?: number;
  connectivity?: string;
}

export interface ProductDocument extends mongoose.Document {
  productId: string;
  vendorId: string;
  name: string;
  category: ProductCategory;
  specifications: ProductSpecifications;
  unitPrice: number;
  stockQty: number;
  monthlyCapacity: number;
  isAvailable: boolean;
}

const ProductSchema = new Schema<ProductDocument>(
  {
    productId: { type: String, required: true, unique: true },
    vendorId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['IT Hardware', 'Medical', 'Office Supplies'],
    },
    specifications: {
      ramGb: { type: Number },
      cpu: { type: String },
      storageGb: { type: Number },
      screenInch: { type: Number },
      osType: { type: String },
      warrantyYears: { type: Number, required: true, default: 1 },
      weight: { type: String },
      resolution: { type: String },
      batteryHours: { type: Number },
      connectivity: { type: String },
    },
    unitPrice: { type: Number, required: true },
    stockQty: { type: Number, required: true, default: 0 },
    monthlyCapacity: { type: Number, required: true, default: 100 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'vendor_products' }
);

export const ProductModel =
  mongoose.models.Product ||
  mongoose.model<ProductDocument>('Product', ProductSchema);
