export default function Results() {
  return (
    <div className="mt-8 px-6 max-w-7xl mx-auto pb-24">
      {/* Hero Stats / Title Section */}
      <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div className="absolute -top-10 left-4 bg-primary-container text-on-primary-container text-[10px] px-2 py-1 rounded font-bold uppercase tracking-tighter shadow-sm border border-primary/10">Results Screen</div>
        <div>
          <span className="label-md text-on-secondary-fixed-variant bg-secondary-fixed px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-3 inline-block">Analysis Complete</span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary leading-tight">Quantum Mechanics <br/><span className="text-secondary">Advanced Lecture II</span></h2>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10 min-w-[120px] text-center">
            <p className="text-[10px] font-bold text-outline uppercase tracking-tighter mb-1">Score</p>
            <p className="text-2xl font-black text-primary">92%</p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10 min-w-[120px] text-center">
            <p className="text-[10px] font-bold text-outline uppercase tracking-tighter mb-1">Concepts</p>
            <p className="text-2xl font-black text-primary">14</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Key Question and Concepts */}
        <div className="lg:col-span-7 space-y-8">
          {/* Main Question Card */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm relative group border border-outline-variant/10">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary"></div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary-fixed px-3 py-1 rounded">Extracted Question</span>
                <span className="text-xs text-outline font-bold">Question 4 of 12</span>
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-8 leading-snug">
                How does the Schrödinger equation differentiate between stationary and non-stationary states in a time-independent potential?
              </h3>
              
              {/* Concepts Pills */}
              <div className="flex flex-wrap gap-2 mb-10">
                <span className="px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-lg text-xs font-bold border border-secondary/10 hover:shadow-glow-gold transition-all cursor-default flex items-center">
                  <span className="material-symbols-outlined text-[14px] mr-1">bolt</span> Wave Function
                </span>
                <span className="px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-lg text-xs font-bold border border-secondary/10 hover:shadow-glow-gold transition-all cursor-default flex items-center">
                  <span className="material-symbols-outlined text-[14px] mr-1">auto_awesome</span> Probability Density
                </span>
                <span className="px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-lg text-xs font-bold border border-secondary/10 hover:shadow-glow-gold transition-all cursor-default flex items-center">
                  <span className="material-symbols-outlined text-[14px] mr-1">psychology</span> Eigenstates
                </span>
              </div>
              
              <button className="flex items-center justify-center gap-3 w-full py-4 bg-surface-container text-outline font-bold rounded-lg cursor-not-allowed opacity-60 border border-outline-variant/20" disabled={true}>
                <span className="material-symbols-outlined">lock</span>
                Reveal Answer
              </button>
              <p className="text-center text-[10px] text-outline mt-3 font-semibold uppercase tracking-widest">Complete the video segment to unlock</p>
            </div>
          </div>

          {/* Discussion Section */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h4 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">forum</span>
              AI Insights
            </h4>
            <div className="space-y-4">
              <div className="bg-surface-container-lowest p-4 rounded-lg border-l-2 border-primary-fixed-dim">
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  The professor emphasizes the <span className="font-bold text-primary">Separation of Variables</span> technique here. Look closely at how the time component simplifies to a phase factor.
                </p>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-lg border-l-2 border-primary-fixed-dim">
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Stationary states have a probability density that remains <span className="underline decoration-secondary decoration-2 font-bold">constant over time</span>. This is the key distinction to memorize for the midterm.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Video Snippets Vertical Feed */}
        <div className="lg:col-span-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-primary tracking-tight">Relevant Snips</h3>
            <button className="text-xs font-bold text-secondary uppercase tracking-widest">View All</button>
          </div>
          
          <div className="space-y-6">
            {/* Video Card 1 */}
            <div className="group relative bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-gold border border-outline-variant/10">
              <div className="aspect-video relative overflow-hidden bg-slate-200">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Chalkboard with complex quantum physics equations" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP00pWYv8Vxuvs8ovzWemWFFHaUUvsf7S9EWgxfJZiK7ZBSetjtnnkXHEUseGLs3tLtUcirelbBWZEAbhy-2A69A6RwM7oehucEwGIQwza6Bdbkt3x4uSUw0JxnCcx0AEo9Q2AG2CLyi9Ny8Mg-6cKduZIPefnzQbYz5JRyGb4BDg3B7Pjp6kRyiwtFZeNn3cYN-7Nvu91kPbXkQ0cfL0iRCDrGVRgvrAbLufoMhpHBR0HLYf1SHetEYwoz07bFZbdilcCNCYfegI" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <span className="bg-primary-container text-on-primary-container text-[10px] font-black px-2 py-1 rounded">02:45 - 04:12</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-on-secondary-fixed text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-on-surface text-sm mb-1 group-hover:text-primary transition-colors">Deriving the Time-Independent Form</h4>
                <p className="text-xs text-on-surface-variant line-clamp-2">Understanding how the partial differential equation reduces when potential is constant.</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span className="text-[10px] font-black text-outline uppercase tracking-widest">High Importance</span>
                </div>
              </div>
            </div>

            {/* Video Card 2 */}
            <div className="group relative bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-gold border border-outline-variant/10">
              <div className="aspect-video relative overflow-hidden bg-slate-200">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Laboratory with glowing blue test tubes" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKtuX9NWTzW89gswW5eztJSj_LXliyz-MqMDElz3GOaZ-KQHAtLAC63YOnhf1mxw7nwQXKms3AYAJzT0oh-RGEc3XmfX0sjjK-rwEKCDfm0DUVx13Qi6xEjmOR0wE85FtnCF9no8e2hbLW8CMpka_RHqA-mhd4WrtEX46VlSoZEK2_3QxRh9HB3FoKJg-f2bp5tLIb_KABfkklqdQKJZjly-qNKot8AU6QYHXZK86pE6UpFarHxRYtt1bdrSRn8k5neIbU-Y9s9k8" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <span className="bg-primary-container text-on-primary-container text-[10px] font-black px-2 py-1 rounded">12:10 - 14:00</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-on-secondary-fixed text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-on-surface text-sm mb-1 group-hover:text-primary transition-colors">Physical Interpretation of Psi</h4>
                <p className="text-xs text-on-surface-variant line-clamp-2">The relationship between the wave function and actual physical measurement outcomes.</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-fixed-dim"></span>
                  <span className="text-[10px] font-black text-outline uppercase tracking-widest">Conceptual Basis</span>
                </div>
              </div>
            </div>

            {/* Video Card 3 */}
            <div className="group relative bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-gold border border-outline-variant/10">
              <div className="aspect-video relative overflow-hidden bg-slate-200">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Brightly lit lecture hall" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmmdcEL7OphoWip902-teX3salZikw2S4O7N-Q02IAuwG30r4X--LC6tf5Qbwvh-oluv7tXl0iWo_sfhn7Zv1tucxbY6An8uvDRB_CGQ_2_2qByFqBUEv34RseLwd655QUngLp9y3yGI2FDJeYpJbPJ-nj2Mnqc46muN3iqUNpMP3WQsHy2H4cXLXD7jxZQTf4xmd7e-Yn7NVu72l32yJDgRce5G-hRZc7tF_f31NX5QQ8Le_SY-Mv-DshkYwQCfL9txCEwyCInvg" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <span className="bg-primary-container text-on-primary-container text-[10px] font-black px-2 py-1 rounded">21:55 - 24:30</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-on-secondary-fixed text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-on-surface text-sm mb-1 group-hover:text-primary transition-colors">Normalization Techniques</h4>
                <p className="text-xs text-on-surface-variant line-clamp-2">Mathematical steps required to ensure the total probability equals one.</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-error"></span>
                  <span className="text-[10px] font-black text-outline uppercase tracking-widest">Review Recommended</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Floating Action Button for Help (Custom context) */}
      <button className="fixed bottom-24 lg:bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group z-50">
        <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">chat_bubble</span>
      </button>
    </div>
  );
}
