// app/components/InitialWarehouseStockSetup.tsx
'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Input } from '@heroui/input';
import { Textarea } from '@heroui/input';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Upload, FileText, Warehouse, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface StockUpdate {
  _id: string;
  warehouseStock: number;
}

export default function InitialWarehouseStockSetup() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isUploading, setIsUploading] = useState(false);
  const [stockUpdates, setStockUpdates] = useState<StockUpdate[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj: any = {};
          
          headers.forEach((header, index) => {
            const value = values[index];
            if (header === 'warehouseStock') {
              obj[header] = value ? parseInt(value, 10) : 0;
            } else {
              obj[header] = value || undefined;
            }
          });
          
          return obj;
        });
      
      setStockUpdates(data);
      setShowPreview(true);
    };
    
    reader.readAsText(file);
  };

  const handleManualInput = () => {
    try {
      const lines = manualInput.trim().split('\n');
      const data = lines.map(line => {
        const [id, stock] = line.split('\t').map(v => v.trim());
        return {
          _id: id,
          warehouseStock: parseInt(stock, 10) || 0
        };
      });
      
      setStockUpdates(data);
      setShowPreview(true);
    } catch (error) {
      toast.error('Invalid input format');
    }
  };

  const handleSetup = async () => {
    if (stockUpdates.length === 0) {
      toast.error('No data to setup');
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch('/api/inventory/update-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates: stockUpdates }),
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success(`Successfully set initial stock for ${result.success} products`);
        if (result.errors.length > 0) {
          console.error('Setup errors:', result.errors);
          toast.warning(`${result.errors.length} products had errors`);
        }
        setStockUpdates([]);
        setShowPreview(false);
        setManualInput('');
        onClose();
      } else {
        toast.error(result.error || 'Failed to set initial warehouse stock');
      }
    } catch (error) {
      console.error('Setup error:', error);
      toast.error('Failed to set initial warehouse stock');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `_id,warehouseStock
68f60d02b1f306002afca51a,3
68f60d02b1f306002afca51f,12
68f60d03b1f306002afca524,12
68f60d03b1f306002afca529,0
68f60d03b1f306002afca52e,10
68f60d03b1f306002afca533,5`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'initial_warehouse_stock_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button 
        color="primary" 
        startContent={<Package size={16} />}
        onPress={onOpen}
      >
        Set Initial Warehouse Stock
      </Button>
      
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Warehouse size={20} />
                  Set Initial Warehouse Stock
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Card className="bg-warning-50 border-warning-200">
                    <CardBody className="flex items-start gap-3">
                      <AlertCircle className="text-warning-600 mt-1" size={20} />
                      <div>
                        <p className="text-sm font-medium text-warning-800">
                          Initial Stock Setup
                        </p>
                        <p className="text-xs text-warning-700 mt-1">
                          This will set the initial warehouse stock for products. 
                          Products that already have stock will be skipped.
                        </p>
                      </div>
                    </CardBody>
                  </Card>

                  <div className="flex items-center space-x-2">
                    <Button
                      color="primary"
                      startContent={<Upload size={16} />}
                      as="label"
                      htmlFor="csv-upload"
                      className="cursor-pointer"
                    >
                      Upload CSV
                    </Button>
                    <input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="light"
                      onPress={downloadTemplate}
                      startContent={<FileText size={16} />}
                    >
                      Download Template
                    </Button>
                  </div>

                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-medium">Or paste data manually</h3>
                    </CardHeader>
                    <CardBody>
                      <p className="text-sm text-default-500 mb-2">
                        Paste tab-separated values (Product ID and warehouse stock):
                      </p>
                      <Textarea
                        placeholder="68f60d02b1f306002afca51a&#9;3&#10;68f60d02b1f306002afca51f&#9;12"
                        value={manualInput}
                        onValueChange={setManualInput}
                        minRows={5}
                      />
                      <Button
                        color="primary"
                        variant="flat"
                        className="mt-2"
                        onPress={handleManualInput}
                      >
                        Parse Input
                      </Button>
                    </CardBody>
                  </Card>

                  {showPreview && (
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium flex items-center gap-2">
                            <Package size={18} />
                            Preview Initial Stock Setup ({stockUpdates.length} products)
                          </h3>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Product ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Initial Stock
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {stockUpdates.slice(0, 10).map((update, index) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                    {update._id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                      {update.warehouseStock} units
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {stockUpdates.length > 10 && (
                            <div className="text-center py-2 text-sm text-gray-500">
                              Showing first 10 of {stockUpdates.length} products
                            </div>
                          )}
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
                  Cancel
                </Button>
                {showPreview && (
                  <Button 
                    color="primary" 
                    onPress={handleSetup}
                    isLoading={isUploading}
                    startContent={<Package size={16} />}
                  >
                    Set Initial Stock
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