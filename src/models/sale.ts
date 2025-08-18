import mongoose, { Schema } from 'mongoose';

const saleItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
  unitCost: { type: Number, required: true }, // Add this field
  profit: { type: Number, required: true }, // Add this field
});
const customerSchema = new Schema({
 customerName: {type:String},
 customerMobile: {type:String},
});

const saleSchema = new Schema({
  items: [saleItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, required: true },
  total: { type: Number, required: true },

  // 💳 Payment info
  paymentMethod: { type: String, required: true },
  amountPaid: { type: Number, default: 0 },   // partial/full payment
  dueAmount: { type: Number, default: 0 },    // auto-calc = total - amountPaid
  paymentStatus: {                            // optional status field
    type: String,
    enum: ['Paid', 'Partial', 'Unpaid'],
    default: 'Unpaid',
  },

  customer: customerSchema,
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

// 🧮 Middleware: auto-calc dueAmount & paymentStatus
saleSchema.pre('save', function (next) {
  this.dueAmount = this.total - this.amountPaid;

  if (this.amountPaid >= this.total) {
    this.paymentStatus = 'Paid';
  } else if (this.amountPaid > 0) {
    this.paymentStatus = 'Partial';
  } else {
    this.paymentStatus = 'Unpaid';
  }

  next();
});

export default mongoose.models.Sale || mongoose.model('Sale', saleSchema);
