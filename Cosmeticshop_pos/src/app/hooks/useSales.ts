import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Sale {
  _id: string;
  items: any[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  customer: {
    customerName: string;
    customerMobile: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface SaleSummary {
  totalRevenue: number;
  totalItemsSold: number;
  todayRevenue: number;
  totalCustomers: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SalesResponse {
  summary: SaleSummary;
  sales: Sale[];
  pagination: PaginationInfo;
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SaleSummary | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSales = async (
    search = "",
    dateFilterValue: string | null = null,
    paymentFilterValue: string | null = null,
    page = 1
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (dateFilterValue) query.append("date", dateFilterValue);
      if (paymentFilterValue) query.append("payment", paymentFilterValue);
      query.append("page", page.toString());
      query.append("limit", "10");

      const response = await fetch(`/api/sales?${query.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: SalesResponse = await response.json();
      setSales(data.sales);
      setSummary(data.summary);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch sales";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Failed to fetch sales:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSales(searchTerm, dateFilter, paymentFilter, 1);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, dateFilter, paymentFilter]);

  const goToPage = (page: number) => {
    fetchSales(searchTerm, dateFilter, paymentFilter, page);
  };

  const nextPage = () => {
    if (pagination && pagination.hasNext) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (pagination && pagination.hasPrev) {
      goToPage(currentPage - 1);
    }
  };

  const refreshSales = () => fetchSales(searchTerm, dateFilter, paymentFilter, currentPage);

  return {
    sales,
    summary,
    pagination,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    paymentFilter,
    setPaymentFilter,
    currentPage,
    goToPage,
    nextPage,
    prevPage,
    refreshSales,
  };
}