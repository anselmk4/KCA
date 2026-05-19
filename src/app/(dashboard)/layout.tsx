import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex font-sans">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Wrapper */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <DashboardHeader />
        
        {/* Page Content */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
