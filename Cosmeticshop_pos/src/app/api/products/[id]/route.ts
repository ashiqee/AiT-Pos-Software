import { dbConnect } from '@/lib/db/dbConnect';
import Product from '@/models/product';
import { NextRequest, NextResponse } from 'next/server';


interface Params {
  params: Promise<{
    id: string;
  }>;
}


// GET single product
export async function GET(request: NextRequest, context: Params) {
  try {
    await dbConnect();
     const { id } = await context.params;
    const product = await Product.findById(id).populate('category');
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// UPDATE product
export async function PATCH(request: NextRequest, context:Params) {
  try {
    await dbConnect();
     const { id } = await context.params;
    const body = await request.json();
    
    // Find the product
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Update basic product fields
    if (body.name !== undefined) product.name = body.name;
    if (body.description !== undefined) product.description = body.description;
    if (body.sellingPrice !== undefined) product.sellingPrice = body.sellingPrice;
    if (body.category !== undefined) product.category = body.category;
    if (body.sku !== undefined) product.sku = body.sku;
    if (body.barcode !== undefined) product.barcode = body.barcode;
    if (body.imageUrl !== undefined) product.imageUrl = body.imageUrl;
    
    // Handle batches update
    if (body.batches !== undefined) {
      // Validate batches
      for (const batch of body.batches) {
        if (!batch.quantity || batch.quantity <= 0) {
          return NextResponse.json(
            { error: 'All batches must have a valid quantity' },
            { status: 400 }
          );
        }
        if (!batch.unitCost || batch.unitCost <= 0) {
          return NextResponse.json(
            { error: 'All batches must have a valid unit cost' },
            { status: 400 }
          );
        }
      }
      
      // Replace batches
      product.batches = body.batches.map((batch: any) => ({
        ...batch,
        purchaseDate: batch.purchaseDate ? new Date(batch.purchaseDate) : new Date()
      }));
      
      // Recalculate total quantity
      product.totalQuantity = product.batches.reduce((sum, batch) => sum + batch.quantity, 0);
    }
    
    // Save the updated product
    await product.save();
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    
    // Handle duplicate SKU error
    if (error instanceof Error && error.message.includes('duplicate key error')) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE product
export async function DELETE(request: NextRequest, context: Params) {
  try {
    await dbConnect();
     const { id } = await context.params;
    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if product has been sold
    if (product.totalSold > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product that has sales history' },
        { status: 400 }
      );
    }
    
    // Delete the product
    await Product.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      message: 'Product deleted successfully',
      deletedId: id
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}