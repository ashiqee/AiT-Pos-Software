// app/components/FixNegativeStock.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { AlertTriangle, RefreshCw, Download, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface NegativeStockProduct {
  _id: string;
  name: string;
  sku: string;
  warehouseStock: number;
  shopStock: number;
}

interface FixedProduct {
  _id: string;
  name: string;
  sku: string;
  oldStock: number;
  newStock: number;
  adjustment: number;
}

export default function FixNegativeStock() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [negativeProducts, setNegativeProducts] = useState<NegativeStockProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixedProducts, setFixedProducts] = useState<FixedProduct[]>([]);
  const [showResults, setShowResults] = useState(false);

  const fetchNegativeStockProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/inventory/fix-negative-stock');
      const data = await response.json();
      
      if (response.ok) {
        setNegativeProducts(data.products);
        if (data.products.length === 0) {
          toast.success('No products with negative stock found');
        }
      } else {
        toast.error(data.error || 'Failed to fetch negative stock products');
      }
    } catch (error) {
      console.error('Error fetching negative stock products:', error);
      toast.error('Failed to fetch negative stock products');
    } finally {
      setIsLoading(false);
    }
  };

  const fixNegativeStock = async () => {
    if (negativeProducts.length === 0) {
      toast.error('No products to fix');
      return;
    }

    setIsFixing(true);
    try {
      // Prepare updates - set all to 0
      const updates = negativeProducts.map(product => ({
        _id: product._id,
        warehouseStock: 0
      }));

      const response = await fetch('/api/inventory/fix-negative-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
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
        await fetchNegativeStockProducts();
      } else {
        toast.error(result.error || 'Failed to fix negative stock');
      }
    } catch (error) {
      console.error('Error fixing negative stock:', error);
      toast.error('Failed to fix negative stock');
    } finally {
      setIsFixing(false);
    }
  };

  const downloadReport = () => {
    const csvContent = `Product ID,SKU,Product Name,Old Stock,New Stock,Adjustment
 ${fixedProducts.map(p => 
  `${p._id},${p.sku},"${p.name}",${p.oldStock},${p.newStock},${p.adjustment}`
).join('\n')}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `negative_stock_fix_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleOpen = () => {
    setShowResults(false);
    setFixedProducts([]);
    onOpen();
    fetchNegativeStockProducts();
  };

  return (
    <>
      <Button 
        color="danger" 
        variant="flat"
        startContent={<AlertTriangle size={16} />}
        onPress={handleOpen}
      >
        Fix Negative Stock
      </Button>
      
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-danger" />
                  Fix Negative Warehouse Stock
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {!showResults ? (
                    <>
                      <Card className="bg-danger-50 border-danger-200">
                        <CardBody className="flex items-start gap-3">
                          <AlertTriangle className="text-danger-600 mt-1" size={20} />
                          <div>
                            <p className="text-sm font-medium text-danger-800">
                              Negative Stock Detected
                            </p>
                            <p className="text-xs text-danger-700 mt-1">
                              The following products have negative warehouse stock. 
                              This will reset them to 0 and create correction transactions.
                            </p>
                          </div>
                        </CardBody>
                      </Card>

                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">
                          Products with Negative Stock ({negativeProducts.length})
                        </h3>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          startContent={<RefreshCw size={16} />}
                          onPress={fetchNegativeStockProducts}
                          isLoading={isLoading}
                        >
                          Refresh
                        </Button>
                      </div>

                      {negativeProducts.length > 0 ? (
                        <Table aria-label="Products with negative stock">
                          <TableHeader>
                            <TableColumn>SKU</TableColumn>
                            <TableColumn>Product Name</TableColumn>
                            <TableColumn>Current Stock</TableColumn>
                            <TableColumn>Shop Stock</TableColumn>
                            <TableColumn>Action</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {negativeProducts.map((product) => (
                              <TableRow key={product._id}>
                                <TableCell className="font-mono text-sm">
                                  {product.sku}
                                </TableCell>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>
                                  <span className="px-2 py-1 text-xs rounded-full bg-danger-100 text-danger-800">
                                    {product.warehouseStock}
                                  </span>
                                </TableCell>
                                <TableCell>{product.shopStock}</TableCell>
                                <TableCell>
                                  <span className="px-2 py-1 text-xs rounded-full bg-warning-100 text-warning-800">
                                    Reset to 0
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 text-default-500">
                          {isLoading ? 'Loading...' : 'No products with negative stock found'}
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
                                  <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800">
                                    +{product.adjustment}
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
                {!showResults && negativeProducts.length > 0 && (
                  <Button 
                    color="danger" 
                    onPress={fixNegativeStock}
                    isLoading={isFixing}
                    startContent={<AlertTriangle size={16} />}
                  >
                    Fix All Negative Stock
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