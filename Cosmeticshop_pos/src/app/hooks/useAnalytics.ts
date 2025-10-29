import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface AnalyticsSummary {
  totalRevenue: number;
  totalProfit: number;
  totalItemsSold: number;
  totalCustomers: number;
  revenueGrowth: number;
  profitGrowth: number;
  itemsGrowth: number;
  customersGrowth: number;
}

interface SalesTrend {
  date: string;
  revenue: number;
}

interface PaymentMethod {
  name: string;
  total: number;
}

interface TopProduct {
  name: string;
  revenue: number;
}

interface RecentSale {
  _id: string;
  customer: {
    customerName: string;
    customerMobile: string;
  };
  total: number;
  createdAt: string;
  paymentStatus: string;
}

interface CustomerInsights {
  newCustomers: number;
  returningCustomers: number;
  averageOrdersPerCustomer: number;
  retentionRate: number;
}

interface SalesPerformance {
  averageSaleValue: number;
  conversionRate: number;
  peakHour: number;
  bestDay: string;
}

interface ProductInsights {
  topCategory: string;
  lowStockCount: number;
  outOfStockCount: number;
  averageProfitMargin: number;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  salesTrend: SalesTrend[];
  paymentMethods: PaymentMethod[];
  topProducts: TopProduct[];
  recentSales: RecentSale[];
  customerInsights: CustomerInsights;
  salesPerformance: SalesPerformance;
  productInsights: ProductInsights;
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/analytics?period=${period}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: AnalyticsData = await response.json();
      setAnalytics(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const refreshAnalytics = () => fetchAnalytics();

  return {
    analytics,
    isLoading,
    error,
    period,
    setPeriod,
    refreshAnalytics
  };
}