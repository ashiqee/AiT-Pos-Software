

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    
      <div className="flex h-screen">
 
       
         
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-black p-6">
            {children}
          </main>
        
      </div>
   
  );
}