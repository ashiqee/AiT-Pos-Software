import { NextRequest, NextResponse } from 'next/server';

import Product from '@/models/product';
import { getServerSession } from 'next-auth';
import { dbConnect } from '@/lib/db/dbConnect';
import { authOptions } from '../../auth/[...nextauth]/authOptions';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const barcode = searchParams.get("barcode");
    const stockFilter = searchParams.get("stock"); // 'out' | 'low' | 'high'
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // 🔹 Match condition for search/barcode
    let match: any = {};
    if (barcode) {
      match = { barcode };
    } else if (search) {
      match = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { sku: { $regex: search, $options: "i" } },
          { "category.name": { $regex: search, $options: "i" } },
        ],
      };
    }

    // 🔹 Base pipeline
    const pipeline: any[] = [
      { $match: match },
      {
        $addFields: {
          availableStock: { $subtract: ["$totalQuantity", "$totalSold"] },
        },
      },
      {
        $addFields: {
          stockLevel: {
            $switch: {
              branches: [
                { case: { $eq: ["$availableStock", 0] }, then: "out" },
                { case: { $lte: ["$availableStock", 10] }, then: "low" },
              ],
              default: "high",
            },
          },
          inStock: { $gt: ["$availableStock", 0] },
        },
      },
    ];

    // 🔹 Apply stock filter
    if (stockFilter) {
      pipeline.push({ $match: { stockLevel: stockFilter } });
    }

    // 🔹 Summary counts (independent of pagination)
    const summaryPipeline = [
      ...pipeline,
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          inStockCount: { $sum: { $cond: ["$inStock", 1, 0] } },
          outOfStockCount: {
            $sum: { $cond: [{ $eq: ["$stockLevel", "out"] }, 1, 0] },
          },
          lowStockCount: {
            $sum: { $cond: [{ $eq: ["$stockLevel", "low"] }, 1, 0] },
          },
          highStockCount: {
            $sum: { $cond: [{ $eq: ["$stockLevel", "high"] }, 1, 0] },
          },
        },
      },
    ];

    const summaryResult = await Product.aggregate(summaryPipeline);
    const summary =
      summaryResult[0] || {
        totalProducts: 0,
        inStockCount: 0,
        outOfStockCount: 0,
        lowStockCount: 0,
        highStockCount: 0,
      };

    // 🔹 Total count for pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Product.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // 🔹 Paginated products (latest first)
    const products = await Product.aggregate([
      ...pipeline,
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    return NextResponse.json({
      summary,
      products,
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
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}