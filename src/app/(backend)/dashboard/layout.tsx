'use client'
import { useSession } from "next-auth/react";
import { Header } from "../_compononents/_dashboard/header";
import { Sidebar } from "../_compononents/_dashboard/sidebar";
import SidebarTwo from "../_compononents/_dashboard/SidebarTwo";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";


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

  const handleCollapsed =()=>{
    setCollapsed(!collapsed)
  }


  return (
    
      <div className="flex h-screen">
        <SidebarTwo role={role} toggleCollapse={handleCollapsed}  collapsed={collapsed} />
        <div className="w-full">
         
          <main   className={`${collapsed ? "ml-0":"md:ml-[256px] ml-0"} transition-all duration-1000 flex-1  flex flex-col `}
          
        >  
        
        <Header handleCollapsed={handleCollapsed} />
         <div className="p-4">
           {children}
         </div>
          </main>
        </div>
      </div>
   
  );
}