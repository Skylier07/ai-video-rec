export default function Home() {
  return (
    <div className="px-6 py-12 md:px-12 lg:px-24">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10"></div>
      
      <header className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-primary mb-4 leading-tight">
          Your Academic Ally
        </h1>
        <p className="text-on-surface-variant text-lg md:text-xl font-medium max-w-2xl mx-auto">
          Transform complex study materials into clear, actionable insights in seconds. Upload, paste, and master your subjects.
        </p>
      </header>
      
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Large Upload Box */}
        <div className="flex justify-center mb-10">
          <button className="gold-gradient text-primary px-10 py-4 rounded-xl font-extrabold text-lg shadow-xl shadow-secondary/30 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
            Help Me Understand
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </button>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-surface-container-lowest border-2 border-dashed border-outline-variant/30 rounded-2xl p-12 md:p-20 text-center flex flex-col items-center justify-center cursor-pointer transition-all hover:border-primary/40 hover:bg-surface-container-low">
            <div className="w-20 h-20 gold-gradient rounded-full flex items-center justify-center text-primary mb-6 shadow-lg shadow-secondary/20 animate-pulse">
              <span className="material-symbols-outlined !text-4xl">cloud_upload</span>
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-2">Drop your files here</h3>
            <p className="text-on-surface-variant mb-8">PDF, Images, or Documents (Max 50MB)</p>
            <button className="px-8 py-3 academic-gradient text-white rounded-lg font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
              Select Files
            </button>
          </div>
        </div>
        
        {/* Input Area */}
        <div className="relative">
          <div className="bg-surface-container-low rounded-xl p-6 shadow-sm border border-outline-variant/10">
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Or paste your question here...</label>
            <textarea className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-lg text-on-surface placeholder:text-outline-variant resize-none h-32" placeholder="Type or paste text, links, or specific academic questions..."></textarea>
          </div>
        </div>
        
        {/* Feature Grid (Asymmetric) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <div className="md:col-span-2 bg-primary text-on-primary rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined !text-9xl">menu_book</span>
            </div>
            <div className="relative z-10">
              <span className="bg-secondary text-on-secondary-fixed px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-4 inline-block">Flashcards</span>
              <h4 className="text-2xl font-bold mb-2">Instant Deck Creation</h4>
              <p className="text-primary-fixed-dim text-sm max-w-md">Turn your notes into interactive flashcards powered by AI memory algorithms.</p>
            </div>
          </div>
          <div className="bg-surface-container-highest rounded-2xl p-8 border border-outline-variant/20 hover:shadow-[0_0_15px_rgba(0,35,111,0.5)] transition-all">
            <div className="text-primary mb-4">
              <span className="material-symbols-outlined !text-3xl">history_edu</span>
            </div>
            <h4 className="text-lg font-bold text-primary mb-1">Summarize</h4>
            <p className="text-on-surface-variant text-sm">Condense 50-page PDFs into 5-minute summaries.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
