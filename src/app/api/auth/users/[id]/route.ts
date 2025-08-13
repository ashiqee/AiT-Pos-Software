import { NextResponse } from "next/server";

import { Types } from "mongoose";

import { authOptions } from "../../[...nextauth]/authOptions";
import { dbConnect } from "@/lib/db/dbConnect";
import { getServerSession } from "next-auth";
import user from "@/models/user";




export async function PATCH(req: Request, { params }: { params: { id: string } }) {
 const session = await getServerSession(authOptions);
 
   const allowedRoles = ['admin', 'super-admin'];
 
   if (!session || !allowedRoles.includes(session.user.role)) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
 
 
    try {
    await dbConnect();
    const id = params.id;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const updates = await req.json();

    const updatedUser = await user.findByIdAndUpdate(id, updates, {
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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  
  const session = await getServerSession(authOptions);
 
   const allowedRoles = ['admin', 'super-admin'];
 
   if (!session || !allowedRoles.includes(session.user.role)) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
  
    try {
    await dbConnect();
    const id = params.id;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const deleted = await user.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
