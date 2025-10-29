"use client";


import React, { useState } from "react";
import Link from "next/link";

import ACForm from "@/components/forms/ACForm";
import ACInput from "@/components/forms/ACInput";
import { Button } from "@heroui/button";

type Props = {
  role: string;
};

const RegistrationForm = ({ role }: Props) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setMessage("");

    const payload = {
      name: values.full_name,
      mobileNo: values.mobileNumber,
      email: values.email,
      password: values.password,
      role,
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Registration successful");
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      setMessage("❌ Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ACForm
      defaultValues={{
        full_name: "",
        email: "",
        mobileNumber: "",
        password: "",
      }}
      onSubmit={handleSubmit}
    >
      <div className="py-3">
        <ACInput isRequired label="Full Name" name="full_name" type="text" />
      </div>
      <div className="py-3">
        <ACInput isRequired label="Mobile" name="mobileNumber" />
      </div>
      <div className="py-3">
        <ACInput isRequired label="Email" name="email" type="email" />
      </div>
      <div className="py-3">
        <ACInput isRequired label="Password" name="password" type="password" />
      </div>

      {message && (
        <p className="text-center text-sm font-medium py-2">{message}</p>
      )}

      <div className="flex gap-2 justify-end">
        <Button fullWidth color="primary" type="submit" isLoading={loading}>
          Register
        </Button>
      </div>

      <p className="text-center text-small py-2">
        Already have an account?{" "}
        <Link className="text-blue-700 hover:text-blue-500" href={"/login"}>
          Login
        </Link>
      </p>
    </ACForm>
  );
};

export default RegistrationForm;
