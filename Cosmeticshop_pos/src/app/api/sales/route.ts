import { NextRequest, NextResponse } from "next/server";

import Sale from "@/models/sale";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/db/dbConnect";

import { authOptions } from "../auth/[...nextauth]/authOptions";
import Product, { IProduct } from "@/models/product";

export interface ISaleProduct extends IProduct {
  _id: string;
}



export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const dateFilter = searchParams.get('date');
    const paymentFilter = searchParams.get('payment');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    let query: any = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { 'customer.customerName': { $regex: search, $options: 'i' } },
        { 'customer.customerMobile': { $regex: search, $options: 'i' } },
        { _id: { $regex: search, $options: 'i' } }
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
    
    // Payment method filter
    if (paymentFilter && paymentFilter !== 'all') {
      query.paymentMethod = paymentFilter;
    }

    // Fetch sales with pagination
    const sales = await Sale.find(query)
      .populate("items.product", "name sku imageUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Get total count for pagination
    const totalCount = await Sale.countDocuments(query);

    // Calculate summary statistics
    const summary = await calculateSummary(query);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      summary,
      sales,
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
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

// Helper function to calculate summary statistics
async function calculateSummary(baseQuery: any) {
  // Total revenue
  const totalRevenueAgg = await Sale.aggregate([
    { $match: baseQuery },
    { $group: { _id: null, total: { $sum: '$total' } } }
  ]);
  const totalRevenue = totalRevenueAgg[0]?.total || 0;

  // Total items sold
  const itemsSoldAgg = await Sale.aggregate([
    { $match: baseQuery },
    { $unwind: '$items' },
    { $group: { _id: null, total: { $sum: '$items.quantity' } } }
  ]);
  const totalItemsSold = itemsSoldAgg[0]?.total || 0;

  // Today's revenue
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayRevenueAgg = await Sale.aggregate([
    { $match: { ...baseQuery, createdAt: { $gte: startOfToday } } },
    { $group: { _id: null, total: { $sum: '$total' } } }
  ]);
  const todayRevenue = todayRevenueAgg[0]?.total || 0;

  // Total unique customers
  const uniqueCustomersAgg = await Sale.aggregate([
    { $match: baseQuery },
    { $group: { _id: '$customer.customerName' } },
    { $count: 'total' }
  ]);
  const totalCustomers = uniqueCustomersAgg[0]?.total || 0;

  return {
    totalRevenue,
    totalItemsSold,
    todayRevenue,
    totalCustomers,
  };
}



// POST SALE 
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await dbConnect();
    const body = await request.json();
    const {
      items,
      subtotal,
      amountPaid,
      discount,
      tax,
      total,
      paymentMethod,
      customer,
    } = body;

    // First, validate all products and check stock availability
    const productIds = items.map((item: any) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    
    // Create a map for easy product lookup
    const productMap = new Map<string, ISaleProduct>();
    products.forEach((product: any) => {
      productMap.set(product._id.toString(), product);
    });

    // Validate all items and calculate costs before processing
    const saleItems = [];
    let totalCost = 0;
    let totalProfit = 0;

    for (const item of items) {
      const product = productMap.get(item.product);
      
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.product}` },
          { status: 400 }
        );
      }
      
      if (product.shopStock! < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for product: ${product.name}. Available: ${product.shopStock}, Requested: ${item.quantity}`,
          },
          { status: 400 }
        );
      }

      // Calculate average unit cost from batches
      const totalBatchCost = product.batches.reduce((sum: number, batch: any) => 
        sum + (batch.quantity * batch.unitCost), 0
      );
      const totalBatchQuantity = product.batches.reduce((sum: number, batch: any) => 
        sum + batch.quantity, 0
      );
      const averageUnitCost = totalBatchQuantity > 0 ? totalBatchCost / totalBatchQuantity : 0;
      
      // Calculate profit for this item
      const itemCost = averageUnitCost * item.quantity;
      const itemProfit = (item.price - averageUnitCost) * item.quantity;
      
      totalCost += itemCost;
      totalProfit += itemProfit;

      // Create sale item with cost and profit
      saleItems.push({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        unitCost: averageUnitCost,
        profit: itemProfit
      });
    }

    // Process each item to record the sale
    try {
      for (const item of items) {
        const product = productMap.get(item.product);
        if (product) {
          // Record the sale using the product's method
          await product.recordSale(item.quantity);
        }
      }
    } catch (error) {
      console.error("Sale recording error:", error);
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Failed to record sale",
        },
        { status: 400 }
      );
    }

    // Create the sale record
    try {
      const sale = new Sale({
        items: saleItems,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod,
        amountPaid,
        customer,
        user: session.user.id,
      });
      
      // Save first
      await sale.save();
      
      // Populate the product inside items
      await sale.populate("items.product", "name sku");
      
      return NextResponse.json({
        ...sale.toObject(),
        totalCost,
        totalProfit
      });
    } catch (error) {
      console.error("Sale creation error:", error);
      
      // Attempt to revert sale recordings if sale creation fails
      try {
        for (const item of items) {
          const product = productMap.get(item.product);
          if (product) {
            // Reduce the total sold by the quantity
            product.totalSold -= item.quantity;
            await product.save();
          }
        }
      } catch (revertError) {
        console.error("Failed to revert sale recordings:", revertError);
      }
      
      return NextResponse.json(
        { error: "Failed to create sale record" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Sale API error:", error);
    return NextResponse.json(
      { error: "Failed to process sale" },
      { status: 500 }
    );
  }
}