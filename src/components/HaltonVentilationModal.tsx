import React, { useState } from 'react';
import { DesignModel } from '../types/designModel';
import { HALTON_REFERENCES, HALTON_HOOD_SPECS, HaltonReferenceProject } from '../catalog/haltonReferences';
import {
  Wind,
  ShieldCheck,
  Zap,
  Leaf,
  ExternalLink,
  X,
  CheckCircle2,
  Gauge,
  Sliders,
  Layers,
  Sparkles,
  Flame,
} from 'lucide-react';

interface HaltonVentilationModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: DesignModel;
  setModel: React.Dispatch<React.SetStateAction<DesignModel>>;
}

export const HaltonVentilationModal: React.FC<HaltonVentilationModalProps> = ({
  isOpen,
  onClose,
  model,
  setModel,
}) => {
  const [selectedSubTab, setSelectedSubTab] = useState<'config' | 'references'>('config');
  const [selectedRef, setSelectedRef] = useState<HaltonReferenceProject>(HALTON_REFERENCES[0]); // Gianni Brazil default

  if (!isOpen) return null;

  const halton = model.haltonVentilation;
  const currentSpec = HALTON_HOOD_SPECS[halton.hoodModel] || HALTON_HOOD_SPECS.KVI_CAPTURE_JET;

  // Airflow calculations
  const baselineAirflowM3h = model.derivedCalculations.totalExhaustFlowM3h;
  const haltonAirflowM3h = halton.enabled
    ? Math.round(baselineAirflowM3h * (1 - halton.captureJetReductionPct / 100))
    : baselineAirflowM3h;

  const airflowSavedM3h = baselineAirflowM3h - haltonAirflowM3h;
  const annualEnergySavedKwh = Math.round(airflowSavedM3h * 8.5); // estimated fan & conditioning kWh/year
  const co2ReductionTons = (annualEnergySavedKwh * 0.00038).toFixed(1);

  // Toggle Halton Enabled
  const handleToggleHalton = (enabled: boolean) => {
    setModel(prev => ({
      ...prev,
      haltonVentilation: {
        ...prev.haltonVentilation,
        enabled,
      },
    }));
  };

  // Change Hood Model
  const handleChangeModel = (hoodModel: any) => {
    const spec = HALTON_HOOD_SPECS[hoodModel];
    setModel(prev => ({
      ...prev,
      haltonVentilation: {
        ...prev.haltonVentilation,
        hoodModel,
        captureJetReductionPct: spec ? spec.efficiencyAirflowReductionPct : 35,
      },
    }));
  };

  // Toggle feature
  const handleToggleFeature = (field: 'hasMarvelDcv' | 'hasCaptureRayUv' | 'hasWaterWash' | 'hasPolluStop') => {
    setModel(prev => ({
      ...prev,
      haltonVentilation: {
        ...prev.haltonVentilation,
        [field]: !prev.haltonVentilation[field],
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl text-neutral-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Padrão Halton de Exaustão & Ventilação</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Capture Jet™ · M.A.R.V.E.L.
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Configuração técnica de alta performance inspirada nas referências Gianni (Brasil) e Thai Mee.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-neutral-800 bg-neutral-950/50 text-xs">
          <button
            onClick={() => setSelectedSubTab('config')}
            className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
              selectedSubTab === 'config'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Configuração Técnica Halton
          </button>
          <button
            onClick={() => setSelectedSubTab('references')}
            className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              selectedSubTab === 'references'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Referências Oficiais (Gianni Brasil & Globais)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: TECHNICAL CONFIGURATION */}
          {selectedSubTab === 'config' && (
            <div className="space-y-6">
              {/* Halton Enabled Toggle & High-Level Comparison */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">
                      Tecnologia Halton Capture Jet™ Ativada
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      -35% Ar Exigido
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 max-w-xl">
                    Jatos de ar aerodinâmicos horizontais e verticais patenteados envolvem a pluma térmica dos woks e chapas Monolithe, impedindo o escape de fumaça e reduzindo a vazão de exaustão necessária.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleHalton(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      halton.enabled
                        ? 'bg-cyan-400 text-neutral-950 shadow-sm'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Padrão Halton
                  </button>
                  <button
                    onClick={() => handleToggleHalton(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      !halton.enabled
                        ? 'bg-neutral-700 text-white shadow-sm'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Convencional
                  </button>
                </div>
              </div>

              {/* Energy & Airflow Delta Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
                  <div className="text-neutral-400 mb-1 flex items-center justify-between">
                    <span>Vazão de Exaustão</span>
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-xl font-bold font-mono text-white">
                    {haltonAirflowM3h} <span className="text-xs font-normal text-neutral-400">m³/h</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-1">
                    {halton.enabled ? `-${airflowSavedM3h} m³/h vs convencional (${baselineAirflowM3h})` : 'Padrão convencional'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
                  <div className="text-neutral-400 mb-1 flex items-center justify-between">
                    <span>Economia M.A.R.V.E.L.</span>
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold font-mono text-white">
                    ~{annualEnergySavedKwh.toLocaleString()} <span className="text-xs font-normal text-neutral-400">kWh/ano</span>
                  </div>
                  <div className="text-[11px] text-amber-400 font-mono mt-1">
                    {halton.hasMarvelDcv ? 'Sensores IR modulando motores EC' : 'Vazão fixa contínua'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
                  <div className="text-neutral-400 mb-1 flex items-center justify-between">
                    <span>Descarbonização</span>
                    <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold font-mono text-white">
                    -{co2ReductionTons} <span className="text-xs font-normal text-neutral-400">tCO₂/ano</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-1">
                    Menor demanda em climatização
                  </div>
                </div>
              </div>

              {/* Hood Model Selector */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-300">
                  Modelo de Coifa Halton Capture Jet™
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {Object.entries(HALTON_HOOD_SPECS).map(([key, spec]) => (
                    <div
                      key={key}
                      onClick={() => handleChangeModel(key)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        halton.hoodModel === key
                          ? 'border-cyan-400 bg-cyan-950/30'
                          : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-white mb-1">
                        <span>{spec.name}</span>
                        <span className="font-mono text-cyan-400 text-[11px]">
                          -{spec.efficiencyAirflowReductionPct}% Ar
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mb-2 leading-relaxed">
                        {spec.description}
                      </p>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        Recomendado: {spec.recommendedFor}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Halton Engineering Modules */}
              <div className="space-y-3 border-t border-neutral-800 pt-4">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-300">
                  Módulos de Tratamento e Automação Avançada
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* M.A.R.V.E.L. */}
                  <div
                    onClick={() => handleToggleFeature('hasMarvelDcv')}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer flex items-start gap-3 ${
                      halton.hasMarvelDcv
                        ? 'border-amber-400/60 bg-amber-950/20'
                        : 'border-neutral-800 bg-neutral-950'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={halton.hasMarvelDcv}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-amber-500 bg-neutral-800 border-neutral-700"
                    />
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>Halton M.A.R.V.E.L. (DCV)</span>
                        <span className="text-[10px] font-mono text-amber-400">Até 52% economia</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Sensores de infravermelho identificam status dos queimadores e woks, ajustando o damper e inversor de frequência automaticamente.
                      </p>
                    </div>
                  </div>

                  {/* UV Capture Ray */}
                  <div
                    onClick={() => handleToggleFeature('hasCaptureRayUv')}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer flex items-start gap-3 ${
                      halton.hasCaptureRayUv
                        ? 'border-cyan-400/60 bg-cyan-950/20'
                        : 'border-neutral-800 bg-neutral-950'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={halton.hasCaptureRayUv}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-cyan-500 bg-neutral-800 border-neutral-700"
                    />
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>Halton Capture Ray™ (UV-C)</span>
                        <span className="text-[10px] font-mono text-cyan-400">Zero graxa nos dutos</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Desagregação molecular fotoquímica de graxa e odores. Elimina necessidade de lavagem manual de dutos e mitiga risco de fogo.
                      </p>
                    </div>
                  </div>

                  {/* Cold Mist & Water Wash */}
                  <div
                    onClick={() => handleToggleFeature('hasWaterWash')}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer flex items-start gap-3 ${
                      halton.hasWaterWash
                        ? 'border-blue-400/60 bg-blue-950/20'
                        : 'border-neutral-800 bg-neutral-950'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={halton.hasWaterWash}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-blue-500 bg-neutral-800 border-neutral-700"
                    />
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>Cold Mist & Water Wash</span>
                        <span className="text-[10px] font-mono text-blue-400">Ideal Wok & Fogo Alto</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Névoa contínua de água fria extingue faíscas de wok e ciclo automático com detergente faz a limpeza da câmara ao final do turno.
                      </p>
                    </div>
                  </div>

                  {/* PolluStop Ecology */}
                  <div
                    onClick={() => handleToggleFeature('hasPolluStop')}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer flex items-start gap-3 ${
                      halton.hasPolluStop
                        ? 'border-emerald-400/60 bg-emerald-950/20'
                        : 'border-neutral-800 bg-neutral-950'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={halton.hasPolluStop}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-emerald-500 bg-neutral-800 border-neutral-700"
                    />
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>Unidade Ecológica PolluStop</span>
                        <span className="text-[10px] font-mono text-emerald-400">Emissão Urbana Zero</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Precipitador eletrostático e leito de carvão ativado. Permite descarga em nível de rua ou fachada sem incômodo aos vizinhos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HALTON REFERENCES SHOWCASE (GIANNI BRAZIL & GLOBALS) */}
          {selectedSubTab === 'references' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Reference Selector List */}
              <div className="lg:col-span-5 space-y-2.5">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                  Referências Homologadas Halton
                </h3>
                {HALTON_REFERENCES.map(ref => (
                  <div
                    key={ref.id}
                    onClick={() => setSelectedRef(ref)}
                    className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedRef.id === ref.id
                        ? 'border-cyan-400 bg-cyan-950/30'
                        : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">{ref.name}</span>
                      <span className="text-[10px] font-mono text-neutral-400">{ref.location}</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 line-clamp-1">{ref.culinaryStyle}</div>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-neutral-500 border-t border-neutral-800/80 pt-1.5">
                      <span className="text-cyan-300">{ref.badge}</span>
                      <span>-{Math.round((1 - ref.airflowWithHaltonM3h / ref.airflowBeforeM3h) * 100)}% Vazão</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reference Detail Card */}
              <div className="lg:col-span-7 space-y-4 bg-neutral-950 p-5 rounded-xl border border-neutral-800 text-xs">
                <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                      {selectedRef.badge} · {selectedRef.location}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{selectedRef.name}</h3>
                    <p className="text-neutral-400 text-xs">{selectedRef.chefOrGroup} · {selectedRef.culinaryStyle}</p>
                  </div>

                  <a
                    href={selectedRef.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold bg-neutral-900 hover:bg-neutral-800 text-cyan-300 rounded-lg border border-neutral-700 transition-colors"
                  >
                    <span>Ver na Halton</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Description */}
                <p className="text-neutral-300 leading-relaxed text-xs">
                  {selectedRef.description}
                </p>

                {/* Quote */}
                <blockquote className="p-3 rounded-lg bg-neutral-900 border-l-2 border-cyan-400 italic text-neutral-300 text-xs">
                  "{selectedRef.featuredQuote}"
                </blockquote>

                {/* Challenges & Solutions */}
                <div className="space-y-3 pt-2">
                  <div>
                    <h4 className="text-[11px] uppercase tracking-wider text-rose-400 font-semibold mb-1.5">
                      Desafios do Espaço:
                    </h4>
                    <ul className="space-y-1 text-neutral-400">
                      {selectedRef.challenges.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-rose-400">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-[11px] uppercase tracking-wider text-cyan-400 font-semibold mb-1.5">
                      Tecnologias Halton Instaladas:
                    </h4>
                    <ul className="space-y-1 text-neutral-300">
                      {selectedRef.haltonSolutions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Energy & Airflow metrics */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-neutral-800 font-mono text-[11px]">
                  <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                    <span className="text-neutral-500 block">Vazão Convencional vs Halton:</span>
                    <span className="text-white font-bold">{selectedRef.airflowBeforeM3h} m³/h → {selectedRef.airflowWithHaltonM3h} m³/h</span>
                  </div>
                  <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
                    <span className="text-neutral-500 block">Economia Anual de Energia:</span>
                    <span className="text-emerald-400 font-bold">{selectedRef.energySavingsKwhYear.toLocaleString()} kWh/ano</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-950/80">
          <span className="text-xs text-neutral-500 font-mono">
            Halton Foodservice & MPK Mellieri · Engenharia Aerodinâmica
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors"
          >
            Aplicar no Projeto
          </button>
        </div>
      </div>
    </div>
  );
};
