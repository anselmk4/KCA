"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Award, 
  Users, 
  Settings, 
  LogOut,
  CreditCard,
  X,
  LifeBuoy,
  Compass,
  Video,
  UserCircle
} from "lucide-react";
import { clearSimulatedSession } from "@/lib/rbac";
import { supabase } from "@/lib/supabase/client";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "Vue d'ensemble", href: "/dashboard" },
    { icon: <Compass className="w-5 h-5" />, label: "Découvrir", href: "/dashboard/discover" },
    { icon: <BookOpen className="w-5 h-5" />, label: "Mes Formations", href: "/dashboard/courses" },
    { icon: <Video className="w-5 h-5" />, label: "Session Live", href: "/dashboard/live" },
    { icon: <CreditCard className="w-5 h-5" />, label: "Paiements", href: "/dashboard/payments" },
    { icon: <Award className="w-5 h-5" />, label: "Certificats", href: "/dashboard/certificates" },
    { icon: <Users className="w-5 h-5" />, label: "Communauté", href: "/dashboard/community" },
    { icon: <LifeBuoy className="w-5 h-5" />, label: "Support Technique", href: "/dashboard/support" },
    ...(userId ? [{ icon: <UserCircle className="w-5 h-5" />, label: "Mon Profil", href: `/dashboard/profile/${userId}` }] : []),
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearSimulatedSession();
    router.push("/login");
  };

  return (
    <aside className={`w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-screen flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300
      ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-100 dark:border-zinc-800">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="ANSELLA" width={100} height={30} className="object-contain h-7 w-auto" />
        </Link>
        <button className="lg:hidden p-1 text-zinc-500" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 py-6 px-4 flex flex-col gap-1 overflow-y-auto">
        {menuItems.map((item, index) => {
          const active = pathname === item.href;
          return (
            <Link 
              key={index} 
              href={item.href}
              onClick={onClose}
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
          onClick={onClose}
          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
            pathname === "/dashboard/settings"
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold" 
              : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm">Paramètres</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}

