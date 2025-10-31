'use client';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Input } from '@heroui/input';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { toast } from 'sonner';
import { 
  ArrowRightLeft, 
  Package, 
  Search, 
  Filter, 
  Calendar,
  Warehouse,
  Store,
  Eye,
  X,
  DollarSign,
  Calculator
} from 'lucide-react';

import { useInventoryTransactions } from '@/app/hooks/useInventoryTransactions';
import { Pagination } from '@heroui/react';
import { useAllProducts } from '@/app/hooks/useAllProduct';
import CreateTransferModal from '@/app/(backend)/_compononents/_inventory/CreateTransferModal';

interface StockTransfer {
  _id: string;
  product: {
    _id: string;
    name: string;
    sku: string;
    imageUrl?: string;
    description?: string;
    batches: Array<{
      purchaseDate: string;
      quantity: number;
      unitCost: number;
      supplier: string;
      batchNumber: string;
    }>;
  };
  fromLocation: 'warehouse' | 'shop';
  toLocation: 'warehouse' | 'shop';
  quantity: number;
  unitCost: number;
  reference: string;
  notes?: string;
  createdAt: string;
  user?: {
    name: string;
  };
}

export default function StockTransfersPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { products } = useAllProducts();
  const { 
    transfers, 
    isLoading, 
    createTransfer,
    pagination,
    currentPage,
    goToPage,
    nextPage,
    prevPage
  } = useInventoryTransactions();

  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Location options
  const locationOptions = [
    { value: 'all', label: 'All Locations' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'shop', label: 'Shop' }
  ];

  // Date filter options
  const dateFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'lastYear', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Filter transfers
  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = transfer.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === 'all' || 
                           transfer.fromLocation === locationFilter || 
                           transfer.toLocation === locationFilter;
    
    // Apply date filter
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const transferDate = new Date(transfer.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day
      
      switch (dateFilter) {
        case 'today':
          matchesDate = transferDate.toDateString() === today.toDateString();
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          matchesDate = transferDate.toDateString() === yesterday.toDateString();
          break;
        case 'thisWeek':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          matchesDate = transferDate >= startOfWeek;
          break;
        case 'lastWeek':
          const startOfLastWeek = new Date(today);
          startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
          const endOfLastWeek = new Date(today);
          endOfLastWeek.setDate(today.getDate() - today.getDay());
          matchesDate = transferDate >= startOfLastWeek && transferDate < endOfLastWeek;
          break;
        case 'thisMonth':
          matchesDate = transferDate.getMonth() === today.getMonth() && 
                       transferDate.getFullYear() === today.getFullYear();
          break;
        case 'lastMonth':
          const lastMonth = new Date(today);
          lastMonth.setMonth(today.getMonth() - 1);
          matchesDate = transferDate.getMonth() === lastMonth.getMonth() && 
                       transferDate.getFullYear() === lastMonth.getFullYear();
          break;
        case 'thisYear':
          matchesDate = transferDate.getFullYear() === today.getFullYear();
          break;
        case 'lastYear':
          matchesDate = transferDate.getFullYear() === today.getFullYear() - 1;
          break;
      }
    }
    
    return matchesSearch && matchesLocation && matchesDate;
  });

  // Calculate average unit cost from batches
  const calculateAverageUnitCost = (batches: any[]) => {
    if (!batches || batches.length === 0) return 0;
    
    const totalCost = batches.reduce((sum, batch) => sum + (batch.quantity * batch.unitCost), 0);
    const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
    
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  };

  // Calculate statistics
  const totalTransfers = transfers.length;
  const totalItemsTransferred = transfers.reduce((sum, transfer) => sum + transfer.quantity, 0);
  const totalValue = transfers.reduce((sum, transfer) => {
    const avgUnitCost = transfer.product.batches && transfer.product.batches.length > 0
      ? transfer.product.batches.reduce((batchSum: number, batch: { quantity: number; unitCost: number; }) => 
          batchSum + (batch.quantity * batch.unitCost), 0) / 
          transfer.product.batches.reduce((qtySum: any, batch: { quantity: any; }) => qtySum + batch.quantity, 0)
      : transfer.unitCost || 0;
    
    return sum + (transfer.quantity * avgUnitCost);
  }, 0);

  // Handle transfer actions
  const handleCompleteTransfer = async (transferId: string) => {
    try {
      // Implementation would go here if needed
      toast.success('Transfer completed successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete transfer');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT'
    }).format(amount);
  };

  // Get location icon
  const getLocationIcon = (location: string) => {
    return location === 'warehouse' ? <Warehouse size={16} /> : <Store size={16} />;
  };

  // Only show stats if there are transfers
  const hasTransfers = transfers.length > 0;

 return (
     
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Stock Transfers</h1>
          <p className="text-gray-600">Manage stock transfers between locations</p>
        </div>
        <CreateTransferModal />
      </div>

      {/* Stats Cards - Only show if there are transfers */}
      {hasTransfers && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Transfers</p>
                    <p className="text-2xl font-bold">{totalTransfers}</p>
                    <p className="text-xs text-gray-400">{totalItemsTransferred} items</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ArrowRightLeft className="text-blue-600" size={24} />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-sm">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Items</p>
                    <p className="text-2xl font-bold">{totalItemsTransferred}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="text-green-600" size={24} />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border-l-4 border-l-purple-500 shadow-sm">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                    <p className="text-xs text-gray-400">All transfers</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="text-purple-600" size={24} />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="text-blue-600" size={20} />
                  <h3 className="text-lg font-semibold">Transfer Summary</h3>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Items</p>
                  <p className="text-xl font-bold text-blue-700">{totalItemsTransferred}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="text-blue-600" size={16} />
                    <span className="text-sm font-medium">Total Value</span>
                  </div>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(totalValue)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {/* Empty State - Show when no transfers */}
      {!hasTransfers && !isLoading && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardBody className="py-12">
            <div className="text-center">
              <ArrowRightLeft className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Stock Transfers Yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Start transferring stock between warehouse and shop locations. 
                Create your first transfer to see statistics and history here.
              </p>
              <CreateTransferModal />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <Input
              placeholder="Search transfers by product name, SKU, or reference..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={<Search size={16} />}
              className="flex-1"
            />

            <div className="flex flex-col sm:flex-row gap-4 flex-1 lg:flex-initial">
              <div className="min-w-[200px]">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  {dateFilterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-[200px]">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  {locationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            </div>
          </CardBody>
        </Card>
     

      {/* Transfers Table - Only show if there are transfers */}
      {hasTransfers && (
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Transfers</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{filteredTransfers.length} of {totalTransfers} transfers</span>
            </div>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="text-center py-8">Loading transfers...</div>
            ) : filteredTransfers.length === 0 ? (
              <div className="text-center py-8">
                <ArrowRightLeft className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No transfers found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your filters or create a new transfer
                </p>
              </div>
            ) : (
              <Table aria-label="Stock transfers">
                <TableHeader>
                  <TableColumn>PRODUCT</TableColumn>
                  <TableColumn>FROM</TableColumn>
                  <TableColumn>TO</TableColumn>
                  <TableColumn>QTY</TableColumn>
                  <TableColumn>AVG UNIT COST</TableColumn>
                  <TableColumn>TOTAL VALUE</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.map((transfer) => {
                    const avgUnitCost = calculateAverageUnitCost(transfer.product.batches);
                    return (
                      <TableRow key={transfer._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                              {transfer.product.imageUrl ? (
                                <img
                                  src={transfer.product.imageUrl}
                                  alt={transfer.product.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <Package size={20} className="text-gray-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{transfer.product.name}</div>
                              <div className="text-sm text-gray-500">{transfer.product.sku}</div>
                              <div className="flex items-center gap-1 mt-1">
                                <Calculator size={12} className="text-gray-400" />
                                <span className="text-xs text-gray-400">
                                  {transfer.product.batches.length} batches
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getLocationIcon(transfer.fromLocation)}
                            <span className="capitalize">{transfer.fromLocation}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getLocationIcon(transfer.toLocation)}
                            <span className="capitalize">{transfer.toLocation}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{transfer.quantity}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{formatCurrency(avgUnitCost)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{formatCurrency(transfer.quantity * avgUnitCost)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(transfer.createdAt).toLocaleDateString()}</div>
                            <div className="text-gray-500">
                              {new Date(transfer.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="light"
                              startContent={<Eye size={14} />}
                              onPress={() => {
                                setSelectedTransfer(transfer);
                                setIsDetailsOpen(true);
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {/* Pagination - Only show if there are transfers */}
      {hasTransfers && pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            total={pagination.totalPages}
            page={currentPage}
            onChange={goToPage}
          />
        </div>
      )}

      {/* Transfer Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} size="md">
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-bold">Transfer Details</h2>
          </ModalHeader>
          <ModalBody>
            {selectedTransfer && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    {selectedTransfer.product.imageUrl ? (
                      <img
                        src={selectedTransfer.product.imageUrl}
                        alt={selectedTransfer.product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <Package size={24} className="text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedTransfer.product.name}</h3>
                    <p className="text-sm text-gray-500">{selectedTransfer.product.sku}</p>
                    {selectedTransfer.product.description && (
                      <p className="text-xs text-gray-400 mt-1">{selectedTransfer.product.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">From</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getLocationIcon(selectedTransfer.fromLocation)}
                      <span className="capitalize">{selectedTransfer.fromLocation}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">To</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getLocationIcon(selectedTransfer.toLocation)}
                      <span className="capitalize">{selectedTransfer.toLocation}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="font-semibold mt-1">{selectedTransfer.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Unit Cost</p>
                    <p className="font-semibold mt-1">{formatCurrency(selectedTransfer.unitCost)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg Unit Cost</p>
                    <p className="font-semibold mt-1">{formatCurrency(calculateAverageUnitCost(selectedTransfer.product.batches))}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Transfer Value</p>
                    <p className="font-semibold mt-1">{formatCurrency(selectedTransfer.quantity * selectedTransfer.unitCost)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg Total Value</p>
                    <p className="font-semibold mt-1">{formatCurrency(selectedTransfer.quantity * calculateAverageUnitCost(selectedTransfer.product.batches))}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Reference</p>
                  <p className="font-mono text-sm mt-1">{selectedTransfer.reference}</p>
                </div>

                {/* Batches Information */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">Product Batches ({selectedTransfer.product.batches.length})</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedTransfer.product.batches.map((batch, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="flex justify-between">
                          <span className="font-medium">{batch.batchNumber}</span>
                          <span>{formatCurrency(batch.unitCost)}</span>
                        </div>
                        <div className="text-gray-500">
                          Qty: {batch.quantity} | Supplier: {batch.supplier}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTransfer.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="mt-1">{selectedTransfer.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="text-sm mt-1">
                      {new Date(selectedTransfer.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created By</p>
                    <p className="text-sm mt-1">{selectedTransfer.user?.name || 'System'}</p>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onPress={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  
 )
}