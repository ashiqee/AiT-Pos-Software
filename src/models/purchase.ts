// models/purchase.ts
import mongoose, { Schema } from 'mongoose';

const purchaseItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  supplier: { type: String, required: true },
  batchNumber: { type: String},
  purchaseDate: { type: Date, default: Date.now },
});

const purchaseSchema = new Schema({
  items: [purchaseItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  invoiceNumber: { type: String },
  notes: { type: String },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

purchaseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.PurchaseModel || mongoose.model('Purchase', purchaseSchema);