'use client';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Badge } from '@heroui/badge';
import { Calendar, TrendingUp, DollarSign, Package, Download, RefreshCw } from 'lucide-react';
import { useSalesReport } from '@/app/hooks/useSalesReport';


export default function SalesReportPage() {
  const {
    report,
    isLoading,
    error,
    period,
    setPeriod,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    fetchReport
  } = useSalesReport();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT'
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value?.toFixed(1)}%`;
  };

  const exportToCSV = () => {
    if (!report) return;
    
    const headers = ['Period', 'Revenue', 'Cost', 'Profit', 'Profit Margin', 'Discount', 'Tax'];
    const csvContent = [
      headers.join(','),
      ...report.dailyProfits.map(day => [
        day.date,
        day.revenue,
        day.cost,
        day.profit,
        `${((day.profit / day.revenue) * 100)?.toFixed(1)}%`,
        day.discount,
        day.tax
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sales Report</h1>
          <p className="text-gray-600">Analyze sales performance and profitability</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button 
            color="primary" 
            variant="flat"
            startContent={<Download size={16} />}
            onPress={exportToCSV}
            isDisabled={!report}
          >
            Export CSV
          </Button>
          <Button 
            color="primary" 
            startContent={<RefreshCw size={16} />}
            onPress={fetchReport}
            isLoading={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <Select
              label="Time Period"
              selectedKeys={[period]}
              onSelectionChange={(keys) => setPeriod(Array.from(keys)[0] as string)}
              className="w-full lg:w-48"
            >
              <SelectItem key="day" textValue="day">Today</SelectItem>
              <SelectItem key="week" textValue="week">This Week</SelectItem>
              <SelectItem key="month" textValue="month">This Month</SelectItem>
              <SelectItem key="year" textValue="year">This Year</SelectItem>
              <SelectItem key="custom" textValue="custom">Custom Range</SelectItem>
            </Select>
            
            {period === 'custom' && (
              <>
                <Input
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onValueChange={setStartDate}
                  className="w-full lg:w-48"
                />
                <Input
                  type="date"
                  label="End Date"
                  value={endDate}
                  onValueChange={setEndDate}
                  className="w-full lg:w-48"
                />
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardBody className="p-4">
            <div className="text-red-700">{error}</div>
          </CardBody>
        </Card>
      )}

      {isLoading ? (
        <Card className="mb-6">
          <CardBody className="p-8 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-2 text-gray-600">Generating report...</p>
          </CardBody>
        </Card>
      ) : report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardBody className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <DollarSign size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-xl font-bold">{formatCurrency(report.summary.totalRevenue)}</p>
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
                    <p className="text-xl font-bold">{formatCurrency(report.summary.totalProfit)}</p>
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
                    <p className="text-sm text-gray-500">Profit Margin</p>
                    <p className="text-xl font-bold">{formatPercent(report.summary.overallProfitMargin)}</p>
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
                    <p className="text-sm text-gray-500">Avg. Daily Profit</p>
                    <p className="text-xl font-bold">{formatCurrency(report.summary.averageDailyProfit)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Product Profits Table */}
          <Card className="mb-6">
            <CardHeader>
              <h3 className="text-lg font-semibold">Product Profitability</h3>
            </CardHeader>
            <CardBody>
              <Table aria-label="Product profits table">
                <TableHeader>
                  <TableColumn>PRODUCT</TableColumn>
                  <TableColumn className="text-right">QTY SOLD</TableColumn>
                  <TableColumn className="text-right">REVENUE</TableColumn>
                  <TableColumn className="text-right">COST</TableColumn>
                  <TableColumn className="text-right">PROFIT</TableColumn>
                  <TableColumn className="text-right">MARGIN</TableColumn>
                </TableHeader>
                <TableBody>
                  {report.productProfits.slice(0, 10).map((product, index) => (
                    <TableRow key={product.productId}>
                      <TableCell>
                        <div className="font-medium">
                            <p>
                                {product.productName}
                            </p>

                            <span className='text-xs'>
                                {product.sku}
                            </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{product.quantitySold}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.cost)}</TableCell>
                      <TableCell className={`text-right font-medium ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(product.profit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          color={product.profitMargin >= 20 ? 'success' : product.profitMargin >= 10 ? 'warning' : 'danger'}
                          variant="flat"
                        >
                          {formatPercent(product.profitMargin)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>

          {/* Period Profits */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">
                {period === 'day' ? 'Daily' : 
                 period === 'week' ? 'Weekly' : 
                 period === 'month' ? 'Monthly' : 'Custom'} Profits
              </h3>
            </CardHeader>
            <CardBody>
              <Table aria-label="Period profits table">
                <TableHeader>
                  <TableColumn>PERIOD</TableColumn>
                  <TableColumn className="text-right">REVENUE</TableColumn>
                  <TableColumn className="text-right">COST</TableColumn>
                  <TableColumn className="text-right">PROFIT</TableColumn>
                  <TableColumn className="text-right">MARGIN</TableColumn>
                </TableHeader>
                <TableBody>
                  {(period === 'day' ? report.dailyProfits : 
                    period === 'week' ? report.weeklyProfits : 
                    report.monthlyProfits).map((periodData, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {period === 'day' ? periodData.date : 
                         `${periodData.startDate} - ${periodData.endDate}`}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(periodData.revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(periodData.cost)}</TableCell>
                      <TableCell className={`text-right font-medium ${periodData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(periodData.profit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          color={periodData.revenue > 0 && (periodData.profit / periodData.revenue) >= 0.2 ? 'success' : 
                               periodData.revenue > 0 && (periodData.profit / periodData.revenue) >= 0.1 ? 'warning' : 'danger'}
                          variant="flat"
                        >
                          {periodData.revenue > 0 ? formatPercent((periodData.profit / periodData.revenue) * 100) : '0%'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}