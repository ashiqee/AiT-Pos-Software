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
  price: string;
  cost: string;
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

      const rows: CSVRow[] = results.data;
      const errors: ImportError[] = [];
      const validProducts: any[] = [];

      // Validate each row
      rows.forEach((row, index) => {
        const rowNumber = index + 2; // +2 because header is row 1 and we start at index 0
        
        // Check required fields
        if (!row.name || !row.price || !row.cost || !row.quantity || !row.category || !row.sku) {
          errors.push({
            row: rowNumber,
            message: 'Missing required fields',
            data: row,
          });
          return;
        }

        // Validate numeric fields
        if (isNaN(parseFloat(row.price)) || isNaN(parseFloat(row.cost)) || isNaN(parseInt(row.quantity))) {
          errors.push({
            row: rowNumber,
            message: 'Invalid numeric values',
            data: row,
          });
          return;
        }

        // Create product object
        validProducts.push({
          name: row.name,
          description: row.description || '',
          price: parseFloat(row.price),
          cost: parseFloat(row.cost),
          quantity: parseInt(row.quantity),
          category: row.category, // This will be resolved on the server
          sku: row.sku,
          barcode: row.barcode || '',
          imageUrl: row.imageUrl || '',
        });
      });

      // Send to server
      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: validProducts }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import products');
      }

      // Combine client-side errors with server-side errors
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
    const csvContent = [
      'name,description,price,cost,quantity,category,sku,barcode,imageUrl',
      'Example Product,Product description,19.99,10.50,100,Electronics,EXM001,123456789,https://example.com/image.jpg',
      'Another Product,Another description,29.99,15.75,50,Electronics,EXM002,987654321,https://example.com/image2.jpg',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_import_template.csv');
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