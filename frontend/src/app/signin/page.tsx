"use client";

import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col selection:bg-secondary-fixed selection:text-on-secondary-fixed relative overflow-hidden">
      
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-transparent dark:bg-transparent">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-2xl font-black text-[#00236f] dark:text-blue-500 tracking-tighter">
            StudySnip
          </Link>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-4 pulse-gradient relative z-10">
        <div className="w-full max-w-[440px] bg-surface-container-lowest rounded-xl scholar-card p-8 md:p-10 border border-outline-variant/10">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-primary tracking-tight mb-2">Welcome Back</h1>
            <p className="text-on-surface-variant text-sm font-medium">Continue your journey through the illuminated archive.</p>
          </div>

          {/* Social Login */}
          {/* Triggers NextAuth Google Provider */}
          <div className="space-y-4 mb-8">
            <button 
              onClick={() => signIn("google", { redirectTo: "/" })}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-lg bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high transition-all duration-300 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="text-on-surface font-bold text-sm">Sign in with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center mb-8">
            <div className="flex-grow border-t border-outline-variant/20"></div>
            <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-widest text-outline">or</span>
            <div className="flex-grow border-t border-outline-variant/20"></div>
          </div>

          {/* Login Form */}
          <form className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Email Address</label>
              <input className="w-full px-4 py-3 bg-surface-container-low border-b-2 border-transparent focus:border-secondary-fixed-dim focus:ring-0 transition-all duration-300 text-on-surface placeholder:text-outline/50 rounded-t-lg outline-none" placeholder="scholar@studysnip.edu" type="email"/>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Password</label>
                <a className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors" href="#">Forgot Password?</a>
              </div>
              <input className="w-full px-4 py-3 bg-surface-container-low border-b-2 border-transparent focus:border-secondary-fixed-dim focus:ring-0 transition-all duration-300 text-on-surface placeholder:text-outline/50 rounded-t-lg outline-none" placeholder="••••••••" type="password"/>
            </div>

            <button className="w-full py-4 px-6 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold text-sm tracking-wide shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300" type="button">
                Sign In
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-10 text-center">
            <p className="text-sm text-on-surface-variant">
                Don't have an account? 
                <a className="text-primary font-extrabold hover:text-secondary-fixed-dim transition-colors ml-1" href="#">Sign Up</a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 flex flex-col items-center gap-4 mt-auto bg-[#faf8ff] dark:bg-slate-950 relative z-10">
        <div className="flex gap-6">
          <a className="font-manrope text-xs uppercase tracking-widest font-medium text-[#444651] dark:text-slate-500 hover:text-[#00236f] dark:hover:text-blue-300 transition-all opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
          <a className="font-manrope text-xs uppercase tracking-widest font-medium text-[#444651] dark:text-slate-500 hover:text-[#00236f] dark:hover:text-blue-300 transition-all opacity-80 hover:opacity-100" href="#">Terms of Service</a>
          <a className="font-manrope text-xs uppercase tracking-widest font-medium text-[#444651] dark:text-slate-500 hover:text-[#00236f] dark:hover:text-blue-300 transition-all opacity-80 hover:opacity-100" href="#">Contact Support</a>
        </div>
        <p className="font-manrope text-xs uppercase tracking-widest font-medium text-[#444651] dark:text-slate-500">© 2026 StudySnip. The Illuminated Archive.</p>
      </footer>

      {/* Decorative Elements */}
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-secondary-fixed/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
    </div>
  );
}
