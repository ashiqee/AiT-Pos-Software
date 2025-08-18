import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ReportSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalDiscount: number;
  totalTax: number;
  overallProfitMargin: number;
  averageDailyProfit: number;
  totalSales: number;
}

interface ProductProfit {
  sku: string;
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
}

interface PeriodProfit {
  date: any;
  period: string;
  startDate: string;
  endDate: string;
  revenue: number;
  cost: number;
  profit: number;
  sku:string;
  discount: number;
  tax: number;
}

interface SalesReport {
  summary: ReportSummary;
  productProfits: ProductProfit[];
  dailyProfits: PeriodProfit[];
  weeklyProfits: PeriodProfit[];
  monthlyProfits: PeriodProfit[];
}

export function useSalesReport() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const query = new URLSearchParams();
      query.append('period', period);
      
      if (period === 'custom' && startDate && endDate) {
        query.append('startDate', startDate);
        query.append('endDate', endDate);
      }
      
      const response = await fetch(`/api/reports/sales?${query.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: SalesReport = await response.json();
      setReport(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sales report';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching sales report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom' || (startDate && endDate)) {
      fetchReport();
    }
  }, [period, startDate, endDate]);

  return {
    report,
    isLoading,
    error,
    period,
    setPeriod,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    fetchReport
  };
}