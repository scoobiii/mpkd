import React, { useState, useRef } from 'react';
import { DesignModel, MonolitheModule } from '../types/designModel';
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
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Drag-and-drop target states
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const room = model.room;
  const suite = model.monolithe;

  // Clearances
  const aisleNorth = suite.yMm;
  const aisleSouth = room.depthMm - (suite.yMm + suite.depthMm);
  const isAisleNorthValid = aisleNorth >= model.parameters.aisleWidthMinMm;
  const isAisleSouthValid = aisleSouth >= model.parameters.aisleWidthMinMm;

  // Position shift
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

  // Drag over canvas to detect insert index
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
              <span>Cotas Técnicas</span>
            </label>
          </div>

          {/* Quick Shift buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-mono">Posição:</span>
            <button
              onClick={() => handlePositionShift(-100, 0)}
              className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-mono cursor-pointer"
              title="Mover bloco para esquerda"
            >
              ←
            </button>
            <button
              onClick={() => handlePositionShift(100, 0)}
              className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-mono cursor-pointer"
              title="Mover bloco para direita"
            >
              →
            </button>
            <button
              onClick={() => handlePositionShift(0, -100)}
              className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-mono cursor-pointer"
              title="Mover bloco para cima"
            >
              ↑
            </button>
            <button
              onClick={() => handlePositionShift(0, 100)}
              className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-mono cursor-pointer"
              title="Mover bloco para baixo"
            >
              ↓
            </button>
          </div>
        </div>

        {/* Interactive SVG Floorplan Canvas with Drag & Drop */}
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

          <svg
            ref={svgRef}
            width={svgWidth + 120}
            height={svgHeight + 120}
            viewBox={`-60 -60 ${room.widthMm + 120} ${room.depthMm + 120}`}
            className="select-none"
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
            {(() => {
              let currentX = suite.xMm;
              return suite.modules.map((m, idx) => {
                const modX = currentX;
                currentX += m.widthMm;
                const isSelected = selectedModuleId === m.id;

                let fillColor = '#333333';
                if (m.type === 'induction_wok') fillColor = '#1e293b';
                else if (m.type === 'frytop_chrome') fillColor = '#475569';
                else if (m.type === 'open_burner') fillColor = '#3b201a';
                else if (m.type === 'pasta_cooker') fillColor = '#172554';
                else if (m.type === 'bain_marie') fillColor = '#451a03';
                else if (m.type === 'refrigerated_drawers') fillColor = '#0f172a';
                else if (m.type === 'pot_sink') fillColor = '#1e3a5f';

                return (
                  <g
                    key={m.id}
                    onClick={() => setSelectedModuleId(m.id)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={modX + 3}
                      y={suite.yMm + 3}
                      width={m.widthMm - 6}
                      height={suite.depthMm - 6}
                      fill={fillColor}
                      stroke={isSelected ? '#38bdf8' : '#737373'}
                      strokeWidth={isSelected ? 5 : 2}
                      rx="3"
                    />

                    {/* Specific module graphics */}
                    {m.type === 'induction_wok' && (
                      <g>
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
                      />
                    )}

                    {m.type === 'open_burner' && (
                      <g>
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
                      <g>
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
                    >
                      {m.widthMm}mm · {m.electricKw > 0 ? `${m.electricKw}kW` : `${m.gasKw}kW gás`}
                    </text>
                  </g>
                );
              });
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
      />
    </div>
  );
};
