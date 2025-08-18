'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Badge } from '@heroui/badge';
import { Button } from '@heroui/button';
import { Select, SelectItem } from '@heroui/select';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  CreditCard,
  Calendar,
  RefreshCw,
  Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAnalytics } from '@/app/hooks/useAnalytics';
import ViewSaleDetailsModal from '../_compononents/_products/_modals/ViewSaleDetailsModal';


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsDashboard() {
  const {
    analytics,
    isLoading,
    error,
    period,
    setPeriod,
    refreshAnalytics
  } = useAnalytics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div >
        <Card>
          <CardBody className="text-center text-red-600">
            {error}
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className=" space-y-6">
      {/* Header */}
      
<div className="flex md:flex-row flex-col gap-4 justify-between md:items-center">
        <div>
          <h1 className=" text-xl md:text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">Business performance insights and trends</p>
        </div>
        <div className="flex gap-3">
           <Select
              label="Time Period"
              selectedKeys={[period]}
              onSelectionChange={(keys) => setPeriod(Array.from(keys)[0] as string)}
              className="w-40 lg:w-48"
              size='sm'
            >
              <SelectItem key="day" textValue="day">Today</SelectItem>
              <SelectItem key="week" textValue="week">This Week</SelectItem>
              <SelectItem key="month" textValue="month">This Month</SelectItem>
              <SelectItem key="year" textValue="year">This Year</SelectItem>
              {/* <SelectItem key="custom" textValue="custom">Custom Range</SelectItem> */}
            </Select>
            
          <Button
            color="primary"
            variant="flat"
            startContent={<RefreshCw size={16} />}
            onPress={refreshAnalytics}
          >
            Refresh
          </Button>
        </div>
      </div>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <DollarSign size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-xl font-bold">{formatCurrency(analytics?.summary.totalRevenue)}</p>
                <p className="text-xs text-green-600">
                  +{formatPercent(analytics?.summary.revenueGrowth)} from last period
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Profit</p>
                <p className="text-xl font-bold">{formatCurrency(analytics.summary.totalProfit)}</p>
                <p className="text-xs text-green-600">
                  +{formatPercent(analytics.summary.profitGrowth)} from last period
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <Package size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Items Sold</p>
                <p className="text-xl font-bold">{analytics.summary.totalItemsSold.toLocaleString()}</p>
                <p className="text-xs text-green-600">
                  +{formatPercent(analytics.summary.itemsGrowth)} from last period
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <Users size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Customers</p>
                <p className="text-xl font-bold">{analytics.summary.totalCustomers}</p>
                <p className="text-xs text-green-600">
                  +{formatPercent(analytics.summary.customersGrowth)} from last period
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Sales Trend</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Payment Methods Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Payment Methods</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.paymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {analytics.paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Products and Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Top Products by Revenue</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Recent Sales</h3>
          </CardHeader>
          <CardBody>
            <Table aria-label="Recent sales table">
              <TableHeader>
                <TableColumn>RECEIPT #</TableColumn>
                <TableColumn>CUSTOMER</TableColumn>
                <TableColumn>DATE</TableColumn>
                <TableColumn>TOTAL</TableColumn>
                <TableColumn>STATUS</TableColumn>
               
              </TableHeader>
              <TableBody>
                {analytics.recentSales.map((sale) => (
                  <TableRow key={sale._id}>
                    <TableCell>
                      <div className="font-mono text-sm">
                        #{sale._id.toString().slice(-6)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sale.customer.customerName}</div>
                        {sale.customer.customerMobile && (
                          <div className="text-sm text-gray-500">
                            {sale.customer.customerMobile}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(sale.total)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        color={sale.paymentStatus === 'Paid' ? 'success' : 'warning'}
                        variant="flat"
                      >
                        {sale.paymentStatus}
                      </Badge>
                    </TableCell>
                   
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Insights */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Customer Insights</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">New Customers</span>
                <span className="font-medium">{analytics.customerInsights.newCustomers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Returning Customers</span>
                <span className="font-medium">{analytics.customerInsights.returningCustomers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Avg. Orders/Customer</span>
                <span className="font-medium">{analytics.customerInsights.averageOrdersPerCustomer.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Customer Retention</span>
                <span className="font-medium">{formatPercent(analytics.customerInsights.retentionRate)}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Sales Performance */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Sales Performance</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Avg. Sale Value</span>
                <span className="font-medium">{formatCurrency(analytics.salesPerformance.averageSaleValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Conversion Rate</span>
                <span className="font-medium">{formatPercent(analytics.salesPerformance.conversionRate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Peak Hour</span>
                <span className="font-medium">{analytics.salesPerformance.peakHour}:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Best Day</span>
                <span className="font-medium">{analytics.salesPerformance.bestDay}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Product Insights */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Product Insights</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Top Category</span>
                <span className="font-medium">{analytics.productInsights.topCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Low Stock Items</span>
                <span className="font-medium">{analytics.productInsights.lowStockCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Out of Stock</span>
                <span className="font-medium">{analytics.productInsights.outOfStockCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Avg. Profit Margin</span>
                <span className="font-medium">{formatPercent(analytics.productInsights.averageProfitMargin)}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}