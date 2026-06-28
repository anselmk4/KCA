"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, LogOut, ShieldAlert, LifeBuoy, BookOpen, Coins, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getSimulatedSession, canAccessRoute } from "@/lib/rbac";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE_ADMIN", "ACADEMIC_ADMIN", "SUPPORT_AGENT"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const session = getSimulatedSession();
    if (!ADMIN_ROLES.includes(session.role)) {
      router.replace("/");
    }
  }, [router]);

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "Vue d'ensemble", href: "/admin" },
    { icon: <Users className="w-5 h-5" />, label: "Utilisateurs", href: "/admin/users" },
    { icon: <BookOpen className="w-5 h-5" />, label: "Validation Cours", href: "/admin/courses" },
    { icon: <CreditCard className="w-5 h-5" />, label: "Transactions", href: "/admin/transactions" },
    { icon: <Coins className="w-5 h-5" />, label: "Commissions & Payouts", href: "/admin/payouts" },
    { icon: <LifeBuoy className="w-5 h-5" />, label: "Tickets Support", href: "/admin/support" },
    { icon: <Settings className="w-5 h-5" />, label: "Configuration", href: "/admin/settings" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex font-sans">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-screen flex flex-col fixed left-0 top-0">
        <div className="h-16 flex items-center px-6 border-b border-zinc-100 dark:border-zinc-800">
          <Link href="/" className="flex items-center space-x-2">
            <ShieldAlert className="h-6 w-6 text-red-600" />
            <span className="font-bold text-lg text-zinc-900 dark:text-white">Admin Kuettu</span>
          </Link>
        </div>
        
        <div className="flex-1 py-6 px-4 flex flex-col gap-1 overflow-y-auto">
          {menuItems.map((item, index) => {
            const active = pathname === item.href;
            return (
              <Link 
                key={index} 
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  active 
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 font-semibold" 
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1">
          <Link 
            href="/dashboard"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Quitter l'Admin</span>
          </Link>
        </div>
      </aside>
      
      {/* Main Content Wrapper */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white dark:bg-zinc-900 flex items-center justify-between px-8 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
          <div className="flex items-center text-sm font-semibold text-red-600">
            Mode Administrateur
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
              AD
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
