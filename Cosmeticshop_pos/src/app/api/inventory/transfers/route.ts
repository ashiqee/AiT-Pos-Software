// app/api/inventory/transfers/route.ts
import { dbConnect } from "@/lib/db/dbConnect";
import Product from "@/models/product";
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
    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (location && location !== "all") {
      query.$or = [{ fromLocation: location }, { toLocation: location }];
    }

    const skip = (page - 1) * limit;

    // Get transfers
    const transfers = await Product.aggregate([
      { $unwind: "$inventoryTransactions" },
      { $match: { "inventoryTransactions.type": "transfer", ...query } },
      { $sort: { "inventoryTransactions.createdAt": -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: "$inventoryTransactions._id",
          product: {
            _id: "$product._id",
            name: "$product.name",
            sku: "$product.sku",
            imageUrl: "$product.imageUrl",
          },
          fromLocation: "$inventoryTransactions.fromLocation",
          toLocation: "$inventoryTransactions.toLocation",
          quantity: "$inventoryTransactions.quantity",
          status: "$inventoryTransactions.status",
          reference: "$inventoryTransactions.reference",
          notes: "$inventoryTransactions.notes",
          createdAt: "$inventoryTransactions.createdAt",
          completedAt: "$inventoryTransactions.completedAt",
          user: "$inventoryTransactions.user",
        },
      },
    ]);

    // Get total count
    const totalCount = await Product.aggregate([
      { $unwind: "$inventoryTransactions" },
      { $match: { "inventoryTransactions.type": "transfer", ...query } },
      { $count: "total" },
    ]);

    const totalPages = Math.ceil((totalCount[0]?.total || 0) / limit);

    return NextResponse.json({
      transfers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalCount[0]?.total || 0,
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
