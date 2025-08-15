'use client'
import { useSession } from "next-auth/react";
import { Header } from "../_compononents/_dashboard/header";
import { Sidebar } from "../_compononents/_dashboard/sidebar";
import SidebarTwo from "../_compononents/_dashboard/SidebarTwo";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {data:session}=useSession()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false); 

  const role = session?.user.role

  if(!role){
    return router.push('/')
  }

   const sidebarWidth = collapsed ? 64 : 256;
  return (
    
      <div className="flex h-screen">
        <SidebarTwo role={role} toggleCollapse={()=>setCollapsed}  />
        <div className="w-full">
         
          <main   className="transition-all duration-300 flex-1 flex-1 flex flex-col "
          style={{ marginLeft: sidebarWidth }}
        >  <Header />
         <div className="p-4">
           {children}
         </div>
          </main>
        </div>
      </div>
   
  );
}