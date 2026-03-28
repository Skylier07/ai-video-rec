import { auth } from "@/auth";
import { getHistory } from "@/lib/api";
import RevisitButton from "@/components/RevisitButton";

export default async function HistoryPage() {
  const session = await auth();
  const userId = session?.user?.id;
  
  let historyEntries: any[] = [];
  if (userId) {
     try {
       historyEntries = await getHistory(userId);
     } catch (e) {
       console.error("Failed to fetch history:", e);
     }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-24">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">Question History</h1>
          <p className="text-on-surface-variant text-lg">Revisit your past inquiries and mastered concepts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-low text-on-surface-variant font-medium text-sm hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-low text-on-surface-variant font-medium text-sm hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-sm">sort</span>
            Newest First
          </button>
        </div>
      </header>

      {historyEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-24 text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 mb-4">history_off</span>
          <h2 className="text-2xl font-bold text-on-surface mb-2">No history yet</h2>
          <p className="text-on-surface-variant">Your processed questions will appear here.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Render Top Results */}
            {historyEntries.map((entry) => {
              const formattedDate = new Date(entry.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              });
              return (
                 <div key={entry.id} className="group relative bg-surface-container-lowest p-6 rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 border-b-2 border-transparent hover:border-secondary-container">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 font-label">{formattedDate}</span>
                    </div>
                    <h3 className="text-lg font-bold text-primary mb-3 leading-snug line-clamp-3 group-hover:text-primary-container transition-colors">
                      {entry.extracted_question}
                    </h3>
                    <div className="flex items-center justify-between mt-auto">
                      <RevisitButton entry={entry} />
                      <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="material-symbols-outlined text-sm">more_vert</span>
                      </div>
                    </div>
                 </div>
              );
            })}
          </div>

          <div className="mt-16 flex justify-center pb-24 lg:pb-0">
            <button className="flex items-center gap-3 px-8 py-3 rounded-full border border-outline-variant/30 text-on-surface-variant font-bold hover:bg-surface-container-low transition-all">
                Load More Entries
                <span className="material-symbols-outlined">expand_more</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
