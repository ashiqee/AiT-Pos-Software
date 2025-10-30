// app/components/WarehouseStockImport.tsx
'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { toast } from 'sonner';
import { Upload, FileText, Warehouse } from 'lucide-react';

export default function WarehouseStockImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

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
            if (header === 'quantity') {
              obj[header] = value ? parseInt(value, 10) : 0;
            } else {
              obj[header] = value || undefined;
            }
          });
          
          return obj;
        });
      
      setCsvData(data);
      setShowPreview(true);
    };
    
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      toast.error('No data to import');
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch('/api/inventory/update-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates: csvData }),
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success(`Successfully updated ${result.success} items`);
        if (result.errors.length > 0) {
          console.error('Import errors:', result.errors);
          toast.warning(`${result.errors.length} items had errors`);
        }
        setCsvData([]);
        setShowPreview(false);
      } else {
        toast.error(result.error || 'Failed to update inventory');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to update inventory');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `sku,operation,quantity,fromLocation
RN-00001,setStock,3,warehouse
RN-00002,setStock,12,warehouse
RN-00003,setStock,12,warehouse
RN-00004,setStock,0,warehouse
RN-00005,setStock,10,warehouse`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'warehouse_stock_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            color="primary"
            startContent={<Upload size={16} />}
            as="label"
            htmlFor="csv-upload"
            className="cursor-pointer"
          >
            Upload Warehouse Stock CSV
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
      </div>

      {showPreview && (
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Warehouse size={18} />
              Warehouse Stock Preview ({csvData.length} items)
            </h3>
            <div className="space-x-2">
              <Button
                variant="light"
                onPress={() => setShowPreview(false)}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleImport}
                isLoading={isUploading}
              >
                Update Stock
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {csvData.slice(0, 10).map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {row.operation}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {row.fromLocation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.length > 10 && (
              <div className="text-center py-2 text-sm text-gray-500">
                Showing first 10 of {csvData.length} items
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}