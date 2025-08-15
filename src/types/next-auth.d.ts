// types/next-auth.d.ts or just next-auth.d.ts in the root

import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      studentId?: string;
      role: 'admin' | 'manager' | 'salesman' | 'customer';
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    studentId?: string;
    role: 'admin' | 'manager' | 'salesman' | 'customer';
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    studentId?: string;
    role: 'admin' | 'manager' | 'salesman' | 'customer';
  }
}
