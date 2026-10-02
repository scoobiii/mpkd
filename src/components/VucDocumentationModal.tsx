import React, { useState } from 'react';
import {
  BookOpen,
  X,
  FileText,
  Users,
  Compass,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Code2
} from 'lucide-react';

interface VucDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VucDocumentationModal: React.FC<VucDocumentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeDoc, setActiveDoc] = useState<'system' | 'agents' | 'sprints' | 'template'>('system');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyCurrent = () => {
    let content = '';
    if (activeDoc === 'system') content = SYSTEM_INSTRUCTION_TEXT;
    else if (activeDoc === 'agents') content = AGENTS_TEXT;
    else if (activeDoc === 'sprints') content = SPRINTS_TEXT;
    else if (activeDoc === 'template') content = TEMPLATE_TEXT;

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[88vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden font-sans text-neutral-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Documentação Oficial & Constituição do Sistema VUC
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold">
                  scoobiii/vuc v1.0.4
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                DesignModel como fonte única da verdade · Arquitetura Mobile-First & Interoperabilidade Rhino/Grasshopper
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCurrent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-neutral-800 bg-neutral-900/50 text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setActiveDoc('system')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              activeDoc === 'system'
                ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>SYSTEM_INSTRUCTION.md</span>
          </button>

          <button
            onClick={() => setActiveDoc('agents')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              activeDoc === 'agents'
                ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>AGENTS.md</span>
          </button>

          <button
            onClick={() => setActiveDoc('sprints')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              activeDoc === 'sprints'
                ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>SPRINTS.md</span>
          </button>

          <button
            onClick={() => setActiveDoc('template')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              activeDoc === 'template'
                ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>SPRINT_PROMPT_TEMPLATE.md</span>
          </button>
        </div>

        {/* Markdown Content Viewer */}
        <div className="flex-1 p-6 overflow-y-auto bg-neutral-950 font-mono text-xs leading-relaxed space-y-4">
          {activeDoc === 'system' && (
            <div className="max-w-4xl mx-auto space-y-4 text-neutral-300">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-300 text-xs font-sans">
                <strong>Princípio Fundamental:</strong> O <code>DesignModel</code> é a fonte única da verdade. Nenhuma camada visual pode modificar silenciosamente o DesignModel. Nenhum renderer pode criar ou remover entidades. Nenhum exportador pode inventar informações.
              </div>
              <pre className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 whitespace-pre-wrap font-mono text-[11px] text-neutral-200">
                {SYSTEM_INSTRUCTION_TEXT}
              </pre>
            </div>
          )}

          {activeDoc === 'agents' && (
            <div className="max-w-4xl mx-auto space-y-4 text-neutral-300">
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs font-sans">
                <strong>Topologia Multi-Agente VUC:</strong> Divisão rigorosa de papéis entre EvidenceAgent, ModelAgent, ParametricKernelAgent, GeometryKernelAgent, ViewerAgent, CollisionAgent, RhinoInteropAgent e VUCEvidenceAgent.
              </div>
              <pre className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 whitespace-pre-wrap font-mono text-[11px] text-neutral-200">
                {AGENTS_TEXT}
              </pre>
            </div>
          )}

          {activeDoc === 'sprints' && (
            <div className="max-w-4xl mx-auto space-y-4 text-neutral-300">
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs font-sans">
                <strong>Roadmap de Sprints:</strong> Da concepção do schema (S01) aos entregáveis certificados STEP, DXF, IFC e Rhino/Grasshopper (S11 a S16).
              </div>
              <pre className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 whitespace-pre-wrap font-mono text-[11px] text-neutral-200">
                {SPRINTS_TEXT}
              </pre>
            </div>
          )}

          {activeDoc === 'template' && (
            <div className="max-w-4xl mx-auto space-y-4 text-neutral-300">
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs font-sans">
                <strong>Template Padronizado de Sprint:</strong> Estrutura de prompt para instruir agentes com evidências, impactos no DesignModel, restrições e prova VUC.
              </div>
              <pre className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 whitespace-pre-wrap font-mono text-[11px] text-neutral-200">
                {TEMPLATE_TEXT}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-neutral-900/80 text-[11px] font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Repositório de Referência: scoobiii/vuc</span>
          </div>
          <a
            href="https://github.com/scoobiii/vuc"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>Ver no GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
};

const SYSTEM_INSTRUCTION_TEXT = `# VUC — System Instruction

## 1. Identidade
Você é o agente técnico responsável pelo desenvolvimento do VUC.
VUC é uma plataforma mobile-first de parametrização, CAD/BIM, visualização 2D/3D e geração de entregáveis técnicos.
O objetivo é construir um sistema que funcione de forma independente no Android e que seja interoperável com o ecossistema Rhino/Grasshopper.
O VUC NÃO deve ser tratado como um clone de Rhino.
O VUC deve ser um sistema próprio, com DesignModel próprio, capaz de produzir e consumir entregáveis compatíveis com ferramentas externas.

---

# 2. Princípio fundamental
## DesignModel é a fonte única da verdade.

Fluxo obrigatório:
evidência
→ modelo
→ parâmetros
→ constraints
→ geometria
→ validação
→ documentação
→ exportação
→ renderização

Nenhuma camada visual pode modificar silenciosamente o DesignModel.
Nenhum renderer pode criar ou remover entidades.
Nenhum exportador pode inventar informações.

---

# 3. Arquitetura conceitual

                    VUC
                     |
              DesignModel
                     |
        +------------+------------+
        |            |            |
       Core       Geometry      Viewer
        |            |            |
   Parameters      CAD/BREP      GPU
   Constraints     Tessellation   2D/3D
   Catalog         Solids         Interaction
   Rules           Booleans
        |
        +-----------------------------+
        |             |               |
       STEP          DXF             IFC
        |             |               |
        +-------------+---------------+
                      |
                     GLB
                      |
              Rhino / Grasshopper`;

const AGENTS_TEXT = `# VUC — Sistema de Agentes Técnicos (AGENTS.md)

1. EvidenceAgent: Captura e validação de requisitos de cozinha, espaço técnico e utilidades.
2. ModelAgent: Guardião supremo do DesignModel como Single Source of Truth (SSOT).
3. ParametricKernelAgent: Avaliação contínua de regras dimensionais, corredores (1100mm) e barreiras térmicas.
4. GeometryKernelAgent: Geração de sólidos BREP, tampos soldados a laser e desmembramento atômico.
5. ViewerAgent: Renderização GPU 2D/3D mobile-first, menus 100% suspensos e modo "Tudo é Objeto".
6. CollisionAgent: Detecção de colisão física em tempo real com malha de alto contraste.
7. RhinoInteropAgent: Linha de comando, 4 vistas, Gumball, corte de seção e Grasshopper live.
8. VUCEvidenceAgent: Prova criptográfica com cadeia de hashes, Merkle Root e Ed25519 (scoobiii/vuc).`;

const SPRINTS_TEXT = `# VUC — Roadmap de Desenvolvimento (SPRINTS.md)

- S01: Core DesignModel & Schemas Tipados
- S02: Parametrização Espacial & Auditoria de Ergonomia
- S03: Catálogo Monolithe & Desmembramento Atômico
- S04: Prova de Execução Criptográfica VUC (scoobiii/vuc)
- S05: Planta Baixa 2D Mobile-First com Cotas Paramétricas
- S06: Viewer 3D GPU com Menus 100% Suspensos de Borda
- S07: Sobreposição de Colisão Física com Malha Visual de Alto Contraste
- S08: Capacidades Rhinoceros & Interoperabilidade Grasshopper
- S09: Persistência LocalStorage & Edição Real de Componentes
- S10: Estúdio de Render Fotorealista PBR 360° por Objeto
- S11: Entregável CAD STEP AP242 (ISO 10303-21)
- S12: Entregável DXF 2D AutoCAD R12/2000
- S13: Entregável BIM IFC 4.0
- S14: Entregável Rhino OpenNURBS 3DM
- S15: Entregável Grasshopper Definition (.ghx)
- S16: Suíte de Validação & Auditoria Automatizada (100% Aprovado)`;

const TEMPLATE_TEXT = `# [VUC-SPRINT-XXX] Título do Sprint

1. Contexto & Objetivo
2. Evidências de Entrada (EvidenceAgent)
3. Impacto no DesignModel (Fonte Única da Verdade)
4. Restrições Paramétricas & Validação Física (ParametricKernelAgent)
5. Experiência Visual & Viewer (ViewerAgent)
6. Prova de Execução Criptográfica VUC (VUCEvidenceAgent)
7. Entregáveis Técnicos Gerados (DeliverablesAgent)
8. Critérios de Aceite & Testes Automatizados`;
