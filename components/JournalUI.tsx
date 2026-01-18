
import React, { useState } from 'react';

export const IvyFrame: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
    <div className="absolute top-0 right-0 w-64 h-full opacity-40 pointer-events-none">
       <svg viewBox="0 0 200 600" className="w-full h-full text-[#7a8c6e] fill-current">
          <path d="M150,0 Q180,150 120,300 T160,600 M120,50 Q140,80 160,50 M170,250 Q190,280 150,290 M140,450 Q160,480 130,500" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M160,50 Q180,60 170,80 Q150,90 160,50" />
          <path d="M140,200 Q160,210 150,230 Q130,240 140,200" />
          <path d="M150,400 Q170,410 160,430 Q140,440 150,400" />
       </svg>
    </div>
    <div className="absolute bottom-0 left-0 w-48 h-48 opacity-20 transform -rotate-90">
       <svg viewBox="0 0 200 200" className="w-full h-full text-[#7a8c6e] fill-current">
          <path d="M0,200 Q100,100 200,200" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="150" r="5" />
          <circle cx="150" cy="150" r="5" />
       </svg>
    </div>
  </div>
);

export const PageCorner: React.FC<{ flipped?: boolean }> = ({ flipped }) => (
  <div className={`absolute bottom-0 ${flipped ? 'left-0' : 'right-0'} w-12 h-12 bg-[#e2d9c2] opacity-30 pointer-events-none`} 
       style={{ clipPath: flipped ? "polygon(0 0, 0% 100%, 100% 100%)" : "polygon(100% 0, 0% 100%, 100% 100%)" }} />
);

export const StoryPaper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`paper-texture p-16 h-full relative overflow-hidden flex flex-col vine-frame ${className}`}>
    <IvyFrame />
    <div className="relative z-10 flex-1 flex flex-col h-full">
      {children}
    </div>
    <PageCorner />
  </div>
);

export const LoreSeal: React.FC<{ text: string }> = ({ text }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-10 left-10 z-40 group">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-8 h-8 rounded-full flex items-center justify-center border border-[#c9b996] hover:bg-[#e2d9c2] transition-all shadow-sm group-hover:scale-110 active:scale-95 duration-300 ${!isOpen ? 'lore-pulse bg-[#e2d9c2]/60' : 'bg-[#e2d9c2]'}`}
        title="A secret lies here..."
      >
        <span className="text-[#4a3728] script-font text-lg select-none">i</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-10 left-0 w-48 p-4 bg-[#fffcf5] border border-[#c9b996] shadow-xl rounded-sm animate-in fade-in slide-in-from-top-2 duration-300 z-50 magical-glow">
          <div className="script-font text-base text-[#7a8c6e] leading-tight italic shimmer-text">
            {text}
          </div>
          <div className="absolute -top-2 left-3 w-4 h-4 bg-[#fffcf5] border-l border-t border-[#c9b996] rotate-45" />
        </div>
      )}
    </div>
  );
};

export const ParchmentScrap: React.FC<{ text: string; onClose: () => void }> = ({ text, onClose }) => {
  return (
    <div 
      className="absolute bottom-4 right-4 z-50 p-6 bg-[#f7f2e8] border border-[#d4c4a8] shadow-2xl rounded-sm max-w-[200px] animate-in slide-in-from-right-4 fade-in duration-500 transform rotate-1 magical-glow"
      style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/handmade-paper.png')" }}
    >
      <button 
        onClick={onClose}
        className="absolute top-1 right-2 text-[#4a3728] opacity-50 hover:opacity-100 text-xs font-bold"
      >
        ✕
      </button>
      <div className="absolute top-0 left-0 w-full h-1 bg-[#d4c4a8]/30" />
      <p className="script-font text-xl text-[#7a8c6e] italic leading-snug shimmer-text">
        {text}
      </p>
      <div className="mt-2 text-[10px] opacity-30 text-right uppercase tracking-widest font-bold">Character Memory</div>
    </div>
  );
};
