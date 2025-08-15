import mongoose, { Schema } from 'mongoose';

const batchSchema = new Schema({
  purchaseDate: { type: Date, default: Date.now },
  quantity: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  supplier: { type: String },
  batchNumber: { type: String }
});

const productSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  sellingPrice: { type: Number, required: true },
  batches: [batchSchema],
  totalQuantity: { type: Number, default: 0 },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  sku: { type: String, unique: true }, // Will be auto-generated
  barcode: { type: String },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-update updatedAt and totalQuantity before saving
productSchema.pre('save', async function (next) {
  this.updatedAt = new Date();
  this.totalQuantity = this.batches.reduce((sum, batch) => sum + batch.quantity, 0);

  // Auto-generate SKU only for new products
  if (!this.sku) {
    const lastProduct = await mongoose.models.Product
      .findOne({})
      .sort({ createdAt: -1 })
      .select('sku');

    let nextNumber = 1;
    if (lastProduct && lastProduct.sku) {
      const lastNum = parseInt(lastProduct.sku.replace('RN', ''), 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }
    this.sku = `RN${String(nextNumber).padStart(4, '0')}`;
  }

  next();
});

export default mongoose.models.Product || mongoose.model('Product', productSchema);
