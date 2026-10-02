export interface HaltonReferenceProject {
  id: string;
  name: string;
  location: string;
  country: string;
  url: string;
  chefOrGroup: string;
  culinaryStyle: string;
  description: string;
  challenges: string[];
  haltonSolutions: string[];
  airflowBeforeM3h: number;
  airflowWithHaltonM3h: number;
  energySavingsKwhYear: number;
  featuredQuote: string;
  badge: string;
}

export const HALTON_REFERENCES: HaltonReferenceProject[] = [
  {
    id: 'gianni-brazil',
    name: 'Gianni Cocina',
    location: 'Brasil',
    country: 'Brasil',
    url: 'https://www.halton.com/references/gianni-brazil/',
    chefOrGroup: 'Chef Gianni & Equipe',
    culinaryStyle: 'Alta Gastronomia Contemporânea & Raízes Italianas',
    description: 'Projeto de referência da Halton no Brasil com padrão internacional de eficiência ambiental e controle de emissões. Uma cozinha aberta de alta performance que exigia eliminação completa de fumaça, contenção de odores e conforto térmico inegociável para a brigada.',
    challenges: [
      'Geração intensa de calor e gordura em espaço integrado ao salão de clientes',
      'Exigência de baixíssimo nível de ruído acústico (< 55 dBA) na praça',
      'Necessidade de conter consumo elétrico de climatização e ar de reposição'
    ],
    haltonSolutions: [
      'Coifas Halton KVE Capture Jet™ com jatos frontais e laterais de alta velocidade',
      'Filtros multiciclônicos KSA em aço inoxidável com eficiência de 95% a 10µm',
      'Sistema Halton M.A.R.V.E.L. com sensores ópticos IR para modulação automática de exaustão',
      'Unidade ecológica de tratamento de ar PolluStop com estágio de carvão ativado'
    ],
    airflowBeforeM3h: 5800,
    airflowWithHaltonM3h: 3650,
    energySavingsKwhYear: 38400,
    featuredQuote: 'A tecnologia Capture Jet permitiu uma cozinha transparente, aberta e silenciosa, onde o calor e os odores não invadem o salão.',
    badge: 'Referência Oficial Halton Brasil'
  },
  {
    id: 'thai-mee-porto-alegre',
    name: 'Thai Mee High-Output Lab',
    location: 'Porto Alegre & Praia do Rosa',
    country: 'Brasil',
    url: 'https://www.monolithe.it',
    chefOrGroup: 'Sócio e Administrador Thai Mee',
    culinaryStyle: 'Culinária Tailandesa de Alto Padrão (Woks & Pad Talay)',
    description: 'Ambiente com linha contínua Monolithe de woks de alta potência e chapa de selamento. A densidade térmica dos salteados tailandeses demanda o padrão Halton Capture Jet com cortina aerodinâmica dupla e proteção contra respingos de óleo.',
    challenges: [
      'Colunas térmicas de woks de indução 8kW e queimadores a gás com picos de comanda',
      'Vapores voláteis de pasta de pimenta Nam Prik Pao e molho de peixe',
      'Fluxo ininterrupto de 280+ coberturas por noite em espaço otimizado'
    ],
    haltonSolutions: [
      'Coifas Halton Capture Jet™ modelo Ilha KVI com bicos patenteados verticais e horizontais',
      'Sistema M.A.R.V.E.L. regulando as seções de wok de forma independente da praça fria',
      'Filtros KSA com calhas coletoras de gordura em aço AISI 304 com dreno contínuo'
    ],
    airflowBeforeM3h: 6200,
    airflowWithHaltonM3h: 3900,
    energySavingsKwhYear: 44200,
    featuredQuote: 'Comida de altíssima qualidade produzida em espaços mínimos exige exaustão que capture o vapor no nascimento da chama.',
    badge: 'Benchmark Tailandês de Alto Padrão'
  },
  {
    id: 'fasano-brasil',
    name: 'Grupo Fasano',
    location: 'São Paulo / Rio de Janeiro',
    country: 'Brasil',
    url: 'https://www.halton.com',
    chefOrGroup: 'Família Fasano',
    culinaryStyle: 'Gastronomia Clássica e Hotelaria de Luxo',
    description: 'Padrão máximo de sofisticação gastronômica no Brasil com cozinhas operando 24 horas por dia com tecnologia Halton Capture Ray UV-C para eliminação definitiva de gordura em dutos.',
    challenges: [
      'Instalação em edifícios históricos e torres hoteleiras de alto padrão',
      'Risco zero de incêndio em dutos de exaustão em longas distâncias verticais',
      'Controle absoluto de ruídos e vibrações'
    ],
    haltonSolutions: [
      'Tecnologia UV Capture Ray™ com quebra fotolítica de gorduras por lâmpadas UV-C',
      'Insuflamento de ar de reposição por fluxo laminar de baixa velocidade Halton',
      'Automação M.A.R.V.E.L. integrada ao BMS (Building Management System)'
    ],
    airflowBeforeM3h: 12500,
    airflowWithHaltonM3h: 7900,
    energySavingsKwhYear: 89000,
    featuredQuote: 'Cozinhas que preservam a integridade arquitetônica e oferecem ar impecável para nossos clientes e equipes.',
    badge: 'Referência Hotelaria & Gastronomia'
  },
  {
    id: 'le-bernardin-ny',
    name: 'Le Bernardin',
    location: 'Nova York',
    country: 'Estados Unidos',
    url: 'https://www.halton.com',
    chefOrGroup: 'Chef Eric Ripert',
    culinaryStyle: 'Culinária de Frutos do Mar 3 Estrelas Michelin',
    description: 'Uma das cozinhas de frutos do mar mais aclamadas do planeta, onde cada grama de ar é tratado com precisão cirúrgica.',
    challenges: [
      'Cocções ultradelicadas de peixes nobres e molhos de precisão',
      'Ambiente com visibilidade total e acústica de estúdio',
      'Conforto térmico impecável para brigada Michelin'
    ],
    haltonSolutions: [
      'Teto filtrante ventilado Halton KCJ (Kitchen Clean Jet Ceiling)',
      'Controle dinâmico de vazão de ar por zona M.A.R.V.E.L.',
      'Iluminação LED integrada CRI > 90 para inspeção de cocção'
    ],
    airflowBeforeM3h: 18000,
    airflowWithHaltonM3h: 11200,
    energySavingsKwhYear: 125000,
    featuredQuote: 'O teto filtrante Halton transforma a cozinha em um ambiente silencioso, arejado e perfeito para o rigor da alta gastronomia.',
    badge: '3 Estrelas Michelin'
  }
];

export interface HaltonTechnicalSpecification {
  model: string;
  name: string;
  technology: string;
  efficiencyAirflowReductionPct: number;
  filtrationEfficiencyPct: number;
  dcvSupport: boolean;
  uvSupport: boolean;
  waterMistSupport: boolean;
  description: string;
  recommendedFor: string;
}

export const HALTON_HOOD_SPECS: Record<string, HaltonTechnicalSpecification> = {
  KVI_CAPTURE_JET: {
    model: 'Halton KVI',
    name: 'Coifa Ilha Capture Jet™',
    technology: 'Aerodinâmica de Jatos Duplos (Horizontal + Vertical)',
    efficiencyAirflowReductionPct: 35,
    filtrationEfficiencyPct: 95,
    dcvSupport: true,
    uvSupport: false,
    waterMistSupport: false,
    description: 'Coifa central para blocos de cocção tipo ilha Monolithe. Jatos de ar comprimido aerodinâmico direcionam a pluma térmica diretamente para os filtros KSA, prevenindo escape lateral mesmo com turbulência.',
    recommendedFor: 'Ilhas centrais com woks, frytops e queimadores pesados.'
  },
  KVE_CAPTURE_JET: {
    model: 'Halton KVE',
    name: 'Coifa de Parede Capture Jet™ com Insuflamento',
    technology: 'Capture Jet™ + Pleno de Insuflamento de Baixa Velocidade',
    efficiencyAirflowReductionPct: 35,
    filtrationEfficiencyPct: 95,
    dcvSupport: true,
    uvSupport: false,
    waterMistSupport: false,
    description: 'Coifa de parede com insuflamento de ar frontal integrado e jatos de captura patenteados, ideal para cozinhas de média a alta densidade.',
    recommendedFor: 'Linhas encostadas em parede com controle de temperatura de reposição.'
  },
  UV_CAPTURE_RAY: {
    model: 'Halton UV Capture Ray™',
    name: 'Coifa de Descontaminação Foto-química UV-C',
    technology: 'Fotólise e Ozonólise Molecular com Lâmpadas UV-C',
    efficiencyAirflowReductionPct: 40,
    filtrationEfficiencyPct: 99,
    dcvSupport: true,
    uvSupport: true,
    waterMistSupport: false,
    description: 'Equipada com câmara de radiação UV-C que oxida a gordura microscópica antes que ela entre no duto, mantendo a rede predial livre de acúmulo inflamável e eliminando odores de exaustão.',
    recommendedFor: 'Edifícios corporativos, shopping centers e hotéis com dutos longos.'
  },
  COLD_MIST_WOK: {
    model: 'Halton Cold Mist & Water Wash',
    name: 'Coifa de Nebulização e Lavagem Automática',
    technology: 'Cortina de Água Fria (Cold Mist) + Lavagem com Água Quente',
    efficiencyAirflowReductionPct: 45,
    filtrationEfficiencyPct: 98,
    dcvSupport: true,
    uvSupport: false,
    waterMistSupport: true,
    description: 'Sistema especializado para cocção com fogo alto, woks tradicionais e grelhas a carvão. A névoa de água resfria os gases instantaneamente e extingue faíscas antes que atinjam os filtros.',
    recommendedFor: 'Cozinhas asiáticas de alto fogo, churrasqueiras e woks intensos.'
  }
};
