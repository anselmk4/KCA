"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  Award, 
  Users, 
  Settings, 
  LogOut,
  GraduationCap,
  CreditCard
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "Vue d'ensemble", href: "/dashboard" },
    { icon: <BookOpen className="w-5 h-5" />, label: "Mes Formations", href: "/dashboard/courses" },
    { icon: <CreditCard className="w-5 h-5" />, label: "Paiements", href: "/dashboard/payments" },
    { icon: <Award className="w-5 h-5" />, label: "Certificats", href: "/dashboard/certificates" },
    { icon: <Users className="w-5 h-5" />, label: "Communauté", href: "/dashboard/community" },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-screen flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-zinc-100 dark:border-zinc-800">
        <Link href="/" className="flex items-center space-x-2">
          <GraduationCap className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-lg text-zinc-900 dark:text-white">Kuettu Pro</span>
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
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold" 
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white"
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
          href="/dashboard/settings"
          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
            pathname === "/dashboard/settings"
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold" 
              : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm">Paramètres</span>
        </Link>
        <Link 
          href="/"
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Déconnexion</span>
        </Link>
      </div>
    </aside>
  );
}
