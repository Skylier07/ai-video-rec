import { auth } from "@/auth";
import ThemeToggleSetting from "@/components/ThemeToggleSetting";
import SolveModeSetting from "@/components/SolveModeSetting";
import ClearHistoryButton from "@/components/ClearHistoryButton";
import SignOutButton from "@/components/SignOutButton";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 md:py-24 pb-24">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
          Settings
        </h1>
        <p className="text-on-surface-variant text-lg">
          Manage your preferences and account.
        </p>
      </header>

      <div className="space-y-4">
        {/* Account */}
        <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10">
          <h2 className="text-xs font-black text-outline uppercase tracking-widest mb-4">Account</h2>
          {session ? (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-lg overflow-hidden shrink-0">
                  {session.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.image} alt={session.user.name ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    (session.user?.name?.[0] ?? session.user?.email?.[0] ?? "?").toUpperCase()
                  )}
                </div>
                <div>
                  {session.user?.name && (
                    <p className="font-bold text-on-surface text-sm">{session.user.name}</p>
                  )}
                  {session.user?.email && (
                    <p className="text-xs text-on-surface-variant">{session.user.email}</p>
                  )}
                </div>
              </div>
              <SignOutButton />
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">Not signed in.</p>
          )}
        </section>

        {/* Appearance */}
        <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10">
          <h2 className="text-xs font-black text-outline uppercase tracking-widest mb-4">Appearance</h2>
          <ThemeToggleSetting />
        </section>

        {/* Solution Quality */}
        <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10">
          <h2 className="text-xs font-black text-outline uppercase tracking-widest mb-4">Solution Quality</h2>
          <SolveModeSetting />
        </section>

        {/* Data & Privacy */}
        <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10">
          <h2 className="text-xs font-black text-outline uppercase tracking-widest mb-4">Data & Privacy</h2>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-bold text-on-surface">Question History</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Permanently delete all your past questions and sessions.
              </p>
            </div>
            {userId && <ClearHistoryButton userId={userId} />}
          </div>
        </section>
      </div>
    </div>
  );
}
