// hooks/usePurchases.ts
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Purchase {
  totalCost: any;
  totalQuantity: any;
  batches: any;
  product: any;
  _id: string;
  items: Array<{
    product: {
      _id: string;
      name: string;
      sku: string;
      category: { name: string };
    };
    quantity: number;
    unitCost: number;
    supplier: string;
    batchNumber: string;
    location: 'warehouse' | 'shop'; // Add location field
    purchaseDate: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  invoiceNumber: string;
  notes: string;
  user: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PurchaseSummary {
  totalPurchases: number;
  totalItemsPurchased: number;
  totalSpent: number;
  thisMonthSpent: number;
  topSuppliers: Array<{
    name: string;
    amount: number;
    purchases: number;
  }>;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PurchasesResponse {
  summary: PurchaseSummary;
  purchases: Purchase[];
  pagination: PaginationInfo;
}

export function usePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [summary, setSummary] = useState<PurchaseSummary | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPurchases = async (
    search = "",
    dateFilterValue: string | null = null,
    supplierFilterValue: string | null = null,
    page = 1
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (dateFilterValue) query.append("date", dateFilterValue);
      if (supplierFilterValue) query.append("supplier", supplierFilterValue);
      query.append("page", page.toString());
      query.append("limit", "10");

      const response = await fetch(`/api/purchases?${query.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: PurchasesResponse = await response.json();
      setPurchases(data.purchases);
      setSummary(data.summary);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch purchases";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Failed to fetch purchases:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPurchases(searchTerm, dateFilter, supplierFilter, 1);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, dateFilter, supplierFilter]);

  const goToPage = (page: number) => {
    fetchPurchases(searchTerm, dateFilter, supplierFilter, page);
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

  const refreshPurchases = () => fetchPurchases(searchTerm, dateFilter, supplierFilter, currentPage);

  return {
    purchases,
    summary,
    pagination,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    supplierFilter,
    setSupplierFilter,
    currentPage,
    goToPage,
    nextPage,
    prevPage,
    refreshPurchases,
  };
}