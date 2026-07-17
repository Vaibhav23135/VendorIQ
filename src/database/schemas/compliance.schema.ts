import mongoose, { Schema } from 'mongoose';

export interface ComplianceDocument extends mongoose.Document {
  vendorId: string;
  certifications: string[];
  lastAuditDate: Date;
  auditScore: number; // 0-100
  flags: string[];
}

const ComplianceSchema = new Schema<ComplianceDocument>(
  {
    vendorId: { type: String, required: true, index: true },
    certifications: { type: [String], default: [] },
    lastAuditDate: { type: Date, required: true },
    auditScore: { type: Number, required: true, min: 0, max: 100 },
    flags: { type: [String], default: [] },
  },
  { timestamps: true, collection: 'compliance' }
);

export const ComplianceModel =
  mongoose.models.Compliance || mongoose.model<ComplianceDocument>('Compliance', ComplianceSchema);
