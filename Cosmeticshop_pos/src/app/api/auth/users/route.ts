import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/authOptions";
import { dbConnect } from "@/lib/db/dbConnect";
import userModel from "@/models/user.model";


export async function POST(req: Request) {
 const session = await getServerSession(authOptions);

  const allowedRoles = ['admin', 'super-admin'];

  if (!session || !allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }



  // Parse the request body
  const { name, email,  password, role,mobileNo,designation,profilePic } = await req.json();

 

  // Validate the role
  if (
    !role ||
    !["super-admin" , "admin" , "manager", "salesmen" , "customer"].includes(role)
  ) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Connect to the database
  await dbConnect();

  // Check if a user already exists with the same email
  if (email) {
    const existingEmailUser = await userModel.findOne({ email });
    if (existingEmailUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }
  }

  // Check if a user already exists with the same studentId
  if (mobileNo) {
    const existingUser = await userModel.findOne({ mobileNo });
    if (existingUser) {
      return NextResponse.json(
        { error: "MobileNo  already exists" },
        { status: 400 }
      );
    }
  }

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new user in the database
  const newUser = await userModel.create({
    name,
    email,
    profilePic,
    password: hashedPassword,
    mobileNo,
    designation,
    role,
  });

  // Return a success response
  return NextResponse.json(
    { message: "User added successfully", user: newUser },
    { status: 201 }
  );
}



export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  const allowedRoles = ["super-admin" , "admin" ];

  if (!session || !allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

try{
  
await dbConnect();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    let query: any = { isDeleted: false };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobileNo: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (status) {
      query.status = status;
    }

    const users = await userModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password');

    const total = await userModel.countDocuments(query);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

