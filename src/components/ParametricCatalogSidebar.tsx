import React, { useState } from 'react';
import { CatalogItem, MONOLITHE_CATALOG, createModuleFromCatalog } from '../catalog/monolitheCatalog';
import { DesignModel, MonolitheModule } from '../types/designModel';
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
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface ParametricCatalogSidebarProps {
  model: DesignModel;
  setModel: React.Dispatch<React.SetStateAction<DesignModel>>;
  selectedModuleId: string | null;
  setSelectedModuleId: (id: string | null) => void;
  onModuleAdded?: (mod: MonolitheModule) => void;
  selectedModuleIds?: string[];
  setSelectedModuleIds?: (ids: string[]) => void;
}

export const ParametricCatalogSidebar: React.FC<ParametricCatalogSidebarProps> = ({
  model,
  setModel,
  selectedModuleId,
  setSelectedModuleId,
  onModuleAdded,
  selectedModuleIds = [],
  setSelectedModuleIds,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'parametric'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cooking' | 'water' | 'refrigeration' | 'neutral'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const suite = model.monolithe;
  const isMultiSelected = selectedModuleIds.length > 1;
  const selectedModules = suite.modules.filter(m => selectedModuleIds.includes(m.id));
  const selectedModule = suite.modules.find(m => m.id === selectedModuleId) || suite.modules[0] || null;

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

  // Add module to Monolithe Suite
  const handleAddModule = (catalogItem: CatalogItem, insertIndex?: number) => {
    const targetIndex = insertIndex !== undefined ? insertIndex : suite.modules.length;
    const newModule = createModuleFromCatalog(catalogItem, targetIndex);
    const updatedModules = [...suite.modules];
    if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= updatedModules.length) {
      updatedModules.splice(insertIndex, 0, newModule);
    } else {
      updatedModules.push(newModule);
    }

    // Re-index
    updatedModules.forEach((m, idx) => {
      m.positionIndex = idx;
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

    setSelectedModuleId(newModule.id);
    if (onModuleAdded) onModuleAdded(newModule);
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

    setSelectedModuleId(duplicated.id);
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

    setSelectedModuleId(updated[0]?.id || null);
  };

  // Collective Handlers for Multi-Selection
  const handleCollectiveWidth = (newWidthMm: number) => {
    const widthClamped = Math.max(400, Math.min(1600, newWidthMm));
    const selectedSet = new Set(selectedModuleIds);
    const updatedModules = suite.modules.map(m => {
      if (!selectedSet.has(m.id)) return m;
      const ratio = widthClamped / m.widthMm;
      const newElectric = m.electricKw > 0 ? Number((m.electricKw * (ratio >= 1.4 ? 1.4 : ratio <= 0.7 ? 0.7 : ratio)).toFixed(1)) : 0;
      const newGas = m.gasKw > 0 ? Number((m.gasKw * (ratio >= 1.4 ? 1.4 : ratio <= 0.7 ? 0.7 : ratio)).toFixed(1)) : 0;
      return {
        ...m,
        widthMm: widthClamped,
        electricKw: newElectric,
        gasKw: newGas,
      };
    });
    const totalLength = updatedModules.reduce((acc, m) => acc + m.widthMm, 0);
    setModel(prev => ({
      ...prev,
      monolithe: { ...prev.monolithe, lengthMm: totalLength, modules: updatedModules },
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

  const handleCollectiveDeltaWidth = (deltaMm: number) => {
    const selectedSet = new Set(selectedModuleIds);
    const updatedModules = suite.modules.map(m => {
      if (!selectedSet.has(m.id)) return m;
      const newWidth = Math.max(400, Math.min(1600, m.widthMm + deltaMm));
      const ratio = newWidth / m.widthMm;
      const newElectric = m.electricKw > 0 ? Number((m.electricKw * ratio).toFixed(1)) : 0;
      const newGas = m.gasKw > 0 ? Number((m.gasKw * ratio).toFixed(1)) : 0;
      return { ...m, widthMm: newWidth, electricKw: newElectric, gasKw: newGas };
    });
    const totalLength = updatedModules.reduce((acc, m) => acc + m.widthMm, 0);
    setModel(prev => ({
      ...prev,
      monolithe: { ...prev.monolithe, lengthMm: totalLength, modules: updatedModules },
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

  const handleCollectiveMove = (direction: 'left' | 'right') => {
    if (selectedModuleIds.length === 0) return;
    const modules = [...suite.modules];
    const selectedSet = new Set(selectedModuleIds);

    if (direction === 'left') {
      const firstIndex = modules.findIndex(m => selectedSet.has(m.id));
      if (firstIndex <= 0) return;
      for (let i = 1; i < modules.length; i++) {
        if (selectedSet.has(modules[i].id) && !selectedSet.has(modules[i - 1].id)) {
          const temp = modules[i];
          modules[i] = modules[i - 1];
          modules[i - 1] = temp;
        }
      }
    } else {
      let lastIndex = -1;
      for (let i = modules.length - 1; i >= 0; i--) {
        if (selectedSet.has(modules[i].id)) {
          lastIndex = i;
          break;
        }
      }
      if (lastIndex === -1 || lastIndex >= modules.length - 1) return;
      for (let i = modules.length - 2; i >= 0; i--) {
        if (selectedSet.has(modules[i].id) && !selectedSet.has(modules[i + 1].id)) {
          const temp = modules[i];
          modules[i] = modules[i + 1];
          modules[i + 1] = temp;
        }
      }
    }

    modules.forEach((m, idx) => { m.positionIndex = idx; });
    setModel(prev => ({
      ...prev,
      monolithe: { ...prev.monolithe, modules },
    }));
  };

  const handleCollectiveDuplicate = () => {
    if (selectedModuleIds.length === 0) return;
    const selectedSet = new Set(selectedModuleIds);
    const selected = suite.modules.filter(m => selectedSet.has(m.id));

    let lastIdx = -1;
    suite.modules.forEach((m, idx) => {
      if (selectedSet.has(m.id)) lastIdx = idx;
    });

    const newClones: MonolitheModule[] = selected.map((m, i) => ({
      ...m,
      id: `mod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${i}`,
      name: `${m.name} (Cópia)`,
    }));

    const updated = [...suite.modules];
    const insertAt = lastIdx >= 0 ? lastIdx + 1 : updated.length;
    updated.splice(insertAt, 0, ...newClones);
    updated.forEach((m, idx) => { m.positionIndex = idx; });

    const totalLength = updated.reduce((acc, m) => acc + m.widthMm, 0);
    setModel(prev => ({
      ...prev,
      monolithe: { ...prev.monolithe, lengthMm: totalLength, modules: updated },
      derivedCalculations: {
        ...prev.derivedCalculations,
        totalElectricKw: updated.reduce((acc, m) => acc + m.electricKw, 0),
        totalGasKw: updated.reduce((acc, m) => acc + m.gasKw, 0),
        totalExhaustFlowM3h: updated.reduce((acc, m) => acc + m.exhaustFlowM3h, 0),
        freshAirCompensationM3h: updated.reduce((acc, m) => acc + m.exhaustFlowM3h, 0) * 0.8,
        linearMetersOfContinuousTop: totalLength / 1000,
      },
    }));

    if (setSelectedModuleIds) {
      setSelectedModuleIds(newClones.map(c => c.id));
    }
  };

  const handleCollectiveRemove = () => {
    if (selectedModuleIds.length === 0) return;
    const selectedSet = new Set(selectedModuleIds);
    const remaining = suite.modules.filter(m => !selectedSet.has(m.id));
    if (remaining.length === 0) return; // Keep at least 1

    remaining.forEach((m, idx) => { m.positionIndex = idx; });
    const totalLength = remaining.reduce((acc, m) => acc + m.widthMm, 0);
    setModel(prev => ({
      ...prev,
      monolithe: { ...prev.monolithe, lengthMm: totalLength, modules: remaining },
      derivedCalculations: {
        ...prev.derivedCalculations,
        totalElectricKw: remaining.reduce((acc, m) => acc + m.electricKw, 0),
        totalGasKw: remaining.reduce((acc, m) => acc + m.gasKw, 0),
        totalExhaustFlowM3h: remaining.reduce((acc, m) => acc + m.exhaustFlowM3h, 0),
        freshAirCompensationM3h: remaining.reduce((acc, m) => acc + m.exhaustFlowM3h, 0) * 0.8,
        linearMetersOfContinuousTop: totalLength / 1000,
      },
    }));

    if (setSelectedModuleIds) {
      setSelectedModuleIds([remaining[0].id]);
    }
    setSelectedModuleId(remaining[0].id);
  };

  const handleCollectiveEnergyTier = (multiplier: number) => {
    const selectedSet = new Set(selectedModuleIds);
    const updated = suite.modules.map(m => {
      if (!selectedSet.has(m.id)) return m;
      return {
        ...m,
        electricKw: m.electricKw > 0 ? Number((m.electricKw * multiplier).toFixed(1)) : 0,
        gasKw: m.gasKw > 0 ? Number((m.gasKw * multiplier).toFixed(1)) : 0,
        exhaustFlowM3h: Math.round(m.exhaustFlowM3h * multiplier),
      };
    });
    setModel(prev => ({
      ...prev,
      monolithe: { ...prev.monolithe, modules: updated },
      derivedCalculations: {
        ...prev.derivedCalculations,
        totalElectricKw: updated.reduce((acc, m) => acc + m.electricKw, 0),
        totalGasKw: updated.reduce((acc, m) => acc + m.gasKw, 0),
        totalExhaustFlowM3h: updated.reduce((acc, m) => acc + m.exhaustFlowM3h, 0),
        freshAirCompensationM3h: updated.reduce((acc, m) => acc + m.exhaustFlowM3h, 0) * 0.8,
      },
    }));
  };

  // Drag Start Handler
  const handleDragStart = (e: React.DragEvent, item: CatalogItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Clearance Check
  const aisleNorth = suite.yMm;
  const aisleSouth = model.room.depthMm - (suite.yMm + suite.depthMm);
  const minAisle = Math.min(aisleNorth, aisleSouth);
  const isAisleValid = minAisle >= model.parameters.aisleWidthMinMm;

  return (
    <aside className="w-full lg:w-96 flex flex-col h-full bg-neutral-950 border-l border-neutral-800 text-neutral-100 select-none">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4 py-3">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-lg">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Catálogo Monolithe
          </button>
          <button
            onClick={() => setActiveTab('parametric')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'parametric'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isMultiSelected ? `Edição em Lote (${selectedModuleIds.length})` : 'Ajuste Paramétrico'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CATALOGUE LIST & DRAG-AND-DROP */}
      {activeTab === 'catalog' && (
        <div className="flex-1 flex flex-col min-h-0 p-4 space-y-3 overflow-hidden">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar wok, plancha, queimador, cuba..."
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
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
              <span>Água & Caldos</span>
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
              <Layers className="w-3 h-3 text-neutral-400" />
              <span>Neutros</span>
            </button>
          </div>

          {/* Drag instruction notice */}
          <div className="flex items-center gap-2 p-2 bg-amber-950/20 border border-amber-900/40 rounded-lg text-[11px] text-amber-300/90 font-mono">
            <GripVertical className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Arraste os módulos diretamente para a planta ou clique em (+)</span>
          </div>

          {/* Catalog Items Scrollable List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredCatalog.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={e => handleDragStart(e, item)}
                className="group relative p-3 rounded-xl border border-neutral-800/90 bg-neutral-900/60 hover:bg-neutral-900 hover:border-amber-500/50 transition-all cursor-grab active:cursor-grabbing text-xs"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-neutral-800 text-neutral-400 group-hover:text-amber-400 group-hover:bg-amber-950/40 transition-colors">
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white tracking-tight leading-snug">
                        {item.name}
                      </h4>
                      <span className="text-[11px] italic text-neutral-400 block font-serif">
                        {item.italianName}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddModule(item)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 transition-colors cursor-pointer shrink-0 shadow-sm"
                    title="Adicionar à linha Monolithe"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-neutral-400 line-clamp-2 mb-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Technical Badges */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-neutral-400 border-t border-neutral-800/80 pt-2">
                  <span className="text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-900/40">
                    {item.defaultWidthMm} mm
                  </span>
                  {item.electricKw > 0 && (
                    <span className="text-orange-300">
                      ⚡ {item.electricKw} kW
                    </span>
                  )}
                  {item.gasKw > 0 && (
                    <span className="text-amber-300">
                      🔥 {item.gasKw} kW gás
                    </span>
                  )}
                  {item.waterInDn && (
                    <span className="text-blue-300">
                      💧 DN{item.waterInDn}
                    </span>
                  )}
                  {item.exhaustFlowM3h > 0 && (
                    <span className="text-cyan-300">
                      💨 {item.exhaustFlowM3h} m³/h
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: REAL-TIME PARAMETRIC ADJUSTMENT */}
      {activeTab === 'parametric' && (
        <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4 overflow-y-auto">
          {isMultiSelected ? (
            <div className="space-y-4">
              {/* Collective Selection Header Card */}
              <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    Seleção Coletiva ({selectedModules.length} módulos)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCollectiveMove('left')}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
                      title="Mover bloco selecionado para a esquerda"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCollectiveMove('right')}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
                      title="Mover bloco selecionado para a direita"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleCollectiveDuplicate}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-sky-300 cursor-pointer"
                      title="Duplicar todos os selecionados em lote"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleCollectiveRemove}
                      disabled={suite.modules.length <= selectedModules.length}
                      className="p-1 rounded bg-neutral-800 hover:bg-rose-900/60 hover:text-rose-300 text-neutral-400 disabled:opacity-30 cursor-pointer"
                      title="Excluir selecionados em lote"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-white tracking-tight">
                  Edição em Massa dos Componentes
                </h4>

                {/* Module chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedModules.map(m => (
                    <span
                      key={m.id}
                      className="px-2 py-0.5 rounded bg-sky-900/50 border border-sky-700 text-[11px] font-mono text-sky-200 flex items-center gap-1"
                    >
                      <span>#{m.positionIndex + 1} {m.name.split(' ')[0]}</span>
                      <span className="text-neutral-400">({m.widthMm}mm)</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Collective Width Adjustment */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-neutral-200">
                    Largura Coletiva Unificada (mm)
                  </label>
                  <span className="font-mono text-sky-400 font-bold text-sm">
                    {selectedModules[0]?.widthMm || 800} mm (cada)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCollectiveDeltaWidth(-50)}
                    className="flex-1 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs cursor-pointer"
                  >
                    -50 mm a todos
                  </button>
                  <button
                    onClick={() => handleCollectiveDeltaWidth(50)}
                    className="flex-1 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs cursor-pointer"
                  >
                    +50 mm a todos
                  </button>
                </div>

                {/* Width Presets */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[400, 600, 800, 1000, 1200].map(preset => (
                    <button
                      key={preset}
                      onClick={() => handleCollectiveWidth(preset)}
                      className="py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-sky-500 hover:text-sky-300"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Collective Energy Tier Scale */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2 text-xs">
                <label className="font-semibold text-neutral-200 block">
                  Escala de Potência Coletiva
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleCollectiveEnergyTier(0.8)}
                    className="py-1.5 px-2 rounded border border-neutral-800 bg-neutral-950 hover:border-emerald-500 text-emerald-400 text-center text-[11px] cursor-pointer"
                  >
                    Eco (-20%)
                  </button>
                  <button
                    onClick={() => handleCollectiveEnergyTier(1.0)}
                    className="py-1.5 px-2 rounded border border-neutral-800 bg-neutral-950 hover:border-sky-500 text-sky-400 text-center text-[11px] cursor-pointer"
                  >
                    Nominal 100%
                  </button>
                  <button
                    onClick={() => handleCollectiveEnergyTier(1.2)}
                    className="py-1.5 px-2 rounded border border-neutral-800 bg-neutral-950 hover:border-amber-500 text-amber-400 text-center text-[11px] cursor-pointer"
                  >
                    Turbo (+20%)
                  </button>
                </div>
              </div>

              {/* Collective Material */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2 text-xs">
                <span className="font-semibold text-neutral-200 block">
                  Liga de Aço Monolítico
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setModel(prev => ({ ...prev, monolithe: { ...prev.monolithe, materialGrade: 'AISI_304' } }))}
                    className={`p-2 rounded border text-center text-xs transition-colors cursor-pointer ${
                      suite.materialGrade === 'AISI_304'
                        ? 'border-sky-400 bg-sky-950/40 text-sky-300 font-bold'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                    }`}
                  >
                    AISI 304 Scotch-Brite
                  </button>
                  <button
                    onClick={() => setModel(prev => ({ ...prev, monolithe: { ...prev.monolithe, materialGrade: 'AISI_316' } }))}
                    className={`p-2 rounded border text-center text-xs transition-colors cursor-pointer ${
                      suite.materialGrade === 'AISI_316'
                        ? 'border-sky-400 bg-sky-950/40 text-sky-300 font-bold'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                    }`}
                  >
                    AISI 316 Anti-ácido
                  </button>
                </div>
              </div>

              {/* Real-time Recalculated Collective Derivatives */}
              <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2 text-xs font-mono">
                <span className="text-neutral-400 text-[10px] uppercase tracking-wider block">
                  Sub-totais da Seleção Coletiva ({selectedModules.length} itens)
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800/80">
                    <span className="text-neutral-500 block">Largura da Seleção:</span>
                    <span className="text-white font-bold">{selectedModules.reduce((a, m) => a + m.widthMm, 0)} mm</span>
                  </div>
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800/80">
                    <span className="text-neutral-500 block">Carga Elétrica Grupo:</span>
                    <span className="text-orange-400 font-bold">{selectedModules.reduce((a, m) => a + m.electricKw, 0).toFixed(1)} kW</span>
                  </div>
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800/80">
                    <span className="text-neutral-500 block">Carga Gás Grupo:</span>
                    <span className="text-amber-400 font-bold">{selectedModules.reduce((a, m) => a + m.gasKw, 0).toFixed(1)} kW</span>
                  </div>
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800/80">
                    <span className="text-neutral-500 block">Vazão Exaustão Grupo:</span>
                    <span className="text-cyan-400 font-bold">{selectedModules.reduce((a, m) => a + m.exhaustFlowM3h, 0)} m³/h</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">% do Bloco Contínuo:</span>
                  <span className="font-bold text-sky-400">
                    {suite.lengthMm > 0 ? ((selectedModules.reduce((a, m) => a + m.widthMm, 0) / suite.lengthMm) * 100).toFixed(0) : 0}% da ilha
                  </span>
                </div>
              </div>
            </div>
          ) : selectedModule ? (
            <div className="space-y-4">
              {/* Selected Module Card */}
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                    Módulo #{selectedModule.positionIndex + 1} de {suite.modules.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveModule('left')}
                      disabled={selectedModule.positionIndex === 0}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-white"
                      title="Mover para esquerda no bloco"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveModule('right')}
                      disabled={selectedModule.positionIndex === suite.modules.length - 1}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-white"
                      title="Mover para direita no bloco"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleDuplicateSelected}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                      title="Duplicar módulo"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleRemoveSelected}
                      disabled={suite.modules.length <= 1}
                      className="p-1 rounded bg-neutral-800 hover:bg-rose-900/60 hover:text-rose-300 text-neutral-400 disabled:opacity-30"
                      title="Remover módulo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-white tracking-tight">
                  {selectedModule.name}
                </h4>
                <div className="text-xs font-mono text-neutral-400">
                  Código: {selectedModule.code}
                </div>
              </div>

              {/* Parametric Dimension Sliders */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-neutral-200">
                      Largura do Módulo (mm)
                    </label>
                    <span className="font-mono text-amber-400 font-bold text-sm">
                      {selectedModule.widthMm} mm
                    </span>
                  </div>

                  <input
                    type="range"
                    min="400"
                    max="1400"
                    step="50"
                    value={selectedModule.widthMm}
                    onChange={e => handleUpdateSelectedWidth(Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />

                  {/* Width Presets */}
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {[400, 600, 800, 1000, 1200].map(preset => (
                      <button
                        key={preset}
                        onClick={() => handleUpdateSelectedWidth(preset)}
                        className={`py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                          selectedModule.widthMm === preset
                            ? 'bg-amber-400 text-neutral-950 font-bold border-amber-400'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Depth Specification */}
                <div className="space-y-1.5 border-t border-neutral-800 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300 font-medium">Profundidade do Bloco:</span>
                    <span className="font-mono text-neutral-300">{suite.depthMm} mm</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[900, 1000, 1100].map(d => (
                      <button
                        key={d}
                        onClick={() => setModel(prev => ({ ...prev, monolithe: { ...prev.monolithe, depthMm: d } }))}
                        className={`py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                          suite.depthMm === d
                            ? 'bg-amber-400 text-neutral-950 font-bold border-amber-400'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                        }`}
                      >
                        {d} mm
                      </button>
                    ))}
                  </div>
                </div>

                {/* Material Specification */}
                <div className="space-y-1.5 border-t border-neutral-800 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300 font-medium">Liga de Aço Inox:</span>
                    <span className="font-mono text-amber-300">{suite.materialGrade}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setModel(prev => ({ ...prev, monolithe: { ...prev.monolithe, materialGrade: 'AISI_304' } }))}
                      className={`p-2 rounded border text-center text-xs transition-colors cursor-pointer ${
                        suite.materialGrade === 'AISI_304'
                          ? 'border-amber-400 bg-amber-950/40 text-amber-300 font-bold'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                      }`}
                    >
                      AISI 304 Scotch-Brite
                    </button>
                    <button
                      onClick={() => setModel(prev => ({ ...prev, monolithe: { ...prev.monolithe, materialGrade: 'AISI_316' } }))}
                      className={`p-2 rounded border text-center text-xs transition-colors cursor-pointer ${
                        suite.materialGrade === 'AISI_316'
                          ? 'border-amber-400 bg-amber-950/40 text-amber-300 font-bold'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                      }`}
                    >
                      AISI 316 Anti-ácido
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Recalculated Derivatives */}
              <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2 text-xs font-mono">
                <span className="text-neutral-400 text-[10px] uppercase tracking-wider block">
                  Derivadas Recalculadas em Tempo Real
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800/80">
                    <span className="text-neutral-500 block">Comprimento Bloco:</span>
                    <span className="text-white font-bold">{suite.lengthMm} mm</span>
                  </div>
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800/80">
                    <span className="text-neutral-500 block">Carga Elétrica:</span>
                    <span className="text-orange-400 font-bold">{model.derivedCalculations.totalElectricKw.toFixed(1)} kW</span>
                  </div>
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800/80">
                    <span className="text-neutral-500 block">Carga Gás:</span>
                    <span className="text-amber-400 font-bold">{model.derivedCalculations.totalGasKw.toFixed(1)} kW</span>
                  </div>
                  <div className="p-2 rounded bg-neutral-950 border border-neutral-800/80">
                    <span className="text-neutral-500 block">Vazão Exaustão:</span>
                    <span className="text-cyan-400 font-bold">{model.derivedCalculations.totalExhaustFlowM3h} m³/h</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">Corredor Mínimo:</span>
                  <span className={`font-bold flex items-center gap-1 ${isAisleValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isAisleValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {minAisle} mm {isAisleValid ? '(Conforme)' : '(Abaixo de 1100mm)'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-500 space-y-2">
              <Sliders className="w-8 h-8 text-neutral-600" />
              <p className="text-xs">Selecione um módulo na planta técnica para ajustar seus parâmetros.</p>
            </div>
          )}
        </div>
      )}

      {/* Footer Info: Monolithe Zero Seam Guarantee */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950 text-[11px] font-mono text-neutral-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-amber-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>0 Juntas Higiênicas</span>
        </span>
        <span>{suite.modules.length} Módulos</span>
      </div>
    </aside>
  );
};
