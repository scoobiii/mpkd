import React, { useState, useRef, useMemo, useEffect } from 'react';
import { DesignModel, MonolitheModule, MaterialGrade } from '../types/designModel';
import { CatalogItem, createModuleFromCatalog } from '../catalog/monolitheCatalog';
import { ParametricCatalogSidebar } from './ParametricCatalogSidebar';
import {
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  AlertTriangle,
  Move,
  Layers,
  Sparkles,
  GripVertical,
  BoxSelect,
  MousePointer,
  CheckSquare,
  X,
  Copy,
  Trash2,
  RotateCcw,
  SlidersHorizontal,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface FloorplanEditor2DProps {
  model: DesignModel;
  setModel: React.Dispatch<React.SetStateAction<DesignModel>>;
}

export const FloorplanEditor2D: React.FC<FloorplanEditor2DProps> = ({ model, setModel }) => {
  const [zoom, setZoom] = useState<number>(0.12);
  const [showMep, setShowMep] = useState<boolean>(true);
  const [showHood, setShowHood] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);

  // Multi-selection state
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>(() => {
    return model.monolithe.modules[0] ? [model.monolithe.modules[0].id] : [];
  });
  const [isMarqueeMode, setIsMarqueeMode] = useState<boolean>(true);
  const [shiftStepMm, setShiftStepMm] = useState<number>(100);

  // Click-and-drag Marquee Selection Box state
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState<boolean>(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Drag-and-drop target states for catalog module insertion
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const room = model.room;
  const suite = model.monolithe;

  // Sync selectedModuleId for backward compatibility / single inspector
  const selectedModuleId = selectedModuleIds[0] || null;
  const setSelectedModuleId = (id: string | null) => {
    setSelectedModuleIds(id ? [id] : []);
  };

  // Clearances
  const aisleNorth = suite.yMm;
  const aisleSouth = room.depthMm - (suite.yMm + suite.depthMm);
  const isAisleNorthValid = aisleNorth >= model.parameters.aisleWidthMinMm;
  const isAisleSouthValid = aisleSouth >= model.parameters.aisleWidthMinMm;

  // Memoized module positions in SVG coordinates
  const modulePositions = useMemo(() => {
    let curX = suite.xMm;
    return suite.modules.map((m, idx) => {
      const x = curX;
      curX += m.widthMm;
      return {
        id: m.id,
        index: idx,
        module: m,
        x,
        y: suite.yMm,
        width: m.widthMm,
        height: suite.depthMm,
      };
    });
  }, [suite.xMm, suite.yMm, suite.depthMm, suite.modules]);

  // Selected modules list & consolidated metrics
  const selectedModules = useMemo(() => {
    return suite.modules.filter(m => selectedModuleIds.includes(m.id));
  }, [suite.modules, selectedModuleIds]);

  const selectedTotalWidth = useMemo(() => {
    return selectedModules.reduce((acc, m) => acc + m.widthMm, 0);
  }, [selectedModules]);

  const selectedTotalElectricKw = useMemo(() => {
    return selectedModules.reduce((acc, m) => acc + m.electricKw, 0);
  }, [selectedModules]);

  const selectedTotalGasKw = useMemo(() => {
    return selectedModules.reduce((acc, m) => acc + m.gasKw, 0);
  }, [selectedModules]);

  const selectedTotalExhaustFlow = useMemo(() => {
    return selectedModules.reduce((acc, m) => acc + m.exhaustFlowM3h, 0);
  }, [selectedModules]);

  // Intersecting modules live preview during marquee drag
  const activeIntersectingIds = useMemo(() => {
    if (!isMarqueeSelecting || !selectionBox) return [];
    const minX = Math.min(selectionBox.startX, selectionBox.currentX);
    const maxX = Math.max(selectionBox.startX, selectionBox.currentX);
    const minY = Math.min(selectionBox.startY, selectionBox.currentY);
    const maxY = Math.max(selectionBox.startY, selectionBox.currentY);

    return modulePositions
      .filter(mp => mp.x < maxX && mp.x + mp.width > minX && mp.y < maxY && mp.y + mp.height > minY)
      .map(mp => mp.id);
  }, [isMarqueeSelecting, selectionBox, modulePositions]);

  // Convert client pointer event into SVG coordinate system
  const getSvgCoords = (e: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>): { x: number; y: number } | null => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const transformed = pt.matrixTransform(ctm.inverse());
      return { x: transformed.x, y: transformed.y };
    }
    const rect = svg.getBoundingClientRect();
    const vx = -60 + ((e.clientX - rect.left) / rect.width) * (room.widthMm + 120);
    const vy = -60 + ((e.clientY - rect.top) / rect.height) * (room.depthMm + 120);
    return { x: vx, y: vy };
  };

  // Helper to update modules and recalculate derived metrics
  const updateModelWithModules = (newModules: MonolitheModule[]) => {
    const indexed = newModules.map((m, idx) => ({ ...m, positionIndex: idx }));
    const totalLength = indexed.reduce((acc, m) => acc + m.widthMm, 0);

    setModel(prev => ({
      ...prev,
      monolithe: {
        ...prev.monolithe,
        lengthMm: totalLength,
        modules: indexed,
      },
      derivedCalculations: {
        ...prev.derivedCalculations,
        totalElectricKw: Number(indexed.reduce((acc, m) => acc + m.electricKw, 0).toFixed(1)),
        totalGasKw: Number(indexed.reduce((acc, m) => acc + m.gasKw, 0).toFixed(1)),
        totalExhaustFlowM3h: Math.round(indexed.reduce((acc, m) => acc + m.exhaustFlowM3h, 0)),
        freshAirCompensationM3h: Math.round(indexed.reduce((acc, m) => acc + m.exhaustFlowM3h, 0) * 0.8),
        linearMetersOfContinuousTop: Number((totalLength / 1000).toFixed(2)),
      },
    }));
  };

  // Keyboard shortcuts (Escape to clear, Ctrl/Cmd+A to select all)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when focusing inputs or textareas
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        setSelectedModuleIds([]);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedModuleIds(suite.modules.map(m => m.id));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [suite.modules]);

  // Mass Position Shift in Room (dx, dy)
  const handlePositionShift = (dx: number, dy: number) => {
    setModel(prev => ({
      ...prev,
      monolithe: {
        ...prev.monolithe,
        xMm: Math.max(200, Math.min(prev.room.widthMm - prev.monolithe.lengthMm - 200, prev.monolithe.xMm + dx)),
        yMm: Math.max(200, Math.min(prev.room.depthMm - prev.monolithe.depthMm - 200, prev.monolithe.yMm + dy)),
      },
    }));
  };

  // Pointer Handlers for Click-and-Drag Box Selection
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only primary mouse button
    const coords = getSvgCoords(e);
    if (!coords) return;

    setIsMarqueeSelecting(true);
    setSelectionBox({
      startX: coords.x,
      startY: coords.y,
      currentX: coords.x,
      currentY: coords.y,
    });

    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isMarqueeSelecting || !selectionBox) return;
    const coords = getSvgCoords(e);
    if (!coords) return;

    setSelectionBox(prev => prev ? {
      ...prev,
      currentX: coords.x,
      currentY: coords.y,
    } : null);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isMarqueeSelecting || !selectionBox) return;
    const coords = getSvgCoords(e) || { x: selectionBox.currentX, y: selectionBox.currentY };
    const minX = Math.min(selectionBox.startX, coords.x);
    const maxX = Math.max(selectionBox.startX, coords.x);
    const minY = Math.min(selectionBox.startY, coords.y);
    const maxY = Math.max(selectionBox.startY, coords.y);
    const dist = Math.hypot(coords.x - selectionBox.startX, coords.y - selectionBox.startY);

    if (dist > 12) {
      // Box selection finished: select all intersecting modules
      const intersecting = modulePositions
        .filter(mp => mp.x < maxX && mp.x + mp.width > minX && mp.y < maxY && mp.y + mp.height > minY)
        .map(mp => mp.id);

      if (e.shiftKey) {
        setSelectedModuleIds(prev => Array.from(new Set([...prev, ...intersecting])));
      } else {
        setSelectedModuleIds(intersecting);
      }
    } else {
      // Simple tap / click on empty background
      if (!e.shiftKey) {
        setSelectedModuleIds([]);
      }
    }

    setIsMarqueeSelecting(false);
    setSelectionBox(null);
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch (_) {}
  };

  const handlePointerCancel = () => {
    setIsMarqueeSelecting(false);
    setSelectionBox(null);
  };

  // Module Click Handler (supports Shift/Ctrl multi-selection toggle)
  const handleModuleClick = (e: React.MouseEvent, modId: string) => {
    e.stopPropagation();
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      setSelectedModuleIds(prev =>
        prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
      );
    } else {
      setSelectedModuleIds([modId]);
    }
  };

  // Selection actions
  const handleSelectAll = () => {
    setSelectedModuleIds(suite.modules.map(m => m.id));
  };

  const handleClearSelection = () => {
    setSelectedModuleIds([]);
  };

  const handleInvertSelection = () => {
    const set = new Set(selectedModuleIds);
    setSelectedModuleIds(suite.modules.filter(m => !set.has(m.id)).map(m => m.id));
  };

  // Mass-Repositioning Operations along the Continuous Monolithe Suite
  const handleMoveSelectedModules = (direction: 'left' | 'right') => {
    if (selectedModuleIds.length === 0) return;
    const modules = [...suite.modules];
    const selectedSet = new Set(selectedModuleIds);

    if (direction === 'left') {
      const firstIndex = modules.findIndex(m => selectedSet.has(m.id));
      if (firstIndex <= 0) return; // Cannot move further left
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
      if (lastIndex === -1 || lastIndex >= modules.length - 1) return; // Cannot move further right
      for (let i = modules.length - 2; i >= 0; i--) {
        if (selectedSet.has(modules[i].id) && !selectedSet.has(modules[i + 1].id)) {
          const temp = modules[i];
          modules[i] = modules[i + 1];
          modules[i + 1] = temp;
        }
      }
    }

    updateModelWithModules(modules);
  };

  const handleMoveSelectedToStart = () => {
    const selectedSet = new Set(selectedModuleIds);
    const selected = suite.modules.filter(m => selectedSet.has(m.id));
    const unselected = suite.modules.filter(m => !selectedSet.has(m.id));
    updateModelWithModules([...selected, ...unselected]);
  };

  const handleMoveSelectedToEnd = () => {
    const selectedSet = new Set(selectedModuleIds);
    const selected = suite.modules.filter(m => selectedSet.has(m.id));
    const unselected = suite.modules.filter(m => !selectedSet.has(m.id));
    updateModelWithModules([...unselected, ...selected]);
  };

  const handleReverseSelectedModules = () => {
    const selectedSet = new Set(selectedModuleIds);
    const selectedIndices: number[] = [];
    suite.modules.forEach((m, idx) => {
      if (selectedSet.has(m.id)) selectedIndices.push(idx);
    });
    if (selectedIndices.length <= 1) return;

    const modules = [...suite.modules];
    for (let i = 0; i < Math.floor(selectedIndices.length / 2); i++) {
      const idxA = selectedIndices[i];
      const idxB = selectedIndices[selectedIndices.length - 1 - i];
      const temp = modules[idxA];
      modules[idxA] = modules[idxB];
      modules[idxB] = temp;
    }
    updateModelWithModules(modules);
  };

  const handleConsolidateSelected = () => {
    const selectedSet = new Set(selectedModuleIds);
    const firstIndex = suite.modules.findIndex(m => selectedSet.has(m.id));
    if (firstIndex === -1) return;

    const selected = suite.modules.filter(m => selectedSet.has(m.id));
    const unselected = suite.modules.filter(m => !selectedSet.has(m.id));

    const result = [
      ...unselected.slice(0, firstIndex),
      ...selected,
      ...unselected.slice(firstIndex),
    ];
    updateModelWithModules(result);
  };

  // Collective Property Editing Operations
  const handleSetCollectiveWidth = (newWidthMm: number) => {
    const widthClamped = Math.max(400, Math.min(1600, newWidthMm));
    const selectedSet = new Set(selectedModuleIds);

    const updated = suite.modules.map(m => {
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

    updateModelWithModules(updated);
  };

  const handleDeltaCollectiveWidth = (deltaMm: number) => {
    const selectedSet = new Set(selectedModuleIds);
    const updated = suite.modules.map(m => {
      if (!selectedSet.has(m.id)) return m;
      const newWidth = Math.max(400, Math.min(1600, m.widthMm + deltaMm));
      const ratio = newWidth / m.widthMm;
      const newElectric = m.electricKw > 0 ? Number((m.electricKw * ratio).toFixed(1)) : 0;
      const newGas = m.gasKw > 0 ? Number((m.gasKw * ratio).toFixed(1)) : 0;
      return {
        ...m,
        widthMm: newWidth,
        electricKw: newElectric,
        gasKw: newGas,
      };
    });

    updateModelWithModules(updated);
  };

  const handleSetCollectiveEnergyTier = (multiplier: number) => {
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

    updateModelWithModules(updated);
  };

  const handleDuplicateSelectedCollective = () => {
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

    updateModelWithModules(updated);
    setSelectedModuleIds(newClones.map(c => c.id));
  };

  const handleDeleteSelectedCollective = () => {
    if (selectedModuleIds.length === 0) return;
    const selectedSet = new Set(selectedModuleIds);
    const remaining = suite.modules.filter(m => !selectedSet.has(m.id));
    if (remaining.length === 0) return; // Must keep at least 1

    updateModelWithModules(remaining);
    setSelectedModuleIds([remaining[0].id]);
  };

  // Drag over canvas to detect insert index from catalog
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * (room.widthMm + 120) - 60;

    let targetIdx = suite.modules.length;
    if (svgX <= suite.xMm) {
      targetIdx = 0;
    } else if (svgX >= suite.xMm + suite.lengthMm) {
      targetIdx = suite.modules.length;
    } else {
      let curX = suite.xMm;
      for (let i = 0; i < suite.modules.length; i++) {
        const midX = curX + suite.modules[i].widthMm / 2;
        if (svgX < midX) {
          targetIdx = i;
          break;
        }
        curX += suite.modules[i].widthMm;
      }
    }
    setDropInsertIndex(targetIdx);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
    setDropInsertIndex(null);
  };

  // Handle drop from Monolithe catalog
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const targetIdx = dropInsertIndex !== null ? dropInsertIndex : suite.modules.length;
    setDropInsertIndex(null);

    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;

    try {
      const catalogItem: CatalogItem = JSON.parse(raw);
      const newModule = createModuleFromCatalog(catalogItem, targetIdx);
      const updatedModules = [...suite.modules];
      updatedModules.splice(targetIdx, 0, newModule);

      updateModelWithModules(updatedModules);
      setSelectedModuleIds([newModule.id]);
    } catch (err) {
      console.error('Error dropping module:', err);
    }
  };

  // Canvas bounds
  const svgWidth = room.widthMm * zoom;
  const svgHeight = room.depthMm * zoom;

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* 2D Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-neutral-800 relative bg-neutral-900/60 p-4">
        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-mono">Zoom</span>
            <button
              onClick={() => setZoom(z => Math.max(0.08, z - 0.02))}
              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-neutral-300 w-12 text-center">
              {(zoom * 1000).toFixed(0)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(0.24, z + 0.02))}
              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Marquee Selection Tool Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
            <button
              onClick={() => setIsMarqueeMode(!isMarqueeMode)}
              className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isMarqueeMode
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Clique e arraste uma caixa para selecionar múltiplos módulos"
            >
              <BoxSelect className="w-3.5 h-3.5" />
              <span>Caixa de Seleção</span>
            </button>

            {selectedModuleIds.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-sky-900/60 text-sky-300 font-mono text-[11px] font-bold">
                {selectedModuleIds.length} selecionado{selectedModuleIds.length > 1 ? 's' : ''}
              </span>
            )}

            <button
              onClick={handleSelectAll}
              className="px-2 py-1 text-[11px] rounded hover:bg-neutral-800 text-neutral-300 transition-colors cursor-pointer"
              title="Selecionar Todos os Módulos (Ctrl+A)"
            >
              Todos
            </button>

            {selectedModuleIds.length > 0 && (
              <button
                onClick={handleClearSelection}
                className="px-1.5 py-1 text-[11px] rounded hover:bg-neutral-800 text-neutral-400 hover:text-rose-300 transition-colors cursor-pointer"
                title="Limpar Seleção (Esc)"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Layer toggles */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300">
              <input
                type="checkbox"
                checked={showMep}
                onChange={e => setShowMep(e.target.checked)}
                className="rounded border-neutral-700 text-amber-500 focus:ring-amber-500 bg-neutral-800"
              />
              <span>Pontos MEP</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300">
              <input
                type="checkbox"
                checked={showHood}
                onChange={e => setShowHood(e.target.checked)}
                className="rounded border-neutral-700 text-amber-500 focus:ring-amber-500 bg-neutral-800"
              />
              <span>Coifa / Exaustão</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300">
              <input
                type="checkbox"
                checked={showDimensions}
                onChange={e => setShowDimensions(e.target.checked)}
                className="rounded border-neutral-700 text-amber-500 focus:ring-amber-500 bg-neutral-800"
              />
              <span>Cotas</span>
            </label>
          </div>

          {/* Quick Position Shift buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-mono">Posição:</span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handlePositionShift(-shiftStepMm, 0)}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-mono cursor-pointer"
                title={`Mover bloco para esquerda (${shiftStepMm}mm)`}
              >
                ←
              </button>
              <button
                onClick={() => handlePositionShift(shiftStepMm, 0)}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-mono cursor-pointer"
                title={`Mover bloco para direita (${shiftStepMm}mm)`}
              >
                →
              </button>
              <button
                onClick={() => handlePositionShift(0, -shiftStepMm)}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-mono cursor-pointer"
                title={`Mover bloco para cima (${shiftStepMm}mm)`}
              >
                ↑
              </button>
              <button
                onClick={() => handlePositionShift(0, shiftStepMm)}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-mono cursor-pointer"
                title={`Mover bloco para baixo (${shiftStepMm}mm)`}
              >
                ↓
              </button>
            </div>
            {/* Step selector */}
            <select
              value={shiftStepMm}
              onChange={e => setShiftStepMm(Number(e.target.value))}
              className="bg-neutral-800 text-[10px] font-mono text-neutral-300 border border-neutral-700 rounded px-1 py-0.5 cursor-pointer"
              title="Passo de deslocamento da ilha"
            >
              <option value="50">50mm</option>
              <option value="100">100mm</option>
              <option value="250">250mm</option>
              <option value="500">500mm</option>
            </select>
          </div>
        </div>

        {/* Interactive SVG Floorplan Canvas with Click-and-Drag Box Selection & Drag-and-Drop */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 flex items-center justify-center overflow-auto p-4 rounded-xl border transition-all shadow-inner relative ${
            isDragOver
              ? 'border-amber-400 bg-amber-950/20 ring-2 ring-amber-400/30'
              : 'border-neutral-800/80 bg-neutral-950/70'
          }`}
        >
          {/* Drag Overlay Helper */}
          {isDragOver && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-amber-400 text-neutral-950 font-bold px-4 py-1.5 rounded-full text-xs shadow-lg flex items-center gap-2 pointer-events-none animate-bounce">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Solte para encaixar no bloco contínuo Monolithe (Posição {dropInsertIndex !== null ? dropInsertIndex + 1 : 'final'})</span>
            </div>
          )}

          {/* Marquee Selection Hint */}
          {isMarqueeMode && !isMarqueeSelecting && selectedModuleIds.length <= 1 && (
            <div className="absolute top-4 left-4 z-10 bg-neutral-900/80 backdrop-blur border border-neutral-800 text-neutral-400 text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 pointer-events-none">
              <BoxSelect className="w-3.5 h-3.5 text-sky-400" />
              <span>Clique e arraste uma caixa para selecionar múltiplos módulos (Shift adiciona)</span>
            </div>
          )}

          <svg
            ref={svgRef}
            width={svgWidth + 120}
            height={svgHeight + 120}
            viewBox={`-60 -60 ${room.widthMm + 120} ${room.depthMm + 120}`}
            className="select-none cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            {/* Grid Pattern */}
            <defs>
              <pattern id="grid100" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#262626" strokeWidth="1" />
              </pattern>
              <pattern id="grid500" width="500" height="500" patternUnits="userSpaceOnUse">
                <path d="M 500 0 L 0 0 0 500" fill="none" stroke="#333333" strokeWidth="1.5" />
              </pattern>
            </defs>

            {/* Room Floor */}
            <rect
              x="0"
              y="0"
              width={room.widthMm}
              height={room.depthMm}
              fill="#121212"
              stroke="#525252"
              strokeWidth="6"
            />
            <rect
              x="0"
              y="0"
              width={room.widthMm}
              height={room.depthMm}
              fill="url(#grid100)"
              opacity="0.4"
            />
            <rect
              x="0"
              y="0"
              width={room.widthMm}
              height={room.depthMm}
              fill="url(#grid500)"
              opacity="0.5"
            />

            {/* Exhaust Hood Overhang Projection (Cyan dashed) */}
            {showHood && (
              <g opacity="0.6">
                <rect
                  x={suite.xMm - model.parameters.exhaustHoodOverhangMm}
                  y={suite.yMm - model.parameters.exhaustHoodOverhangMm}
                  width={suite.lengthMm + model.parameters.exhaustHoodOverhangMm * 2}
                  height={suite.depthMm + model.parameters.exhaustHoodOverhangMm * 2}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                  strokeDasharray="12,8"
                  rx="8"
                />
                <text
                  x={suite.xMm + 10}
                  y={suite.yMm - model.parameters.exhaustHoodOverhangMm + 24}
                  fill="#06b6d4"
                  fontSize="42"
                  fontFamily="monospace"
                >
                  COIFA LABIRINTO MPK ({model.derivedCalculations.totalExhaustFlowM3h} m³/h)
                </text>
              </g>
            )}

            {/* Monolithe Seamless Block Boundary */}
            <rect
              x={suite.xMm}
              y={suite.yMm}
              width={suite.lengthMm}
              height={suite.depthMm}
              fill="#262626"
              stroke={isDragOver ? '#38bdf8' : '#fbbf24'}
              strokeWidth={isDragOver ? '7' : '5'}
              strokeDasharray={isDragOver ? '16,8' : 'none'}
              rx="4"
            />

            {/* Monolithe Modules */}
            {modulePositions.map((pos) => {
              const m = pos.module;
              const modX = pos.x;
              const isSelected = selectedModuleIds.includes(m.id);
              const isHoveredMarquee = activeIntersectingIds.includes(m.id);

              let fillColor = '#333333';
              if (m.type === 'induction_wok') fillColor = '#1e293b';
              else if (m.type === 'frytop_chrome') fillColor = '#475569';
              else if (m.type === 'open_burner') fillColor = '#3b201a';
              else if (m.type === 'pasta_cooker') fillColor = '#172554';
              else if (m.type === 'bain_marie') fillColor = '#451a03';
              else if (m.type === 'refrigerated_drawers') fillColor = '#0f172a';
              else if (m.type === 'pot_sink') fillColor = '#1e3a5f';

              let strokeColor = '#737373';
              let strokeWidth = 2;
              if (isSelected) {
                strokeColor = '#38bdf8';
                strokeWidth = 6;
              } else if (isHoveredMarquee) {
                strokeColor = '#f59e0b';
                strokeWidth = 4;
              }

              return (
                <g
                  key={m.id}
                  onClick={(e) => handleModuleClick(e, m.id)}
                  className="cursor-pointer group"
                >
                  <rect
                    x={modX + 3}
                    y={suite.yMm + 3}
                    width={m.widthMm - 6}
                    height={suite.depthMm - 6}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isHoveredMarquee && !isSelected ? '8,4' : 'none'}
                    rx="3"
                  />

                  {/* Multi-selection tinted overlay */}
                  {isSelected && (
                    <rect
                      x={modX + 3}
                      y={suite.yMm + 3}
                      width={m.widthMm - 6}
                      height={suite.depthMm - 6}
                      fill="#38bdf8"
                      fillOpacity="0.2"
                      rx="3"
                      pointerEvents="none"
                    />
                  )}

                  {/* Specific module graphics */}
                  {m.type === 'induction_wok' && (
                    <g pointerEvents="none">
                      <circle
                        cx={modX + m.widthMm / 2}
                        cy={suite.yMm + suite.depthMm / 2}
                        r="150"
                        fill="#0f172a"
                        stroke="#ef4444"
                        strokeWidth="4"
                      />
                      <circle
                        cx={modX + m.widthMm / 2}
                        cy={suite.yMm + suite.depthMm / 2}
                        r="80"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="2"
                        strokeDasharray="8,6"
                      />
                    </g>
                  )}

                  {m.type === 'frytop_chrome' && (
                    <rect
                      x={modX + 40}
                      y={suite.yMm + 60}
                      width={m.widthMm - 80}
                      height={suite.depthMm - 120}
                      fill="#cbd5e1"
                      stroke="#94a3b8"
                      strokeWidth="3"
                      rx="4"
                      pointerEvents="none"
                    />
                  )}

                  {m.type === 'open_burner' && (
                    <g pointerEvents="none">
                      <circle
                        cx={modX + m.widthMm / 2}
                        cy={suite.yMm + suite.depthMm * 0.35}
                        r="75"
                        fill="#262626"
                        stroke="#f59e0b"
                        strokeWidth="4"
                      />
                      <circle
                        cx={modX + m.widthMm / 2}
                        cy={suite.yMm + suite.depthMm * 0.7}
                        r="75"
                        fill="#262626"
                        stroke="#f59e0b"
                        strokeWidth="4"
                      />
                    </g>
                  )}

                  {m.type === 'pot_sink' && (
                    <g pointerEvents="none">
                      <rect
                        x={modX + 50}
                        y={suite.yMm + 80}
                        width={m.widthMm - 100}
                        height={suite.depthMm - 160}
                        fill="#172554"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        rx="4"
                      />
                      <circle
                        cx={modX + m.widthMm / 2}
                        cy={suite.yMm + 50}
                        r="20"
                        fill="#60a5fa"
                      />
                    </g>
                  )}

                  {/* Text Labels */}
                  <text
                    x={modX + m.widthMm / 2}
                    y={suite.yMm + 50}
                    fill="#f8fafc"
                    fontSize="36"
                    fontWeight="600"
                    textAnchor="middle"
                    fontFamily="system-ui"
                    pointerEvents="none"
                  >
                    {m.name.split(' ')[0]} {m.name.split(' ')[1] || ''}
                  </text>

                  <text
                    x={modX + m.widthMm / 2}
                    y={suite.yMm + suite.depthMm - 40}
                    fill="#94a3b8"
                    fontSize="28"
                    textAnchor="middle"
                    fontFamily="monospace"
                    pointerEvents="none"
                  >
                    {m.widthMm}mm · {m.electricKw > 0 ? `${m.electricKw}kW` : `${m.gasKw}kW gás`}
                  </text>

                  {/* Selection Badge with Order Number */}
                  {isSelected && (
                    <g pointerEvents="none">
                      <circle
                        cx={modX + m.widthMm - 24}
                        cy={suite.yMm + 24}
                        r="14"
                        fill="#38bdf8"
                      />
                      <text
                        x={modX + m.widthMm - 24}
                        y={suite.yMm + 29}
                        fill="#09090b"
                        fontSize="15"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        #{selectedModuleIds.indexOf(m.id) + 1}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Collective Multi-Selection Outer Bounding Contour */}
            {selectedModuleIds.length > 1 && (() => {
              const selectedPositions = modulePositions.filter(p => selectedModuleIds.includes(p.id));
              if (selectedPositions.length === 0) return null;
              const selMinX = Math.min(...selectedPositions.map(p => p.x)) - 8;
              const selMaxX = Math.max(...selectedPositions.map(p => p.x + p.width)) + 8;
              const selMinY = suite.yMm - 8;
              const selMaxY = suite.yMm + suite.depthMm + 8;
              const selWidth = selMaxX - selMinX;
              const selHeight = selMaxY - selMinY;

              return (
                <g className="pointer-events-none">
                  <rect
                    x={selMinX}
                    y={selMinY}
                    width={selWidth}
                    height={selHeight}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3.5"
                    strokeDasharray="14,8"
                    rx="8"
                  />
                  {/* Corner markers */}
                  <circle cx={selMinX} cy={selMinY} r="8" fill="#38bdf8" />
                  <circle cx={selMaxX} cy={selMinY} r="8" fill="#38bdf8" />
                  <circle cx={selMinX} cy={selMaxY} r="8" fill="#38bdf8" />
                  <circle cx={selMaxX} cy={selMaxY} r="8" fill="#38bdf8" />

                  {/* Floating Tag */}
                  <rect
                    x={selMinX + selWidth / 2 - 200}
                    y={selMinY - 44}
                    width="400"
                    height="34"
                    fill="#0284c7"
                    rx="6"
                  />
                  <text
                    x={selMinX + selWidth / 2}
                    y={selMinY - 22}
                    fill="#ffffff"
                    fontSize="20"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    ✦ SELEÇÃO COLETIVA: {selectedModuleIds.length} MÓDULOS ({selectedTotalWidth} mm)
                  </text>
                </g>
              );
            })()}

            {/* Active Click-and-Drag Marquee Selection Box */}
            {isMarqueeSelecting && selectionBox && (() => {
              const minX = Math.min(selectionBox.startX, selectionBox.currentX);
              const maxX = Math.max(selectionBox.startX, selectionBox.currentX);
              const minY = Math.min(selectionBox.startY, selectionBox.currentY);
              const maxY = Math.max(selectionBox.startY, selectionBox.currentY);
              const boxW = maxX - minX;
              const boxH = maxY - minY;

              return (
                <g className="pointer-events-none">
                  <rect
                    x={minX}
                    y={minY}
                    width={boxW}
                    height={boxH}
                    fill="rgba(56, 189, 248, 0.15)"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeDasharray="10,6"
                    rx="6"
                  />
                  <rect
                    x={minX}
                    y={minY - 34}
                    width={Math.max(280, boxW)}
                    height="28"
                    fill="#0c4a6e"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    rx="4"
                  />
                  <text
                    x={minX + 10}
                    y={minY - 15}
                    fill="#e0f2fe"
                    fontSize="20"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Caixa: {boxW.toFixed(0)} × {boxH.toFixed(0)} mm ({activeIntersectingIds.length} módulos)
                  </text>
                </g>
              );
            })()}

            {/* Drop Indicator Guide Line */}
            {isDragOver && dropInsertIndex !== null && (
              (() => {
                let targetX = suite.xMm;
                for (let i = 0; i < dropInsertIndex && i < suite.modules.length; i++) {
                  targetX += suite.modules[i].widthMm;
                }
                return (
                  <g>
                    <line
                      x1={targetX}
                      y1={suite.yMm - 40}
                      x2={targetX}
                      y2={suite.yMm + suite.depthMm + 40}
                      stroke="#38bdf8"
                      strokeWidth="10"
                      strokeDasharray="16,8"
                    />
                    <circle cx={targetX} cy={suite.yMm - 40} r="16" fill="#38bdf8" />
                    <circle cx={targetX} cy={suite.yMm + suite.depthMm + 40} r="16" fill="#38bdf8" />
                  </g>
                );
              })()
            )}

            {/* Continuous Hygienic Weld Indicator */}
            <g opacity="0.9">
              <rect
                x={suite.xMm}
                y={suite.yMm - 30}
                width={suite.lengthMm}
                height="22"
                fill="#fbbf24"
                rx="3"
              />
              <text
                x={suite.xMm + suite.lengthMm / 2}
                y={suite.yMm - 14}
                fill="#18181b"
                fontSize="18"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="system-ui"
              >
                TAMPO MONOLÍTICO SOLDADO A LASER · AISI {suite.materialGrade.replace('_', ' ')} (0 JUNTAS HIGIÊNICAS)
              </text>
            </g>

            {/* Cotas / Dimension Lines */}
            {showDimensions && (
              <g stroke="#94a3b8" strokeWidth="2" fill="#94a3b8">
                {/* North Aisle Dimension */}
                <line x1={suite.xMm + suite.lengthMm / 2} y1="0" x2={suite.xMm + suite.lengthMm / 2} y2={suite.yMm} />
                <text
                  x={suite.xMm + suite.lengthMm / 2 + 15}
                  y={suite.yMm / 2}
                  fill={isAisleNorthValid ? '#10b981' : '#ef4444'}
                  fontSize="36"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {aisleNorth} mm {isAisleNorthValid ? '✓' : '⚠️ (<1100)'}
                </text>

                {/* South Aisle Dimension */}
                <line
                  x1={suite.xMm + suite.lengthMm / 2}
                  y1={suite.yMm + suite.depthMm}
                  x2={suite.xMm + suite.lengthMm / 2}
                  y2={room.depthMm}
                />
                <text
                  x={suite.xMm + suite.lengthMm / 2 + 15}
                  y={suite.yMm + suite.depthMm + aisleSouth / 2}
                  fill={isAisleSouthValid ? '#10b981' : '#ef4444'}
                  fontSize="36"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {aisleSouth} mm {isAisleSouthValid ? '✓' : '⚠️ (<1100)'}
                </text>

                {/* Monolithe Length Dimension */}
                <line
                  x1={suite.xMm}
                  y1={suite.yMm + suite.depthMm + 50}
                  x2={suite.xMm + suite.lengthMm}
                  y2={suite.yMm + suite.depthMm + 50}
                />
                <text
                  x={suite.xMm + suite.lengthMm / 2}
                  y={suite.yMm + suite.depthMm + 90}
                  fill="#fbbf24"
                  fontSize="38"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  Comprimento Total: {suite.lengthMm} mm ({suite.modules.length} módulos)
                </text>
              </g>
            )}

            {/* MEP Points */}
            {showMep && (
              <g>
                <circle cx={suite.xMm + 400} cy={suite.yMm + 50} r="25" fill="#3b82f6" />
                <text x={suite.xMm + 400} y={suite.yMm + 90} fill="#3b82f6" fontSize="22" textAnchor="middle" fontFamily="monospace">
                  ÁGUA DN20
                </text>

                {model.derivedCalculations.totalGasKw > 0 && (
                  <>
                    <circle cx={suite.xMm + suite.lengthMm - 300} cy={suite.yMm + 50} r="25" fill="#eab308" />
                    <text x={suite.xMm + suite.lengthMm - 300} y={suite.yMm + 90} fill="#eab308" fontSize="22" textAnchor="middle" fontFamily="monospace">
                      GÁS GLP/GN
                    </text>
                  </>
                )}

                <polygon
                  points={`${suite.xMm + 150},${suite.yMm + 30} ${suite.xMm + 180},${suite.yMm + 55} ${suite.xMm + 150},${suite.yMm + 80} ${suite.xMm + 120},${suite.yMm + 55}`}
                  fill="#f97316"
                />
                <text x={suite.xMm + 150} y={suite.yMm + 105} fill="#f97316" fontSize="22" textAnchor="middle" fontFamily="monospace">
                  400V 3P ({model.derivedCalculations.totalElectricKw.toFixed(1)} kW)
                </text>
              </g>
            )}
          </svg>

          {/* Floating Collective Mass Editor & Repositioning Bar */}
          {selectedModuleIds.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-4xl w-[94%] bg-neutral-900/95 backdrop-blur-md border border-sky-500/50 shadow-2xl rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-3 border-b border-neutral-800 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 font-mono font-bold text-xs">
                    <BoxSelect className="w-3.5 h-3.5" />
                    <span>{selectedModuleIds.length} Módulos Selecionados</span>
                  </div>
                  <span className="text-xs text-neutral-400">
                    Largura: <strong className="text-white font-mono">{selectedTotalWidth}mm</strong> · Carga: <strong className="text-amber-400 font-mono">{selectedTotalElectricKw.toFixed(1)}kW</strong> elétrico / <strong className="text-orange-400 font-mono">{selectedTotalGasKw.toFixed(1)}kW</strong> gás · Exaustão: <strong className="text-cyan-400 font-mono">{selectedTotalExhaustFlow}m³/h</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleSelectAll}
                    className="px-2 py-1 text-[11px] rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                    title="Selecionar Todos os Módulos (Ctrl+A)"
                  >
                    Todos
                  </button>
                  <button
                    onClick={handleInvertSelection}
                    className="px-2 py-1 text-[11px] rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                    title="Inverter Seleção"
                  >
                    Inverter
                  </button>
                  <button
                    onClick={handleClearSelection}
                    className="px-2 py-1 text-[11px] rounded bg-neutral-800 hover:bg-rose-900/40 text-rose-300 cursor-pointer"
                    title="Limpar Seleção (Esc)"
                  >
                    Limpar (Esc)
                  </button>
                </div>
              </div>

              {/* Mass Repositioning & Collective Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* 1. Mass Repositioning along island */}
                <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-semibold block">
                    Reposicionamento em Massa
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      onClick={() => handleMoveSelectedModules('left')}
                      className="py-1 px-1.5 rounded bg-neutral-800 hover:bg-sky-600 hover:text-white text-neutral-200 font-mono text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      title="Mover grupo para esquerda na bancada"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Esq</span>
                    </button>
                    <button
                      onClick={() => handleMoveSelectedModules('right')}
                      className="py-1 px-1.5 rounded bg-neutral-800 hover:bg-sky-600 hover:text-white text-neutral-200 font-mono text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      title="Mover grupo para direita na bancada"
                    >
                      <span>Dir</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleMoveSelectedToStart}
                      className="py-1 px-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[11px] text-center cursor-pointer"
                      title="Mover seleção para o início da ilha"
                    >
                      |&lt; Início
                    </button>
                    <button
                      onClick={handleMoveSelectedToEnd}
                      className="py-1 px-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[11px] text-center cursor-pointer"
                      title="Mover seleção para o fim da ilha"
                    >
                      Fim &gt;|
                    </button>
                  </div>
                  <div className="flex items-center gap-1 pt-0.5">
                    <button
                      onClick={handleReverseSelectedModules}
                      className="flex-1 py-1 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                      title="Inverter ordem dos módulos selecionados"
                    >
                      <RotateCcw className="w-3 h-3 text-sky-400" />
                      <span>Inverter Ordem</span>
                    </button>
                    <button
                      onClick={handleConsolidateSelected}
                      className="flex-1 py-1 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                      title="Agrupar módulos contiguamente"
                    >
                      <Layers className="w-3 h-3 text-sky-400" />
                      <span>Agrupar</span>
                    </button>
                  </div>
                </div>

                {/* 2. Collective Width Editing */}
                <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                      Largura Coletiva (mm)
                    </span>
                    <span className="font-mono text-white text-[11px] font-bold">
                      {selectedModules[0]?.widthMm}mm (cada)
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[400, 600, 800, 1000, 1200].map(w => (
                      <button
                        key={w}
                        onClick={() => handleSetCollectiveWidth(w)}
                        className="py-1 rounded bg-neutral-900 border border-neutral-800 hover:border-amber-400 hover:text-amber-300 font-mono text-[10px] text-neutral-300 cursor-pointer"
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 pt-0.5">
                    <button
                      onClick={() => handleDeltaCollectiveWidth(-50)}
                      className="flex-1 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-[10px] cursor-pointer"
                    >
                      -50mm a todos
                    </button>
                    <button
                      onClick={() => handleDeltaCollectiveWidth(50)}
                      className="flex-1 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-[10px] cursor-pointer"
                    >
                      +50mm a todos
                    </button>
                  </div>
                </div>

                {/* 3. Batch Actions & Power Scale */}
                <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                    Ações em Bloco & Potência
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleDuplicateSelectedCollective}
                      className="flex-1 py-1 px-2 rounded bg-sky-950/60 border border-sky-800/80 hover:bg-sky-900 text-sky-200 text-[11px] flex items-center justify-center gap-1 font-semibold cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Duplicar Bloco</span>
                    </button>
                    <button
                      onClick={handleDeleteSelectedCollective}
                      disabled={suite.modules.length <= selectedModuleIds.length}
                      className="flex-1 py-1 px-2 rounded bg-rose-950/60 border border-rose-900/80 hover:bg-rose-900 text-rose-300 text-[11px] flex items-center justify-center gap-1 font-semibold disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Excluir Bloco</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    <button
                      onClick={() => handleSetCollectiveEnergyTier(0.8)}
                      className="py-1 rounded bg-neutral-900 border border-neutral-800 hover:border-emerald-500 text-emerald-400 text-[10px] cursor-pointer"
                      title="Escalar potência para Eco 80%"
                    >
                      Eco 80%
                    </button>
                    <button
                      onClick={() => handleSetCollectiveEnergyTier(1.0)}
                      className="py-1 rounded bg-neutral-900 border border-neutral-800 hover:border-sky-500 text-sky-300 text-[10px] cursor-pointer"
                      title="Escalar potência para Nominal 100%"
                    >
                      Nominal
                    </button>
                    <button
                      onClick={() => handleSetCollectiveEnergyTier(1.2)}
                      className="py-1 rounded bg-neutral-900 border border-neutral-800 hover:border-amber-500 text-amber-400 text-[10px] cursor-pointer"
                      title="Escalar potência para Turbo 120%"
                    >
                      Turbo 120%
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Indicator Bar */}
        <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-neutral-800 text-neutral-400">
          <div className="flex items-center gap-2">
            {isAisleNorthValid && isAisleSouthValid ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ergonomia de circulação validada (≥ {model.parameters.aisleWidthMinMm}mm)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Corredor inferior a {model.parameters.aisleWidthMinMm}mm — ajuste a posição do bloco
              </span>
            )}
          </div>
          <span className="font-mono text-neutral-400">
            Escala Técnica: 1:{(1 / zoom / 10).toFixed(0)} · Cotas em mm nominais
          </span>
        </div>
      </div>

      {/* Lateral Parametric Catalog Panel (S03) */}
      <ParametricCatalogSidebar
        model={model}
        setModel={setModel}
        selectedModuleId={selectedModuleId}
        setSelectedModuleId={setSelectedModuleId}
        selectedModuleIds={selectedModuleIds}
        setSelectedModuleIds={setSelectedModuleIds}
      />
    </div>
  );
};
