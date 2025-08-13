import { Header } from "../_compononents/_dashboard/header";
import { Sidebar } from "../_compononents/_dashboard/sidebar";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-black p-6">
            {children}
          </main>
        </div>
      </div>
   
  );
}