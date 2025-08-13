import { NextResponse } from 'next/server';

import Product from '@/models/product';
import Category from '@/models/category';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { dbConnect } from '@/lib/db/dbConnect';


interface ImportProduct {
  name: string;
  description: string;
  price: number;
  cost: number;
  quantity: number;
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

export async function POST(request: Request) {
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
    
    // Get all categories to map names to IDs
    const categories = await Category.find({});
    const categoryMap = new Map(
      categories.map(cat => [cat.name.toLowerCase(), cat._id])
    );

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const productData = products[i] as ImportProduct;
      const rowNumber = i + 1; // Row number for error reporting

      try {
        // Check if SKU already exists
        const existingProduct = await Product.findOne({ sku: productData.sku });
        if (existingProduct) {
          errors.push({
            row: rowNumber,
            message: `SKU '${productData.sku}' already exists`,
            data: productData,
          });
          continue;
        }

        // Find category by name
        const categoryName = productData.category.toLowerCase();
        const categoryId = categoryMap.get(categoryName);
        
        if (!categoryId) {
          errors.push({
            row: rowNumber,
            message: `Category '${productData.category}' not found`,
            data: productData,
          });
          continue;
        }

        // Create new product
        const newProduct = new Product({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          cost: productData.cost,
          quantity: productData.quantity,
          category: categoryId,
          sku: productData.sku,
          barcode: productData.barcode,
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