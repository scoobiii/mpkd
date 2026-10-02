import React, { useState } from 'react';
import { DetectedSceneObject, IFCClassificationClass } from '../types/objectDetection';
import { MonolitheModule, SubComponentDetail } from '../types/designModel';
import {
  Scan,
  ShieldCheck,
  Zap,
  Flame,
  Wind,
  Layers,
  Box,
  Eye,
  X,
  Sliders,
  CheckCircle2,
  Maximize2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCode,
  Wrench,
  Camera,
  RotateCw,
  Edit3,
  Save
} from 'lucide-react';

interface ObjectClassificationInspectorProps {
  detectedObject: DetectedSceneObject;
  onClose: () => void;
  onSelectAnotherObject?: (objId: string) => void;
  allObjects?: DetectedSceneObject[];
  onIsolateObject?: (objId: string) => void;
  isIsolated?: boolean;
  onEditModule?: (modId: string) => void;
  onUpdateModule?: (updatedMod: MonolitheModule) => void;
  onOpenRealisticRender?: (obj: DetectedSceneObject) => void;
  onToggleDecomposeAtomic?: () => void;
  isAtomicDecomposed?: boolean;
}

export const ObjectClassificationInspector: React.FC<ObjectClassificationInspectorProps> = ({
  detectedObject,
  onClose,
  onSelectAnotherObject,
  allObjects = [],
  onIsolateObject,
  isIsolated = false,
  onEditModule,
  onUpdateModule,
  onOpenRealisticRender,
  onToggleDecomposeAtomic,
  isAtomicDecomposed = false,
}) => {
  const obj = detectedObject;
  const mod = obj.sourceModule;

  // Real editable state
  const [isEditingReal, setIsEditingReal] = useState<boolean>(false);
  const [editWidth, setEditWidth] = useState<number>(mod?.widthMm || 800);
  const [editDepth, setEditDepth] = useState<number>(mod?.depthMm || 1000);
  const [editHeight, setEditHeight] = useState<number>(mod?.heightMm || 900);
  const [editElectricKw, setEditElectricKw] = useState<number>(mod?.electricKw || 0);
  const [editGasKw, setEditGasKw] = useState<number>(mod?.gasKw || 0);
  const [editExhaustM3h, setEditExhaustM3h] = useState<number>(mod?.exhaustFlowM3h || 0);
  const [showSubComponents, setShowSubComponents] = useState<boolean>(false);

  const handleSaveEdit = () => {
    if (!mod || !onUpdateModule) return;
    const updated: MonolitheModule = {
      ...mod,
      widthMm: editWidth,
      depthMm: editDepth,
      heightMm: editHeight,
      electricKw: editElectricKw,
      gasKw: editGasKw,
      exhaustFlowM3h: editExhaustM3h,
    };
    onUpdateModule(updated);
    setIsEditingReal(false);
  };

  return (
    <div className="w-84 sm:w-96 bg-neutral-900/98 backdrop-blur-2xl border border-neutral-700/80 rounded-2xl shadow-2xl text-neutral-100 overflow-hidden font-sans pointer-events-auto transition-all duration-200 animate-in fade-in zoom-in-95">
      {/* Header with Classification Badge and Status */}
      <div className="p-3.5 border-b border-neutral-800 bg-neutral-950/90 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className="w-4 h-4 rounded-full mt-0.5 shrink-0 shadow-sm ring-2 ring-neutral-800"
            style={{ backgroundColor: obj.maskColor }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-amber-300 font-semibold border border-neutral-700">
                {obj.ifcClass}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                {(obj.confidence * 100).toFixed(1)}% VUC
              </span>
            </div>
            <h4 className="text-sm font-bold text-white tracking-tight truncate mt-1">
              {obj.name}
            </h4>
            <p className="text-[11px] text-neutral-400 font-mono truncate">
              ID: {obj.code} · {obj.categoryLabel}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
          title="Fechar Inspetor"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Body */}
      <div className="p-3.5 space-y-3 text-xs max-h-80 overflow-y-auto">
        
        {/* Real Editable Parameters Form */}
        {isEditingReal ? (
          <div className="p-3 rounded-xl bg-neutral-950 border border-amber-500/50 space-y-2.5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5" />
                Edição Paramétrica Real (DesignModel)
              </span>
              <span className="text-[10px] font-mono text-neutral-400">Fonte Única da Verdade</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
              <div>
                <label className="text-neutral-400 block text-[10px]">Largura (mm):</label>
                <input
                  type="number"
                  step="50"
                  value={editWidth}
                  onChange={(e) => setEditWidth(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-neutral-400 block text-[10px]">Prof. (mm):</label>
                <input
                  type="number"
                  step="50"
                  value={editDepth}
                  onChange={(e) => setEditDepth(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-neutral-400 block text-[10px]">Altura (mm):</label>
                <input
                  type="number"
                  step="50"
                  value={editHeight}
                  onChange={(e) => setEditHeight(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
              <div>
                <label className="text-neutral-400 block text-[10px]">Elétrica (kW):</label>
                <input
                  type="number"
                  step="0.5"
                  value={editElectricKw}
                  onChange={(e) => setEditElectricKw(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-neutral-400 block text-[10px]">Gás (kW):</label>
                <input
                  type="number"
                  step="0.5"
                  value={editGasKw}
                  onChange={(e) => setEditGasKw(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-neutral-400 block text-[10px]">Exaustão (m³/h):</label>
                <input
                  type="number"
                  step="50"
                  value={editExhaustM3h}
                  onChange={(e) => setEditExhaustM3h(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar Alterações
              </button>
              <button
                onClick={() => setIsEditingReal(false)}
                className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded-lg text-xs hover:bg-neutral-700 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* Normal Display */
          <>
            {/* Dimensions */}
            <div className="bg-neutral-950/60 rounded-xl p-2.5 border border-neutral-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span className="flex items-center gap-1">
                  <Box className="w-3.5 h-3.5 text-neutral-400" />
                  Dimensões Nominais (AABB):
                </span>
                <span className="text-white font-semibold">{obj.specs.dimensionsMm}</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-neutral-800/60 text-[10px] font-mono">
                <div className="bg-neutral-900/80 px-2 py-1 rounded text-center">
                  <span className="text-neutral-500 block">L (X)</span>
                  <span className="text-neutral-200 font-bold">{Math.round(obj.boundingBox.size[0])} mm</span>
                </div>
                <div className="bg-neutral-900/80 px-2 py-1 rounded text-center">
                  <span className="text-neutral-500 block">A (Y)</span>
                  <span className="text-neutral-200 font-bold">{Math.round(obj.boundingBox.size[1])} mm</span>
                </div>
                <div className="bg-neutral-900/80 px-2 py-1 rounded text-center">
                  <span className="text-neutral-500 block">P (Z)</span>
                  <span className="text-neutral-200 font-bold">{Math.round(obj.boundingBox.size[2])} mm</span>
                </div>
              </div>
            </div>

            {/* Engineering Demands */}
            <div className="grid grid-cols-3 gap-1.5 text-neutral-300">
              <div className="p-2 rounded-lg bg-neutral-950/50 border border-neutral-800 text-center">
                <Zap className="w-3.5 h-3.5 text-amber-400 mx-auto mb-0.5" />
                <span className="text-[10px] text-neutral-400 block font-mono">Elétrica</span>
                <span className="font-bold text-white">{obj.specs.electricKw} kW</span>
              </div>

              <div className="p-2 rounded-lg bg-neutral-950/50 border border-neutral-800 text-center">
                <Flame className="w-3.5 h-3.5 text-rose-400 mx-auto mb-0.5" />
                <span className="text-[10px] text-neutral-400 block font-mono">Gás</span>
                <span className="font-bold text-white">{obj.specs.gasKw} kW</span>
              </div>

              <div className="p-2 rounded-lg bg-neutral-950/50 border border-neutral-800 text-center">
                <Wind className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-0.5" />
                <span className="text-[10px] text-neutral-400 block font-mono">Halton</span>
                <span className="font-bold text-white">{obj.specs.exhaustFlowM3h} m³/h</span>
              </div>
            </div>
          </>
        )}

        {/* Real Links (Manufacturer, Datasheet, CAD) */}
        {(mod?.manufacturer || mod?.manufacturerUrl || mod?.datasheetUrl) && (
          <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 font-mono text-[10px]">Objeto Homologado:</span>
              <span className="font-bold text-white text-[11px]">{mod?.manufacturer || 'Angelo Po Monolithe'}</span>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-neutral-800">
              {mod?.datasheetUrl && (
                <a
                  href={mod.datasheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-700 text-[10px] font-mono transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Datasheet PDF
                </a>
              )}
              {mod?.manufacturerUrl && (
                <a
                  href={mod.manufacturerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-[10px] font-mono transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Site Fabricante
                </a>
              )}
            </div>
          </div>
        )}

        {/* Demembrar / Nível Mínimo Atômico (SubComponents) */}
        {mod?.subComponents && mod.subComponents.length > 0 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 overflow-hidden">
            <button
              onClick={() => setShowSubComponents(!showSubComponents)}
              className="w-full p-2.5 flex items-center justify-between text-left hover:bg-neutral-900 transition-colors cursor-pointer text-[11px]"
            >
              <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Componentes Atômicos Desmembrados ({mod.subComponents.length})
              </span>
              {showSubComponents ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSubComponents && (
              <div className="p-2 space-y-1.5 border-t border-neutral-800/80 bg-neutral-950 text-[10px] font-mono max-h-48 overflow-y-auto">
                {mod.subComponents.map((sub, sIdx) => (
                  <div
                    key={sub.id}
                    className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-amber-400/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{sub.name}</span>
                      <span className="text-amber-400">{sub.category}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400 mt-1">
                      <span>{sub.materialGrade}</span>
                      <span>{sub.weightKg} kg</span>
                    </div>
                    <span className="text-[9px] text-neutral-500 block truncate mt-0.5">PN: {sub.partNumber}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Material & Hygiene Grade */}
        <div className="space-y-1 bg-neutral-950/50 p-2.5 rounded-xl border border-neutral-800 text-[11px]">
          <div className="flex justify-between">
            <span className="text-neutral-400">Liga Metálica:</span>
            <span className="font-semibold text-white font-mono">{obj.materialGrade.replace('_', ' ')} (3mm)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Higienização:</span>
            <span className="text-amber-300 font-mono">{obj.specs.sanitaryCompliance}</span>
          </div>
          <p className="text-[10px] text-neutral-400 pt-1 border-t border-neutral-800/60 leading-relaxed">
            {obj.materialDescription}
          </p>
        </div>

        {/* Cryptographic VUC Integrity Token (scoobiii/vuc) */}
        <div className="p-2 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>VUC Hash (scoobiii/vuc)</span>
          </div>
          <span className="text-neutral-400 truncate max-w-[140px]">{obj.vucHash}</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/95 flex flex-wrap items-center gap-2">
        {onIsolateObject && (
          <button
            onClick={() => onIsolateObject(obj.id)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              isIsolated
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isIsolated ? 'Restaurar' : 'Isolar'}</span>
          </button>
        )}

        {/* Real Editable Button */}
        {mod && onUpdateModule && (
          <button
            onClick={() => setIsEditingReal(!isEditingReal)}
            className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span>{isEditingReal ? 'Fechar' : 'Editar'}</span>
          </button>
        )}

        {/* Realistic Render Studio Launch Button */}
        {onOpenRealisticRender && (
          <button
            onClick={() => onOpenRealisticRender(obj)}
            className="w-full py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Estúdio Render Realístico 360°</span>
          </button>
        )}
      </div>
    </div>
  );
};
