import React, { useState } from 'react';
import { DesignModel } from '../types/designModel';
import { exportToSTEP, exportToDXF, exportToIFC, exportToGrasshopperJson, triggerFileDownload } from '../utils/exporters';
import { X, Download, FileCode, Check, Copy, Box } from 'lucide-react';

interface DeliverablesExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: DesignModel;
}

export const DeliverablesExportModal: React.FC<DeliverablesExportModalProps> = ({
  isOpen,
  onClose,
  model,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'step' | 'dxf' | 'ifc' | 'grasshopper'>('step');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const getExportContent = () => {
    switch (selectedFormat) {
      case 'step':
        return exportToSTEP(model);
      case 'dxf':
        return exportToDXF(model);
      case 'ifc':
        return exportToIFC(model);
      case 'grasshopper':
        return exportToGrasshopperJson(model);
    }
  };

  const handleDownload = () => {
    const content = getExportContent();
    const filename = `MPK_MONOLITHE_${model.id.substring(0, 8)}.${
      selectedFormat === 'grasshopper' ? 'gh.json' : selectedFormat
    }`;
    triggerFileDownload(filename, content);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getExportContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Exportar Entregáveis de Engenharia (Sprints S11 — S16)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Format Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => setSelectedFormat('step')}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                selectedFormat === 'step'
                  ? 'border-amber-400 bg-amber-950/30 text-white font-semibold'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="font-mono text-amber-300">S11 · STEP (.stp)</div>
              <div className="text-[11px] text-neutral-400 mt-1">ISO 10303-21 CAD 3D</div>
            </button>

            <button
              onClick={() => setSelectedFormat('dxf')}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                selectedFormat === 'dxf'
                  ? 'border-amber-400 bg-amber-950/30 text-white font-semibold'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="font-mono text-amber-300">S12 · DXF (.dxf)</div>
              <div className="text-[11px] text-neutral-400 mt-1">Plantas AutoCAD c/ cotas</div>
            </button>

            <button
              onClick={() => setSelectedFormat('ifc')}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                selectedFormat === 'ifc'
                  ? 'border-amber-400 bg-amber-950/30 text-white font-semibold'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="font-mono text-amber-300">S13 · IFC BIM (.ifc)</div>
              <div className="text-[11px] text-neutral-400 mt-1">IFC4 Coordenação MEP</div>
            </button>

            <button
              onClick={() => setSelectedFormat('grasshopper')}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                selectedFormat === 'grasshopper'
                  ? 'border-amber-400 bg-amber-950/30 text-white font-semibold'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="font-mono text-amber-300">S15/S16 · Rhino/GH</div>
              <div className="text-[11px] text-neutral-400 mt-1">Grasshopper Paramétrico</div>
            </button>
          </div>

          {/* Code Preview Box */}
          <div className="relative">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
              <span className="font-mono">
                Prévia do arquivo gerado a partir do DesignModel 1.0:
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 hover:text-white font-mono text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 h-64 overflow-y-auto leading-relaxed">
              {getExportContent()}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-950/80">
          <span className="text-xs text-neutral-500 font-mono">
            VUC Export Kernel · Sem geração fictícia de geometria
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white rounded-md bg-neutral-800"
            >
              Fechar
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Arquivo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
