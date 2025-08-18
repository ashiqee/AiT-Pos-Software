'use client';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Input } from '@heroui/input';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Badge } from '@heroui/badge';
import { Select, SelectItem } from '@heroui/select';
import { Calendar, Search, Eye, Package, DollarSign, User, Plus } from 'lucide-react';

import { useSales } from '@/app/hooks/useSales';
import ViewSaleDetailsModal from '../../_compononents/_products/_modals/ViewSaleDetailsModal';
import { useRouter } from 'next/navigation';


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

export default function SalesPage() {
  const {
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
    refreshSales
  } = useSales();
  const router = useRouter()


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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sales Management</h1>
          <p className="text-gray-600">View and manage sales transactions</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button 
            color="primary" 
            startContent={<Plus size={16} />}
           
            onPress={()=>router.push('/pos')}
          >
            New Sale
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <DollarSign size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-xl font-bold">
                  {formatCurrency(summary?.totalRevenue || 0)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Package size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Items Sold</p>
                <p className="text-xl font-bold">{summary?.totalItemsSold || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <Calendar size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Today's Sales</p>
                <p className="text-xl font-bold">
                  {formatCurrency(summary?.todayRevenue || 0)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <User size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Customers</p>
                <p className="text-xl font-bold">{summary?.totalCustomers || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <Input
              placeholder="Search by customer name or receipt ID..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={<Search size={16} />}
              className="w-full lg:w-96"
            />
            
            <div className="flex gap-2">
              <Select
                placeholder="Date Range"
                selectedKeys={dateFilter ? [dateFilter] : []}
                onSelectionChange={(keys) => setDateFilter(Array.from(keys)[0] as string)}
                className="w-full lg:w-48"
              >
                <SelectItem key="today" textValue="today">Today</SelectItem>
                <SelectItem key="week" textValue="week">This Week</SelectItem>
                <SelectItem key="month" textValue="month">This Month</SelectItem>
                <SelectItem key="year" textValue="year">This Year</SelectItem>
              </Select>
              
              <Select
                placeholder="Payment Status"
                selectedKeys={paymentFilter ? [paymentFilter] : []}
                onSelectionChange={(keys) => setPaymentFilter(Array.from(keys)[0] as string)}
                className="w-full lg:w-48"
              >
                <SelectItem key="all" textValue="all">All</SelectItem>
                <SelectItem key="Paid" textValue="Paid">Paid</SelectItem>
                <SelectItem key="Partial" textValue="Partial">Partial</SelectItem>
                <SelectItem key="Unpaid" textValue="Unpaid">Unpaid</SelectItem>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Sales Records</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="text-center py-8">Loading sales records...</div>
          ) : sales?.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sales found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or create a new sale
              </p>
              <div className="mt-6">
                <Button color="primary" href="/dashboard/pos">
                  <Plus size={16} className="mr-1" />
                  New Sale
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table aria-label="Sales table">
                <TableHeader>
                  <TableColumn>RECEIPT #</TableColumn>
                  <TableColumn>CUSTOMER</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>ITEMS</TableColumn>
                  <TableColumn>TOTAL</TableColumn>
                  <TableColumn>PAYMENT</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {sales?.map((sale:any) => (
                    <TableRow key={sale._id}>
                      <TableCell>
                        <div className="font-mono text-sm">
                          #{sale._id.toString().slice(-6)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sale?.customer?.customerName}</div>
                          {sale?.customer?.customerMobile && (
                            <div className="text-sm text-gray-500">
                              {sale?.customer?.customerMobile}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(sale.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {sale?.items?.length} item{sale?.items?.length !== 1 ? 's' : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(sale.total)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          color={
                            sale.paymentMethod === 'cash' ? 'success' : 
                            sale.paymentMethod === 'card' ? 'primary' : 'warning'
                          }
                          variant="flat"
                          className="capitalize"
                        >
                          {sale.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          color={
                            sale.amountPaid >= sale.total ? 'success' : 'warning'
                          }
                          variant="flat"
                        >
                          {sale.amountPaid >= sale.total ? 'Paid' : 'Partial'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ViewSaleDetailsModal sale={sale} />
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