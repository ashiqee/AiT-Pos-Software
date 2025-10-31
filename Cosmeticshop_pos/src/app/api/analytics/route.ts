import { dbConnect } from '@/lib/db/dbConnect';
import Product from '@/models/product';
import sale from '@/models/sale';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }

    // Current period data
    const currentQuery = { createdAt: { $gte: startDate } };
    const previousQuery = { createdAt: { $gte: previousStartDate, $lt: startDate } };

    // Fetch summary data
    const summary = await getSummary(currentQuery, previousQuery);
    
    // Get sales trend (last 30 days)
    const salesTrend = await getSalesTrend();
    
    // Get payment methods
    const paymentMethods = await getPaymentMethods(currentQuery);
    
    // Get top products
    const topProducts = await getTopProducts(currentQuery);
    
    // Get recent sales
    const recentSales = await getRecentSales();
    
    // Get customer insights
    const customerInsights = await getCustomerInsights(currentQuery);
    
    // Get sales performance
    const salesPerformance = await getSalesPerformance(currentQuery);
    
    // Get product insights
    const productInsights = await getProductInsights();

    return NextResponse.json({
      summary,
      salesTrend,
      paymentMethods,
      topProducts,
      recentSales,
      customerInsights,
      salesPerformance,
      productInsights
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

async function getSummary(currentQuery: any, previousQuery: any) {
  // Current period aggregates
  const currentAgg = await sale.aggregate([
    { $match: currentQuery },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        totalProfit: { $sum: { $subtract: ['$total', '$subtotal'] } },
        totalItems: { $sum: { $sum: '$items.quantity' } },
        customers: { $addToSet: '$customer.customerName' }
      }
    }
  ]);

  // Previous period aggregates
  const previousAgg = await sale.aggregate([
    { $match: previousQuery },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        totalProfit: { $sum: { $subtract: ['$total', '$subtotal'] } },
        totalItems: { $sum: { $sum: '$items.quantity' } },
        customers: { $addToSet: '$customer.customerName' }
      }
    }
  ]);

  const current = currentAgg[0] || { totalRevenue: 0, totalProfit: 0, totalItems: 0, customers: [] };
  const previous = previousAgg[0] || { totalRevenue: 0, totalProfit: 0, totalItems: 0, customers: [] };

  // Calculate growth rates
  const revenueGrowth = previous.totalRevenue > 0 
    ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100 
    : 0;
  const profitGrowth = previous.totalProfit > 0 
    ? ((current.totalProfit - previous.totalProfit) / previous.totalProfit) * 100 
    : 0;
  const itemsGrowth = previous.totalItems > 0 
    ? ((current.totalItems - previous.totalItems) / previous.totalItems) * 100 
    : 0;
  const customersGrowth = previous.customers.length > 0 
    ? ((current.customers.length - previous.customers.length) / previous.customers.length) * 100 
    : 0;

  return {
    totalRevenue: current.totalRevenue,
    totalProfit: current.totalProfit,
    totalItemsSold: current.totalItems,
    totalCustomers: current.customers.length,
    revenueGrowth,
    profitGrowth,
    itemsGrowth,
    customersGrowth
  };
}

async function getSalesTrend() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trend = await sale.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return trend.map(item => ({
    date: item._id,
    revenue: item.revenue
  }));
}

async function getPaymentMethods(query: any) {
  const methods = await sale.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$paymentMethod',
        total: { $sum: '$total' }
      }
    },
    { $sort: { total: -1 } }
  ]);

  return methods.map(item => ({
    name: item._id,
    total: item.total
  }));
}

async function getTopProducts(query: any) {
  const products = await sale.aggregate([
    { $match: query },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.product.name' },
        revenue: { $sum: '$items.total' }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 }
  ]);

  return products.map(item => ({
    name: item.name,
    revenue: item.revenue
  }));
}

async function getRecentSales() {
  return await sale.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('customer total createdAt paymentStatus')
    .lean();
}

async function getCustomerInsights(query: any) {
  // Get all customers and their order counts
  const customers = await sale.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$customer.customerName',
        orderCount: { $sum: 1 },
        firstOrder: { $min: '$createdAt' }
      }
    }
  ]);

  const totalCustomers = customers.length;
  const newCustomers = customers.filter(c => {
    const firstOrder = new Date(c.firstOrder);
    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - 1);
    return firstOrder >= periodStart;
  }).length;
  const returningCustomers = totalCustomers - newCustomers;
  
  const totalOrders = customers.reduce((sum, c) => sum + c.orderCount, 0);
  const averageOrdersPerCustomer = totalCustomers > 0 ? totalOrders / totalCustomers : 0;
  
  const retentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

  return {
    newCustomers,
    returningCustomers,
    averageOrdersPerCustomer,
    retentionRate
  };
}

async function getSalesPerformance(query: any) {
  // Average sale value
  const avgSaleValue = await sale.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        average: { $avg: '$total' }
      }
    }
  ]);

  // Peak hour
  const peakHour = await sale.aggregate([
    { $match: query },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  // Best day
  const bestDay = await sale.aggregate([
    { $match: query },
    {
      $group: {
        _id: { $dayOfWeek: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return {
    averageSaleValue: avgSaleValue[0]?.average || 0,
    conversionRate: 0, // Would need visitor data for this
    peakHour: peakHour[0]?._id || 0,
    bestDay: bestDay[0] ? days[bestDay[0]._id] : 'N/A'
  };
}

async function getProductInsights() {
  const products = await Product.find();
  
  const categories = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  const lowStockCount = products.filter(
  (p) => (p.warehouseStock ?? 0) > 0 && (p.warehouseStock ?? 0) <= 5
).length;

  const outOfStockCount = products.filter(p => p.warehouseStock === 0).length;

  // Calculate average profit margin (would need cost data)
  const averageProfitMargin = 25; // Placeholder

  return {
    topCategory: categories[0]?._id || 'N/A',
    lowStockCount,
    outOfStockCount,
    averageProfitMargin
  };
}