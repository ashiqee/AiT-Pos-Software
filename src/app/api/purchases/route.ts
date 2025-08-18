// app/api/purchases/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';
import { dbConnect } from '@/lib/db/dbConnect';
import Product from '@/models/product';
import purchase from '@/models/purchase';



export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    const body = await request.json();
    const { items, subtotal, tax, total, invoiceNumber, notes } = body;

    // Validate all products exist
    const productIds = items.map((item: any) => item.product);
    const products = await Product.find({ '_id': { $in: productIds } });
    
    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found' },
        { status: 400 }
      );
    }

    // Create a map for easy product lookup
    const productMap = new Map();
    products.forEach((product: any) => {
      productMap.set(product._id.toString(), product);
    });

    // Process each item to add to inventory
    const processedItems = [];
    for (const item of items) {
      const product = productMap.get(item.product);
      
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.product}` },
          { status: 400 }
        );
      }

      // Generate batch number if not provided
      const batchNumber = item.batchNumber || `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Add a new batch to the product
      product.batches.push({
        purchaseDate: item.purchaseDate || new Date(),
        quantity: item.quantity,
        unitCost: item.unitCost,
        supplier: item.supplier,
        batchNumber: batchNumber,
      });
      await product.save();

      // Prepare the item for the purchase record with the batch number
      processedItems.push({
        ...item,
        batchNumber: batchNumber,
      });
    }

    // Create the purchase record
    const resPurchase = new purchase({
      items: processedItems,
      subtotal,
      tax,
      total,
      invoiceNumber,
      notes,
      user: session.user.id,
    });
    
    await resPurchase.save();
    
    return NextResponse.json(resPurchase);
  } catch (error) {
    console.error('Purchase API error:', error);
    return NextResponse.json(
      { error: 'Failed to process purchase' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const dateFilter = searchParams.get('date');
    const supplierFilter = searchParams.get('supplier');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Build query
    let query: any = {};
    
    // Search filter - FIXED: Use top-level fields instead of nested
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Date filter
    if (dateFilter) {
      const now = new Date();
      let startDate: Date;
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      query.createdAt = { $gte: startDate };
    }
    
    // Supplier filter
    if (supplierFilter && supplierFilter !== 'all') {
      query['batches.supplier'] = supplierFilter;
    }
    
    // Get products with batches
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    
    // Transform products to purchase records
    const purchases = products.map(product => {
      const totalQuantity = product.batches.reduce((sum, batch) => sum + batch.quantity, 0);
      const totalCost = product.batches.reduce((sum, batch) => sum + (batch.quantity * batch.unitCost), 0);
      
      return {
        _id: product._id,
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku,
          category: product.category
        },
        batches: product.batches,
        totalQuantity,
        totalCost,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    });
    
    // Get total count for pagination
    const totalCount = await Product.countDocuments(query);
    
    // Calculate summary statistics
    const summary = await calculateSummary(query);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      summary,
      purchases,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}

// Helper function to calculate summary statistics
async function calculateSummary(baseQuery: any) {
  // Get all products matching the query
  const products = await Product.find(baseQuery);
  
  // Total purchases (products with at least one batch)
  const totalPurchases = products.filter(p => p.batches.length > 0).length;
  
  // Total items purchased
  const totalItemsPurchased = products.reduce((sum, product) => {
    return sum + product.batches.reduce((batchSum, batch) => batchSum + batch.quantity, 0);
  }, 0);
  
  // Total spent
  const totalSpent = products.reduce((sum, product) => {
    return sum + product.batches.reduce((batchSum, batch) => batchSum + (batch.quantity * batch.unitCost), 0);
  }, 0);
  
  // This month spent
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthSpent = products.reduce((sum, product) => {
    const monthBatches = product.batches.filter(batch => {
      const batchDate = new Date(batch.purchaseDate);
      return batchDate >= startOfMonth;
    });
    return sum + monthBatches.reduce((batchSum, batch) => batchSum + (batch.quantity * batch.unitCost), 0);
  }, 0);
  
  // Top suppliers
  const supplierStats: { [key: string]: { amount: number; purchases: number } } = {};
  products.forEach(product => {
    product.batches.forEach(batch => {
      if (!batch.supplier) return;
      
      if (!supplierStats[batch.supplier]) {
        supplierStats[batch.supplier] = { amount: 0, purchases: 0 };
      }
      
      supplierStats[batch.supplier].amount += batch.quantity * batch.unitCost;
      supplierStats[batch.supplier].purchases += 1;
    });
  });
  
  const topSuppliers = Object.entries(supplierStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5); // Top 5 suppliers
    
  return {
    totalPurchases,
    totalItemsPurchased,
    totalSpent,
    thisMonthSpent,
    topSuppliers
  };
}