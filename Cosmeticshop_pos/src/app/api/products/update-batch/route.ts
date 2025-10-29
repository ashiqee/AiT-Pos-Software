// app/api/products/update-batch/route.ts
import { dbConnect } from "@/lib/db/dbConnect";
import Product from "@/models/product";
import { NextRequest, NextResponse } from "next/server";


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

    let successCount = 0;
    const errors: any[] = [];

    for (const update of updates) {
      try {
        const { _id, ...updateFields } = update;

        if (!_id) {
          errors.push({
            row: 0,
            message: "Missing _id field",
            data: update,
          });
          continue;
        }

        // Handle batches array specially
        if (updateFields.batches && Array.isArray(updateFields.batches)) {
          const product = await Product.findById(_id);
          if (!product) {
            errors.push({
              row: 0,
              message: `Product with _id ${_id} not found`,
              data: update,
            });
            continue;
          }

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

          // Save the product with updated batches
          await product.save();

          // Remove batches from updateFields to avoid updating it again
          delete updateFields.batches;
        }

        // Update other fields (non-batch)
        if (Object.keys(updateFields).length > 0) {
          await Product.findByIdAndUpdate(_id, updateFields);
        }

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