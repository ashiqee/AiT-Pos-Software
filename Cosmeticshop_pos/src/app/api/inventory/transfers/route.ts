// app/api/inventory/transfers/route.ts
import { dbConnect } from "@/lib/db/dbConnect";
import Product, { InventoryTransaction } from "@/models/product";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const location = searchParams.get("location");

    // Build query
    const query: any = { type: "transfer" };
    
    if (status && status !== "all") {
      query.status = status;
    }
    
    if (location && location !== "all") {
      query.$or = [{ fromLocation: location }, { toLocation: location }];
    }

    const skip = (page - 1) * limit;

    // Get transfers with product information
    const transfers = await InventoryTransaction.find(query)
      .populate({
        path: 'product',
        select: 'name sku imageUrl batches',
        model: 'Product'
      })
      .populate({
        path: 'user',
        select: 'name email',
        model: 'User'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const totalCount = await InventoryTransaction.countDocuments(query);

    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      transfers,
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
    console.error("Error fetching transfers:", error);
    return NextResponse.json(
      { error: "Failed to fetch transfers" },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, fromLocation, toLocation, quantity, notes } = body;

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check stock availability
    const stockInfo = await product.getStockInfo();
    const sourceStock =
      fromLocation === "warehouse"
        ? stockInfo.warehouseStock
        : stockInfo.shopStock;

    if (sourceStock < quantity) {
      return NextResponse.json(
        {
          error: `Insufficient stock at ${fromLocation}. Available: ${sourceStock}`,
        },
        { status: 400 }
      );
    }

    // Create transfer
    await product.recordTransfer(quantity, fromLocation, toLocation);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating transfer:", error);
    return NextResponse.json(
      { error: "Failed to create transfer" },
      { status: 500 }
    );
  }
}
