'use client';

import { useState, useRef } from 'react';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Input } from '@heroui/input';
import { Progress } from '@heroui/progress';
import { Alert } from '@heroui/alert';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import Papa from 'papaparse';

interface CSVRow {
  _id: string;
  name?: string;
  description?: string;
  sellingPrice?: string;
  totalQuantity?: string;
  category?: string;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
  // Batch fields
  'batches[0].purchaseDate'?: string;
  'batches[0].quantity'?: string;
  'batches[0].unitCost'?: string;
  'batches[0].supplier'?: string;
  'batches[0].batchNumber'?: string;
  'batches[1].purchaseDate'?: string;
  'batches[1].quantity'?: string;
  'batches[1].unitCost'?: string;
  'batches[1].supplier'?: string;
  'batches[1].batchNumber'?: string;
}

interface ImportError {
  row: number;
  message: string;
  data: any;
}

export default function UpdateBulkProductsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: ImportError[];
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportResults(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setImportResults(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    setImportResults(null);
    
    try {
      // Parse CSV file
      const results = await new Promise<any>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject,
        });
      });

      const rows: any[] = results.data;
      const validUpdates: any[] = [];
      
      rows.forEach((row, index) => {
        const rowNumber = index + 2;
        
        // Extract and trim required fields
        const _id = row._id?.trim();
        
        // Create update object with only the fields that are present in the CSV
        const updateData: any = { _id };
        
        // Add simple fields if they exist
        if (row.name !== undefined) updateData.name = row.name?.trim();
        if (row.description !== undefined) updateData.description = row.description?.trim();
        if (row.sellingPrice !== undefined) {
          const sellingPrice = parseFloat(row.sellingPrice?.trim());
          if (!isNaN(sellingPrice)) {
            updateData.sellingPrice = sellingPrice;
          }
        }
        if (row.totalQuantity !== undefined) {
          const totalQuantity = parseInt(row.totalQuantity?.trim(), 10);
          if (!isNaN(totalQuantity)) {
            updateData.totalQuantity = totalQuantity;
          }
        }
        if (row.category !== undefined) updateData.category = row.category?.trim();
        if (row.sku !== undefined) updateData.sku = row.sku?.trim();
        if (row.barcode !== undefined) updateData.barcode = row.barcode?.trim();
        if (row.imageUrl !== undefined) updateData.imageUrl = row.imageUrl?.trim();
        
        // Handle batches array
        const batches: any[] = [];
        
        // Process batch 0 if any batch fields are present
        const batch0: any = {};
        if (row['batches[0].purchaseDate'] !== undefined) {
          batch0.purchaseDate = new Date(row['batches[0].purchaseDate']);
        }
        if (row['batches[0].quantity'] !== undefined) {
          const quantity = parseInt(row['batches[0].quantity']?.trim(), 10);
          if (!isNaN(quantity)) {
            batch0.quantity = quantity;
          }
        }
        if (row['batches[0].unitCost'] !== undefined) {
          const unitCost = parseFloat(row['batches[0].unitCost']?.trim());
          if (!isNaN(unitCost)) {
            batch0.unitCost = unitCost;
          }
        }
        if (row['batches[0].supplier'] !== undefined) {
          batch0.supplier = row['batches[0].supplier']?.trim();
        }
        if (row['batches[0].batchNumber'] !== undefined) {
          batch0.batchNumber = row['batches[0].batchNumber']?.trim();
        }
        if (row['batches[0]._id'] !== undefined) {
          batch0._id = row['batches[0]._id']?.trim();
        }
        
        // Process batch 1 if any batch fields are present
        const batch1: any = {};
        if (row['batches[1].purchaseDate'] !== undefined) {
          batch1.purchaseDate = new Date(row['batches[1].purchaseDate']);
        }
        if (row['batches[1].quantity'] !== undefined) {
          const quantity = parseInt(row['batches[1].quantity']?.trim(), 10);
          if (!isNaN(quantity)) {
            batch1.quantity = quantity;
          }
        }
        if (row['batches[1].unitCost'] !== undefined) {
          const unitCost = parseFloat(row['batches[1].unitCost']?.trim());
          if (!isNaN(unitCost)) {
            batch1.unitCost = unitCost;
          }
        }
        if (row['batches[1].supplier'] !== undefined) {
          batch1.supplier = row['batches[1].supplier']?.trim();
        }
        if (row['batches[1].batchNumber'] !== undefined) {
          batch1.batchNumber = row['batches[1].batchNumber']?.trim();
        }
        if (row['batches[1]._id'] !== undefined) {
          batch1._id = row['batches[1]._id']?.trim();
        }
        
        // Add batches to update data if any batch fields were provided
        if (Object.keys(batch0).length > 0) batches.push(batch0);
        if (Object.keys(batch1).length > 0) batches.push(batch1);
        
        if (batches.length > 0) {
          updateData.batches = batches;
        }
        
        validUpdates.push(updateData);
      });
      
      // Send update request to API
      const response = await fetch('/api/products/update-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: validUpdates }),
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update products');
      }
      
      setImportResults({
        success: result.success || 0,
        errors: result.errors || [],
      });
    } catch (error) {
      console.error('Import error:', error);
      setImportResults({
        success: 0,
        errors: [{ row: 0, message: error instanceof Error ? error.message : 'Unknown error', data: null }],
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const downloadTemplate = () => {
    const header = [
      '_id',           // required
      'name',
      'description',
      'sellingPrice',
      'totalQuantity',
      'category',
      'sku',
      'barcode',
      'imageUrl',
      'batches[0].purchaseDate',
      'batches[0].quantity',
      'batches[0].unitCost',
      'batches[0].supplier',
      'batches[0].batchNumber',
      'batches[0]._id',
      'batches[1].purchaseDate',
      'batches[1].quantity',
      'batches[1].unitCost',
      'batches[1].supplier',
      'batches[1].batchNumber',
      'batches[1]._id'
    ].join(',');

    const row1 = [
      '68f60d02b1f306002afca51a',  // _id
      '3 WAY আয়না',
      'Updated description',
      '130.00',
      '5',
      '68f60842b1f306002afc7a35',
      'RN-00001',
      '569454381860',
      'https://example.com/new-image.jpg',
      '2025-08-01',
      '3',
      '125.00',
      'ABC Supplier',
      'BATCH-1760959594229-03ADX',
      '68f60d02b1f306002afca51b',
      '2025-08-10',
      '2',
      '140.00',
      'XYZ Supplier',
      'BATCH-1760959594229-03BDX',
      '68f61c6a3ec00b1a5021dddd'
    ];

    // CSV-safe quoting
    const quoteRow = (arr: (string|number)[]) =>
      arr.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');

    const csvContent = [header, quoteRow(row1)].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product_update_template.csv';
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Update Products</h1>
        <p className="text-gray-600">Upload a CSV file to update existing products in bulk</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold">Instructions</h2>
        </CardHeader>
        <CardBody>
          <ul className="list-disc pl-5 space-y-1">
            <li>Download the template below to ensure correct formatting</li>
            <li>Required field: _id (product identifier)</li>
            <li>Only include fields you want to update - empty fields will be ignored</li>
            <li>For batch updates, use the format batches[0].fieldName, batches[1].fieldName, etc.</li>
            <li>Include the batch _id if you want to update an existing batch</li>
            <li>Numeric fields should contain valid numbers</li>
            <li>Date fields should be in YYYY-MM-DD format</li>
          </ul>
          <Button color="primary" variant="light" className="mt-3" onClick={downloadTemplate}>
            Download Template
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Upload CSV File</h2>
        </CardHeader>
        <CardBody>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-primary bg-primary-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role='button'
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleFileChange}
            />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">CSV files only</p>
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </div>
              <Button
                color="primary"
                size="sm"
                onPress={handleUpload}
                isLoading={isUploading}
                isDisabled={isUploading}
              >
                {isUploading ? 'Updating...' : 'Update Products'}
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="mt-4">
              <Progress value={uploadProgress} color="primary" className="w-full" />
              <p className="text-sm text-gray-600 mt-1">Processing your file...</p>
            </div>
          )}

          {importResults && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="font-medium">
                  {importResults.success} products updated successfully
                </span>
              </div>

              {importResults.errors.length > 0 && (
                <div>
                  <div className="flex items-center mb-2">
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="font-medium">
                      {importResults.errors.length} errors encountered
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Row
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-900 divide-y divide-gray-200">
                        {importResults.errors.map((error, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm ">
                              {error.row}
                            </td>
                            <td className="px-4 py-2 text-sm ">
                              {error.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}