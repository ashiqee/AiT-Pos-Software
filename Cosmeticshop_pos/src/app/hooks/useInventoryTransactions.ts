// hooks/useInventoryTransactions.ts
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface StockTransfer {
  unitCost: number;
  _id: string;
  product: {
    batches: any;
    _id: string;
    name: string;
    sku: string;
    imageUrl?: string;
  };
  fromLocation: 'warehouse' | 'shop';
  toLocation: 'warehouse' | 'shop';
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  reference: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  user?: {
    name: string;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function useInventoryTransactions() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch transfers
  const fetchTransfers = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/inventory/transfers?page=${page}&limit=10`);
      if (!response.ok) throw new Error('Failed to fetch transfers');
      
      const data = await response.json();
      setTransfers(data.transfers);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (error) {
      toast.error('Failed to fetch transfers');
      console.error('Error fetching transfers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new transfer
  const createTransfer = async (transferData: any) => {
    try {
      const response = await fetch('/api/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      });
      
      if (!response.ok) throw new Error('Failed to create transfer');
      
      await fetchTransfers(currentPage);
    } catch (error) {
      throw error;
    }
  };

  // Complete transfer
  const completeTransfer = async (transferId: string) => {
    try {
      const response = await fetch(`/api/inventory/transfers/${transferId}/complete`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to complete transfer');
      
      await fetchTransfers(currentPage);
    } catch (error) {
      throw error;
    }
  };

  // Cancel transfer
  const cancelTransfer = async (transferId: string) => {
    try {
      const response = await fetch(`/api/inventory/transfers/${transferId}/cancel`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to cancel transfer');
      
      await fetchTransfers(currentPage);
    } catch (error) {
      throw error;
    }
  };

  // Pagination functions
  const goToPage = (page: number) => {
    fetchTransfers(page);
  };

  const nextPage = () => {
    if (pagination?.hasNext) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (pagination?.hasPrev) {
      goToPage(currentPage - 1);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  return {
    transfers,
    isLoading,
    pagination,
    currentPage,
    createTransfer,
    completeTransfer,
    cancelTransfer,
    goToPage,
    nextPage,
    prevPage
  };
}