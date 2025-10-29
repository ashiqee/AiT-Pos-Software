import mongoose, { Schema, Document, Model } from 'mongoose';

// Define interfaces for TypeScript
interface IBatch {
  purchaseDate: Date;
  quantity: number;
  unitCost: number;
  supplier?: string;
  batchNumber?: string;
}

export interface IProduct extends Document {
  name: string;
  description?: string;
  sellingPrice: number;
  batches: IBatch[];
  totalQuantity: number;
  totalSold: number;
  category: mongoose.Types.ObjectId;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields will be added here
  availableStock?: number;
  inStock?: boolean;
  stockLevel?: string;
  
  // Methods
  recordSale(quantity: number, session?: any): Promise<IProduct>;
  getAvailableStock(): number;
  getStockInfo(): {
    totalQuantity: number;
    totalSold: number;
    availableStock: number;
    inStock: boolean;
    stockLevel: string;
  };
}

const batchSchema = new Schema<IBatch>({
  purchaseDate: { type: Date, default: Date.now },
  quantity: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  supplier: { type: String },
  batchNumber: { type: String }
});

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String },
  sellingPrice: { type: Number, required: true },
  batches: [batchSchema],
  totalQuantity: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  sku: { type: String, unique: true },
  barcode: { type: String },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
},{
virtuals:true
});

// Virtual fields for stock information
productSchema.virtual('availableStock').get(function() {
  return this.totalQuantity - this.totalSold;
});

productSchema.virtual('inStock').get(function() {
  return this.availableStock! > 0;
});

productSchema.virtual('stockLevel').get(function() {
  if (this.availableStock === 0) return 'out';
  if (this.availableStock! <= 5) return 'low';
  return 'high';
});

// Auto-update updatedAt before saving
productSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  // Calculate total quantity from batches
  this.totalQuantity = this.batches.reduce((sum, batch) => sum + batch.quantity, 0);
  
  // Auto-generate SKU only for new products
  if (this.isNew && !this.sku) {
    const lastProduct = await mongoose.models.Product
      .findOne({})
      .sort({ createdAt: -1 })
      .select('sku');
    let nextNumber = 1;
    if (lastProduct && lastProduct.sku) {
      // Handle SKU format with dash (e.g., "RN-01239")
      const lastNum = parseInt(lastProduct.sku.replace('RN-', ''), 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }
    this.sku = `RN-${String(nextNumber).padStart(5, '0')}`;
  }
  next();
});

// Method to record a sale without modifying batches
productSchema.methods.recordSale = async function(quantity: number, session?: any) {
  // Check if there's enough stock
  if (this.availableStock < quantity) {
    throw new Error(`Insufficient stock for product: ${this.name}. Available: ${this.availableStock}, Requested: ${quantity}`);
  }
  
  // Increase the total sold quantity
  this.totalSold += quantity;
  
  // Save the product with the session if provided
  if (session) {
    return this.save({ session });
  } else {
    return this.save();
  }
};

// Method to get available stock
productSchema.methods.getAvailableStock = function() {
  return this.availableStock;
};

// Method to get stock information
productSchema.methods.getStockInfo = function() {
  return {
    totalQuantity: this.totalQuantity,
    totalSold: this.totalSold,
    availableStock: this.availableStock,
    inStock: this.inStock,
    stockLevel: this.stockLevel
  };
};

productSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete (ret as any).__v;
    return ret;
  }
});

productSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    delete (ret as any).__v;
    return ret;
  }
});

// Create the model
const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

export default Product;