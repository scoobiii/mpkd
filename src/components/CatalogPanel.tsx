import React, { useState } from 'react';
import { CatalogItem, MONOLITHE_CATALOG, createModuleFromCatalog } from '../catalog/monolitheCatalog';
import { DesignModel, MonolitheModule, MaterialGrade } from '../types/designModel';
import {
  Flame,
  Droplets,
  Snowflake,
  Layers,
  Search,
  GripVertical,
  Plus,
  Sliders,
  SlidersHorizontal,
  Trash2,
  Copy,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
} from 'lucide-react';

interface CatalogPanelProps {
  model: DesignModel;
  setModel: React.Dispatch<React.SetStateAction<DesignModel>>;
  selectedModuleId?: string | null;
  setSelectedModuleId?: (id: string | null) => void;
  onModuleAdded?: (module: MonolitheModule) => void;
  className?: string;
}

export const CatalogPanel: React.FC<CatalogPanelProps> = ({
  model,
  setModel,
  selectedModuleId,
  setSelectedModuleId,
  onModuleAdded,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'parametric'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cooking' | 'water' | 'refrigeration' | 'neutral'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const suite = model.monolithe;
  const currentSelectedId = selectedModuleId || suite.modules[0]?.id || null;
  const selectedModule = suite.modules.find(m => m.id === currentSelectedId) || suite.modules[0] || null;

  const handleSelectModule = (id: string) => {
    if (setSelectedModuleId) {
      setSelectedModuleId(id);
    }
  };

  // Filter Catalog Items
  const filteredCatalog = MONOLITHE_CATALOG.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.italianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Add module programmatically or via click
  const handleAddModule = (item: CatalogItem) => {
    const newModule = createModuleFromCatalog(item, suite.modules.length);
    const updatedModules = [...suite.modules, newModule];
    const totalLength = updatedModules.reduce((acc, m) => acc + m.widthMm, 0);

    setModel(prev => ({
      ...prev,
      monolithe: {
        ...prev.monolithe,
        lengthMm: totalLength,
        modules: updatedModules,
      },
      derivedCalculations: {
        ...prev.derivedCalculations,
        totalElectricKw: updatedModules.reduce((acc, m) => acc + m.electricKw, 0),
        totalGasKw: updatedModules.reduce((acc, m) => acc + m.gasKw, 0),
        totalExhaustFlowM3h: updatedModules.reduce((acc, m) => acc + m.exhaustFlowM3h, 0),
        freshAirCompensationM3h: updatedModules.reduce((acc, m) => acc + m.exhaustFlowM3h, 0) * 0.8,
        linearMetersOfContinuousTop: totalLength / 1000,
      },
    }));

    setRecentlyAddedId(item.id);
    setTimeout(() => setRecentlyAddedId(null), 1500);

    if (setSelectedModuleId) {
      setSelectedModuleId(newModule.id);
    }

    if (onModuleAdded) {
      onModuleAdded(newModule);
    }
  };

  // Drag start handler
  const handleDragStart = (e: React.DragEvent, item: CatalogItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Real-time Parametric Adjustment for the selected module
  const handleUpdateSelectedWidth = (newWidthMm: number) => {
    if (!selectedModule) return;
    const widthClamped = Math.max(400, Math.min(1600, newWidthMm));

    const updatedModules = suite.modules.map(m => {
      if (m.id === selectedModule.id) {
        // Recalculate power proportional to width
        const ratio = widthClamped / m.widthMm;
        const newElectric = m.electricKw > 0 ? Number((m.electricKw * (ratio >= 1.4 ? 1.4 : ratio <= 0.7 ? 0.7 : 1)).toFixed(1)) : 0;
        const newGas = m.gasKw > 0 ? Number((m.gasKw * (ratio >= 1.4 ? 1.4 : ratio <= 0.7 ? 0.7 : 1)).toFixed(1)) : 0;

        return {
          ...m,
          widthMm: widthClamped,
          electricKw: newElectric,
          gasKw: newGas,
        };
      }
      return m;
    });

    const totalLength = updatedModules.reduce((acc, m) => acc + m.widthMm, 0);

    setModel(prev => ({
      ...prev,
      monolithe: {
        ...prev.monolithe,
        lengthMm: totalLength,
        modules: updatedModules,
      },
      derivedCalculations: {
        ...prev.derivedCalculations,
        totalElectricKw: updatedModules.reduce((acc, m) => acc + m.electricKw, 0),
        totalGasKw: updatedModules.reduce((acc, m) => acc + m.gasKw, 0),
        totalExhaustFlowM3h: updatedModules.reduce((acc, m) => acc + m.exhaustFlowM3h, 0),
        freshAirCompensationM3h: updatedModules.reduce((acc, m) => acc + m.exhaustFlowM3h, 0) * 0.8,
        linearMetersOfContinuousTop: totalLength / 1000,
      },
    }));
  };

  // Update suite depth
  const handleUpdateSuiteDepth = (newDepthMm: number) => {
    const depthClamped = Math.max(700, Math.min(1400, newDepthMm));
    setModel(prev => ({
      ...prev,
      monolithe: {
        ...prev.monolithe,
        depthMm: depthClamped,
      },
    }));
  };

  // Update suite height
  const handleUpdateSuiteHeight = (newHeightMm: number) => {
    const heightClamped = Math.max(800, Math.min(1000, newHeightMm));
    setModel(prev => ({
      ...prev,
      monolithe: {
        ...prev.monolithe,
        heightMm: heightClamped,
      },
    }));
  };

  // Update material grade
  const handleUpdateMaterial = (grade: MaterialGrade) => {
    setModel(prev => ({
      ...prev,
      monolithe: {
        ...prev.monolithe,
        materialGrade: grade,
      },
    }));
  };

  // Reorder module
  const handleMoveModule = (direction: 'left' | 'right') => {
    if (!selectedModule) return;
    const index = suite.modules.findIndex(m => m.id === selectedModule.id);
    if (index === -1) return;

    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= suite.modules.length) return;

    const updated = [...suite.modules];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    updated.forEach((m, idx) => {
      m.positionIndex = idx;
    });

    setModel(prev => ({
      ...prev,
      monolithe: {
        ...prev.monolithe,
        modules: updated,
      },
    }));
  };

  // Duplicate module
  const handleDuplicateSelected = () => {
    if (!selectedModule) return;
    const index = suite.modules.findIndex(m => m.id === selectedModule.id);
    const duplicated: MonolitheModule = {
      ...selectedModule,
      id: `mod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: `${selectedModule.name} (Cópia)`,
      positionIndex: index + 1,
    };

    const updated = [...suite.modules];
    updated.splice(index + 1, 0, duplicated);
    updated.forEach((m, idx) => {
      m.positionIndex = idx;
    });

    const totalLength = updated.reduce((acc, m) => acc + m.widthMm, 0);

    setModel(prev => ({
      ...prev,
      monolithe: {
        ...prev.monolithe,
        lengthMm: totalLength,
        modules: updated,
      },
      derivedCalculations: {
        ...prev.derivedCalculations,
        totalElectricKw: updated.reduce((acc, m) => acc + m.electricKw, 0),
        totalGasKw: updated.reduce((acc, m) => acc + m.gasKw, 0),
        totalExhaustFlowM3h: updated.reduce((acc, m) => acc + m.exhaustFlowM3h, 0),
        freshAirCompensationM3h: updated.reduce((acc, m) => acc + m.exhaustFlowM3h, 0) * 0.8,
        linearMetersOfContinuousTop: totalLength / 1000,
      },
    }));

    if (setSelectedModuleId) {
      setSelectedModuleId(duplicated.id);
    }
  };

  // Remove module
  const handleRemoveSelected = () => {
    if (!selectedModule || suite.modules.length <= 1) return;
    const updated = suite.modules.filter(m => m.id !== selectedModule.id);
    updated.forEach((m, idx) => {
      m.positionIndex = idx;
    });

    const totalLength = updated.reduce((acc, m) => acc + m.widthMm, 0);

    setModel(prev => ({
      ...prev,
      monolithe: {
        ...prev.monolithe,
        lengthMm: totalLength,
        modules: updated,
      },
      derivedCalculations: {
        ...prev.derivedCalculations,
        totalElectricKw: updated.reduce((acc, m) => acc + m.electricKw, 0),
        totalGasKw: updated.reduce((acc, m) => acc + m.gasKw, 0),
        totalExhaustFlowM3h: updated.reduce((acc, m) => acc + m.exhaustFlowM3h, 0),
        freshAirCompensationM3h: updated.reduce((acc, m) => acc + m.exhaustFlowM3h, 0) * 0.8,
        linearMetersOfContinuousTop: totalLength / 1000,
      },
    }));

    if (setSelectedModuleId) {
      setSelectedModuleId(updated[0]?.id || null);
    }
  };

  return (
    <aside
      className={`w-80 sm:w-96 flex flex-col h-full bg-neutral-950 border-l border-neutral-800 text-neutral-100 select-none ${className}`}
    >
      {/* Header with Switcher Tabs */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-950">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Monolithe Studio (S03)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            {suite.modules.length} módulos
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800/80 text-xs">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`py-1.5 px-3 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-neutral-800 text-amber-300 shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <GripVertical className="w-3.5 h-3.5 text-amber-400" />
            <span>Catálogo (D&D)</span>
          </button>

          <button
            onClick={() => setActiveTab('parametric')}
            className={`py-1.5 px-3 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'parametric'
                ? 'bg-neutral-800 text-amber-300 shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Ajuste Paramétrico</span>
          </button>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Search Bar */}
          <div className="p-3 border-b border-neutral-800/80 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por módulo, código ou elemento..."
                className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-neutral-800 text-amber-300 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Todos ({MONOLITHE_CATALOG.length})
              </button>

              <button
                onClick={() => setSelectedCategory('cooking')}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedCategory === 'cooking'
                    ? 'bg-neutral-800 text-amber-300 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-500" />
                <span>Cocção</span>
              </button>

              <button
                onClick={() => setSelectedCategory('water')}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedCategory === 'water'
                    ? 'bg-neutral-800 text-amber-300 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Droplets className="w-3 h-3 text-blue-400" />
                <span>Água</span>
              </button>

              <button
                onClick={() => setSelectedCategory('refrigeration')}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedCategory === 'refrigeration'
                    ? 'bg-neutral-800 text-amber-300 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Snowflake className="w-3 h-3 text-cyan-400" />
                <span>Refrigeração</span>
              </button>

              <button
                onClick={() => setSelectedCategory('neutral')}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedCategory === 'neutral'
                    ? 'bg-neutral-800 text-amber-300 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span>Neutros</span>
              </button>
            </div>
          </div>

          {/* Drag & Drop Instruction Box */}
          <div className="mx-3 mt-3 p-2 rounded-lg bg-amber-950/20 border border-amber-900/40 flex items-center gap-2 text-[11px] text-amber-300 font-mono">
            <GripVertical className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Arraste o módulo para o 3D ou clique em '+'</span>
          </div>

          {/* Modules List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredCatalog.map(item => {
              const isRecentlyAdded = recentlyAddedId === item.id;

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={e => handleDragStart(e, item)}
                  className="group p-3 rounded-xl border border-neutral-800/90 bg-neutral-900/60 hover:bg-neutral-900 hover:border-amber-400/50 transition-all cursor-grab active:cursor-grabbing text-xs relative"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 group-hover:text-amber-400 group-hover:bg-amber-950/40 transition-colors shadow-inner">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/60">
                            {item.code}
                          </span>
                          <span className="text-[10px] font-medium text-amber-400/90 capitalize">
                            {item.category === 'cooking' ? 'Cocção' : item.category === 'water' ? 'Água' : item.category === 'refrigeration' ? 'Refrigeração' : 'Neutro'}
                          </span>
                        </div>
                        <h4 className="font-bold text-white tracking-tight leading-snug mt-0.5 text-xs">
                          {item.name}
                        </h4>
                        <span className="text-[11px] italic text-neutral-400 block font-serif">
                          {item.italianName}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddModule(item)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 shadow-sm ${
                        isRecentlyAdded
                          ? 'bg-emerald-500 text-neutral-950'
                          : 'bg-neutral-800 hover:bg-amber-400 hover:text-neutral-950 text-neutral-200'
                      }`}
                      title="Clique para adicionar ou arraste para o 3D"
                    >
                      {isRecentlyAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Dimensions Box */}
                  <div className="bg-neutral-950/80 rounded-lg p-2 border border-neutral-800/80 mb-2 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-neutral-400">Dimensões (L×P×A):</span>
                    <span className="text-amber-300 font-bold bg-amber-950/50 px-2 py-0.5 rounded border border-amber-900/60">
                      {item.defaultWidthMm} × {suite.depthMm} × {suite.heightMm} mm
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400 line-clamp-2 mb-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Technical Specifications */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-neutral-400 border-t border-neutral-800/80 pt-2">
                    <span className="text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/40">
                      {item.defaultWidthMm} mm
                    </span>
                    {item.electricKw > 0 && (
                      <span className="text-orange-400 flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" />
                        {item.electricKw} kW
                      </span>
                    )}
                    {item.gasKw > 0 && (
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5" />
                        {item.gasKw} kW gás
                      </span>
                    )}
                    {item.waterInDn && (
                      <span className="text-blue-400 flex items-center gap-0.5">
                        <Droplets className="w-2.5 h-2.5" />
                        DN{item.waterInDn}
                      </span>
                    )}
                    {item.exhaustFlowM3h > 0 && (
                      <span className="text-cyan-400 flex items-center gap-0.5">
                        <Wind className="w-2.5 h-2.5" />
                        {item.exhaustFlowM3h} m³/h
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Tab: Parametric Dimensions Adjustment */
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Active Module Selector in Suite */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span>Módulo em Edição no Bloco</span>
              <span className="text-[10px] text-amber-400 font-mono">
                {suite.modules.length} instalados
              </span>
            </label>

            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {suite.modules.map((m, idx) => {
                const isSel = m.id === currentSelectedId;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectModule(m.id)}
                    className={`p-2 rounded-lg text-left transition-all text-xs border cursor-pointer ${
                      isSel
                        ? 'bg-amber-950/40 border-amber-400 text-white shadow-sm'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono text-neutral-500">#{idx + 1}</span>
                      <span className="text-[10px] font-mono text-amber-400">{m.widthMm}mm</span>
                    </div>
                    <div className="font-medium truncate">{m.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedModule && (
            <div className="p-3.5 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-white">{selectedModule.name}</h4>
                  <span className="text-[11px] font-mono text-neutral-400">ID: {selectedModule.id}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMoveModule('left')}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                    title="Mover para a esquerda"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleMoveModule('right')}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                    title="Mover para a direita"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleDuplicateSelected}
                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-400 cursor-pointer"
                    title="Duplicar módulo"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {suite.modules.length > 1 && (
                    <button
                      onClick={handleRemoveSelected}
                      className="p-1 rounded bg-neutral-800 hover:bg-rose-950 hover:text-rose-400 text-neutral-400 cursor-pointer"
                      title="Remover módulo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Parametric Width Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300 font-medium">Largura Paramétrica (L)</span>
                  <span className="font-mono text-amber-400 font-bold">{selectedModule.widthMm} mm</span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="1600"
                  step="50"
                  value={selectedModule.widthMm}
                  onChange={e => handleUpdateSelectedWidth(Number(e.target.value))}
                  className="w-full accent-amber-400 bg-neutral-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                  <span>400mm (Mín)</span>
                  <span>800mm (Std)</span>
                  <span>1600mm (Max)</span>
                </div>
              </div>

              {/* Live MEP impacts of this module */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Elétrico:</span>
                  <span className="text-orange-400 font-bold">{selectedModule.electricKw} kW</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Gás:</span>
                  <span className="text-amber-400 font-bold">{selectedModule.gasKw} kW</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Exaustão:</span>
                  <span className="text-cyan-400 font-bold">{selectedModule.exhaustFlowM3h} m³/h</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Água/Esgoto:</span>
                  <span className="text-blue-400 font-bold">
                    {selectedModule.waterInDn ? `DN${selectedModule.waterInDn}` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Monolithe Suite Global Dimensions */}
          <div className="p-3.5 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center justify-between">
              <span>Dimensões do Bloco Monolithe</span>
              <span className="text-amber-400 font-mono text-[10px]">Tampo Único 3mm</span>
            </h4>

            {/* Depth Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Profundidade (P)</span>
                <span className="font-mono text-neutral-200">{suite.depthMm} mm</span>
              </div>
              <input
                type="range"
                min="800"
                max="1200"
                step="50"
                value={suite.depthMm}
                onChange={e => handleUpdateSuiteDepth(Number(e.target.value))}
                className="w-full accent-amber-400 bg-neutral-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Height Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Altura de Trabalho (H)</span>
                <span className="font-mono text-neutral-200">{suite.heightMm} mm</span>
              </div>
              <input
                type="range"
                min="850"
                max="950"
                step="10"
                value={suite.heightMm}
                onChange={e => handleUpdateSuiteHeight(Number(e.target.value))}
                className="w-full accent-amber-400 bg-neutral-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Material Grade Selection */}
            <div className="space-y-1 pt-1">
              <span className="text-xs text-neutral-400 block">Aço Inoxidável Cirúrgico</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleUpdateMaterial('AISI_304')}
                  className={`py-1 px-2 rounded-lg border text-center font-mono cursor-pointer ${
                    suite.materialGrade === 'AISI_304'
                      ? 'bg-amber-950/40 border-amber-400 text-amber-300 font-bold'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  AISI 304 (18/10)
                </button>
                <button
                  onClick={() => handleUpdateMaterial('AISI_316')}
                  className={`py-1 px-2 rounded-lg border text-center font-mono cursor-pointer ${
                    suite.materialGrade === 'AISI_316'
                      ? 'bg-amber-950/40 border-amber-400 text-amber-300 font-bold'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  AISI 316 (Marítimo/Ácido)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950 text-[11px] font-mono text-neutral-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-amber-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>0 Juntas Sanitárias</span>
        </span>
        <span className="text-white font-semibold">
          {suite.lengthMm} mm total
        </span>
      </div>
    </aside>
  );
};
