"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Bell, Menu, Search, User } from "lucide-react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import ProfileBar from "@/components/shared/ProfileBar";
import { useRouter } from "next/navigation";
import { ThemeSwitch } from "@/components/theme-switch";

export function Header({ handleCollapsed }: any) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <header className=" shadow">
      <div className="border-b  border-white/5  px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="relative rounded-md shadow-sm">
                <div className="flex justify-end p-2">
                  <button onClick={() => handleCollapsed()}>
                    <Menu size={20} />
                  </button>
                </div>
                {/* <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div> */}
              </div>
            </form>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onPress={() => router.push("/pos")}
              variant="ghost"
              size="sm"
            >
              POS
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>

            <ThemeSwitch />

            <div className="flex items-center space-x-3">
              <ProfileBar />

            
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
