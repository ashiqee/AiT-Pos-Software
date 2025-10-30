// app/api/inventory/set-initial-warehouse-stock/route.ts
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

        if (warehouseStock === undefined || warehouseStock === null) {
          errors.push({
            row: 0,
            message: "Missing warehouseStock field",
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

        // Check if product already has warehouse stock
        if (product.warehouseStock > 0) {
          errors.push({
            row: 0,
            message: `Product ${product.name} already has warehouse stock (${product.warehouseStock})`,
            data: update,
          });
          continue;
        }

        // Set the initial warehouse stock
        product.warehouseStock = parseInt(warehouseStock);
        
        // Create an initial setup transaction for audit trail
        const setupTransaction = new InventoryTransaction({
          product: product._id,
          type: 'adjustment',
          quantity: parseInt(warehouseStock),
          toLocation: 'warehouse',
          notes: 'Initial warehouse stock setup',
          reference: `initial-setup-${Date.now()}`,
          user: userId
        });

        // Save both records
        await setupTransaction.save();
        await product.save();

        successCount++;
      } catch (error: any) {
        errors.push({
          row: 0,
          message: `Update failed: ${error.message}`,
          data: update,
        });
      }
    }

    return NextResponse.json({
      success: successCount,
      errors,
    });
  } catch (error: any) {
    console.error("Initial warehouse stock setup error:", error);
    return NextResponse.json({ error: "Failed to set initial warehouse stock" }, { status: 500 });
  }
}