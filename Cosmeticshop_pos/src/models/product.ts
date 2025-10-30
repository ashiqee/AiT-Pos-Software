import mongoose, { Schema, Document, Model } from 'mongoose';

// Location Enum
const LOCATION_ENUM = {
  WAREHOUSE: 'warehouse',
  SHOP: 'shop',
} as const;
type LocationType = typeof LOCATION_ENUM[keyof typeof LOCATION_ENUM];

// Transaction Type Enum
const TRANSACTION_TYPE_ENUM = {
  PURCHASE: 'purchase',
  TRANSFER: 'transfer',
  SALE: 'sale',
  ADJUSTMENT: 'adjustment',
} as const;
type TransactionType = typeof TRANSACTION_TYPE_ENUM[keyof typeof TRANSACTION_TYPE_ENUM];

// Batch Interface
interface IBatch {
  purchaseDate: Date;
  quantity: number;
  unitCost: number;
  supplier?: string;
  batchNumber?: string;
}

// Inventory Transaction Interface
interface IInventoryTransaction extends Document {
  product: mongoose.Types.ObjectId;
  type: TransactionType;
  quantity: number;
  unitCost?: number;
  fromLocation?: LocationType;
  toLocation?: LocationType;
  batchNumber?: string;
  reference?: string;
  notes?: string;
  createdAt: Date;
  user?: mongoose.Types.ObjectId;
}

// Product Interface
export interface IProduct extends Document {
  name: string;
  description?: string;
  sellingPrice: number;
  batches: IBatch[];
  totalSold: number;
  warehouseStock: number; // Track warehouse stock directly
  shopStock: number; // Track shop stock directly
  category: mongoose.Types.ObjectId;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  recordSale(quantity: number, session?: any, userId?: mongoose.Types.ObjectId): Promise<IProduct>;
  recordPurchase(quantity: number, unitCost: number, location: LocationType, batchNumber?: string, session?: any): Promise<IProduct>;
  recordTransfer(quantity: number, fromLocation: LocationType, toLocation: LocationType, session?: any): Promise<IProduct>;
  recordAdjustment(quantity: number, location: LocationType, reason?: string, session?: any): Promise<IProduct>;
  getStockByLocation(location: LocationType): Promise<number>;
  getStockInfo(): Promise<{
    warehouseStock: number;
    shopStock: number;
    totalStock: number;
    inStock: boolean;
    stockLevel: string;
  }>;
  getAverageUnitCost(): Promise<number>;
  recalculateStock(): Promise<void>;
}

// Batch Schema
const batchSchema = new Schema<IBatch>({
  purchaseDate: { type: Date, default: Date.now },
  quantity: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  supplier: { type: String },
  batchNumber: { type: String }
});

// Inventory Transaction Schema
const inventoryTransactionSchema = new Schema<IInventoryTransaction>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  type: { 
    type: String, 
    enum: Object.values(TRANSACTION_TYPE_ENUM), 
    required: true 
  },
  quantity: { type: Number, required: true },
  unitCost: { type: Number },
  fromLocation: { type: String, enum: Object.values(LOCATION_ENUM) },
  toLocation: { type: String, enum: Object.values(LOCATION_ENUM) },
  batchNumber: { type: String },
  reference: { type: String },
  notes: { type: String },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

// Indexes for performance
inventoryTransactionSchema.index({ product: 1, createdAt: -1 });
inventoryTransactionSchema.index({ product: 1, type: 1, toLocation: 1 });

// Product Schema
const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String },
  sellingPrice: { type: Number, required: true },
  batches: [batchSchema],
  totalSold: { type: Number, default: 0 },
  warehouseStock: { type: Number, default: 0 }, // Track warehouse stock
  shopStock: { type: Number, default: 0 }, // Track shop stock
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  sku: { type: String, unique: true },
  barcode: { type: String },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { 
  virtuals: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for totalQuantity - calculated as sum of warehouse and shop stock
productSchema.virtual('totalQuantity').get(function() {
  return this.warehouseStock + this.shopStock;
});

// Virtual for availableStock - sum of warehouse and shop stock
productSchema.virtual('availableStock').get(function() {
  return this.warehouseStock + this.shopStock;
});

// Virtual for stockLevel - based on total stock
productSchema.virtual('stockLevel').get(function() {
  const totalStock = this.warehouseStock + this.shopStock;
  if (totalStock === 0) return 'out';
  if (totalStock <= 5) return 'low';
  return 'high';
});

// Virtual for inStock - based on total stock
productSchema.virtual('inStock').get(function() {
  return (this.warehouseStock + this.shopStock) > 0;
});

// Method to get stock by location
productSchema.methods.getStockByLocation = async function(location: LocationType): Promise<number> {
  // For performance, return the directly tracked value
  if (location === 'warehouse') return this.warehouseStock;
  if (location === 'shop') return this.shopStock;
  
  // Fallback to calculation if needed
  const InventoryTransaction = mongoose.model('InventoryTransaction') as Model<IInventoryTransaction>;
  
  const result = await InventoryTransaction.aggregate([
    {
      $match: { 
        product: this._id,
        $or: [
          { toLocation: location },
          { fromLocation: location }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalIn: { 
          $sum: { 
            $cond: [
              { $eq: ['$toLocation', location] },
              '$quantity',
              0
            ]
          }
        },
        totalOut: { 
          $sum: { 
            $cond: [
              { $eq: ['$fromLocation', location] },
              { $multiply: ['$quantity', -1] },
              0
            ]
          }
        }
      }
    }
  ]).exec();
  
  return (result[0]?.totalIn || 0) + (result[0]?.totalOut || 0);
};

// Method to get complete stock information
productSchema.methods.getStockInfo = async function() {
  // For performance, use the directly tracked values
  const warehouseStock = this.warehouseStock;
  const shopStock = this.shopStock;
  const totalStock = warehouseStock + shopStock;
  
  return {
    warehouseStock,
    shopStock,
    totalStock,
    inStock: totalStock > 0,
    stockLevel: totalStock === 0 ? 'out' : (totalStock <= 5 ? 'low' : 'high')
  };
};

// Method to get average unit cost
productSchema.methods.getAverageUnitCost = async function(): Promise<number> {
  const InventoryTransaction = mongoose.model('InventoryTransaction') as Model<IInventoryTransaction>;
  
  const result = await InventoryTransaction.aggregate([
    {
      $match: { 
        product: this._id,
        type: 'purchase'
      }
    },
    {
      $group: {
        _id: null,
        totalCost: { $sum: { $multiply: ['$quantity', '$unitCost'] } },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]).exec();
  
  if (!result.length || result[0].totalQuantity === 0) return 0;
  return result[0].totalCost / result[0].totalQuantity;
};

// Method to record a purchase
productSchema.methods.recordPurchase = async function(
  quantity: number, 
  unitCost: number, 
  location: LocationType, 
  batchNumber?: string, 
  session?: any
): Promise<IProduct> {
  const InventoryTransaction = mongoose.model('InventoryTransaction') as Model<IInventoryTransaction>;
  
  // Create a new batch record
  const newBatch = {
    purchaseDate: new Date(),
    quantity,
    unitCost,
    batchNumber: batchNumber || `BATCH-${Date.now()}`
  };
  
  // Add batch to product
  this.batches.push(newBatch);
  
  // Update location-specific stock
  if (location === 'warehouse') {
    this.warehouseStock += quantity;
  } else if (location === 'shop') {
    this.shopStock += quantity;
  }
  
  // Create inventory transaction
  const purchaseTransaction = new InventoryTransaction({
    product: this._id,
    type: 'purchase',
    quantity,
    toLocation: location,
    batchNumber: newBatch.batchNumber,
    unitCost,
    reference: `purchase-${Date.now()}`
  });
  
  // Save both records
  await purchaseTransaction.save({ session });
  return this.save({ session });
};

// Method to record a transfer
productSchema.methods.recordTransfer = async function(
  quantity: number,
  fromLocation: LocationType,
  toLocation: LocationType,
  session?: any
): Promise<IProduct> {
  const InventoryTransaction = mongoose.model('InventoryTransaction') as Model<IInventoryTransaction>;

  // Check if there's enough stock at the source location
  const sourceStock = fromLocation === 'warehouse' ? this.warehouseStock : this.shopStock;
  if (sourceStock < quantity) {
    throw new Error(`Insufficient stock at ${fromLocation}. Available: ${sourceStock}, Requested: ${quantity}`);
  }

  // Update location-specific stock
  if (fromLocation === 'warehouse') {
    this.warehouseStock -= quantity;
  } else if (fromLocation === 'shop') {
    this.shopStock -= quantity;
  }
  
  if (toLocation === 'warehouse') {
    this.warehouseStock += quantity;
  } else if (toLocation === 'shop') {
    this.shopStock += quantity;
  }

  // Create transfer transaction
  const transferTransaction = new InventoryTransaction({
    product: this._id,
    type: 'transfer',
    quantity,
    fromLocation,
    toLocation,
    reference: `transfer-${Date.now()}`
  });

  await transferTransaction.save({ session });
  return this.save({ session });
};

// Method to record a sale - FIXED to only affect shop stock
productSchema.methods.recordSale = async function(
  quantity: number, 
  session?: any, 
  userId?: mongoose.Types.ObjectId
): Promise<IProduct> {
  const InventoryTransaction = mongoose.model('InventoryTransaction') as Model<IInventoryTransaction>;
  
  // Check if there's enough stock at the shop
  if (this.shopStock < quantity) {
    throw new Error(`Insufficient shop stock for ${this.name}. Shop: ${this.shopStock}, Requested: ${quantity}`);
  }
  
  // Update only shop stock and total sold
  this.shopStock -= quantity;
  this.totalSold += quantity;
  
  // Create sale transaction
  const saleTransaction = new InventoryTransaction({
    product: this._id,
    type: 'sale',
    quantity: -quantity, // Negative for out
    fromLocation: 'shop',
    reference: `sale-${Date.now()}`,
    user: userId
  });
  
  // Save both records
  await saleTransaction.save({ session });
  return this.save({ session });
};

// Method to record a stock adjustment
productSchema.methods.recordAdjustment = async function(
  quantity: number,
  location: LocationType,
  reason?: string,
  session?: any
): Promise<IProduct> {
  const InventoryTransaction = mongoose.model('InventoryTransaction') as Model<IInventoryTransaction>;

  // Update location-specific stock
  if (location === 'warehouse') {
    this.warehouseStock += quantity;
  } else if (location === 'shop') {
    this.shopStock += quantity;
  }

  const adjustmentTransaction = new InventoryTransaction({
    product: this._id,
    type: 'adjustment',
    quantity,
    toLocation: location,
    notes: reason,
    reference: `adjustment-${Date.now()}`
  });

  await adjustmentTransaction.save({ session });
  return this.save({ session });
};

// Method to recalculate stock from transactions
productSchema.methods.recalculateStock = async function(): Promise<void> {
  const InventoryTransaction = mongoose.model('InventoryTransaction') as Model<IInventoryTransaction>;
  
  // Calculate warehouse stock
  const warehouseResult = await InventoryTransaction.aggregate([
    {
      $match: { 
        product: this._id,
        $or: [
          { toLocation: 'warehouse' },
          { fromLocation: 'warehouse' }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalIn: { 
          $sum: { 
            $cond: [
              { $eq: ['$toLocation', 'warehouse'] },
              '$quantity',
              0
            ]
          }
        },
        totalOut: { 
          $sum: { 
            $cond: [
              { $eq: ['$fromLocation', 'warehouse'] },
              { $multiply: ['$quantity', -1] },
              0
            ]
          }
        }
      }
    }
  ]).exec();
  
  // Calculate shop stock
  const shopResult = await InventoryTransaction.aggregate([
    {
      $match: { 
        product: this._id,
        $or: [
          { toLocation: 'shop' },
          { fromLocation: 'shop' }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalIn: { 
          $sum: { 
            $cond: [
              { $eq: ['$toLocation', 'shop'] },
              '$quantity',
              0
            ]
          }
        },
        totalOut: { 
          $sum: { 
            $cond: [
              { $eq: ['$fromLocation', 'shop'] },
              { $multiply: ['$quantity', -1] },
              0
            ]
          }
        }
      }
    }
  ]).exec();
  
  // Update stock values
  this.warehouseStock = (warehouseResult[0]?.totalIn || 0) + (warehouseResult[0]?.totalOut || 0);
  this.shopStock = (shopResult[0]?.totalIn || 0) + (shopResult[0]?.totalOut || 0);
  
  await this.save();
};

// Pre-save middleware
productSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  // Auto-generate SKU only for new products
  if (this.isNew && !this.sku) {
    const ProductModel = mongoose.model('Product') as Model<IProduct>;
    const lastProduct = await ProductModel
      .findOne({})
      .sort({ createdAt: -1 })
      .select('sku');
    let nextNumber = 1;
    if (lastProduct && lastProduct.sku) {
      const lastNum = parseInt(lastProduct.sku.replace('RN-', ''), 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }
    this.sku = `RN-${String(nextNumber).padStart(5, '0')}`;
  }
  next();
});

// JSON transformation
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

// Create models with proper typing
const Product: Model<IProduct> = mongoose.models.Product || 
  mongoose.model<IProduct>('Product', productSchema);

const InventoryTransaction: Model<IInventoryTransaction> = mongoose.models.InventoryTransaction || 
  mongoose.model<IInventoryTransaction>('InventoryTransaction', inventoryTransactionSchema);

// Export models and enums
export default Product;
export { InventoryTransaction, LOCATION_ENUM, TRANSACTION_TYPE_ENUM };