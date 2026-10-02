import React from 'react';
import { Layers, Box, Cpu, FileDown, Heart, ShieldCheck, Wind, Pin, PinOff, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface HeaderProps {
  activeTab: 'viewer3d' | 'editor2d' | 'ai_studio' | 'vuc_audit' | 'mep';
  setActiveTab: (tab: 'viewer3d' | 'editor2d' | 'ai_studio' | 'vuc_audit' | 'mep') => void;
  onOpenStory: () => void;
  onOpenExport: () => void;
  onOpenHalton: () => void;
  onOpenDocs?: () => void;
  isVucValid: boolean;
  isVisible?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onReveal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenStory,
  onOpenExport,
  onOpenHalton,
  onOpenDocs,
  isVucValid,
  isVisible = true,
  isPinned = false,
  onTogglePin,
  onMouseEnter,
  onMouseLeave,
  onReveal,
}) => {
  return (
    <>
      {/* Top Extreme Suspended Edge Trigger Tab (visible when header is retracted) */}
      {!isVisible && (
        <div
          onMouseEnter={onReveal}
          onClick={onReveal}
          className="fixed top-0 left-1/2 -translate-x-1/2 z-40 cursor-pointer group pointer-events-auto"
        >
          <div className="bg-neutral-900/95 hover:bg-neutral-850 border-b border-x border-neutral-700/80 px-4 py-1.5 rounded-b-xl text-[11px] font-mono text-neutral-300 hover:text-amber-300 flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all duration-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold tracking-wide">Menu Superior</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-y-0.5 transition-transform" />
          </div>
        </div>
      )}

      {/* 100% Suspended Floating Header Bar */}
      <header
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`fixed top-0 left-0 right-0 z-40 px-6 py-2.5 border-b border-neutral-800/90 bg-neutral-950/95 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-out pointer-events-auto ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Zone 1: Single text element Brand Zone */}
          <div className="flex items-center gap-3">
            <a href="/" className="text-base font-bold tracking-tight text-white hover:text-amber-400 transition-colors">
              MPK Mellieri
            </a>
            <span className="hidden sm:inline text-xs text-neutral-400 border-l border-neutral-800 pl-3 font-mono">
              Monolithe VUC
            </span>
            <span className="text-[10px] text-amber-400/90 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded font-mono hidden lg:inline">
              Menu 100% Suspenso
            </span>
          </div>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-neutral-300">
            <button
              onClick={() => setActiveTab('viewer3d')}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2 rounded-md ${
                activeTab === 'viewer3d' ? 'bg-neutral-800/80 text-amber-400 font-semibold' : 'hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Visão 3D</span>
            </button>

            <button
              onClick={() => setActiveTab('editor2d')}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2 rounded-md ${
                activeTab === 'editor2d' ? 'bg-neutral-800/80 text-amber-400 font-semibold' : 'hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Planta 2D</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_studio')}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2 rounded-md ${
                activeTab === 'ai_studio' ? 'bg-neutral-800/80 text-amber-400 font-semibold' : 'hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Estúdio IA & Cardápio</span>
            </button>

            <button
              onClick={() => setActiveTab('vuc_audit')}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2 rounded-md ${
                activeTab === 'vuc_audit' ? 'bg-neutral-800/80 text-amber-400 font-semibold' : 'hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Trace VUC</span>
            </button>

            <button
              onClick={() => setActiveTab('mep')}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2 rounded-md ${
                activeTab === 'mep' ? 'bg-neutral-800/80 text-amber-400 font-semibold' : 'hover:text-white'
              }`}
            >
              <span>Engenharia MEP</span>
            </button>
          </nav>

          {/* Zone 3: Primary actions & Pin Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenHalton}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 rounded-md hover:bg-cyan-900/60 transition-colors whitespace-nowrap cursor-pointer"
              title="Padrão Halton de Exaustão & Referência Gianni Brasil"
            >
              <Wind className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Halton</span>
            </button>

            <button
              onClick={onOpenStory}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-950/60 border border-amber-800/60 rounded-md hover:bg-amber-900/60 transition-colors whitespace-nowrap cursor-pointer"
              title="A jornada do Thai Mee e a alma da cozinha de alto rendimento"
            >
              <Heart className="w-3 h-3 text-rose-400 fill-rose-400/30" />
              <span className="hidden md:inline">Thai Mee</span>
            </button>

            {onOpenDocs && (
              <button
                onClick={onOpenDocs}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded-md hover:bg-emerald-900/60 transition-colors whitespace-nowrap cursor-pointer"
                title="Constituição VUC, Agentes e Roadmap de Sprints"
              >
                <BookOpen className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">VUC Docs</span>
              </button>
            )}

            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap shadow-sm cursor-pointer"
            >
              <FileDown className="w-3 h-3" />
              <span>Exportar CAD</span>
            </button>

            {/* Pin / Unpin button for suspended menu */}
            {onTogglePin && (
              <button
                onClick={onTogglePin}
                className={`p-1.5 rounded-md border transition-colors cursor-pointer ml-1 ${
                  isPinned
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title={isPinned ? 'Menu fixado (Clique para suspender)' : 'Menu suspenso (Clique para fixar)'}
              >
                {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

