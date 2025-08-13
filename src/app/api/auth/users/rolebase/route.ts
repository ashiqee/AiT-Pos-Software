import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../[...nextauth]/authOptions";
import { dbConnect } from "@/lib/db/dbConnect";
import userModel from "@/models/user.model";



export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  const allowedRoles = ['admin', 'super-admin', 'guest', 'teacher'];

  if (!session || !allowedRoles.includes(session.userData.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  const searchParams = req.nextUrl.searchParams;
  const role = searchParams.get("role") || "";

  console.log(role,"CHECK");
  

  const query: any = {
    isDeleted: false,
  };

  if (role) {
    query.role = { $regex: role, $options: "i" };
  }

  const teachers = await userModel.find(query).select("name _id"); // ✅ fixed select syntax
  const total = await userModel.countDocuments(query);

  return NextResponse.json({ users: teachers, total }, { status: 200 });
}

