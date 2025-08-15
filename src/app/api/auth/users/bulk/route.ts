import { NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { getServerSession } from "next-auth";
import { authOptions } from "../../[...nextauth]/authOptions";
import { dbConnect } from "@/lib/db/dbConnect";
import userModel from "@/models/user.model";

export async function POST(req: Request) {

 const session = await getServerSession(authOptions);

  const allowedRoles = ['admin', 'super-admin'];

  if (!session || !allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }


  try {
    await dbConnect();

    const users = await req.json();

    if (!Array.isArray(users)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });


    }


    
    const createdUsers = [];

    for (const u of users) {
      if (!u.name || !u.password || !u.mobile || !u.role) continue;

      const query = {
        $or: [
          ...(u.email ? [{ email: u.email }] : []),
          ...(u.studentId ? [{ studentId: u.studentId }] : []),
        ],
      };

      const existing = await userModel.findOne(query);
      if (existing) continue;

      const hashedPassword = await bcrypt.hash(u.password, 10);

      const newUser = new userModel({
        name: u.name,
        email: u.email || undefined,
        studentId: u.studentId || undefined,
        profilePic: u.profilePic || undefined,
        password: hashedPassword,
        mobile: u.mobile,
        status: u.status || "active",
        role: u.role,
        designation: u.designation || "",
      });

      await newUser.save();
      createdUsers.push(newUser);
    }

    return NextResponse.json({ success: true, count: createdUsers.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
