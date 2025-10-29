import { dbConnect } from '@/lib/db/dbConnect';
import Product from '@/models/product';
import sale from '@/models/sale';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else if (period) {
      const now = new Date();
      let start: Date;
      
      switch (period) {
        case 'day':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          start = new Date(now);
          start.setDate(now.getDate() - dayOfWeek);
          start.setHours(0, 0, 0, 0);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      dateFilter = { createdAt: { $gte: start } };
    }

    // Fetch all sales with product details
    const sales = await sale.find(dateFilter)
      .populate({
        path: 'items.product',
        model: Product, // Use the imported model
        select: 'name sku cost sellingPrice batches'
      })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Calculate overall profit
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    // Product profit data
    const productProfitMap: { [key: string]: {
      productId: string;
      productName: string;
      sku: string;
      quantitySold: number;
      revenue: number;
      cost: number;
      profit: number;
      profitMargin: number;
    } } = {};

    // Daily profit data
    const dailyProfitMap: { [key: string]: {
      date: string;
      revenue: number;
      cost: number;
      profit: number;
      discount: number;
      tax: number;
    } } = {};

    // Process each sale
    for (const sale of sales) {
      totalRevenue += sale.total;
      totalDiscount += sale.discount;
      totalTax += sale.tax;

      // Process each item in the sale
      for (const item of sale.items) {
        const product = item.product as any;
        
        // Use stored unitCost and profit if available, otherwise calculate
        let itemCost = item.unitCost || 0;
        let itemProfit = item.profit || 0;
        
        // If unitCost not stored, calculate from product batches
        if (!item.unitCost && product.batches && product.batches.length > 0) {
          const totalBatchCost = product.batches.reduce((sum: number, batch: { quantity: number; unitCost: number; }) => sum + (batch.quantity * batch.unitCost), 0);
          const totalBatchQuantity = product.batches.reduce((sum: any, batch: { quantity: any; }) => sum + batch.quantity, 0);
          const averageUnitCost = totalBatchCost / totalBatchQuantity;
          itemCost = averageUnitCost * item.quantity;
          itemProfit = item.total - itemCost;
        }

        totalCost += itemCost;
        totalProfit += itemProfit;

        // Update product profit data
        if (!productProfitMap[product._id]) {
          productProfitMap[product._id] = {
            productId: product._id,
            productName: product.name,
            sku: product.sku,
            quantitySold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            profitMargin: 0
          };
        }

        productProfitMap[product._id].quantitySold += item.quantity;
        productProfitMap[product._id].revenue += item.total;
        productProfitMap[product._id].cost += itemCost;
        productProfitMap[product._id].profit += itemProfit;

        // Calculate profit margin
        if (productProfitMap[product._id].revenue > 0) {
          productProfitMap[product._id].profitMargin = 
            (productProfitMap[product._id].profit / productProfitMap[product._id].revenue) * 100;
        }
      }

      // Group by day
      const dateKey = sale.createdAt.toISOString().split('T')[0];
      if (!dailyProfitMap[dateKey]) {
        dailyProfitMap[dateKey] = {
          date: dateKey,
          revenue: 0,
          cost: 0,
          profit: 0,
          discount: 0,
          tax: 0
        };
      }

      // Calculate cost for the day
      let dayCost = 0;
      for (const item of sale.items) {
        const product = item.product as any;
        
        // Use stored unitCost if available, otherwise calculate
        if (item.unitCost) {
          dayCost += item.unitCost * item.quantity;
        } else if (product.batches && product.batches.length > 0) {
          const totalBatchCost = product.batches.reduce((sum: number, batch: { quantity: number; unitCost: number; }) => sum + (batch.quantity * batch.unitCost), 0);
          const totalBatchQuantity = product.batches.reduce((sum: any, batch: { quantity: any; }) => sum + batch.quantity, 0);
          const averageUnitCost = totalBatchCost / totalBatchQuantity;
          dayCost += averageUnitCost * item.quantity;
        }
      }

      dailyProfitMap[dateKey].revenue += sale.total;
      dailyProfitMap[dateKey].cost += dayCost;
      dailyProfitMap[dateKey].profit += sale.total - dayCost;
      dailyProfitMap[dateKey].discount += sale.discount;
      dailyProfitMap[dateKey].tax += sale.tax;
    }

    // Convert maps to arrays
    const productProfits = Object.values(productProfitMap)
      .sort((a, b) => b.profit - a.profit);

    const dailyProfits = Object.values(dailyProfitMap)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate weekly and monthly aggregates
    const weeklyProfits = aggregateByPeriod(dailyProfits, 'week');
    const monthlyProfits = aggregateByPeriod(dailyProfits, 'month');

    // Calculate overall metrics
    const overallProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageDailyProfit = dailyProfits.length > 0 
      ? totalProfit / dailyProfits.length 
      : 0;

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        totalDiscount,
        totalTax,
        overallProfitMargin,
        averageDailyProfit,
        totalSales: sales.length
      },
      productProfits,
      dailyProfits,
      weeklyProfits,
      monthlyProfits
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    return NextResponse.json(
      { error: 'Failed to generate sales report' },
      { status: 500 }
    );
  }
}

// Helper function to aggregate by period (week or month)
function aggregateByPeriod(dailyData: any[], period: 'week' | 'month') {
  const periodMap: { [key: string]: any } = {};

  for (const day of dailyData) {
    const date = new Date(day.date);
    let key: string;

    if (period === 'week') {
      // Get week number and year
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
      key = `${date.getFullYear()}-W${weekNumber}`;
    } else {
      // Month
      key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    }

    if (!periodMap[key]) {
      periodMap[key] = {
        period: key,
        revenue: 0,
        cost: 0,
        profit: 0,
        discount: 0,
        tax: 0,
        startDate: '',
        endDate: ''
      };

      // Set start and end dates for display
      if (period === 'week') {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        periodMap[key].startDate = startOfWeek.toISOString().split('T')[0];
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        periodMap[key].endDate = endOfWeek.toISOString().split('T')[0];
      } else {
        periodMap[key].startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
        periodMap[key].endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
      }
    }

    periodMap[key].revenue += day.revenue;
    periodMap[key].cost += day.cost;
    periodMap[key].profit += day.profit;
    periodMap[key].discount += day.discount;
    periodMap[key].tax += day.tax;
  }

  return Object.values(periodMap).sort((a, b) => a.period.localeCompare(b.period));
}