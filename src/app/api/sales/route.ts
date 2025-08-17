import { NextRequest, NextResponse } from 'next/server';

import Sale from '@/models/sale';
import { getServerSession } from 'next-auth';
import { dbConnect } from '@/lib/db/dbConnect';

import { authOptions } from '../auth/[...nextauth]/authOptions';
import Product, { IProduct } from '@/models/product';

export interface ISaleProduct extends IProduct {
  _id:string
}


export async function GET() {
  try {
    await dbConnect();
    const sales = await Sale.find({}).populate('items.product');
    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}






export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    const body = await request.json();
    const { items, subtotal,amountPaid, discount, tax, total, paymentMethod, customer } = body;

    console.log(body, "RES");
    
    // First, validate all products and check stock availability
    const productIds = items.map((item: any) => item.product);
    const products = await Product.find({ '_id': { $in: productIds } });
    
    // Create a map for easy product lookup
    const productMap = new Map<string, ISaleProduct>();
    products.forEach((product:any )=> {
      productMap.set(product._id.toString(), product);
    });
    
    // Validate all items before processing
    for (const item of items) {
      const product = productMap.get(item.product);
      
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.product}` },
          { status: 400 }
        );
      }
      
      if (product.availableStock! < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product: ${product.name}. Available: ${product.availableStock}, Requested: ${item.quantity}` },
          { status: 400 }
        );
      }
    }
    
    // Process each item to record the sale
    try {
      for (const item of items) {
        const product = productMap.get(item.product);
        
        if (product) {
          // Record the sale using the product's method
          await product.recordSale(item.quantity);
        }
      }
    } catch (error) {
      console.error('Sale recording error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to record sale' },
        { status: 400 }
      );
    }
    
    // Create the sale record
    try {
      const sale = new Sale({
        items,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod,
        amountPaid,
        customer,
        user: session.user.id,
      });
      // Save first
    await sale.save();

  // Populate the product inside items
    await sale.populate("items.product","name sku");
      return NextResponse.json(sale);
    } catch (error) {
      console.error('Sale creation error:', error);
      
      // Attempt to revert sale recordings if sale creation fails
      try {
        for (const item of items) {
          const product = productMap.get(item.product);
          if (product) {
            // Reduce the total sold by the quantity
            product.totalSold -= item.quantity;
            await product.save();
          }
        }
      } catch (revertError) {
        console.error('Failed to revert sale recordings:', revertError);
      }
      
      return NextResponse.json(
        { error: 'Failed to create sale record' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Sale API error:', error);
    return NextResponse.json(
      { error: 'Failed to process sale' },
      { status: 500 }
    );
  }
}