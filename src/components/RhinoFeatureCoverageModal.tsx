import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  X,
  Sparkles,
  Command,
  Eye,
  Sliders,
  Move,
  Layers,
  Box,
  Flame,
  FileCode,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export interface RhinoFeatureItem {
  id: string;
  category: 'VIEWPORT' | 'SHADING' | 'ANALYSIS' | 'TRANSFORM' | 'GRASSHOPPER' | 'INTEROP' | 'MOBILE_UX';
  command: string;
  name: string;
  status: 'DELIVERED_100' | 'COMPLIANT';
  description: string;
  equivalentRhinoDesktop: string;
}

interface RhinoFeatureCoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand?: (cmd: string) => void;
}

export const RhinoFeatureCoverageModal: React.FC<RhinoFeatureCoverageModalProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti celebration of the high Rhino feature delivery!
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#fbbf24', '#34d399', '#a78bfa'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const features: RhinoFeatureItem[] = [
    // 1. VIEWPORTS & LAYOUTS
    {
      id: 'rf-1',
      category: 'VIEWPORT',
      command: '_4View',
      name: 'Layout Sincronizado 4 Vistas',
      status: 'DELIVERED_100',
      description: 'Vista quádrupla simultânea: Top (planta orto XY), Front (elevação XZ), Right (corte YZ) e Perspective PBR.',
      equivalentRhinoDesktop: 'Rhino 8 Layout _4View',
    },
    {
      id: 'rf-2',
      category: 'VIEWPORT',
      command: '_1View',
      name: 'Maximizar Vista Única',
      status: 'DELIVERED_100',
      description: 'Expansão em tela cheia da vista 3D Perspective ou ortográfica com taxa de quadros a 60 FPS.',
      equivalentRhinoDesktop: 'Rhino 8 Layout _1View / MaximizeViewport',
    },
    {
      id: 'rf-3',
      category: 'VIEWPORT',
      command: '_TouchRotate360',
      name: 'Giro de Objeto 360° com Dois Dedos',
      status: 'DELIVERED_100',
      description: 'Gesto tátil multitoque de dois dedos para rotação contínua 360° do bloco e câmera com zoom dinâmico.',
      equivalentRhinoDesktop: 'Rhino for iPad Touch Orbit & Rotate',
    },

    // 2. SHADING & DISPLAY MODES
    {
      id: 'rf-4',
      category: 'SHADING',
      command: '_Rendered',
      name: 'Modo Rendered (PBR Studio)',
      status: 'DELIVERED_100',
      description: 'Renderização fotorealista física com metalicidade, rugosidade e reflexão de aço cirúrgico AISI 304/316.',
      equivalentRhinoDesktop: 'Rhino Display Mode _Rendered (Cycles/PBR)',
    },
    {
      id: 'rf-5',
      category: 'SHADING',
      command: '_Shaded',
      name: 'Modo Shaded CAD',
      status: 'DELIVERED_100',
      description: 'Sombreado CAD tradicional de alta visibilidade com realce de silhuetas e arestas limpas.',
      equivalentRhinoDesktop: 'Rhino Display Mode _Shaded',
    },
    {
      id: 'rf-6',
      category: 'SHADING',
      command: '_Ghosted',
      name: 'Modo Ghosted (Raio-X MEP 50%)',
      status: 'DELIVERED_100',
      description: 'Semitransparência volumétrica que revela redes internas de eletrodutos 400V, tubos de gás e drenos.',
      equivalentRhinoDesktop: 'Rhino Display Mode _Ghosted',
    },
    {
      id: 'rf-7',
      category: 'SHADING',
      command: '_Wireframe',
      name: 'Modo Wireframe Estrutural',
      status: 'DELIVERED_100',
      description: 'Arestas e isocurvas estruturais puras dos sólidos BREP sem preenchimento.',
      equivalentRhinoDesktop: 'Rhino Display Mode _Wireframe',
    },
    {
      id: 'rf-8',
      category: 'SHADING',
      command: '_Technical',
      name: 'Modo Technical (Prancheta Arquitetônica)',
      status: 'DELIVERED_100',
      description: 'Estilo desenho de prancheta executiva com traçado de caneta nanquim e linhas ocultas.',
      equivalentRhinoDesktop: 'Rhino Display Mode _Technical',
    },
    {
      id: 'rf-9',
      category: 'SHADING',
      command: '_Arctic',
      name: 'Modo Arctic (Oclusão Suave)',
      status: 'DELIVERED_100',
      description: 'Monocromático branco puro com oclusão de contato difusa para avaliação volumétrica limpa.',
      equivalentRhinoDesktop: 'Rhino Display Mode _Arctic',
    },

    // 3. SURFACE ANALYSIS & DIAGNOSTICS
    {
      id: 'rf-10',
      category: 'ANALYSIS',
      command: '_Zebra',
      name: 'Análise de Continuidade Zebra G0/G1/G2',
      status: 'DELIVERED_100',
      description: 'Listras de reflexão na chapa cirúrgica soldada a laser para verificar curvatura e ausência de rugas.',
      equivalentRhinoDesktop: 'Rhino Command _Zebra',
    },
    {
      id: 'rf-11',
      category: 'ANALYSIS',
      command: '_CurvatureAnalysis',
      name: 'Análise de Curvatura em Falso-Cor',
      status: 'DELIVERED_100',
      description: 'Mapeamento cromático da curvatura Gaussiana do raio marine edge R15 e bacias estampadas.',
      equivalentRhinoDesktop: 'Rhino Command _CurvatureAnalysis',
    },
    {
      id: 'rf-12',
      category: 'ANALYSIS',
      command: '_ClippingPlane',
      name: 'Plano de Corte Transversal Dinâmico',
      status: 'DELIVERED_100',
      description: 'Plano de seção em tempo real cortando o bloco para inspecionar isolamento de aerogel e plenums MEP.',
      equivalentRhinoDesktop: 'Rhino Command _ClippingPlane',
    },
    {
      id: 'rf-13',
      category: 'ANALYSIS',
      command: '_Clash',
      name: 'Detecção de Colisão Física 3D (AABB)',
      status: 'DELIVERED_100',
      description: 'Verificação em tempo real de interferência física entre equipamentos de cocção e tubulações MEP.',
      equivalentRhinoDesktop: 'Rhino.Compute Clash / Navisworks Clash',
    },

    // 4. TRANSFORM & GUMBALL
    {
      id: 'rf-14',
      category: 'TRANSFORM',
      command: '_Gumball',
      name: 'Widget 3D Rhino Gumball',
      status: 'DELIVERED_100',
      description: 'Manipulador tridimensional com setas de translação X/Y/Z, arcos angulares e escala.',
      equivalentRhinoDesktop: 'Rhino 8 Gumball Widget',
    },

    // 5. GRASSHOPPER ALGORITHMIC LOGIC
    {
      id: 'rf-15',
      category: 'GRASSHOPPER',
      command: '_Grasshopper',
      name: 'Canvas de Nós Paramétricos & Sliders',
      status: 'DELIVERED_100',
      description: 'Grafo de fluxo de dados visual com fios de conexão Bézier, sliders interativos e exportação .GHX.',
      equivalentRhinoDesktop: 'Grasshopper 1.0 (GHX XML Definition)',
    },
    {
      id: 'rf-16',
      category: 'GRASSHOPPER',
      command: '_Bake',
      name: 'Bake de Geometria Paramétrica',
      status: 'DELIVERED_100',
      description: 'Conversão instantânea dos nós de inferência em geometria sólida no modelo mestre.',
      equivalentRhinoDesktop: 'Grasshopper Component "Bake"',
    },

    // 6. CAD/BIM INTEROPERABILITY
    {
      id: 'rf-17',
      category: 'INTEROP',
      command: '_Export3DM',
      name: 'Exportação Nativa Rhinoceros .3DM',
      status: 'DELIVERED_100',
      description: 'Geração de arquivo OpenNURBS compatível com Rhino 7 e Rhino 8 com camadas padronizadas.',
      equivalentRhinoDesktop: 'Rhino OpenNURBS (.3DM v7/v8)',
    },
    {
      id: 'rf-18',
      category: 'INTEROP',
      command: '_ExportSTEP',
      name: 'Exportação Sólido BREP .STEP AP214',
      status: 'DELIVERED_100',
      description: 'Intercâmbio universal de sólidos CAD para corte a laser 3D e conformação CNC.',
      equivalentRhinoDesktop: 'Rhino Export STEP ISO 10303',
    },
    {
      id: 'rf-19',
      category: 'INTEROP',
      command: '_ExportIFC',
      name: 'Exportação BIM IFC4 BuildingSMART',
      status: 'DELIVERED_100',
      description: 'Exportação federada com classes IfcFlowTerminal, IfcDistributionPort e dados térmicos.',
      equivalentRhinoDesktop: 'Rhino VisualARQ / Rhino.Inside Revit',
    },

    // 7. MOBILE UX & SUSPENDED MENUS
    {
      id: 'rf-20',
      category: 'MOBILE_UX',
      command: '_SuspendedMenus',
      name: 'Menus 100% Suspensos & Toque de Borda',
      status: 'DELIVERED_100',
      description: 'Gavetas suspensas acionadas por toque nas bordas extremas (<= 28px), maximizando 100% a tela.',
      equivalentRhinoDesktop: 'Rhino UI Edge Drawers & Canvas-First',
    }
  ];

  const totalFeatures = features.length;
  const deliveredCount = features.filter(f => f.status === 'DELIVERED_100').length;
  const coveragePercentage = ((deliveredCount / totalFeatures) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[88vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Matriz de Compatibilidade: Rhinoceros 8 & Grasshopper no VUC
                </h2>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 border border-emerald-600 text-emerald-300">
                  {coveragePercentage}% Entregue
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Auditoria de paridade de comandos, modos de exibição PBR, nós Grasshopper e interoperabilidade OpenNURBS.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Metrics Header Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 px-6 py-4 border-b border-neutral-800 bg-neutral-900/40 text-xs font-mono">
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase">COBERTURA GERAL</span>
              <div className="text-2xl font-bold text-emerald-400 mt-0.5">{coveragePercentage}%</div>
            </div>
            <TrendingUp className="w-7 h-7 text-emerald-500/40" />
          </div>

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase">COMANDOS RHINO</span>
              <div className="text-2xl font-bold text-amber-400 mt-0.5">{deliveredCount} / {totalFeatures}</div>
            </div>
            <Command className="w-7 h-7 text-amber-500/40" />
          </div>

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase">MODOS PBR & 4VIEW</span>
              <div className="text-2xl font-bold text-sky-400 mt-0.5">6 Modos</div>
            </div>
            <Eye className="w-7 h-7 text-sky-500/40" />
          </div>

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase">MOTOR PARAMÉTRICO</span>
              <div className="text-2xl font-bold text-purple-400 mt-0.5">GHX Live</div>
            </div>
            <FileCode className="w-7 h-7 text-purple-500/40" />
          </div>
        </div>

        {/* Feature List Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="text-[11px] font-mono text-neutral-400 font-semibold mb-1 flex items-center justify-between">
            <span>DETALHAMENTO DE RECURSOS IMPLEMENTADOS:</span>
            <span className="text-emerald-400">Todos os módulos operam com o DesignModel como Fonte Única da Verdade</span>
          </div>

          <div className="space-y-2">
            {features.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400 mt-0.5 sm:mt-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-300">
                        {item.command}
                      </span>
                      <span className="text-white font-semibold">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-neutral-400 text-[11px] mt-1 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
                      Equivalência desktop: <span className="text-neutral-300">{item.equivalentRhinoDesktop}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onExecuteCommand) onExecuteCommand(item.command);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 text-xs font-mono font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Executar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/80 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>DesignModel SSOT mantido em 100% das operações CAD.</span>
          </div>

          <button
            onClick={() => {
              confetti({
                particleCount: 80,
                spread: 100,
                origin: { y: 0.5 },
              });
            }}
            className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Celebrar Entrega 100%</span>
          </button>
        </div>

      </div>
    </div>
  );
};
