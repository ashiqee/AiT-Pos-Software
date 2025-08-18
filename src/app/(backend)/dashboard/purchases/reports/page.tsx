'use client';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Input } from '@heroui/input';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Badge } from '@heroui/badge';
import { Select, SelectItem } from '@heroui/select';
import { Calendar, Search, Eye, Package, DollarSign, User, TrendingUp, Download } from 'lucide-react';
import { usePurchases } from '@/app/hooks/usePurchases';
import ViewPurchaseDetailsModal from '@/app/(backend)/_compononents/_products/_modals/ViewPurchaseDetailsModal';


interface Purchase {
  _id: string;
  product: {
    _id: string;
    name: string;
    sku: string;
    category: { name: string };
  };
  batches: Array<{
    purchaseDate: string;
    quantity: number;
    unitCost: number;
    supplier: string;
    batchNumber: string;
  }>;
  totalQuantity: number;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
}

export default function PurchasesReportPage() {
  const {
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
    refreshPurchases
  } = usePurchases();

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

  const exportToCSV = () => {
    const headers = ['Product', 'SKU', 'Category', 'Supplier', 'Date', 'Quantity', 'Unit Cost', 'Total Cost'];
    const csvContent = [
      headers.join(','),
      ...purchases.map(purchase => [
        purchase.product.name,
        purchase.product.sku,
        purchase.product.category.name,
        purchase.batches[0]?.supplier || 'N/A',
        formatDate(purchase.createdAt),
        purchase.totalQuantity,
        purchase.totalCost / purchase.totalQuantity,
        purchase.totalCost
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `purchases_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

// Create the supplier options array
const supplierOptions = [
  { name: 'all', displayName: 'All Suppliers' },
  ...(summary?.topSuppliers || [])
];


  return (
    <div>
      {/* Header Section */}
      <div className="flex flex-col  md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div >
          <h1 className="2xl:text-2xl  text-xl font-bold">Purchases Report</h1>
          <p className="text-gray-600">Track inventory purchases and supplier performance</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3  ">
          <Button 
            color="primary" 
            variant="flat"
            startContent={<Download size={16} />}
            onPress={exportToCSV}
          >
            Export CSV
          </Button>
          <Button 
            color="primary" 
            startContent={<TrendingUp size={16} />}
            onPress={refreshPurchases}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Purchases</p>
                <p className="text-xl font-bold">{summary?.totalPurchases || 0}</p>
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
                <p className="text-sm text-gray-500">Items Purchased</p>
                <p className="text-xl font-bold">{summary?.totalItemsPurchased || 0}</p>
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
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-xl font-bold">
                  {formatCurrency(summary?.totalSpent || 0)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <Calendar size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-xl font-bold">
                  {formatCurrency(summary?.thisMonthSpent || 0)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Top Suppliers Card */}
      {summary?.topSuppliers && summary.topSuppliers.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Top Suppliers</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {summary.topSuppliers.map((supplier, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{supplier.name}</h4>
                    <Badge color="primary" variant="flat">
                      #{index + 1}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount:</span>
                      <span className="font-medium">{formatCurrency(supplier.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Purchases:</span>
                      <span className="font-medium">{supplier.purchases}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <Input
              placeholder="Search by product name or SKU..."
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
                <SelectItem key="all" textValue="all">All Time</SelectItem>
              </Select>
<Select
  placeholder="Supplier"
  selectedKeys={supplierFilter ? [supplierFilter] : []}
  onSelectionChange={(keys) => setSupplierFilter(Array.from(keys)[0] as string)}
  className="w-full lg:w-48 capitalize"
  items={supplierOptions}
>
  {(supplier) => (
    <SelectItem key={supplier.name} textValue={supplier.name}>
      {supplier.name}
    </SelectItem>
  )}
</Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Purchases Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Purchase Records</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="text-center py-8">Loading purchase records...</div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No purchases found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or check back later
              </p>
            </div>
          ) : (
            <>
              <Table aria-label="Purchases table">
                <TableHeader>
                  <TableColumn>PRODUCT</TableColumn>
                  <TableColumn>SUPPLIER</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>QTY</TableColumn>
                  <TableColumn>UNIT COST</TableColumn>
                  <TableColumn>TOTAL COST</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{purchase.product.name}</div>
                          <div className="text-sm text-gray-500">
                            SKU: {purchase.product.sku}
                          </div>
                          <div className="text-xs text-gray-500">
                            {purchase.product.category.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {purchase.batches[0]?.supplier || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(purchase.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {purchase.totalQuantity}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatCurrency(purchase.totalCost / purchase.totalQuantity)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(purchase.totalCost)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ViewPurchaseDetailsModal purchase={purchase} />
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