import mongoose, { Schema } from 'mongoose';

const saleItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
});

const saleSchema = new Schema({
  items: [saleItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  discount: { type: Number, default:0 },
  total: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  customer: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Sale || mongoose.model('Sale', saleSchema);