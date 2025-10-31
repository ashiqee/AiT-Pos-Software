// app/components/FixDoubleStock.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Input } from '@heroui/input';
import { AlertTriangle, RefreshCw, Download, CheckCircle, Divide, FolderSync,  } from 'lucide-react';
import { toast } from 'sonner';

interface Batch {
  purchaseDate: string;
  quantity: number;
  unitCost: number;
  supplier?: string;
  batchNumber?: string;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  warehouseStock: number; // Current (potentially incorrect) stock
  shopStock: number;
  batches: Batch[];
}

interface FixedProduct {
  _id: string;
  name: string;
  sku: string;
  oldStock: number;
  newStock: number;
  adjustment: number;
  note?: string;
}

export default function FixDoubleStock() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixedProducts, setFixedProducts] = useState<FixedProduct[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper function to calculate total from batches (correct stock)
  const calculateBatchTotal = (batches: Batch[] = []) => {
    return batches.reduce((total, batch) => total + (batch.quantity || 0), 0);
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/inventory/fix-double-stock');
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.products);
        setSelectedProducts(data.products);
      } else {
        toast.error(data.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim() === '') {
      setSelectedProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.sku.toLowerCase().includes(value.toLowerCase()) ||
        product.name.toLowerCase().includes(value.toLowerCase())
      );
      setSelectedProducts(filtered);
    }
  };

  const handleStockChange = (productId: string, newStock: string) => {
    const stockValue = parseInt(newStock) || 0;
    setSelectedProducts(prev => 
      prev.map(p => 
        p._id === productId 
          ? { ...p, warehouseStock: stockValue }
          : p
      )
    );
  };

  const fixDoubleStock = async () => {
    // Filter products that need fixing (where current stock != correct stock)
    const productsToFix = selectedProducts.filter(p => {
      const original = products.find(op => op._id === p._id);
      const correctStock = original ? calculateBatchTotal(original.batches) : 0;
      return p.warehouseStock !== correctStock;
    });

    if (productsToFix.length === 0) {
      toast.error('No products to fix');
      return;
    }

    setIsFixing(true);
    try {
      const updates = productsToFix.map(product => ({
        _id: product._id,
        warehouseStock: product.warehouseStock
      }));

      const response = await fetch('/api/inventory/fix-double-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates, useBatchStock: false }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setFixedProducts(result.fixedProducts);
        setShowResults(true);
        toast.success(`Successfully fixed ${result.success} products`);
        
        if (result.errors.length > 0) {
          console.error('Fix errors:', result.errors);
          toast.warning(`${result.errors.length} products had errors`);
        }
        
        // Refresh the list
        await fetchProducts();
      } else {
        toast.error(result.error || 'Failed to fix stock');
      }
    } catch (error) {
      console.error('Error fixing stock:', error);
      toast.error('Failed to fix stock');
    } finally {
      setIsFixing(false);
    }
  };

  // NEW FUNCTION: Set warehouse stock to match correct stock from batches
  const setCorrectStockToAll = async () => {
    setIsFixing(true);
    try {
      // We only need the product IDs, the API will calculate the correct stock from batches
      const updates = selectedProducts.map(product => ({
        _id: product._id
      }));

      const response = await fetch('/api/inventory/fix-double-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates, useBatchStock: true }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setFixedProducts(result.fixedProducts);
        setShowResults(true);
        toast.success(`Successfully set correct stock for ${result.success} products`);
        
        if (result.errors.length > 0) {
          console.error('Fix errors:', result.errors);
          toast.warning(`${result.errors.length} products had errors`);
        }
        
        // Refresh the list
        await fetchProducts();
      } else {
        toast.error(result.error || 'Failed to set correct stock');
      }
    } catch (error) {
      console.error('Error setting correct stock:', error);
      toast.error('Failed to set correct stock');
    } finally {
      setIsFixing(false);
    }
  };

  const downloadReport = () => {
    const csvContent = `Product ID,SKU,Product Name,Old Stock,New Stock,Adjustment,Note
 ${fixedProducts.map(p => 
  `${p._id},${p.sku},"${p.name}",${p.oldStock},${p.newStock},${p.adjustment},"${p.note || ''}"`
).join('\n')}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_fix_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const csvContent = `_id,warehouseStock
68f6371d7fdfbeaa36da8cfb,36
68f63946b7d7f99f33ee5c26,12
68f63b0c84794121a63820da,12
68f63c4eae25c269a24cccb0,12`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock_fix_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleOpen = () => {
    setShowResults(false);
    setFixedProducts([]);
    onOpen();
    fetchProducts();
  };

  const calculateHalf = (current: number) => {
    return Math.floor(current / 2);
  };

  const applyHalfToAll = () => {
    setSelectedProducts(prev => 
      prev.map(p => {
        const original = products.find(op => op._id === p._id);
        const correctStock = original ? calculateBatchTotal(original.batches) : 0;
        return {
          ...p,
          warehouseStock: calculateHalf(correctStock)
        };
      })
    );
  };

  return (
    <>
      <Button 
        color="warning" 
        variant="flat"
        startContent={<Divide size={16} />}
        onPress={handleOpen}
      >
        Fix Double Stock
      </Button>
      
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Divide size={20} className="text-warning" />
                  Fix Double-Counted Warehouse Stock
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {!showResults ? (
                    <>
                      <Card className="bg-warning-50 border-warning-200">
                        <CardBody className="flex items-start gap-3">
                          <AlertTriangle className="text-warning-600 mt-1" size={20} />
                          <div>
                            <p className="text-sm font-medium text-warning-800">
                              Double Stock Correction
                            </p>
                            <p className="text-xs text-warning-700 mt-1">
                              Some products have double-counted warehouse stock. 
                              The &#34;Correct Stock &#34; column shows the actual stock based on batches.
                              Update the &#34;Current Stock &#34; to match the correct values.
                            </p>
                          </div>
                        </CardBody>
                      </Card>

                      <div className="flex justify-between items-center gap-2">
                        <Input
                          placeholder="Search by SKU or name..."
                          value={searchTerm}
                          onValueChange={handleSearch}
                          className="max-w-xs"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            startContent={<RefreshCw size={16} />}
                            onPress={fetchProducts}
                            isLoading={isLoading}
                          >
                            Refresh
                          </Button>
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            startContent={<FolderSync size={16} />}
                            onPress={setCorrectStockToAll}
                            isLoading={isFixing}
                          >
                            Set Correct Stock
                          </Button>
                          <Button
                            size="sm"
                            color="warning"
                            variant="flat"
                            onPress={applyHalfToAll}
                          >
                            Apply Half to All
                          </Button>
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            startContent={<Download size={16} />}
                            onPress={downloadTemplate}
                          >
                            Template
                          </Button>
                        </div>
                      </div>

                      {selectedProducts.length > 0 ? (
                        <Table aria-label="Products to fix">
                          <TableHeader>
                            <TableColumn>SKU</TableColumn>
                            <TableColumn>Product Name</TableColumn>
                            <TableColumn>Correct Stock</TableColumn>
                            <TableColumn>Current Stock</TableColumn>
                            <TableColumn>Difference</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {selectedProducts.map((product) => {
                              const original = products.find(p => p._id === product._id);
                              const correctStock = original ? calculateBatchTotal(original.batches) : 0;
                              const difference = product.warehouseStock - correctStock;
                              
                              return (
                                <TableRow key={product._id}>
                                  <TableCell className="font-mono text-sm">
                                    {product.sku}
                                  </TableCell>
                                  <TableCell>{product.name}</TableCell>
                                  <TableCell>
                                    <span className="px-2 py-1 text-xs rounded-full bg-success-100 text-success-800">
                                      {correctStock}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      size="sm"
                                      value={product.warehouseStock.toString()}
                                      onValueChange={(value) => handleStockChange(product._id, value)}
                                      className="w-24"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      difference < 0 
                                        ? 'bg-success-100 text-success-800' 
                                        : difference > 0 
                                        ? 'bg-danger-100 text-danger-800'
                                        : 'bg-default-100'
                                    }`}>
                                      {difference > 0 ? '+' : ''}{difference}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 text-default-500">
                          {isLoading ? 'Loading...' : 'No products found'}
                        </div>
                      )}
                    </>
                  ) : (
                    <Card className="bg-success-50 border-success-200">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={20} className="text-success" />
                          <h3 className="text-lg font-medium text-success-800">
                            Stock Fix Complete
                          </h3>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <p className="text-sm text-success-700 mb-4">
                          Successfully fixed {fixedProducts.length} products
                        </p>
                        <Table aria-label="Fixed products">
                          <TableHeader>
                            <TableColumn>SKU</TableColumn>
                            <TableColumn>Product Name</TableColumn>
                            <TableColumn>Old Stock</TableColumn>
                            <TableColumn>New Stock</TableColumn>
                            <TableColumn>Adjustment</TableColumn>
                            <TableColumn>Note</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {fixedProducts.map((product) => (
                              <TableRow key={product._id}>
                                <TableCell className="font-mono text-sm">
                                  {product.sku}
                                </TableCell>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>
                                  <span className="px-2 py-1 text-xs rounded-full bg-danger-100 text-danger-800">
                                    {product.oldStock}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="px-2 py-1 text-xs rounded-full bg-success-100 text-success-800">
                                    {product.newStock}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    product.adjustment < 0 
                                      ? 'bg-success-100 text-success-800' 
                                      : 'bg-primary-100 text-primary-800'
                                  }`}>
                                    {product.adjustment > 0 ? '+' : ''}{product.adjustment}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="px-2 py-1 text-xs rounded-full bg-default-100">
                                    {product.note || ''}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="mt-4">
                          <Button
                            color="primary"
                            variant="flat"
                            startContent={<Download size={16} />}
                            onPress={downloadReport}
                          >
                            Download Report
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="default" 
                  variant="light" 
                  onPress={onClose}
                >
                  Close
                </Button>
                {!showResults && selectedProducts.length > 0 && (
                  <Button 
                    color="warning" 
                    onPress={fixDoubleStock}
                    isLoading={isFixing}
                    startContent={<Divide size={16} />}
                  >
                    Apply Stock Corrections
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}