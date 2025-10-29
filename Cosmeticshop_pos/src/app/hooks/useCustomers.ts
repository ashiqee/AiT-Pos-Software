import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CustomerPurchase {
  _id: string;
  items: Array<{
    product: {
      _id: string;
      name: string;
      sku: string;
      imageUrl: string;
    };
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  dueAmount: number;
  paymentStatus: string;
  createdAt: string;
  user: {
    name: string;
  };
}

interface Customer {
  customerName: string;
  customerMobile: string;
  totalDue: number;
  totalPurchases: number;
  totalSpent: number;
  lastPurchase: string;
  purchases: CustomerPurchase[];
}

interface CustomerSummary {
  totalCustomers: number;
  customersWithDue: number;
  totalDueAmount: number;
  averageDue: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CustomersResponse {
  customers: Customer[];
  summary: CustomerSummary;
  pagination: PaginationInfo;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, due, paid
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCustomers = async (
    search = '',
    status = 'all',
    page = 1
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (status !== 'all') query.append('status', status);
      query.append('page', page.toString());
      query.append('limit', '10');

      const response = await fetch(`/api/customers?${query.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: CustomersResponse = await response.json();
      setCustomers(data.customers);
      setSummary(data.summary);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(searchTerm, statusFilter, 1);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomers(searchTerm, statusFilter, 1);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const goToPage = (page: number) => {
    fetchCustomers(searchTerm, statusFilter, page);
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

  const refreshCustomers = () => fetchCustomers(searchTerm, statusFilter, currentPage);

  return {
    customers,
    summary,
    pagination,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    goToPage,
    nextPage,
    prevPage,
    refreshCustomers
  };
}