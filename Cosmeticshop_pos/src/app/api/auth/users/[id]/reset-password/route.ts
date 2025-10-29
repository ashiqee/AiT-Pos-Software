// app/api/users/[id]/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";


import { dbConnect } from "@/lib/db/dbConnect";
import jwt from "jsonwebtoken";

import userModel from "@/models/user.model";

// import { sendEmail } from "@/lib/utils/email/sendEmail";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    await dbConnect();
  const { id } = await context.params;
    const userData = await userModel.findById(id);
    if (!userData || !userData.email) {
      return NextResponse.json({ error: "User not found or missing email" }, { status: 404 });
    }

    const token = jwt.sign(
      { userId: userData._id },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

    // await sendEmail({
    //   to: userData.email,
    //   subject: "Reset your password",
    //   html: `
    //     <p>Hello ${userData.name},</p>
    //     <p>Click the link below to reset your password:</p>
    //     <a href="${resetLink}">${resetLink}</a>
    //     <p>This link will expire in 15 minutes.</p>
    //   `,
    // });

    return NextResponse.json({ message: "Reset link sent" });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
