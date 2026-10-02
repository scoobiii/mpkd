import React from 'react';
import { DesignModel } from '../types/designModel';
import { Zap, Flame, Wind, Droplets, Gauge, AlertCircle } from 'lucide-react';

interface MEPSummaryPanelProps {
  model: DesignModel;
  setModel: React.Dispatch<React.SetStateAction<DesignModel>>;
}

export const MEPSummaryPanel: React.FC<MEPSummaryPanelProps> = ({ model, setModel }) => {
  const suite = model.monolithe;
  const calcs = model.derivedCalculations;

  // Electrical math
  const totalElectricKw = calcs.totalElectricKw;
  // 400V 3-phase current calculation: I = P / (sqrt(3) * 400 * 0.9)
  const currentAmps400v = totalElectricKw > 0
    ? (totalElectricKw * 1000) / (Math.sqrt(3) * 400 * 0.9)
    : 0;
  const breakerSuggestedAmps = Math.ceil(currentAmps400v * 1.25 / 10) * 10;

  // Gas math
  const totalGasKw = calcs.totalGasKw;
  // 1 m³ natural gas ~ 10 kWh
  const gasConsumptionM3h = totalGasKw > 0 ? (totalGasKw / 9.8).toFixed(1) : '0';
  // LPG ~ 12.8 kWh per kg
  const lpgConsumptionKgH = totalGasKw > 0 ? (totalGasKw / 12.8).toFixed(1) : '0';

  // Ventilation math
  const baselineExhaustFlow = calcs.totalExhaustFlowM3h;
  const halton = model.haltonVentilation;
  const effectiveExhaustFlow = halton.enabled
    ? Math.round(baselineExhaustFlow * (1 - halton.captureJetReductionPct / 100))
    : baselineExhaustFlow;
  const compensationAir = effectiveExhaustFlow * model.parameters.ventilationCompensationRatio;
  const airflowSavings = baselineExhaustFlow - effectiveExhaustFlow;

  // Sensible & Latent Heat Dissipation
  const totalSensibleWatts = suite.modules.reduce((acc, m) => acc + m.heatDissipationSensibleWatts, 0);
  const totalLatentWatts = suite.modules.reduce((acc, m) => acc + m.heatDissipationLatentWatts, 0);

  return (
    <div className="flex flex-col h-full w-full bg-neutral-950 text-neutral-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Engenharia de Utilidades MEP & Balanço Térmico
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Dimensionamento paramétrico de eletricidade, gás, hidráulica e padrão Halton de exaustão aerodinâmica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5" />
            <span>Padrão Halton: {halton.enabled ? `Capture Jet™ (-${halton.captureJetReductionPct}%)` : 'Desativado'}</span>
          </span>
        </div>
      </div>

      {/* Gianni Brazil & Halton Benchmark Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-neutral-900 to-neutral-900 border border-cyan-800/50 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold">
            <Wind className="w-4 h-4 text-cyan-400" />
            <span>Referência Oficial Halton: Gianni (Brasil)</span>
          </div>
          <a
            href="https://www.halton.com/references/gianni-brazil/"
            target="_blank"
            rel="noreferrer noopener"
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline"
          >
            halton.com/references/gianni-brazil/ ↗
          </a>
        </div>
        <p className="text-neutral-300 leading-relaxed">
          Na referência <strong className="text-white">Gianni Cocina (Brasil)</strong>, a Halton implementou coifas <strong className="text-cyan-300">Capture Jet™ KVE</strong> com filtros multiciclônicos KSA e automação <strong className="text-amber-300">M.A.R.V.E.L.</strong>, reduzindo a vazão de exaustão em 37% e garantindo nível acústico abaixo de 55 dBA para integração com o salão.
        </p>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Electrical Card */}
        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Carga Elétrica</span>
            <Zap className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {totalElectricKw.toFixed(1)} <span className="text-sm font-normal text-neutral-400">kW</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono space-y-0.5 border-t border-neutral-800 pt-2">
            <div>Tensão: 400V 3P+N+PE</div>
            <div>Corrente Nominal: {currentAmps400v.toFixed(1)} A</div>
            <div className="text-amber-400">Disjuntor Sugerido: {breakerSuggestedAmps} A</div>
          </div>
        </div>

        {/* Gas Card */}
        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Carga Térmica Gás</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {totalGasKw.toFixed(1)} <span className="text-sm font-normal text-neutral-400">kW</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono space-y-0.5 border-t border-neutral-800 pt-2">
            <div>Gás Natural: ~{gasConsumptionM3h} m³/h</div>
            <div>GLP: ~{lpgConsumptionKgH} kg/h</div>
            <div className="text-amber-400">Conexão: 1" BSP (DN25)</div>
          </div>
        </div>

        {/* Exhaust Card with Halton Comparison */}
        <div className="p-4 rounded-xl bg-neutral-900/70 border border-cyan-800/60 space-y-2">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Exaustão Halton</span>
            <Wind className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {effectiveExhaustFlow} <span className="text-sm font-normal text-neutral-400">m³/h</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono space-y-0.5 border-t border-neutral-800 pt-2">
            <div className="text-emerald-400 font-semibold">
              {halton.enabled ? `Economia: -${airflowSavings} m³/h (-${halton.captureJetReductionPct}%)` : 'Modo convencional sem jatos'}
            </div>
            <div>Ar Reposição (80%): {compensationAir.toFixed(0)} m³/h</div>
            <div className="text-cyan-400">Filtros KSA 95% @ 10µm</div>
          </div>
        </div>

        {/* Hydraulic Card */}
        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Hidráulica & Esgoto</span>
            <Droplets className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            3.0 <span className="text-sm font-normal text-neutral-400">bar</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono space-y-0.5 border-t border-neutral-800 pt-2">
            <div>Água Fria: DN20 (3/4")</div>
            <div>Água Quente: DN15 (1/2")</div>
            <div className="text-blue-400">Dreno de Piso: DN50 c/ caixa gordura</div>
          </div>
        </div>
      </div>

      {/* Heat Dissipation & Air Conditioning Load */}
      <div className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-white flex items-center gap-2">
          <Gauge className="w-4 h-4 text-amber-400" />
          <span>Dissipação Térmica no Ambiente (Cálculo para Ar Condicionado)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
            <span className="text-neutral-500 block mb-1">Calor Sensível (Radiação):</span>
            <span className="text-white text-lg font-bold">{totalSensibleWatts} W</span>
            <span className="text-neutral-400 text-[11px] block mt-1">({(totalSensibleWatts * 3.412).toFixed(0)} BTU/h)</span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
            <span className="text-neutral-500 block mb-1">Calor Latente (Vapor/Umidade):</span>
            <span className="text-white text-lg font-bold">{totalLatentWatts} W</span>
            <span className="text-neutral-400 text-[11px] block mt-1">({(totalLatentWatts * 3.412).toFixed(0)} BTU/h)</span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
            <span className="text-neutral-500 block mb-1">Vantagem do Bloco Monolithe:</span>
            <span className="text-emerald-400 text-lg font-bold">-48% Calor Irradiado</span>
            <span className="text-neutral-400 text-[11px] block mt-1">graças à indução de alto rendimento</span>
          </div>
        </div>
      </div>

      {/* Module-by-Module MEP Breakdown Table */}
      <div className="bg-neutral-900/60 rounded-xl border border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-white">
            Detalhamento por Elemento de Cocção Monolithe
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            {suite.modules.length} módulos instalados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="p-3">Módulo</th>
                <th className="p-3">Código</th>
                <th className="p-3">Largura</th>
                <th className="p-3">Elétrico (kW)</th>
                <th className="p-3">Gás (kW)</th>
                <th className="p-3">Vazão (m³/h)</th>
                <th className="p-3">Água / Dreno</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/30 text-neutral-300">
              {suite.modules.map((m, idx) => (
                <tr key={idx} className="hover:bg-neutral-800/40">
                  <td className="p-3 text-white font-medium">{m.name}</td>
                  <td className="p-3 text-neutral-400">{m.code}</td>
                  <td className="p-3">{m.widthMm} mm</td>
                  <td className="p-3 text-orange-400">{m.electricKw > 0 ? `${m.electricKw} kW` : '-'}</td>
                  <td className="p-3 text-amber-400">{m.gasKw > 0 ? `${m.gasKw} kW` : '-'}</td>
                  <td className="p-3 text-cyan-400">{m.exhaustFlowM3h > 0 ? `${m.exhaustFlowM3h} m³/h` : '-'}</td>
                  <td className="p-3 text-neutral-400">
                    {m.waterInDn ? `DN${m.waterInDn} / ` : ''}
                    {m.drainDn ? `DN${m.drainDn}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
