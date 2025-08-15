import { NextRequest, NextResponse } from 'next/server';
import Category from '@/models/category';
import { getServerSession } from 'next-auth';
import { dbConnect } from '@/lib/db/dbConnect';
import { authOptions } from '../../auth/[...nextauth]/authOptions';



interface RouteParams {
  params: Promise<{ id: string }>;
}


// GET single category
export async function GET(request: NextRequest,context: RouteParams) {
   const session = await getServerSession(authOptions);
   
     const allowedRoles = ['admin', 'super-admin'];
   
     if (!session || !allowedRoles.includes(session?.user.role)) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
   
  try {
    
    
    await dbConnect();
    const { id } = await context.params;
    const category = await Category.findById(id);

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
export async function PUT(request: NextRequest,context: RouteParams) {
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

    const { id } = await context.params;

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if another category with the same name exists
    const existingCategory = await Category.findOne({ 
      name, 
      _id: { $ne: id } 
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
export async function DELETE(request: Request, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const {id} = await context.params

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category is being used by products
    const Product = (await import('@/models/product')).default;
    const productsWithCategory = await Product.countDocuments({ category: id });
    
    if (productsWithCategory > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. It is being used by ${productsWithCategory} product(s).` },
        { status: 400 }
      );
    }

    // Delete category
    await Category.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}