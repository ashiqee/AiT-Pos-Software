"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { FieldValues } from "react-hook-form";
import { getSession, signIn } from "next-auth/react";
import ACInput from "@/components/forms/ACInput";
import ACForm from "@/components/forms/ACForm";

import Loading from "@/components/shared/Loading";
import { toast } from "sonner";
import { Button, Card, CardBody } from "@heroui/react";

const LoginPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect");
 
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);


  const handleLoginData = async (data: FieldValues) => {
   
    setLoading(true);
    const toastId = toast.loading("Logging in...");
    const credentials = {
      identifier: data.identifier,
      password: data.password,
    };

    console.log(credentials);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        ...credentials,
      });

      if (result?.error) {
        toast.error("Invalid credentials", { id: toastId });
        console.log("Login failed:", result.error);
        setLoading(false);
        return;
      }

      toast.success("Login successful", { id: toastId });

      const session = await getSession();
      // const role = session?.user?.role;

      if (redirect) {
        router.push(redirect);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Something went wrong", { id: toastId });
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      {loading ? <Loading />:
      <motion.div animate={{ y: [-200, 100, 0] }}>
        <Card
          isBlurred
          className="border-none md:max-w-[40vw] mx-auto bg-background/60 dark:text-white text-primary dark:bg-default-100/50 "
          shadow="md"
        >
          <CardBody className="p-10  md:p-20 2xl:px-40">
            <div className=" text-center pb-10">
              <Link href={"/"}>
                {" "}
                <h2 className="text-3xl font-bold uppercase">AiT POS Software</h2>
              </Link>
              <h3>Login Now</h3>
            </div>

            <ACForm
              //! Only for development
              defaultValues={{
                identifier: "ashiq.buet73@gmail.com",
                password: "123456",
              }}
              onSubmit={handleLoginData}
            >
              <div className="py-3">
                {" "}
                <ACInput
                  isRequired
                  label="Email"
                  name="identifier"
                  type="email"
                />
              </div>
              <div className="py-3">
                {" "}
                <ACInput
                  isRequired
                  label="Password"
                  name="password"
                  type="password"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button fullWidth color="primary" type="submit">
                  Login
                </Button>
              </div>
              <p className="text-center  text-small py-2">
                Forgot passowrd?{" "}
                <Link className="text-primary-700" href={"/reset-password"}>
                  Reset
                </Link>
              </p>
            </ACForm>
          </CardBody>
        </Card>
      </motion.div>}
    </>
  );
};

export default LoginPage;
