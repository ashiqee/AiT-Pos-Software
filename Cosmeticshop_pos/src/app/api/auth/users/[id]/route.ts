import { NextRequest, NextResponse } from 'next/server';

import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../[...nextauth]/authOptions';
import { dbConnect } from '@/lib/db/dbConnect';
import userModel from '@/models/user.model';


interface RouteParams {
  params: Promise<{ id: string }>;
}


export async function GET(request: NextRequest,context:RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

     const { id } = await context.params;

    await dbConnect();
    const user = await userModel.findById(id).select('-password');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

     const { id } = await context.params;

    await dbConnect();
    const body = await request.json();
    
    // Don't allow role change through this endpoint for security
    delete body.role;

    // If password is being updated, hash it
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 12);
    }

    const user = await userModel.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context:RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    await dbConnect();
    const user = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}