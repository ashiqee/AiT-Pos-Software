import { dbConnect } from '@/lib/db/dbConnect';
import sale from '@/models/sale';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const statusFilter = searchParams.get('status'); // all, due, paid

    // Build query
    let query: any = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { 'customer.customerName': { $regex: search, $options: 'i' } },
        { 'customer.customerMobile': { $regex: search, $options: 'i' } }
      ];
    }

    // Get all sales with customer info
    const sales = await sale.find(query)
      .populate('items.product', 'name sku imageUrl')
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Group by customer and calculate due amounts
    const customerMap = new Map();
    
    for (const sale of sales) {
      const customerKey = sale.customer.customerName;
      const customerMobile = sale.customer.customerMobile;
      
      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          customerName: customerKey,
          customerMobile: customerMobile,
          totalDue: 0,
          totalPurchases: 0,
          totalSpent: 0,
          lastPurchase: sale.createdAt,
          purchases: []
        });
      }
      
      const customer = customerMap.get(customerKey);
      
      // Add to total due if payment status is not 'Paid'
      if (sale.paymentStatus !== 'Paid') {
        customer.totalDue += sale.dueAmount;
      }
      
      customer.totalPurchases += 1;
      customer.totalSpent += sale.total;
      
      // Update last purchase date if this sale is more recent
      if (new Date(sale.createdAt) > new Date(customer.lastPurchase)) {
        customer.lastPurchase = sale.createdAt;
      }
      
      // Add sale to purchases array
      customer.purchases.push(sale);
    }

    // Convert map to array and filter by status if needed
    let customers = Array.from(customerMap.values());
    
    if (statusFilter === 'due') {
      customers = customers.filter(c => c.totalDue > 0);
    } else if (statusFilter === 'paid') {
      customers = customers.filter(c => c.totalDue === 0);
    }

    // Sort customers by totalDue (descending) or last purchase
  customers.sort((a, b) => {
  if (statusFilter === 'due') {
    return b.totalDue - a.totalDue; // Both are numbers
  }
  // Convert dates to numbers (milliseconds) for consistent return type
  return new Date(b.lastPurchase).getTime() - new Date(a.lastPurchase).getTime();
});

    // Get total count for pagination
    const totalCount = customers.length;
    
    // Apply pagination
    const paginatedCustomers = customers.slice(skip, skip + limit);
    
    // Calculate summary statistics
    const totalCustomers = customers.length;
    const customersWithDue = customers.filter(c => c.totalDue > 0).length;
    const totalDueAmount = customers.reduce((sum, c) => sum + c.totalDue, 0);
    const averageDue = customersWithDue > 0 ? totalDueAmount / customersWithDue : 0;

    return NextResponse.json({
      customers: paginatedCustomers,
      summary: {
        totalCustomers,
        customersWithDue,
        totalDueAmount,
        averageDue
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}