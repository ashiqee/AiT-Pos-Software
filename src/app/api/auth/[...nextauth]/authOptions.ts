import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";


import { dbConnect } from "@/lib/db/dbConnect";
import user from "@/models/user";

// Auth options configuration
export const authOptions:NextAuthOptions = {
   session: {
    strategy: "jwt", // TypeScript now understands this is the literal "jwt"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Mobile No", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) {
          throw new Error("Both identifier and password are required.");
        }

       

        // Connect to the database
        await dbConnect();

        // Find the user by email or studentId
        const user = await user.findOne({
          $or: [
            { email: credentials.identifier },
            { mobileNo: credentials.identifier },
          ],
        });

        if (!user) {
          throw new Error("No user found with this identifier.");
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password.");
        }

        // Return safe user object
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          mobileNo: user.mobileNo,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }:{token:any,user:any}) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.mobileNo = user.mobileNo;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }:{session:any,token:any}) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.mobileNo = token.mobileNo as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
};

