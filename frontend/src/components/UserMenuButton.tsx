"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRef, useState, useEffect } from 'react';

export default function UserMenuButton() {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <div className="flex items-center gap-4 relative" ref={dropdownRef}>
      <button
        id="user-menu-button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="relative w-10 h-10 rounded-full overflow-hidden hover:ring-2 hover:ring-[#e9c349] transition-all bg-slate-100 dark:bg-white/10 flex items-center justify-center focus:outline-none"
        aria-label="Open user menu"
        aria-expanded={dropdownOpen}
      >
        {session?.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User Profile"}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="material-symbols-outlined text-[#00236f] dark:text-[#e9c349]">account_circle</span>
        )}
      </button>

      {/* Dropdown panel */}
      <div
        className={`absolute right-0 top-14 w-52 rounded-xl bg-white dark:bg-[#001a4d] shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden transition-all duration-200 origin-top-right ${
          dropdownOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="user-menu-button"
      >
        {/* User info header */}
        {session?.user && (
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10">
            <p className="text-sm font-bold text-[#00236f] dark:text-[#e9c349] truncate">{session.user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{session.user.email}</p>
          </div>
        )}

        {/* Settings */}
        <Link
          href="/settings"
          role="menuitem"
          onClick={() => setDropdownOpen(false)}
          className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px] text-slate-400">settings</span>
          Settings
        </Link>

        {/* Sign out */}
        <button
          role="menuitem"
          onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: '/signin' }); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Sign out
        </button>
      </div>
    </div>
  );
}
