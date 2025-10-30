// app/api/inventory/fix-double-stock/route.ts
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
    const { updates, useBatchStock } = await req.json();

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
        let correctStock;
        
        // If useBatchStock flag is true, calculate correct stock from batches
        if (useBatchStock) {
          correctStock = product.batches.reduce((total: number, batch: any) => 
            total + (batch.quantity || 0), 0
          );
        } else {
          // Use the provided warehouseStock value
          correctStock = parseInt(warehouseStock) || 0;
        }
        
        // Calculate the adjustment needed
        const adjustmentAmount = correctStock - currentStock;
        
        // Only proceed if there's actually a change needed
        if (adjustmentAmount === 0) {
          fixedProducts.push({
            _id: product._id,
            name: product.name,
            sku: product.sku,
            oldStock: currentStock,
            newStock: correctStock,
            adjustment: adjustmentAmount,
            note: "No change needed"
          });
          successCount++;
          continue;
        }
        
        // Update the warehouse stock to the correct value
        product.warehouseStock = correctStock;
        
        // Create a correction transaction
        const correctionTransaction = new InventoryTransaction({
          product: product._id,
          type: 'adjustment',
          quantity: adjustmentAmount,
          toLocation: 'warehouse',
          notes: useBatchStock 
            ? `Stock correction: Set warehouse stock to match batch total (${currentStock} → ${correctStock})`
            : `Stock correction: Fixed double-counted stock from ${currentStock} to ${correctStock}`,
          reference: useBatchStock 
            ? `batch-stock-fix-${Date.now()}`
            : `double-stock-fix-${Date.now()}`,
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
          newStock: correctStock,
          adjustment: adjustmentAmount,
          note: useBatchStock ? "Set to batch total" : "Manual correction"
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
    console.error("Stock fix error:", error);
    return NextResponse.json({ error: "Failed to fix stock" }, { status: 500 });
  }
}

// Also add a GET endpoint to find all products that might have double-counted stock
export async function GET() {
  try {
    await dbConnect();
    
    // Find all products with warehouse stock (you can add filters as needed)
    const products = await Product.find({
      warehouseStock: { $gt: 0 }
    })
    .select('_id name sku warehouseStock shopStock batches totalSold')
    .lean();

    return NextResponse.json({
      count: products.length,
      products
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}