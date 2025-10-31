// pages/api/products/adjust-stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { dbConnect } from '@/lib/db/dbConnect';
import Product from '@/models/product';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { productId, adjustment, reason } = body;

    if (!productId || adjustment === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Create a new batch for the adjustment
    const adjustmentBatch = {
      purchaseDate: new Date(),
      quantity: adjustment,
      unitCost: 0, // No cost for adjustments
      supplier: 'Stock Adjustment',
      batchNumber: `ADJ-${Date.now()}`,
    };

    // Add the adjustment batch
    product.batches.push(adjustmentBatch);
    await product.save();

    // Log the adjustment (you might want to create a separate model for this)
    console.log(`Stock adjustment for ${product.name}: ${adjustment} units. Reason: ${reason}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Stock adjusted successfully',
      product: {
        id: product._id,
        name: product.name,
        
      }
    });
  } catch (error) {
    console.error('Stock adjustment error:', error);
    return NextResponse.json(
      { error: 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}