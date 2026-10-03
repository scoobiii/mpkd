import React, { useState } from 'react';
import { DesignModel } from '../types/designModel';
import { MONOLITHE_CATALOG, createModuleFromCatalog } from '../catalog/monolitheCatalog';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileBox,
  Image,
  Sparkles,
  Download,
  Upload,
  ArrowRight,
  Move,
  X,
  CheckCircle2,
  HardDrive,
  Eye,
  Sliders,
  Play,
  Share2,
  Layers,
  Box
} from 'lucide-react';

export interface ProjectFileItem {
  id: string;
  name: string;
  folder: 'models' | 'components' | 'render' | 'grasshopper' | 'deliverables';
  extension: string;
  sizeKb: number;
  updatedAt: string;
  description: string;
  type: 'model_vuc' | 'model_3dm' | 'cad_step' | 'cad_dxf' | 'bim_ifc' | 'part_vuc' | 'pbr_scene' | 'hdr_light' | 'gh_script' | 'doc_pdf' | 'proof_vuc';
  payload?: any;
}

interface ProjectFileExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: DesignModel;
  setModel?: React.Dispatch<React.SetStateAction<DesignModel>>;
  onOpenRealisticStudio?: () => void;
  onOpenGrasshopper?: () => void;
  onOpenDeliverables?: () => void;
  onOpen3DViewer?: () => void;
}

export const ProjectFileExplorerModal: React.FC<ProjectFileExplorerModalProps> = ({
  isOpen,
  onClose,
  model,
  setModel,
  onOpenRealisticStudio,
  onOpenGrasshopper,
  onOpenDeliverables,
  onOpen3DViewer,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<'all' | 'models' | 'components' | 'render' | 'grasshopper' | 'deliverables'>('all');
  const [selectedFileId, setSelectedFileId] = useState<string>('f-mod-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [draggedFile, setDraggedFile] = useState<ProjectFileItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Virtual Project File Registry
  const projectFiles: ProjectFileItem[] = [
    // 📁 models/
    {
      id: 'f-mod-1',
      name: 'Monolithe_ThaiMee_Master.vuc',
      folder: 'models',
      extension: '.vuc',
      sizeKb: 142,
      updatedAt: 'Agora (SSOT)',
      description: 'Fonte única da verdade do DesignModel. Contém topologia contínua, módulos e prova Ed25519.',
      type: 'model_vuc',
      payload: model,
    },
    {
      id: 'f-mod-2',
      name: 'Suite_Central_3600mm.3dm',
      folder: 'models',
      extension: '.3dm',
      sizeKb: 2840,
      updatedAt: 'Hoje 14:20',
      description: 'Arquivo nativo Rhinoceros OpenNURBS com camadas VUC::Plinth, VUC::TopPlate e VUC::MEP.',
      type: 'model_3dm',
    },
    {
      id: 'f-mod-3',
      name: 'Bloco_AngeloPo_Monolithe.step',
      folder: 'models',
      extension: '.step',
      sizeKb: 4120,
      updatedAt: 'Ontem',
      description: 'Sólido BREP contínuo soldado a laser ISO 10303 AP214 para usinagem CNC e corte laser.',
      type: 'cad_step',
    },
    {
      id: 'f-mod-4',
      name: 'Planta_Executiva_Cozinha.dxf',
      folder: 'models',
      extension: '.dxf',
      sizeKb: 890,
      updatedAt: 'Ontem',
      description: 'Planta baixa 2D AutoCAD R14 com cotas DIN 18860, distâncias de circulação e utilidades MEP.',
      type: 'cad_dxf',
    },
    {
      id: 'f-mod-5',
      name: 'Modelo_BIM_MEP_LOD400.ifc',
      folder: 'models',
      extension: '.ifc',
      sizeKb: 3450,
      updatedAt: '2 dias atrás',
      description: 'Modelo federado IFC4 BuildingSMART com conexões MEP de água, esgoto, eletricidade e exaustão.',
      type: 'bim_ifc',
    },

    // 📁 components/ (Módulos & Peças Atômicas)
    {
      id: 'f-cmp-1',
      name: 'Wok_Inducao_8kW.vuc-part',
      folder: 'components',
      extension: '.vuc-part',
      sizeKb: 45,
      updatedAt: 'Recente',
      description: 'Módulo wok de indução côncavo 380mm, 8.0 kW, para selagem ultrarrápida de frutos do mar.',
      type: 'part_vuc',
      payload: MONOLITHE_CATALOG[0],
    },
    {
      id: 'f-cmp-2',
      name: 'Frytop_Cromo_Espelhado.vuc-part',
      folder: 'components',
      extension: '.vuc-part',
      sizeKb: 52,
      updatedAt: 'Recente',
      description: 'Chapa de cromo duro espelhado 15mm, 10.8 kW, selagem térmica uniforme sem perda de sucos.',
      type: 'part_vuc',
      payload: MONOLITHE_CATALOG[1],
    },
    {
      id: 'f-cmp-3',
      name: 'Fogao_Latao_2B.vuc-part',
      folder: 'components',
      extension: '.vuc-part',
      sizeKb: 38,
      updatedAt: 'Recente',
      description: 'Queimadores duplos de latão maciço com válvula termopar de segurança e chama piloto selada.',
      type: 'part_vuc',
      payload: MONOLITHE_CATALOG[2],
    },
    {
      id: 'f-cmp-4',
      name: 'Cozedor_Massas_GN.vuc-part',
      folder: 'components',
      extension: '.vuc-part',
      sizeKb: 48,
      updatedAt: 'Recente',
      description: 'Cuba de cocção contínua de noodles em AISI 316 com torneira de reposição e dreno de amido.',
      type: 'part_vuc',
      payload: MONOLITHE_CATALOG[3],
    },
    {
      id: 'f-cmp-5',
      name: 'Banho_Maria_Digital.vuc-part',
      folder: 'components',
      extension: '.vuc-part',
      sizeKb: 36,
      updatedAt: 'Recente',
      description: 'Mantenedor térmico de molhos aromáticos tailandeses (Nam Prik Pao e curry) a 72°C controlados.',
      type: 'part_vuc',
      payload: MONOLITHE_CATALOG[4],
    },
    {
      id: 'f-cmp-6',
      name: 'Gaveteiro_Refrigerado_GN.vuc-part',
      folder: 'components',
      extension: '.vuc-part',
      sizeKb: 64,
      updatedAt: 'Recente',
      description: 'Base refrigerada -2°C/+4°C sob bancada com isolamento térmico de aerogel 25mm para mise-en-place.',
      type: 'part_vuc',
      payload: MONOLITHE_CATALOG[5],
    },

    // 📁 render/
    {
      id: 'f-rnd-1',
      name: 'Estudio_Fotorealista_ACESFilmic.scene',
      folder: 'render',
      extension: '.scene',
      sizeKb: 120,
      updatedAt: 'Hoje',
      description: 'Preset de iluminação PBR com estúdio de 3 pontos ACES Filmic, sombra de oclusão de contato e reflexão cirúrgica.',
      type: 'pbr_scene',
    },
    {
      id: 'f-rnd-2',
      name: 'Luz_Estudio_3Pontos.hdr',
      folder: 'render',
      extension: '.hdr',
      sizeKb: 5400,
      updatedAt: 'Ontem',
      description: 'Mapa de radiação HDRI estúdio fotográfico neutro para realçar chanfros marine edge R15.',
      type: 'hdr_light',
    },
    {
      id: 'f-rnd-3',
      name: 'Turntable_360_4K.preset',
      folder: 'render',
      extension: '.preset',
      sizeKb: 18,
      updatedAt: 'Hoje',
      description: 'Configuração de base giratória 360° com dois dedos e turntable automático PBR.',
      type: 'pbr_scene',
    },

    // 📁 grasshopper/
    {
      id: 'f-gh-1',
      name: 'Monolithe_Parametric_Kernel.ghx',
      folder: 'grasshopper',
      extension: '.ghx',
      sizeKb: 320,
      updatedAt: 'Live',
      description: 'Definição algorítmica Grasshopper conectando parâmetros da sala com o tampo contínuo monolítico.',
      type: 'gh_script',
    },
    {
      id: 'f-gh-2',
      name: 'Halton_CaptureJet_Flow.ghx',
      folder: 'grasshopper',
      extension: '.ghx',
      sizeKb: 210,
      updatedAt: 'Hoje',
      description: 'Cálculo termodinâmico VDI 2052 e vazão da coifa Halton Capture Jet com ar de compensação.',
      type: 'gh_script',
    },
    {
      id: 'f-gh-3',
      name: 'Collision_Detector_AABB.ghx',
      folder: 'grasshopper',
      extension: '.ghx',
      sizeKb: 180,
      updatedAt: 'Hoje',
      description: 'Detector de sobreposição volumétrica 3D entre condutos MEP e equipamentos.',
      type: 'gh_script',
    },

    // 📁 deliverables/
    {
      id: 'f-del-1',
      name: 'Memorial_Descritivo_MPK.pdf',
      folder: 'deliverables',
      extension: '.pdf',
      sizeKb: 650,
      updatedAt: 'Gerado',
      description: 'Especificação técnica executiva de aço inoxidável AISI 304/316, espessura 3mm e potências MEP.',
      type: 'doc_pdf',
    },
    {
      id: 'f-del-2',
      name: 'Certificado_Criptografico_VUC.proof',
      folder: 'deliverables',
      extension: '.proof',
      sizeKb: 32,
      updatedAt: 'Assinado Ed25519',
      description: 'Comprovante RFC-VUC-1.0.4 com Merkle Root, cadeia de tokens e assinatura criptográfica de 512 bits.',
      type: 'proof_vuc',
    },
  ];

  // Filtering files
  const filteredFiles = projectFiles.filter(file => {
    const matchesFolder = selectedFolder === 'all' || file.folder === selectedFolder;
    const matchesQuery = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.extension.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesQuery;
  });

  const selectedFile = projectFiles.find(f => f.id === selectedFileId) || projectFiles[0];

  // ACTION: "Tocou vem pra tela principal"
  const handleFileTouchOrClick = (file: ProjectFileItem) => {
    setSelectedFileId(file.id);

    if (file.folder === 'components' && file.payload) {
      // Add module to model and switch to 3D
      const newModule = createModuleFromCatalog(file.payload, model.monolithe.modules.length);
      const updatedModules = [...model.monolithe.modules, newModule];
      const totalLength = updatedModules.reduce((acc, m) => acc + m.widthMm, 0);

      if (setModel) {
        setModel(prev => ({
          ...prev,
          monolithe: {
            ...prev.monolithe,
            lengthMm: totalLength,
            modules: updatedModules,
          },
          derivedCalculations: {
            ...prev.derivedCalculations,
            totalElectricKw: Number((prev.derivedCalculations.totalElectricKw + newModule.electricKw).toFixed(1)),
            totalGasKw: Number((prev.derivedCalculations.totalGasKw + newModule.gasKw).toFixed(1)),
            totalExhaustFlowM3h: prev.derivedCalculations.totalExhaustFlowM3h + newModule.exhaustFlowM3h,
            freshAirCompensationM3h: Math.round((prev.derivedCalculations.totalExhaustFlowM3h + newModule.exhaustFlowM3h) * 0.8),
            linearMetersOfContinuousTop: Number((totalLength / 1000).toFixed(2)),
          },
          provenance: {
            ...prev.provenance,
            updatedAt: new Date().toISOString(),
            generatorMode: 'MANUAL_PARAMETRIC',
          },
        }));
      }

      showToast(`Componente "${file.name}" carregado e inserido na tela principal do VUC!`);
      if (onOpen3DViewer) onOpen3DViewer();
      onClose();
    } else if (file.folder === 'render') {
      showToast(`Cena de render "${file.name}" ativada! Abrindo estúdio PBR 360°...`);
      if (onOpenRealisticStudio) onOpenRealisticStudio();
      onClose();
    } else if (file.folder === 'grasshopper') {
      showToast(`Definição "${file.name}" carregada no ambiente visual Grasshopper!`);
      if (onOpenGrasshopper) onOpenGrasshopper();
      onClose();
    } else if (file.folder === 'deliverables') {
      showToast(`Entregável técnico "${file.name}" pronto para download e exportação!`);
      if (onOpenDeliverables) onOpenDeliverables();
      onClose();
    } else if (file.folder === 'models') {
      showToast(`Modelo mestre "${file.name}" ativo como Fonte Única da Verdade!`);
      if (onOpen3DViewer) onOpen3DViewer();
      onClose();
    }
  };

  // ACTION: "Arrastou vem pra tela principal"
  const handleDragStart = (e: React.DragEvent, file: ProjectFileItem) => {
    setDraggedFile(file);
    if (file.payload) {
      e.dataTransfer.setData('application/json', JSON.stringify(file.payload));
      e.dataTransfer.setData('text/plain', file.name);
      e.dataTransfer.effectAllowed = 'copy';
    } else {
      e.dataTransfer.setData('text/plain', JSON.stringify({ fileId: file.id, name: file.name, type: file.type }));
      e.dataTransfer.effectAllowed = 'copy';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[88vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Explorador de Pastas & Arquivos do Projeto VUC
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 border border-amber-800 text-amber-300">
                  Tocou ou Arrastou → Tela Principal
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Estrutura de diretórios de engenharia, modelos 3D, componentes atômicos, cenas PBR e scripts Grasshopper.
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

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-2 rounded-full text-xs font-mono flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Search & Folder Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
            {[
              { id: 'all', label: 'Todas as Pastas' },
              { id: 'models', label: '📁 models/' },
              { id: 'components', label: '📁 components/' },
              { id: 'render', label: '📁 render/' },
              { id: 'grasshopper', label: '📁 grasshopper/' },
              { id: 'deliverables', label: '📁 deliverables/' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFolder(f.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  selectedFolder === f.id
                    ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar arquivo (.3dm, .vuc, .ghx)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
        </div>

        {/* Content Body: Left File List + Right File Detail Inspector */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* File Grid/List (7 cols) */}
          <div className="lg:col-span-7 border-r border-neutral-800 overflow-y-auto p-4 sm:p-5 space-y-2">
            <div className="text-[11px] font-mono text-neutral-400 font-semibold mb-2 flex items-center justify-between">
              <span>{filteredFiles.length} ARQUIVOS DISPONÍVEIS:</span>
              <span className="text-[10px] text-amber-400 flex items-center gap-1">
                <Move className="w-3 h-3" /> Arraste para o canvas ou dê 1 toque
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredFiles.map(file => {
                const isSelected = file.id === selectedFileId;
                return (
                  <div
                    key={file.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, file)}
                    onClick={() => setSelectedFileId(file.id)}
                    onDoubleClick={() => handleFileTouchOrClick(file)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-amber-400/10 border-amber-400/80 shadow-md ring-1 ring-amber-400/40'
                        : 'bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-900 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {file.folder === 'models' && <Box className="w-4 h-4 text-sky-400" />}
                          {file.folder === 'components' && <Layers className="w-4 h-4 text-amber-400" />}
                          {file.folder === 'render' && <Image className="w-4 h-4 text-purple-400" />}
                          {file.folder === 'grasshopper' && <FileCode className="w-4 h-4 text-green-400" />}
                          {file.folder === 'deliverables' && <FileText className="w-4 h-4 text-rose-400" />}
                          <span className="font-mono text-xs font-bold text-white truncate max-w-[170px]">
                            {file.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
                          {file.extension}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                        {file.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-neutral-800/60 text-[10px] font-mono text-neutral-500">
                      <span>{file.sizeKb} KB</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileTouchOrClick(file);
                        }}
                        className="px-2 py-1 rounded bg-amber-400/15 hover:bg-amber-400 text-amber-300 hover:text-neutral-950 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Abrir na Tela</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Inspector: Selected File Preview & Immediate Action (5 cols) */}
          <div className="lg:col-span-5 bg-neutral-900/40 p-5 overflow-y-auto space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                    <FileBox className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">
                      {selectedFile.name}
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Pasta: /{selectedFile.folder}/
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono text-amber-400 font-bold px-2 py-1 rounded bg-amber-950/80 border border-amber-800">
                  {selectedFile.sizeKb} KB
                </span>
              </div>

              {/* Description */}
              <div className="bg-neutral-950/80 border border-neutral-800/90 rounded-xl p-3.5 space-y-2 text-xs">
                <span className="text-neutral-400 font-semibold block text-[11px] uppercase tracking-wider">
                  Descrição Técnica:
                </span>
                <p className="text-neutral-200 leading-relaxed">
                  {selectedFile.description}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-[11px] font-mono text-neutral-400">
                  <span>Modificação:</span>
                  <span className="text-neutral-300">{selectedFile.updatedAt}</span>
                </div>
              </div>

              {/* File Interactive Direct Touch Action Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/40 via-neutral-950 to-neutral-950 border border-amber-800/60 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs font-mono">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Ação Instantânea na Tela Principal:</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Toque no botão abaixo ou arraste o card diretamente para a viewport 3D ou planta 2D para carregar o arquivo na cena ativa.
                </p>

                <button
                  onClick={() => handleFileTouchOrClick(selectedFile)}
                  className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xl text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-amber-400/20"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Trazer "{selectedFile.name}" para a Tela Principal</span>
                </button>
              </div>

              {/* Quick Capabilities Matrix for this format */}
              <div className="space-y-1.5 text-xs font-mono">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                  Interoperabilidade Nativa:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-800/80 text-neutral-300">
                    <span className="text-neutral-500 block text-[9px]">COMPATIBILIDADE</span>
                    Rhinoceros 8 / GH
                  </div>
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-800/80 text-neutral-300">
                    <span className="text-neutral-500 block text-[9px]">GARANTIA VUC</span>
                    RFC-VUC-1.0.4 SSOT
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Close */}
            <div className="pt-4 border-t border-neutral-800">
              <button
                onClick={onClose}
                className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-mono transition-colors cursor-pointer"
              >
                Fechar Explorador
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
