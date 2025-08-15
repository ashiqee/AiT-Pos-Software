import { NextRequest, NextResponse } from 'next/server';

import Sale from '@/models/sale';
import { getServerSession } from 'next-auth';
import { dbConnect } from '@/lib/db/dbConnect';
import { authOptions } from '../auth/[...nextauth]/authOptions';
import mongoose from 'mongoose';
import product from '@/models/product';


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
    const { items, subtotal, discount, tax, total, paymentMethod, customer } = body;

    // Start a session for the transaction
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // Process each item in the sale
      for (const item of items) {
        // Find the product
        const productData = await product.findById(item.product).session(dbSession);
        if (!productData) {
          throw new Error(`Product not found: ${item.productData}`);
        }

        // Check if there's enough stock
        if (productData.totalQuantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${productData.name}. Available: ${productData.totalQuantity}, Requested: ${item.quantity}`);
        }

        // Reduce the stock
        await productData.reduceStock(item.quantity, dbSession);
      }

      // Create the sale record
      const sale = new Sale({
        items,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod,
        customer,
        user: session.userData.id,
      });

      await sale.save({ session: dbSession });

      // Commit the transaction
      await dbSession.commitTransaction();
      dbSession.endSession();

      return NextResponse.json(sale);
    } catch (error) {
      // Abort the transaction on error
      await dbSession.abortTransaction();
      dbSession.endSession();
      
      console.error('Sale processing error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 400 }
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