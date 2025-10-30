// app/api/products/update-batch/route.ts
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
        const { _id, inventoryOperation, ...updateFields } = update;

        if (!_id) {
          errors.push({
            row: 0,
            message: "Missing _id field",
            data: update,
          });
          continue;
        }

        const product = await Product.findById(_id);
        if (!product) {
          errors.push({
            row: 0,
            message: `Product with _id ${_id} not found`,
            data: update,
          });
          continue;
        }

        // Handle inventory operations
        if (inventoryOperation) {
          const { type, quantity, fromLocation, toLocation, notes, reason } = inventoryOperation;
          
          try {
            switch (type) {
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
                const unitCost = inventoryOperation.unitCost || await product.getAverageUnitCost();
                await product.recordPurchase(quantity, unitCost, toLocation);
                break;
                
              case 'adjustment':
                if (!toLocation) {
                  throw new Error("Adjustment operation requires toLocation");
                }
                await product.recordAdjustment(quantity, toLocation, reason || notes);
                break;
                
              default:
                throw new Error(`Unknown inventory operation type: ${type}`);
            }
          } catch (error: any) {
            errors.push({
              row: 0,
              message: `Inventory operation failed: ${error.message}`,
              data: update,
            });
            continue;
          }
        }

        // Handle direct stock updates (for manual adjustments)
        if (updateFields.warehouseStock !== undefined || updateFields.shopStock !== undefined) {
          const oldWarehouseStock = product.warehouseStock;
          const oldShopStock = product.shopStock;
          
          // Update stock values
          if (updateFields.warehouseStock !== undefined) {
            product.warehouseStock = updateFields.warehouseStock;
          }
          if (updateFields.shopStock !== undefined) {
            product.shopStock = updateFields.shopStock;
          }
          
          // Create adjustment transactions for stock changes
          const warehouseDiff = product.warehouseStock - oldWarehouseStock;
          const shopDiff = product.shopStock - oldShopStock;
          
          if (warehouseDiff !== 0) {
            await product.recordAdjustment(
              warehouseDiff,
              'warehouse',
              updateFields.adjustmentReason || 'Manual stock update'
            );
          }
          
          if (shopDiff !== 0) {
            await product.recordAdjustment(
              shopDiff,
              'shop',
              updateFields.adjustmentReason || 'Manual stock update'
            );
          }
          
          // Remove from updateFields to avoid updating again
          delete updateFields.warehouseStock;
          delete updateFields.shopStock;
          delete updateFields.adjustmentReason;
        }

        // Handle batches array specially
        if (updateFields.batches && Array.isArray(updateFields.batches)) {
          // Process each batch update in order (assuming order corresponds to array indices)
          for (let i = 0; i < updateFields.batches.length; i++) {
            const batchUpdate = updateFields.batches[i];

            if (batchUpdate._id) {
              // Update existing batch by ID
              const batchIndex = product.batches.findIndex((b: any) => b._id.toString() === batchUpdate._id);
              if (batchIndex !== -1) {
                Object.assign(product.batches[batchIndex], batchUpdate);
              } else {
                errors.push({
                  row: 0,
                  message: `Batch with _id ${batchUpdate._id} not found in product ${_id}`,
                  data: update,
                });
              }
            } else {
              // No _id: Update by index if exists (specific field update on existing batch), else add new
              if (i < product.batches.length) {
                // Update existing batch at index i with provided fields only (preserves other required fields like quantity)
                Object.assign(product.batches[i], batchUpdate);
              } else {
                // Add new batch (but since specific fields, may fail validation if required missing - log error but continue)
                if (batchUpdate.quantity === undefined || batchUpdate.quantity === null) {
                  errors.push({
                    row: 0,
                    message: `New batch at index ${i} missing required quantity`,
                    data: update,
                  });
                  continue; // Skip adding invalid new batch
                }
                product.batches.push(batchUpdate);
              }
            }
          }

          // Remove batches from updateFields to avoid updating it again
          delete updateFields.batches;
        }

        // Update other fields (non-batch, non-inventory)
        if (Object.keys(updateFields).length > 0) {
          Object.assign(product, updateFields);
        }

        // Save the product with all updates
        await product.save();

        successCount++;
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
    console.error("Batch update error:", error);
    return NextResponse.json({ error: "Failed to update products" }, { status: 500 });
  }
}