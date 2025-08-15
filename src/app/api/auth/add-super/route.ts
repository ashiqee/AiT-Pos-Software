import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db/dbConnect";
import userModel from "@/models/user.model";



export async function POST(req: Request) {
  try {
    // Ensure database is connected
    await dbConnect();

    // Read request body safely
    const bodyText = await req.text();
    if (!bodyText) {
      return NextResponse.json({ error: "Missing request body" }, { status: 400 });
    }

    const { name, email, password, role } = JSON.parse(bodyText);

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }


    
    // Check if Super Admin already exists
    const existingSuperAdmin = await userModel.findOne({ email: email });
    if (existingSuperAdmin) {
      return NextResponse.json({ error: "Super Admin already exists" }, { status: 400 });
    }

    // Only allow one-time Super Admin creation
    if (email !== "ashiq.buet73@gmail.com" || role !== "admin") {
      return NextResponse.json({ error: "Only Super Admin can be added" }, { status: 403 });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Super Admin
    const newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    return NextResponse.json(
      { message: "Super Admin added successfully", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in add-super route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
