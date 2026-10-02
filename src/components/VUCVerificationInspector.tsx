import React, { useState } from 'react';
import { DesignModel, VUCEvidence } from '../types/designModel';
import { verifyVucTrace, auditKitchenDesignCorrectness, VUC_MODEL_REGISTRY } from '../vuc/vucClient';
import { runVucTestSuite } from '../vuc/vuc.test';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Play, Terminal, Database, Key, Check, ExternalLink } from 'lucide-react';

interface VUCVerificationInspectorProps {
  model: DesignModel;
}

export const VUCVerificationInspector: React.FC<VUCVerificationInspectorProps> = ({ model }) => {
  const [testSuiteOutput, setTestSuiteOutput] = useState<{
    allPassed: boolean;
    results: Array<{ testName: string; passed: boolean; details: string }>;
  } | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const [verifyStatus, setVerifyStatus] = useState<any>(null);

  const vuc = model.vucTrace;

  const handleVerifyCurrentTrace = async () => {
    if (!vuc) return;
    const res = await verifyVucTrace(vuc);
    setVerifyStatus(res);
  };

  const handleRunAllTests = async () => {
    setIsRunningTests(true);
    try {
      const suite = await runVucTestSuite();
      setTestSuiteOutput(suite);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Perform physical audit (Rule 3)
  const physicalClashes = auditKitchenDesignCorrectness(model);

  return (
    <div className="flex flex-col h-full w-full bg-neutral-950 text-neutral-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-neutral-900/80 border border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Inspetor de Trace Criptográfico VUC Nativo
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            O trace verificável faz parte da inferência matemática da MPK. Verificação encadeada de tokens, árvore de Merkle e assinatura Ed25519 em conformidade com as 7 regras fundamentais.
          </p>
        </div>

        <button
          onClick={handleRunAllTests}
          disabled={isRunningTests}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50 shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isRunningTests ? 'Executando Suíte...' : 'Executar Suíte de Testes VUC'}</span>
        </button>
      </div>

      {/* Test Suite Results if run */}
      {testSuiteOutput && (
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>Resultados dos Testes Automatizados (Regras 1 a 5)</span>
            </h3>
            <span
              className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                testSuiteOutput.allPassed
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}
            >
              {testSuiteOutput.allPassed ? 'TODOS OS 5 TESTES APROVADOS (100%)' : 'FALHA EM TESTES'}
            </span>
          </div>

          <div className="space-y-2">
            {testSuiteOutput.results.map((r, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-neutral-950 border border-neutral-800/80 text-xs flex items-start justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-medium text-white">
                    {r.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{r.testName}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-mono ml-6">{r.details}</p>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
                    r.passed ? 'text-emerald-400 bg-emerald-950/40' : 'text-rose-400 bg-rose-950/40'
                  }`}
                >
                  {r.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rule 3 Spotlight: Validade NÃO é Correção */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/50 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-semibold">
          <AlertTriangle className="w-4 h-4" />
          <span>Regra 3: Validade Criptográfica não é Correção Física</span>
        </div>
        <p className="text-neutral-300">
          A integridade matemática do trace (hash encadeado + assinatura Ed25519) comprova exclusivamente a <strong className="text-white">autenticidade e não adulteração do processo de inferência</strong>. A qualidade física, térmica e ergonômica da cozinha (ex: largura de corredores, fluxo limpo/sujo HACCP) é uma auditoria independente. Nunca declare aprovação do projeto apenas pelo status <code className="font-mono text-emerald-300">VERIFIED_VALID</code>.
        </p>
        <div className="pt-2 flex items-center justify-between border-t border-amber-900/40 text-[11px] font-mono">
          <span className="text-neutral-400">
            Status do Trace Criptográfico: <strong className="text-emerald-400">{vuc?.status || 'PRONTO'}</strong>
          </span>
          <span className="text-neutral-400">
            Conformidade Física/Ergonômica: <strong className={physicalClashes.length === 0 ? 'text-emerald-400' : 'text-rose-400'}>{physicalClashes.length === 0 ? 'CONFORME (0 Clashes)' : `${physicalClashes.length} CLASHES ENCONTRADOS`}</strong>
          </span>
        </div>
      </div>

      {/* Model Registry Record (Rule 5) */}
      <div className="bg-neutral-900/60 p-5 rounded-xl border border-neutral-800 space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2 flex-wrap gap-2">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-300 flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <span>Regra 5: Registro Criptográfico do Modelo (Padrão scoobiii/vuc)</span>
          </h3>
          <a
            href="https://github.com/scoobiii/vuc"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded-lg text-[11px] font-mono border border-neutral-700 transition-colors"
          >
            <span>Prova de Execução: scoobiii/vuc</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-[11px]">
          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
            <span className="text-neutral-500 block">ID do Modelo:</span>
            <span className="text-white font-semibold">{VUC_MODEL_REGISTRY.model_id}</span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
            <span className="text-neutral-500 block">Repositório & Norma:</span>
            <span className="text-amber-400 font-semibold">{VUC_MODEL_REGISTRY.spec_standard}</span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
            <span className="text-neutral-500 block">Ambiente Executor:</span>
            <span className="text-neutral-300 truncate block">{VUC_MODEL_REGISTRY.runner_env}</span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
            <span className="text-neutral-500 block">Chave Pública Ed25519:</span>
            <span className="text-emerald-400 truncate block">{VUC_MODEL_REGISTRY.publicKeyHex.substring(0, 16)}...</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-[11px] space-y-1">
          <div>
            <span className="text-neutral-500">weights_sha256: </span>
            <span className="text-neutral-300">{VUC_MODEL_REGISTRY.weights_sha256}</span>
          </div>
          <div>
            <span className="text-neutral-500">tensor_merkle_root: </span>
            <span className="text-neutral-300">{VUC_MODEL_REGISTRY.tensor_merkle_root}</span>
          </div>
        </div>
      </div>

      {/* Active Trace Steps Inspector */}
      {vuc ? (
        <div className="bg-neutral-900/60 p-5 rounded-xl border border-neutral-800 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Cadeia de Passos de Inferência (Trace Encadeado)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                parentHash do passo 1 = prompt_hash. Cada passo calcula SHA-256(parentHash + token + tokenId).
              </p>
            </div>
            <button
              onClick={handleVerifyCurrentTrace}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-semibold font-mono"
            >
              Auditar Trace
            </button>
          </div>

          {verifyStatus && (
            <div
              className={`p-3 rounded-lg font-mono text-xs ${
                verifyStatus.isCryptographicallyValid
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-800 text-rose-300'
              }`}
            >
              {verifyStatus.isCryptographicallyValid
                ? '✓ Assinatura Ed25519 e Árvore de Merkle confirmadas com sucesso.'
                : `✗ Falha de verificação: ${verifyStatus.error}`}
            </div>
          )}

          {/* Root Hashes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-500 block">Prompt Hash (parentHash inicial):</span>
              <span className="text-amber-400 break-all">{vuc.prompt_hash}</span>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-500 block">Merkle Root (cobertura total de passos):</span>
              <span className="text-emerald-400 break-all">{vuc.merkle_root}</span>
            </div>
          </div>

          {/* Signature */}
          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-[11px]">
            <span className="text-neutral-500 block">Assinatura Ed25519 Real (512-bit detached):</span>
            <span className="text-neutral-300 break-all">{vuc.ed25519_signature}</span>
          </div>

          {/* Trace steps table */}
          <div className="max-h-64 overflow-y-auto rounded-lg border border-neutral-800">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-neutral-950 text-neutral-400 sticky top-0 border-b border-neutral-800">
                <tr>
                  <th className="p-2 w-16">Passo</th>
                  <th className="p-2">Token</th>
                  <th className="p-2 w-24">TokenId</th>
                  <th className="p-2">Parent Hash</th>
                  <th className="p-2">Step Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/40 text-neutral-300">
                {vuc.trace_steps?.slice(0, 25).map((step, idx) => (
                  <tr key={idx} className="hover:bg-neutral-800/40">
                    <td className="p-2 text-neutral-400 font-bold">{step.step}</td>
                    <td className="p-2 text-white font-semibold">{step.token}</td>
                    <td className="p-2 text-amber-400">{step.tokenId}</td>
                    <td className="p-2 text-neutral-400">{step.parentHash.substring(0, 10)}...</td>
                    <td className="p-2 text-emerald-400">{step.stepHash.substring(0, 10)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-neutral-900/30 border border-dashed border-neutral-800 text-center">
          <ShieldCheck className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <p className="text-xs text-neutral-400">
            Nenhum trace VUC ativo gerado nesta sessão. Execute uma análise no "Estúdio IA" ou clique em "Executar Suíte de Testes VUC" acima.
          </p>
        </div>
      )}
    </div>
  );
};
