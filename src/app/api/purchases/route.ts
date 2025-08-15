// app/api/purchases/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';
import { dbConnect } from '@/lib/db/dbConnect';
import Product from '@/models/product';
import purchase from '@/models/purchase';



export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    const body = await request.json();
    const { items, subtotal, tax, total, invoiceNumber, notes } = body;

    // Validate all products exist
    const productIds = items.map((item: any) => item.product);
    const products = await Product.find({ '_id': { $in: productIds } });
    
    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found' },
        { status: 400 }
      );
    }

    // Create a map for easy product lookup
    const productMap = new Map();
    products.forEach((product: any) => {
      productMap.set(product._id.toString(), product);
    });

    // Process each item to add to inventory
    const processedItems = [];
    for (const item of items) {
      const product = productMap.get(item.product);
      
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.product}` },
          { status: 400 }
        );
      }

      // Generate batch number if not provided
      const batchNumber = item.batchNumber || `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Add a new batch to the product
      product.batches.push({
        purchaseDate: item.purchaseDate || new Date(),
        quantity: item.quantity,
        unitCost: item.unitCost,
        supplier: item.supplier,
        batchNumber: batchNumber,
      });
      await product.save();

      // Prepare the item for the purchase record with the batch number
      processedItems.push({
        ...item,
        batchNumber: batchNumber,
      });
    }

    // Create the purchase record
    const resPurchase = new purchase({
      items: processedItems,
      subtotal,
      tax,
      total,
      invoiceNumber,
      notes,
      user: session.user.id,
    });
    
    await resPurchase.save();
    
    return NextResponse.json(resPurchase);
  } catch (error) {
    console.error('Purchase API error:', error);
    return NextResponse.json(
      { error: 'Failed to process purchase' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    const purchases = await purchase.find()
      .populate('user', 'name email')
      .populate('items.product', 'name sku barcode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await purchase.countDocuments();
    
    return NextResponse.json({
      purchases,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}