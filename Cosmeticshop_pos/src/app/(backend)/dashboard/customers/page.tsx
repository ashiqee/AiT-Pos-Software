'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Input } from '@heroui/input';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Badge } from '@heroui/badge';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Select, SelectItem } from '@heroui/select';
import { 
  Users, 
  Search, 
  Phone, 
  DollarSign, 
  Calendar, 
  Package,
  Eye,
  RefreshCw,
  Filter
} from 'lucide-react';

import Image from 'next/image';
import { useCustomers } from '@/app/hooks/useCustomers';
import CustomerDetailModal from '../../_compononents/_products/_modals/CustomerDetailsModal';

export default function CustomersPage() {
  const {
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
  } = useCustomers();

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

 

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-gray-600">Manage customer accounts and view purchase history</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button 
            color="primary" 
            variant="flat"
            startContent={<RefreshCw size={16} />}
            onPress={refreshCustomers}
            isLoading={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-xl font-bold">{summary?.totalCustomers || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <DollarSign size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Customers with Due</p>
                <p className="text-xl font-bold">{summary?.customersWithDue || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <DollarSign size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Due Amount</p>
                <p className="text-xl font-bold">{formatCurrency(summary?.totalDueAmount || 0)}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <DollarSign size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Due</p>
                <p className="text-xl font-bold">{formatCurrency(summary?.averageDue || 0)}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search by name or mobile..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={<Search size={16} />}
              className="w-full md:w-96"
            />
            
            <div className="flex gap-2">
              <Select
                placeholder="Payment Status"
                selectedKeys={[statusFilter]}
                onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
                className="w-full md:w-48"
              >
                <SelectItem key="all" textValue="all">All Customers</SelectItem>
                <SelectItem key="due" textValue="due">With Due</SelectItem>
                <SelectItem key="paid" textValue="paid">Fully Paid</SelectItem>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardBody className="p-4">
            <div className="text-red-700">{error}</div>
          </CardBody>
        </Card>
      )}

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Customer List</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="text-center py-8">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or check back later
              </p>
            </div>
          ) : (
            <>
              <Table aria-label="Customers table">
                <TableHeader>
                  <TableColumn>CUSTOMER</TableColumn>
                  <TableColumn>CONTACT</TableColumn>
                  <TableColumn>PURCHASES</TableColumn>
                  <TableColumn>TOTAL SPENT</TableColumn>
                  <TableColumn>AMOUNT DUE</TableColumn>
                  <TableColumn>LAST PURCHASE</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {customers.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="font-medium">{customer.customerName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone size={14} className="text-gray-400" />
                          <span>{customer.customerMobile || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{customer.totalPurchases}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(customer.totalSpent)}</div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${customer.totalDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(customer.totalDue)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(customer.lastPurchase)}</div>
                      </TableCell>
                      <TableCell>
                        <CustomerDetailModal customer={customer}/>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <div className="flex items-center gap-2">
                    <Button 
                      isDisabled={!pagination.hasPrev}
                      variant="flat"
                      size="sm"
                      onPress={prevPage}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    <Button 
                      isDisabled={!pagination.hasNext}
                      variant="flat"
                      size="sm"
                      onPress={nextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

    </div>

      );
}

  
    
