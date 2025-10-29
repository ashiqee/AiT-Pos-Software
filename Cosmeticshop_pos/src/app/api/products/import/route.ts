import { NextRequest, NextResponse } from 'next/server';
import Product from '@/models/product';
import Category from '@/models/category';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { dbConnect } from '@/lib/db/dbConnect';
import { generateBarcode } from '@/lib/utils/barcode';

interface ImportProduct {
  name: string;
  description?: string;
  sellingPrice: number;
  batches: [{
    purchaseDate: Date;
    quantity: number;
    unitCost: number;
    supplier?: string;
    batchNumber: string;
  }],
  category: string;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
}

interface ImportError {
  row: number;
  message: string;
  data: any;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    const { products } = await request.json();
    
    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }
    
    const errors: ImportError[] = [];
    const successCount: number[] = [];
    
    // Map category names to IDs
    const categories = await Category.find({});
    const categoryMap = new Map(
      categories.map(cat => [cat.name.toLowerCase(), cat._id])
    );
    
    for (let i = 0; i < products.length; i++) {
      const productData = products[i] as ImportProduct;
      const rowNumber = i + 1;
      
      try {
        // Check if batches array exists and has at least one element
        if (!productData.batches || !productData.batches.length) {
          errors.push({
            row: rowNumber,
            message: 'Product must have at least one batch',
            data: productData,
          });
          continue;
        }
        
        // Get the first batch
        const batch = productData.batches[0];
        
        // Validate and convert numeric values
        const quantity = Number(batch.quantity);
        const unitCost = Number(batch.unitCost);
        const sellingPrice = Number(productData.sellingPrice);
        
        
        
        // Check if numeric values are valid
        if (isNaN(quantity) || isNaN(unitCost) || isNaN(sellingPrice)) {
          errors.push({
            row: rowNumber,
            message: 'Invalid numeric values (quantity, unitCost, or sellingPrice)',
            data: productData,
          });
          continue;
        }
        
        // Check if numeric values are positive
        // if (quantity <= 0 || unitCost <= 0 || sellingPrice <= 0) {
        //   errors.push({
        //     row: rowNumber,
        //     message: 'Numeric values must be positive (quantity, unitCost, sellingPrice)',
        //     data: productData,
        //   });
        //   continue;
        // }
        
        // Check duplicate SKU only if provided
        if (productData.sku) {
          const existingProduct = await Product.findOne({ sku: productData.sku });
          if (existingProduct) {
            errors.push({
              row: rowNumber,
              message: `SKU '${productData.sku}' already exists`,
              data: productData,
            });
            continue;
          }
        }
        
        // Resolve category
        const categoryId = categoryMap.get(productData.category?.toLowerCase());
        if (!categoryId) {
          errors.push({
            row: rowNumber,
            message: `Category '${productData.category}' not found`,
            data: productData,
          });
          continue;
        }
        
        // Auto-generate barcode if missing
        let finalBarcode = productData.barcode;
        if (!finalBarcode) {
          let unique = false;
          while (!unique) {
            const candidate = generateBarcode();
            const exists = await Product.findOne({ barcode: candidate });
            if (!exists) {
              finalBarcode = candidate;
              unique = true;
            }
          }
        }
        
        // Create new product with batches
        const newProduct = new Product({
          name: productData.name,
          description: productData.description,
          sellingPrice: sellingPrice,
          batches: [{
            purchaseDate: batch.purchaseDate || new Date(),
            quantity: quantity,
            unitCost: unitCost,
            supplier: batch.supplier || '',
            batchNumber: batch.batchNumber || ''
          }],
          category: categoryId,
          sku: productData.sku || undefined, // let schema hook generate if missing
          barcode: finalBarcode,
          imageUrl: productData.imageUrl,
        });
        
        await newProduct.save();
        successCount.push(1);
      } catch (error) {
        console.error(`Error importing product at row ${rowNumber}:`, error);
        errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Unknown error',
          data: productData,
        });
      }
    }
    
    return NextResponse.json({
      success: successCount.length,
      errors,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import products' },
      { status: 500 }
    );
  }
}