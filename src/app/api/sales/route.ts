import { NextResponse } from 'next/server';

import Sale from '@/models/sale';
import { getServerSession } from 'next-auth';
import { dbConnect } from '@/lib/db/dbConnect';
import { authOptions } from '../auth/[...nextauth]/authOptions';


export async function GET() {
  try {
    await dbConnect();
    const sales = await Sale.find({}).populate('items.product');
    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const data = await request.json();
    const sale = new Sale(data);
    await sale.save();
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
  }
}