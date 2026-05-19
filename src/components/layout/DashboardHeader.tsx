import { Search, Bell, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function DashboardHeader() {
  return (
    <header className="h-16 bg-white dark:bg-zinc-900 flex items-center justify-between px-8 border-b border-zinc-200 dark:border-white/10">
      <div className="flex items-center text-sm text-zinc-500 dark:text-zinc-400">
        <span>Dashboard</span>
        <span className="mx-2">›</span>
        <span className="text-zinc-900 dark:text-zinc-100 font-medium">Vue d'ensemble</span>
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64 transition-all"
          />
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <div className="flex items-center space-x-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700">
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">Solde: 0$</span>
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          </div>
          
          <button className="relative p-2 bg-white border border-zinc-200 rounded-full hover:bg-zinc-50 text-zinc-600">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          
          <div className="flex items-center space-x-3 cursor-pointer pl-2 border-l border-zinc-200">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              AN
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-zinc-900 leading-none">Ansel</p>
              <p className="text-xs text-zinc-500 mt-1">Plan Gratuit</p>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          </div>
        </div>
      </div>
    </header>
  );
}
