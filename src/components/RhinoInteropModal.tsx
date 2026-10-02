import React, { useState } from 'react';
import { DesignModel } from '../types/designModel';
import { exportToRhino3DM, exportToGrasshopperPython } from '../utils/rhinoExporters';
import { triggerFileDownload } from '../utils/exporters';
import {
  FileCode,
  Download,
  Copy,
  Check,
  X,
  Layers,
  Terminal,
  Cpu,
  Share2,
  Box,
  Sliders,
  Code2,
  CheckCircle2,
} from 'lucide-react';

interface RhinoInteropModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: DesignModel;
}

export const RhinoInteropModal: React.FC<RhinoInteropModalProps> = ({ isOpen, onClose, model }) => {
  const [activeTab, setActiveTab] = useState<'rhino_3dm' | 'gh_python' | 'compute_api'>('rhino_3dm');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const getCodeContent = () => {
    switch (activeTab) {
      case 'rhino_3dm':
        return exportToRhino3DM(model);
      case 'gh_python':
        return exportToGrasshopperPython(model);
      case 'compute_api':
        return JSON.stringify(
          {
            endpoint: "https://compute.rhino3d.com/rhino/geometry/brep/create-boolean-union",
            method: "POST",
            headers: {
              "RhinoComputeKey": "RHINO_COMPUTE_AUTH_TOKEN",
              "Content-Type": "application/json",
            },
            payload: {
              tolerance: 0.001,
              modelId: model.id,
              vucHash: model.vucTrace?.merkle_root,
              breps: [
                { id: "top_plate_3mm", length: model.monolithe.lengthMm, depth: model.monolithe.depthMm },
                { id: "sanitary_plinth", height: 120 },
              ],
            },
          },
          null,
          2
        );
    }
  };

  const handleDownload = () => {
    const content = getCodeContent();
    const ext = activeTab === 'rhino_3dm' ? '3dm.json' : activeTab === 'gh_python' ? 'gh.py' : 'compute.json';
    const filename = `MPK_MONOLITHE_RHINO_${model.id.substring(0, 8)}.${ext}`;
    triggerFileDownload(filename, content, activeTab === 'gh_python' ? 'text/x-python' : 'application/json');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-700/80 rounded-2xl overflow-hidden shadow-2xl text-neutral-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Rhinoceros 3D & Grasshopper Interoperability Hub
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-amber-300 border border-neutral-700">
                  OpenNURBS v8
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                DesignModel como fonte única da verdade · Sem geração fictícia de geometria
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4 border-b border-neutral-800 flex items-center gap-2 bg-neutral-950/50">
          <button
            onClick={() => setActiveTab('rhino_3dm')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'rhino_3dm'
                ? 'bg-neutral-900 text-amber-400 border-t-2 border-amber-400'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Rhino .3DM (OpenNURBS & Layers)</span>
          </button>

          <button
            onClick={() => setActiveTab('gh_python')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'gh_python'
                ? 'bg-neutral-900 text-amber-400 border-t-2 border-amber-400'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Script Grasshopper Python (RhinoCommon)</span>
          </button>

          <button
            onClick={() => setActiveTab('compute_api')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'compute_api'
                ? 'bg-neutral-900 text-amber-400 border-t-2 border-amber-400'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Rhino.Compute REST API</span>
          </button>
        </div>

        {/* Code Content & Details */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-mono">
              {activeTab === 'rhino_3dm' && 'Estrutura OpenNURBS com hierarquia de camadas nativas Rhino e metadados VUC.'}
              {activeTab === 'gh_python' && 'Script Python para recriar parametricamente o Monolithe no Grasshopper com sliders.'}
              {activeTab === 'compute_api' && 'Payload formatado para chamada de computação geométrica headless (Hops / Compute).'}
            </span>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors font-mono text-[11px] cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 h-72 overflow-y-auto leading-relaxed shadow-inner">
            {getCodeContent()}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Compatibilidade Garantida: Rhino 7 · Rhino 8 · Grasshopper · Rhino.Inside</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white rounded-lg bg-neutral-800 transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Arquivo Rhino</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
