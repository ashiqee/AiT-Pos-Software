import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";


import { dbConnect } from "@/lib/db/dbConnect";

import userModel from "@/models/user.model";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { name, email, password, role, mobileNo } = body;

   
    

    if (!name || !email || !password || !role || !mobileNo) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

   
    

    // Check if email already exists
    const existingEmail = await userModel.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ message: "Email already exists" }, { status: 409 });
    }

    // Check if mobile number already exists
    const existingMobile = await userModel.findOne({ mobileNo });
    if (existingMobile) {
      return NextResponse.json({ message: "Mobile number already exists" }, { status: 409 });
    }

     // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userModel({ name, email, password:hashedPassword, role, mobileNo });
    await newUser.save();

    return NextResponse.json({ message: "Registration successful" }, { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
