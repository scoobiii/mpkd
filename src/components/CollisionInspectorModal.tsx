import React from 'react';
import { PhysicalCollision } from '../vuc/collisionDetector';
import {
  AlertTriangle,
  Flame,
  Zap,
  Droplets,
  Layers,
  ArrowRight,
  CheckCircle2,
  X,
  Compass,
  Sliders,
  ShieldAlert,
  Wrench,
  RotateCcw,
} from 'lucide-react';

interface CollisionInspectorModalProps {
  collision: PhysicalCollision;
  allCollisions: PhysicalCollision[];
  onClose: () => void;
  onFocusClash: (collision: PhysicalCollision) => void;
  onAutoFix: (collision: PhysicalCollision) => void;
  onSelectAnotherClash: (collision: PhysicalCollision) => void;
  mepOffsetZ: number;
  setMepOffsetZ: (val: number) => void;
  elecOffsetY: number;
  setElecOffsetY: (val: number) => void;
  onResetOffsets: () => void;
}

export const CollisionInspectorModal: React.FC<CollisionInspectorModalProps> = ({
  collision,
  allCollisions,
  onClose,
  onFocusClash,
  onAutoFix,
  onSelectAnotherClash,
  mepOffsetZ,
  setMepOffsetZ,
  elecOffsetY,
  setElecOffsetY,
  onResetOffsets,
}) => {
  const isCritical = collision.severity === 'CRITICAL';

  return (
    <div className="w-88 sm:w-104 bg-neutral-950/95 backdrop-blur-2xl border-2 border-red-500/90 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.35)] text-neutral-100 overflow-hidden font-sans pointer-events-auto transition-all duration-200 animate-in fade-in zoom-in-95">
      {/* High-Contrast Hazard Warning Header */}
      <div className="p-3.5 bg-gradient-to-r from-red-950/90 via-neutral-950 to-neutral-900 border-b border-red-800/80 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/60 text-red-400 shrink-0 animate-pulse">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-black tracking-wider ${
                  isCritical ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-500 text-neutral-950'
                }`}
              >
                {collision.severity} OVERLAP
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                Profundidade: <strong className="text-red-400">{collision.penetrationDepthMm} mm</strong>
              </span>
            </div>
            <h4 className="text-sm font-bold text-white tracking-tight truncate mt-1">
              {collision.title}
            </h4>
            <p className="text-[11px] text-red-300/80 font-mono truncate">
              Norma: {collision.normativeStandard}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-850 transition-colors shrink-0 cursor-pointer"
          title="Fechar Inspetor"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Collision List Navigation if multiple */}
      {allCollisions.length > 1 && (
        <div className="px-3 py-1.5 bg-neutral-900/80 border-b border-neutral-800 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono">
          <span className="text-neutral-500 shrink-0">Outras Colisões ({allCollisions.length}):</span>
          {allCollisions.map((c, i) => (
            <button
              key={c.id}
              onClick={() => onSelectAnotherClash(c)}
              className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
                c.id === collision.id
                  ? 'bg-red-500 text-white font-bold'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              #{i + 1} {c.code.split('_')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Main Clash Entities Diagram */}
      <div className="p-3.5 space-y-3 text-xs max-h-80 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {/* Entity A */}
          <div className="bg-neutral-900/90 rounded-xl p-2.5 border border-neutral-800 space-y-1">
            <span className="text-[10px] font-mono text-amber-400 font-semibold block uppercase">
              Entidade A (Equipamento)
            </span>
            <p className="font-bold text-white truncate text-xs">{collision.entityA.name}</p>
            <span className="text-[10px] font-mono text-neutral-400 block truncate">
              {collision.entityA.ifcClass}
            </span>
          </div>

          {/* Entity B */}
          <div className="bg-neutral-900/90 rounded-xl p-2.5 border border-neutral-800 space-y-1">
            <span className="text-[10px] font-mono text-cyan-400 font-semibold block uppercase">
              Entidade B (Utilidade / MEP)
            </span>
            <p className="font-bold text-white truncate text-xs">{collision.entityB.name}</p>
            <span className="text-[10px] font-mono text-neutral-400 block truncate">
              {collision.entityB.ifcClass}
            </span>
          </div>
        </div>

        {/* Clash Volume Metrics */}
        <div className="bg-neutral-900/60 rounded-xl p-2.5 border border-neutral-800 space-y-1 text-[11px] font-mono">
          <div className="flex justify-between text-neutral-400">
            <span>Coordenadas de Interseção 3D:</span>
            <span className="text-white font-bold">
              X:{Math.round(collision.intersectionBox.center[0])} Y:{Math.round(collision.intersectionBox.center[1])} Z:{Math.round(collision.intersectionBox.center[2])}
            </span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Volume de Conflito Físico:</span>
            <span className="text-red-400 font-bold">
              {Math.round(collision.intersectionBox.size[0])} × {Math.round(collision.intersectionBox.size[1])} × {Math.round(collision.intersectionBox.size[2])} mm
            </span>
          </div>
        </div>

        {/* Risk Description & Failure Mechanism */}
        <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-800/40 text-neutral-300 space-y-1">
          <span className="text-[10px] font-mono text-red-400 font-bold uppercase block">
            Diagnóstico de Engenharia & Risco Físico:
          </span>
          <p className="text-[11px] leading-relaxed text-neutral-200">
            {collision.description}
          </p>
          <div className="pt-1.5 border-t border-red-900/40 text-[11px] text-amber-300">
            <strong>Ação Recomendada:</strong> {collision.recommendedAction}
          </div>
        </div>

        {/* Real-Time Interactive MEP Offset Simulation Sliders */}
        <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-300 font-bold flex items-center gap-1.5 uppercase">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Simulação em Tempo Real (Deslocar Utilidades):
            </span>
            <button
              onClick={onResetOffsets}
              className="text-[10px] font-mono text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
              title="Restaurar roteamento padrão"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Slider 1: Vertical Offset for Electrical Conduit */}
          <div className="space-y-1 text-[10px] font-mono">
            <div className="flex justify-between text-neutral-400">
              <span>Elevação Eletroduto 400V (Eixo Y):</span>
              <span className="text-amber-400 font-bold">{elecOffsetY > 0 ? `+${elecOffsetY}` : elecOffsetY} mm</span>
            </div>
            <input
              type="range"
              min="-150"
              max="200"
              step="5"
              value={elecOffsetY}
              onChange={(e) => setElecOffsetY(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
          </div>

          {/* Slider 2: Depth Offset for Utility Manifold */}
          <div className="space-y-1 text-[10px] font-mono">
            <div className="flex justify-between text-neutral-400">
              <span>Afastamento Manifold MEP (Eixo Z):</span>
              <span className="text-cyan-400 font-bold">{mepOffsetZ > 0 ? `+${mepOffsetZ}` : mepOffsetZ} mm</span>
            </div>
            <input
              type="range"
              min="-120"
              max="120"
              step="5"
              value={mepOffsetZ}
              onChange={(e) => setMepOffsetZ(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between gap-2">
        <button
          onClick={() => onFocusClash(collision)}
          className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-750 text-neutral-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Focar no 3D</span>
        </button>

        <button
          onClick={() => onAutoFix(collision)}
          className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 flex items-center justify-center gap-1.5 transition-colors shadow-lg cursor-pointer"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Auto-Corrigir Rota</span>
        </button>
      </div>
    </div>
  );
};
