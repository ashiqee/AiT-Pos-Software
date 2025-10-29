"use client";
import dynamic from "next/dynamic";


// Dynamically import with no SSR
const LoginPage = dynamic(
  () => import("../(auth)/login/LoginPage"),
  { ssr: false }
);
export default function Login() {
  return (
    <div>
      <LoginPage/>
    </div>
  );
}