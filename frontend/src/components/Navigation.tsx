"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Load the user menu entirely client-side — avoids SSR/hydration mismatch
// from useSession returning different values on server vs client.
const UserMenuButton = dynamic(() => import('./UserMenuButton'), { ssr: false });

export function TopNavBar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#00236f]/80 backdrop-blur-xl shadow-[0_16px_32px_rgba(0,35,111,0.04)] flex justify-between items-center px-6 h-16">
      <div className="flex items-center gap-8">
        <span className="text-2xl font-extrabold tracking-tighter text-[#00236f] dark:text-[#e9c349]">
          StudySnip
        </span>
        <div className="hidden md:flex gap-6 items-center">
          <Link
            className={`font-manrope font-bold tracking-tight px-1 h-16 flex items-center transition-all duration-300 ${
              isActive('/')
                ? 'text-[#00236f] dark:text-[#e9c349] border-b-2 border-[#e9c349]'
                : 'text-slate-500 dark:text-slate-300 hover:text-[#00236f] dark:hover:text-[#e9c349]'
            }`}
            href="/"
          >
            Home
          </Link>
          <Link
            className={`font-manrope font-bold tracking-tight px-3 py-1 rounded-lg transition-all duration-300 ${
              isActive('/history')
                ? 'text-[#00236f] dark:text-[#e9c349] bg-slate-100 dark:bg-white/10'
                : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
            href="/history"
          >
            History
          </Link>
        </div>
      </div>

      {/* User menu loaded purely client-side via dynamic import (ssr:false) */}
      <UserMenuButton />

      <div className="bg-gradient-to-r from-[#00236f] to-[#1e3a8a] h-[2px] w-full absolute bottom-0 left-0"></div>
    </nav>
  );
}


export function SideNavBar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  
  return (
    <aside className="h-screen w-64 hidden lg:flex flex-col border-r border-slate-100 dark:border-white/5 bg-[#faf8ff] dark:bg-[#001a4d] p-4 gap-4">
      <div className="mb-8 px-2">
        <h2 className="text-xl font-black text-[#00236f] dark:text-[#e9c349] leading-tight">
          Study Archive
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Your Knowledge Hub
        </p>
      </div>
      <nav className="space-y-2">
        <Link
          className={`flex items-center gap-3 p-3 rounded-lg font-bold hover:translate-x-1 transition-all duration-200 ${
            isActive('/')
              ? 'text-[#00236f] dark:text-[#e9c349] bg-[#e3e1e9] dark:bg-[#1e3a8a]'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
          }`}
          href="/"
        >
          <span className="material-symbols-outlined">home</span>
          <span className="font-manrope text-sm font-semibold uppercase tracking-widest">
            Home
          </span>
        </Link>
        <Link
          className={`flex items-center gap-3 p-3 rounded-lg font-bold hover:translate-x-1 transition-all duration-200 ${
            isActive('/history')
              ? 'text-[#00236f] dark:text-[#e9c349] bg-[#e3e1e9] dark:bg-[#1e3a8a]'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
          }`}
          href="/history"
        >
          <span className="material-symbols-outlined">history</span>
          <span className="font-manrope text-sm font-semibold uppercase tracking-widest">
            History
          </span>
        </Link>
        <Link
          className={`flex items-center gap-3 p-3 rounded-lg font-bold hover:translate-x-1 transition-all duration-200 ${
            isActive('/settings')
              ? 'text-[#00236f] dark:text-[#e9c349] bg-[#e3e1e9] dark:bg-[#1e3a8a]'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
          }`}
          href="/settings"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-manrope text-sm font-semibold uppercase tracking-widest">
            Settings
          </span>
        </Link>
      </nav>
      <div className="mt-auto p-4 bg-[#f4f3fa] dark:bg-[#00236f] rounded-xl border border-white/40">
        <p className="text-xs font-bold text-primary mb-2">PRO FEATURES</p>
        <button className="w-full py-2 bg-[#00236f] text-[#e9c349] rounded-lg font-bold text-sm hover:shadow-[0_0_15px_rgba(0,35,111,0.5)] transition-all">
          Upgrade to Pro
        </button>
      </div>
    </aside>
  );
}

export function BottomNavBar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  
  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-end px-4 pb-4 h-20 bg-white/90 dark:bg-[#001a4d]/90 backdrop-blur-md rounded-t-2xl border-t border-slate-100 dark:border-white/5 shadow-[0_-8px_24px_rgba(0,0,0,0.05)] lg:hidden z-50">
      <Link
        className={`flex flex-col items-center justify-center p-3 transition-all duration-300 ${
          isActive('/')
            ? 'bg-[#ffe088] dark:bg-[#e9c349] text-[#00236f] rounded-2xl transform -translate-y-2 animate-bounce-subtle shadow-lg'
            : 'text-slate-500 dark:text-slate-400 hover:text-[#00236f]'
        }`}
        href="/"
      >
        <span className="material-symbols-outlined">home</span>
        <span className="font-manrope text-[10px] font-medium">Home</span>
      </Link>
      <Link
        className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-2 hover:text-[#00236f] dark:hover:text-[#e9c349] transition-all"
        href="#"
      >
        <span className="material-symbols-outlined">search</span>
        <span className="font-manrope text-[10px] font-medium">Search</span>
      </Link>
      <Link
        className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-2 hover:text-[#00236f] dark:hover:text-[#e9c349] transition-all"
        href="#"
      >
        <span className="material-symbols-outlined">auto_awesome</span>
        <span className="font-manrope text-[10px] font-medium">Snip</span>
      </Link>
      <Link
        className={`flex flex-col items-center justify-center p-3 transition-all duration-300 ${
          isActive('/history')
            ? 'bg-[#ffe088] dark:bg-[#e9c349] text-[#00236f] rounded-2xl transform -translate-y-2 animate-bounce-subtle shadow-lg'
            : 'text-slate-500 dark:text-slate-400 hover:text-[#00236f]'
        }`}
        href="/history"
      >
        <span className="material-symbols-outlined">history</span>
        <span className="font-manrope text-[10px] font-medium">History</span>
      </Link>
      <Link
        className={`flex flex-col items-center justify-center p-3 transition-all duration-300 ${
          isActive('/settings')
            ? 'bg-[#ffe088] dark:bg-[#e9c349] text-[#00236f] rounded-2xl transform -translate-y-2 shadow-lg'
            : 'text-slate-500 dark:text-slate-400 hover:text-[#00236f]'
        }`}
        href="/settings"
      >
        <span className="material-symbols-outlined">settings</span>
        <span className="font-manrope text-[10px] font-medium">Settings</span>
      </Link>
    </nav>
  );
}
