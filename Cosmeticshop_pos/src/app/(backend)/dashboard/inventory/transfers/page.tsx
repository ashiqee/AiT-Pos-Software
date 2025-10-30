'use client';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Input } from '@heroui/input';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Badge } from '@heroui/badge';
import { toast } from 'sonner';
import Select, { 
  components, 
  ControlProps, 
  MenuProps, 
  OptionProps, 
  SingleValueProps,
  StylesConfig,
  GroupBase,
  ClearIndicatorProps,
  DropdownIndicatorProps,
  
} from 'react-select';
import { 
  ArrowRightLeft, 
  Package, 
  Search, 
  Filter, 
  Calendar,
  Warehouse,
  Store,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X
} from 'lucide-react';

import { useInventoryTransactions } from '@/app/hooks/useInventoryTransactions';
import { Pagination } from '@heroui/react';
import { useAllProducts } from '@/app/hooks/useAllProduct';
import CreateTransferModal, { selectStyles } from '@/app/(backend)/_compononents/_inventory/CreateTransferModal';


// Custom option with highlighted search text
const highlightText = (text: string, highlight: string) => {
  if (!highlight) return text;
  
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, index) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 px-1 rounded">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};

// Enhanced Option with highlighted search
const HighlightedOption = ({ children, ...props }: OptionProps<any, false, GroupBase<any>>) => {
  const product = props.data as any;
  const inputValue = props.selectProps.inputValue || '';
  
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.label}
              className="w-8 h-8 rounded object-cover"
            />
          ) : (
            <Package size={16} className="text-gray-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {highlightText(product.label, inputValue)}
          </div>
          <div className="text-xs text-gray-500 truncate">
            SKU: {highlightText(product.sku, inputValue)}
          </div>
          {product.description && (
            <div className="text-xs text-gray-400 truncate">
              {highlightText(product.description, inputValue)}
            </div>
          )}
        </div>
      </div>
    </components.Option>
  );
};

interface StockTransfer {
  _id: string;
  product: {
    _id: string;
    name: string;
    sku: string;
    imageUrl?: string;
    description?: string;
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



interface ProductOption {
  value: string;
  label: string;
  sku: string;
  imageUrl?: string;
  description?: string;
  searchTerms: string; // Combined search terms for better filtering
}

export default function StockTransfersPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { products  } = useAllProducts();
  const { 
    transfers, 
    isLoading, 
    createTransfer, 
    completeTransfer, 
    cancelTransfer,
    pagination,
    currentPage,
    goToPage,
    nextPage,
    prevPage
  } = useInventoryTransactions();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  

  // Convert products to select options with enhanced search terms
  const productOptions: ProductOption[] = products.map(product => ({
    value: product._id,
    label: product.name,
    sku: product.sku,
    imageUrl: product.imageUrl,
    description: product.description,
    searchTerms: `${product.name} ${product.sku} ${product.description || ''}`.toLowerCase()
  }));

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Location options
  const locationOptions = [
    { value: 'all', label: 'All Locations' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'shop', label: 'Shop' }
  ];

  // Filter transfers
  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = transfer.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
    const matchesLocation = locationFilter === 'all' || 
                           transfer.fromLocation === locationFilter || 
                           transfer.toLocation === locationFilter;
    
    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Handle form submission
// Custom Control Component with search
const Control = ({ children, ...props }: ControlProps<any, false, GroupBase<any>>) => (
  <components.Control {...props}>
    {children}
  </components.Control>
);

  // Handle transfer actions
  const handleCompleteTransfer = async (transferId: string) => {
    try {
      await completeTransfer(transferId);
      toast.success('Transfer completed successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete transfer');
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    try {
      await cancelTransfer(transferId);
      toast.success('Transfer cancelled successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel transfer');
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'warning',
      completed: 'success',
      cancelled: 'danger'
    } as const;

    const icons = {
      pending: <Clock size={14} />,
      completed: <CheckCircle size={14} />,
      cancelled: <XCircle size={14} />
    };

    return (
      <Badge color={variants[status as keyof typeof variants]} variant="flat">
        <div className="flex items-center gap-1">
          {icons[status as keyof typeof icons]}
          <span className="capitalize">{status}</span>
        </div>
      </Badge>
    );
  };

  // Get location icon
  const getLocationIcon = (location: string) => {
    return location === 'warehouse' ? <Warehouse size={16} /> : <Store size={16} />;
  };

  // Custom filter option for react-select
  const filterOption = (option: any, inputValue: string) => {
    const product = option.data as ProductOption;
    const searchLower = inputValue.toLowerCase();
    
    return product.searchTerms.includes(searchLower);
  };

  // Custom no options message
  const noOptionsMessage = ({ inputValue }: { inputValue: string }) => {
    return inputValue ? `No products found for "${inputValue}"` : 'No products available';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Stock Transfers</h1>
          <p className="text-gray-600">Manage stock transfers between locations</p>
        </div>
         <CreateTransferModal/>
        
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Transfers</p>
                <p className="text-2xl font-bold">{transfers.length}</p>
              </div>
              <ArrowRightLeft className="text-blue-500" size={24} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">
                  {transfers.filter(t => t.status === 'pending').length}
                </p>
              </div>
              <Clock className="text-yellow-500" size={24} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold">
                  {transfers.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cancelled</p>
                <p className="text-2xl font-bold">
                  {transfers.filter(t => t.status === 'cancelled').length}
                </p>
              </div>
              <XCircle className="text-red-500" size={24} />
            </div>
          </CardBody>
        </Card>
      </div>

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
                <Select
                  options={statusOptions}
                  value={statusOptions.find(option => option.value === statusFilter)}
                  onChange={(selectedOption) => setStatusFilter(selectedOption?.value || 'all')}
                  placeholder="Filter by status"
                  styles={selectStyles}
                  components={{ Control }}
                  isClearable
                />
              </div>

              <div className="min-w-[200px]">
                <Select
                  options={locationOptions}
                  value={locationOptions.find(option => option.value === locationFilter)}
                  onChange={(selectedOption) => setLocationFilter(selectedOption?.value || 'all')}
                  placeholder="Filter by location"
                  styles={selectStyles}
                  components={{ Control }}
                  isClearable
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Transfers Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Recent Transfers</h2>
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
                <TableColumn>QUANTITY</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>DATE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((transfer) => (
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
                      {getStatusBadge(transfer.status)}
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
                        
                        {transfer.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              color="success"
                              variant="flat"
                              onPress={() => handleCompleteTransfer(transfer._id)}
                            >
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              color="danger"
                              variant="flat"
                              onPress={() => handleCancelTransfer(transfer._id)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            total={pagination.totalPages}
            page={currentPage}
            onChange={goToPage}
          />
        </div>
      )}

     {/* ------------------------- */}
    

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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="font-semibold mt-1">{selectedTransfer.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedTransfer.status)}</div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Reference</p>
                  <p className="font-mono text-sm mt-1">{selectedTransfer.reference}</p>
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
                  {selectedTransfer.completedAt && (
                    <div>
                      <p className="text-sm text-gray-500">Completed</p>
                      <p className="text-sm mt-1">
                        {new Date(selectedTransfer.completedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {selectedTransfer.user && (
                  <div>
                    <p className="text-sm text-gray-500">Created By</p>
                    <p className="text-sm mt-1">{selectedTransfer.user.name}</p>
                  </div>
                )}
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
  );
}