import { NextRequest, NextResponse } from "next/server";

import { Types } from "mongoose";

import { authOptions } from "../../[...nextauth]/authOptions";
import { dbConnect } from "@/lib/db/dbConnect";
import { getServerSession } from "next-auth";

import userModel from "@/models/user.model";


interface RouteParams {
  params: Promise<{ id: string }>;
}



export async function PATCH(request: NextRequest, context: RouteParams) {
 const session = await getServerSession(authOptions);
 
   const allowedRoles = ['admin', 'super-admin'];
 
   if (!session || !allowedRoles.includes(session?.user.role)) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
 
 
    try {
    await dbConnect();
    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const updates = await request.json();

    const updatedUser = await userModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error("PATCH error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}



export async function DELETE(request: NextRequest, context: RouteParams) {
  
  const session = await getServerSession(authOptions);
 
   const allowedRoles = ['admin', 'super-admin'];
 
   if (!session || !allowedRoles.includes(session.user.role)) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
  
    try {
    await dbConnect();
     const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const deleted = await userModel.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
