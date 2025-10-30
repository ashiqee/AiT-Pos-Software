// app/api/inventory/update-batch/route.ts
import { dbConnect } from "@/lib/db/dbConnect";
import Product, { IProduct } from "@/models/product";
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
        const { sku, productId, operation, quantity, fromLocation, toLocation, notes, reason } = update;

        // Find product by SKU or ID
        const product = await Product.findOne(
          sku ? { sku } : { _id: productId }
        );
        
        if (!product) {
          errors.push({
            row: 0,
            message: `Product not found: ${sku || productId}`,
            data: update,
          });
          continue;
        }

        try {
          switch (operation) {
            case 'transfer':
              if (!fromLocation || !toLocation) {
                throw new Error("Transfer operation requires fromLocation and toLocation");
              }
              await product.recordTransfer(quantity, fromLocation, toLocation);
              break;
              
            case 'sale':
              await product.recordSale(quantity, undefined);
              break;
              
            case 'purchase':
              if (!toLocation) {
                throw new Error("Purchase operation requires toLocation");
              }
              // For purchases, we need unitCost - if not provided, use average cost
              const unitCost = update.unitCost || await product.getAverageUnitCost();
              await product.recordPurchase(quantity, unitCost, toLocation);
              break;
              
            case 'adjustment':
              if (!toLocation) {
                throw new Error("Adjustment operation requires toLocation");
              }
              await product.recordAdjustment(quantity, toLocation, reason || notes);
              break;
              
            case 'setStock':
              // Direct stock setting for a specific location
              if (!fromLocation) {
                throw new Error("setStock operation requires fromLocation");
              }
              
              const currentStock = fromLocation === 'warehouse' ? product.warehouseStock : product.shopStock;
              const newStock = quantity;
              const stockDiff = newStock - currentStock;
              
              // Update the stock for the specified location
              if (fromLocation === 'warehouse') {
                product.warehouseStock = newStock;
              } else if (fromLocation === 'shop') {
                product.shopStock = newStock;
              }
              
              // Create adjustment transaction for the difference
              if (stockDiff !== 0) {
                await product.recordAdjustment(
                  stockDiff,
                  fromLocation,
                  reason || notes || `Set stock to ${newStock}`
                );
              }
              
              // Save the product with updated stock
              await product.save();
              break;
              
            default:
              throw new Error(`Unknown inventory operation type: ${operation}`);
          }
          
          successCount++;
        } catch (error: any) {
          errors.push({
            row: 0,
            message: `Inventory operation failed: ${error.message}`,
            data: update,
          });
        }
      } catch (error: any) {
        errors.push({
          row: 0,
          message: error.message,
          data: update,
        });
      }
    }

    return NextResponse.json({
      success: successCount,
      errors,
    });
  } catch (error: any) {
    console.error("Batch inventory update error:", error);
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}