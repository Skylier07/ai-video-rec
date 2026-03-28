import Link from "next/link";
import { auth } from "@/auth";

// Temporary Mock Data for UI rendering until Claude wires the Backend
const mockHistory = [
  {
    id: 1,
    date: "Oct 24, 2023",
    question: "How do the limits of integration change when applying u-substitution in a definite integral?",
    tags: ["Calculus", "Limits"],
    starred: true
  },
  {
    id: 2,
    date: "Oct 22, 2023",
    question: "Explain the primary differences between Keynesian and Classical economic theories regarding market self-correction.",
    tags: ["Economics", "Macro"],
    starred: false
  },
  {
    id: 3,
    date: "Oct 21, 2023",
    question: "What are the structural differences between DNA and RNA nucleotides, and how do these affect stability?",
    tags: ["Biology", "Genetics"],
    starred: false
  },
  {
    id: 4,
    date: "Oct 18, 2023",
    question: "Derive the formula for the volume of a sphere using the shell method in integral calculus.",
    tags: ["Calculus", "Geometry"],
    starred: false
  },
  {
    id: 5,
    date: "Oct 15, 2023",
    question: "Analyze the impact of the printing press on the Reformation in 16th-century Europe.",
    tags: ["History", "Social Science"],
    starred: false
  }
];

export default async function HistoryPage() {
  const session = await auth();

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

      {/* Grid of Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Render Top 4 Dummy Results first */}
        {mockHistory.slice(0, 4).map((entry) => (
          <div key={entry.id} className="group relative bg-surface-container-lowest p-6 rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 border-b-2 border-transparent hover:border-secondary-container">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 font-label">{entry.date}</span>
              {entry.starred && (
                  <span className="material-symbols-outlined text-secondary-fixed-dim" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              )}
            </div>
            <h3 className="text-lg font-bold text-primary mb-3 leading-snug line-clamp-3 group-hover:text-primary-container transition-colors">
              {entry.question}
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {entry.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase tracking-wider rounded">
                    {tag}
                  </span>
              ))}
            </div>
            <div className="flex items-center justify-between mt-auto">
              <Link href={`/results?q=${encodeURIComponent(entry.question)}`} className="text-primary font-bold text-sm flex items-center gap-1 group/btn hover:text-primary-container">
                Revisit
                <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="material-symbols-outlined text-sm">more_vert</span>
              </div>
            </div>
          </div>
        ))}

        {/* Feature Banner */}
        <div className="md:col-span-2 group relative bg-gradient-to-br from-primary to-primary-container p-8 rounded-xl overflow-hidden shadow-2xl shadow-primary/10">
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-primary-container mb-4 block">Scholar's Insight</span>
              <h3 className="text-2xl font-bold text-white mb-4 max-w-md">Your most frequent study topic this week is <span className="text-secondary-fixed underline decoration-2 underline-offset-4">Calculus</span>.</h3>
              <p className="text-on-primary-container/80 max-w-sm">Reviewing your history shows consistent focus on integration techniques. Try a mock exam session to test your mastery.</p>
            </div>
            <button className="mt-8 self-start px-6 py-2.5 bg-secondary-fixed text-on-secondary-fixed font-bold rounded-lg hover:bg-secondary-container transition-all active:scale-95 shadow-sm">
                Start Mastery Quiz
            </button>
          </div>
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-20 pointer-events-none">
            <span className="material-symbols-outlined text-[120px] text-white">auto_awesome</span>
          </div>
        </div>

        {/* Render Remaining Dummy Results */}
        {mockHistory.slice(4).map((entry) => (
          <div key={entry.id} className="group relative bg-surface-container-lowest p-6 rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 border-b-2 border-transparent hover:border-secondary-container flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 font-label">{entry.date}</span>
                {entry.starred && (
                  <span className="material-symbols-outlined text-secondary-fixed-dim" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              )}
            </div>
            <h3 className="text-lg font-bold text-primary mb-3 leading-snug line-clamp-3 group-hover:text-primary-container transition-colors">
              {entry.question}
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
               {entry.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase tracking-wider rounded">
                    {tag}
                  </span>
              ))}
            </div>
            <div className="flex items-center justify-between mt-auto">
              <Link href={`/results?q=${encodeURIComponent(entry.question)}`} className="text-primary font-bold text-sm flex items-center gap-1 group/btn hover:text-primary-container">
                Revisit
                <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="material-symbols-outlined text-sm">more_vert</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Pagination */}
      <div className="mt-16 flex justify-center pb-24 lg:pb-0">
        <button className="flex items-center gap-3 px-8 py-3 rounded-full border border-outline-variant/30 text-on-surface-variant font-bold hover:bg-surface-container-low transition-all">
            Load More Entries
            <span className="material-symbols-outlined">expand_more</span>
        </button>
      </div>
    </div>
  );
}
