import { NextRequest, NextResponse } from 'next/server';

import Product from '@/models/product';
import { getServerSession } from 'next-auth';
import { dbConnect } from '@/lib/db/dbConnect';
import { authOptions } from '../auth/[...nextauth]/authOptions';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const barcode = searchParams.get('barcode');

    let query = {};

    if (barcode) {
      // Exact barcode match
      query = { barcode: barcode };
    } else if (search) {
      // Search by name, SKU, or category
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { 'category.name': { $regex: search, $options: 'i' } },
        ],
      };
    }

    const products = await Product.find(query)
      .limit(barcode || search ? 0 : 20) // Limit only when no search or barcode
      .exec();

    const productsWithStock = products.map((product) => ({
      ...product.toObject(),
      inStock: product.totalQuantity > 0,
      stockLevel:
        product.totalQuantity > 10
          ? 'high'
          : product.totalQuantity > 0
          ? 'low'
          : 'out',
    }));

    return NextResponse.json(productsWithStock);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const data = await request.json();
    const product = new Product(data);
    await product.save();
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}