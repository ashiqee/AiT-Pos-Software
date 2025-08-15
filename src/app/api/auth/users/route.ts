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
  const { name, email, studentId, password, role,mobileNo,designation,profilePic } = await req.json();

 

  // Validate the role
  if (
    !role ||
    !["super-admin", "admin", "student", "teacher", "guest"].includes(role)
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
  if (studentId) {
    const existingStudentUser = await userModel.findOne({ studentId });
    if (existingStudentUser) {
      return NextResponse.json(
        { error: "Student ID already exists" },
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
    studentId,
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



export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  const allowedRoles = ['admin', 'super-admin', 'guest', 'teacher'];

  if (!session || !allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }


  

  await dbConnect();

  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

 const query = {
  isDeleted: false,
  ...(search && {
    $or: [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ],
  }),
};

  const users = await userModel.find(query).skip(skip).limit(limit);
  const total = await userModel.countDocuments(query);

  return NextResponse.json({ users, total }, { status: 200 });
}


