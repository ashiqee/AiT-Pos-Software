// app/api/purchases/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { dbConnect } from "@/lib/db/dbConnect";
import Purchase from "@/models/purchase";
import Product from "@/models/product";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items, subtotal, tax, total, invoiceNumber, notes } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in purchase" }, { status: 400 });
    }

    // Validate each item
    for (const item of items) {
      if (!item.product || !item.quantity || !item.unitCost || !item.location) {
        return NextResponse.json({ error: "Missing required fields in purchase items" }, { status: 400 });
      }
    }

    // Create the purchase record
    const purchase = new Purchase({
      items,
      subtotal,
      tax,
      total,
      invoiceNumber,
      notes,
      user: session.user.id,
    });

    // Process each item to update product inventory
    for (const item of items) {
      try {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Product not found: ${item.product}`);
        }

        // Record the purchase with the specified location
        await product.recordPurchase(
          item.quantity,
          item.unitCost,
          item.location,
          item.batchNumber
        );
      } catch (error: any) {
        console.error(`Error processing purchase item: ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Save the purchase record
    await purchase.save();

    return NextResponse.json({ 
      success: true, 
      message: "Purchase processed successfully",
      purchase 
    });
  } catch (error: any) {
    console.error("Error processing purchase:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint for fetching purchases
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
    if (supplierFilter && supplierFilter !== 'All') {
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