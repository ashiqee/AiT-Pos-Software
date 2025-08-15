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
  name: string;
  description: string;
  sellingPrice: string;
  unitCost: string;
  quantity: string;
  category: string;
  sku: string;
  barcode: string;
  imageUrl: string;
}

interface ImportError {
  row: number;
  message: string;
  data: any;
}

export default function ImportProductsPage() {
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
    const errors: ImportError[] = [];
    const validProducts: any[] = [];
    
    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      
      // Extract and trim required fields
      const name = row.name?.trim();
      const sellingPrice = row.sellingPrice?.trim();
      const quantity = row.quantity?.trim();
      const unitCost = row.unitCost?.trim();
      const category = row.category?.trim();

      console.log(quantity,"Q",unitCost);
      
      
      // Check for missing required fields
      if (!name || !sellingPrice || !quantity || !unitCost || !category) {
        errors.push({
          row: rowNumber,
          message: 'Missing required fields (name, sellingPrice, unitCost, quantity, category)',
          data: row,
        });
        return;
      }
      
      // Parse numeric values with robust handling
      const parseNumber = (value: string, isInteger: boolean = false) => {
        // Remove all non-numeric characters except decimal point and minus sign
        let cleaned = value.replace(/[^\d.-]/g, '');
        
        // Handle decimal commas (convert to decimal point)
        cleaned = cleaned.replace(',', '.');
        
        // Parse the number
        const num = isInteger ? parseInt(cleaned, 10) : parseFloat(cleaned);
        
        // Return NaN if parsing failed
        return isNaN(num) ? NaN : num;
      };

      const quantityValue = parseNumber(quantity, true);
      const unitCostValue = parseNumber(unitCost, false);
      const sellingPriceValue = parseNumber(sellingPrice, false);

      // Validate parsed numbers
      if (isNaN(quantityValue) || isNaN(unitCostValue) || isNaN(sellingPriceValue)) {
        errors.push({
          row: rowNumber,
          message: 'Invalid numeric values (sellingPrice, unitCost, or quantity)',
          data: row,
        });
        return;
      }
      
      // Ensure quantity is a positive integer
      if (!Number.isInteger(quantityValue) || quantityValue <= 0) {
        errors.push({
          row: rowNumber,
          message: 'Quantity must be a positive integer',
          data: row,
        });
        return;
      }
      
      // Ensure unitCost and sellingPrice are positive numbers
      if (unitCostValue <= 0 || sellingPriceValue <= 0) {
        errors.push({
          row: rowNumber,
          message: 'Unit cost and selling price must be positive numbers',
          data: row,
        });
        return;
      }
         
      validProducts.push({
        name,
        description: row.description?.trim() || '',
        sellingPrice: sellingPriceValue,
        category,
        sku: row.sku?.trim() || undefined,
        imageUrl: row.imageUrl?.trim() || '',
        batches: [
          {
            purchaseDate: row.purchaseDate ? new Date(row.purchaseDate) : new Date(),
            quantity: quantityValue,
            unitCost: unitCostValue,
            supplier: row.supplier?.trim() || '',
            batchNumber: row.batchNumber?.trim() || '',
          },
        ],
      });
    });
    
    const response = await fetch('/api/products/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: validProducts }),
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to import products');
    }
    
    const combinedErrors = [...errors, ...(result.errors || [])];
    setImportResults({
      success: result.success || 0,
      errors: combinedErrors,
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
    'name',
    'description',
    'sellingPrice',
    'category',
    'sku',         // optional: leave blank to auto-generate
    'barcode',     // optional: leave blank to auto-generate
    'imageUrl',
    'purchaseDate',
    'quantity',
    'unitCost',
    'supplier',
    'batchNumber'
  ].join(',');

  const row1 = [
    'Example Product',
    'Product description',
    '19.99',
    'Electronics',
    '',                      // sku -> auto
    '',                      // barcode -> auto
    'https://example.com/image.jpg',
    '2025-08-01',
    '100',
    '10.50',
    'ABC Supplier',
    'INV-1001'
  ];

  const row2 = [
    'Another Product',
    'Another description',
    '29.99',
    'Home & Kitchen',
    '',                      // sku -> auto
    '',                      // barcode -> auto
    'https://example.com/image2.jpg',
    '2025-08-10',
    '50',
    '15.75',
    'XYZ Traders',
    'INV-1002'
  ];

  // CSV-safe quoting
  const quoteRow = (arr: (string|number)[]) =>
    arr.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');

  const csvContent = [header, quoteRow(row1), quoteRow(row2)].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'product_import_template.csv';
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  return (
    <div className="mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Import Products</h1>
        <p className="text-gray-600">Upload a CSV file to import products in bulk</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold">Instructions</h2>
        </CardHeader>
        <CardBody>
          <ul className="list-disc pl-5 space-y-1">
            <li>Download the template below to ensure correct formatting</li>
            <li>Required fields: name, price, cost, quantity, category, sku</li>
            <li>Category should match an existing category name in your database</li>
            <li>SKU must be unique</li>
            <li>Price and cost should be numeric values</li>
            <li>Quantity should be a whole number</li>
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
                {isUploading ? 'Importing...' : 'Import Products'}
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
                  {importResults.success} products imported successfully
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
                      <tbody className=" text-white divide-y divide-gray-200">
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