import { NextResponse } from 'next/server';
import Category from '@/models/category';
import { getServerSession } from 'next-auth';
import { dbConnect } from '@/lib/db/dbConnect';
import { authOptions } from '../../auth/[...nextauth]/authOptions';


interface Params {
  params: { id: string };
}

// GET single category
export async function GET(request: Request, { params }: Params) {
  try {
    await dbConnect();
    const category = await Category.findById(params.id);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT update category
export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, imageUrl } = await request.json();

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if category exists
    const category = await Category.findById(params.id);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if another category with the same name exists
    const existingCategory = await Category.findOne({ 
      name, 
      _id: { $ne: params.id } 
    });
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      );
    }

    // Update category
    category.name = name;
    category.description = description || category.description;
    category.imageUrl = imageUrl || category.imageUrl;

    await category.save();

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE category
export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Check if category exists
    const category = await Category.findById(params.id);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category is being used by products
    const Product = (await import('@/models/product')).default;
    const productsWithCategory = await Product.countDocuments({ category: params.id });
    
    if (productsWithCategory > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. It is being used by ${productsWithCategory} product(s).` },
        { status: 400 }
      );
    }

    // Delete category
    await Category.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}