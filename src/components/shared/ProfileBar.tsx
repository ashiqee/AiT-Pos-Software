"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  User,
  Spinner,
  AvatarIcon,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { User2Icon } from "lucide-react";


export default function ProfileBar() {
  const { data: session, status } = useSession();
  const router = useRouter()

  if (status === "loading") return <Spinner color="warning" size="sm" labelColor="warning" />;


  if (!session)
    return (
      <button onClick={() => signIn()} className=" text-xl cursor-pointer">
        <User2Icon size={20}  />
      </button>
    );

  return (
    <div className="flex flex-col items-center gap-2">
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Avatar
            isBordered
            as="button"
            className="transition-transform"
            src="https://i.pravatar.cc/150?img=11"
          />
        </DropdownTrigger>
        <DropdownMenu aria-label="Profile Actions" variant="flat">
          <DropdownItem key="profile" className="h-14 gap-2">
            <p>Welcome, {session.user?.name}</p>
            <p className="font-semibold">{session.user?.role}</p>
          </DropdownItem>
          <DropdownItem key="settings">
            <Link href={`/dashboard/${session.user?.role}`}>Dashboard</Link>
          </DropdownItem>
          <DropdownItem key="analytics">
            <Link href={`/${session.user?.role}/settings/profile`}>
              Profile Settings
            </Link>
          </DropdownItem>
          <DropdownItem key="logout" color="danger">
            <button
              onClick={() => signOut()}
              className="text-red-500 underline"
            >
              Sign Out
            </button>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
     
    </div>
  );
}
