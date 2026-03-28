"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/signin" })}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container text-on-surface-variant font-bold text-sm hover:bg-error/10 hover:text-error transition-colors"
    >
      <span className="material-symbols-outlined text-sm">logout</span>
      Sign Out
    </button>
  );
}
