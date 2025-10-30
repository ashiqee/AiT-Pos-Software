// app/api/inventory/fix-negative-stock/route.ts
import { dbConnect } from "@/lib/db/dbConnect";
import Product, { InventoryTransaction, IProduct } from "@/models/product";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    await dbConnect();
    const { updates } = await req.json();

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "Invalid updates data" }, { status: 400 });
    }

    // Get user session for audit trail
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    let successCount = 0;
    const errors: any[] = [];
    const fixedProducts: any[] = [];

    for (const update of updates) {
      try {
        const { _id, warehouseStock } = update;

        if (!_id) {
          errors.push({
            row: 0,
            message: "Missing _id field",
            data: update,
          });
          continue;
        }

        // Find product by ID
        const product = await Product.findById(_id);
        
        if (!product) {
          errors.push({
            row: 0,
            message: `Product with _id ${_id} not found`,
            data: update,
          });
          continue;
        }

        const currentStock = product.warehouseStock;
        const newStock = parseInt(warehouseStock) || 0;
        
        // Only proceed if current stock is negative
        if (currentStock >= 0) {
          errors.push({
            row: 0,
            message: `Product ${product.name} has non-negative stock (${currentStock})`,
            data: update,
          });
          continue;
        }

        // Calculate the adjustment needed (add the negative amount to make it 0)
        const adjustmentAmount = Math.abs(currentStock);
        
        // Update the warehouse stock to 0
        product.warehouseStock = newStock;
        
        // Create a correction transaction
        const correctionTransaction = new InventoryTransaction({
          product: product._id,
          type: 'adjustment',
          quantity: adjustmentAmount, // Positive value to add back
          toLocation: 'warehouse',
          notes: `Stock correction: Fixed negative stock from ${currentStock} to ${newStock}`,
          reference: `negative-stock-fix-${Date.now()}`,
          user: userId
        });

        // Save both records
        await correctionTransaction.save();
        await product.save();

        fixedProducts.push({
          _id: product._id,
          name: product.name,
          sku: product.sku,
          oldStock: currentStock,
          newStock: newStock,
          adjustment: adjustmentAmount
        });

        successCount++;
      } catch (error: any) {
        errors.push({
          row: 0,
          message: `Fix failed: ${error.message}`,
          data: update,
        });
      }
    }

    return NextResponse.json({
      success: successCount,
      errors,
      fixedProducts,
    });
  } catch (error: any) {
    console.error("Negative stock fix error:", error);
    return NextResponse.json({ error: "Failed to fix negative stock" }, { status: 500 });
  }
}

// Also add a GET endpoint to find all products with negative stock
export async function GET() {
  try {
    await dbConnect();
    
    // Find all products with negative warehouse stock
    const negativeStockProducts = await Product.find({
      warehouseStock: { $lt: 0 }
    })
    .select('_id name sku warehouseStock shopStock')
    .lean();

    return NextResponse.json({
      count: negativeStockProducts.length,
      products: negativeStockProducts
    });
  } catch (error: any) {
    console.error("Error fetching negative stock products:", error);
    return NextResponse.json({ error: "Failed to fetch negative stock products" }, { status: 500 });
  }
}