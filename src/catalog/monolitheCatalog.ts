import { MonolitheModule, SubComponentDetail } from '../types/designModel';

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  italianName: string;
  category: 'cooking' | 'water' | 'refrigeration' | 'neutral';
  defaultWidthMm: number;
  availableWidthsMm: number[];
  depthMm: number;
  heightMm: number;
  electricKw: number;
  gasKw: number;
  waterInDn?: number;
  drainDn?: number;
  exhaustFlowM3h: number;
  heatDissipationSensibleWatts: number;
  heatDissipationLatentWatts: number;
  description: string;
  monolitheBenefit: string;
  manufacturer: string;
  manufacturerUrl: string;
  datasheetUrl: string;
  cadModelUrl: string;
  defaultTopElementDetail: {
    bowlDiameterMm?: number;
    planchaZones?: number;
    burnerCount?: number;
    basinCapacityLiters?: number;
    temperatureRange?: string;
  };
  subComponentsTemplate: (widthMm: number, depthMm: number, heightMm: number) => SubComponentDetail[];
}

export const MONOLITHE_CATALOG: CatalogItem[] = [
  {
    id: 'elem-wok-8kw',
    code: 'MONO-WOK-800-8KW',
    name: 'Wok de Indução Alta Frequência 8kW',
    italianName: 'Elemento Wok Induzione Concavo',
    category: 'cooking',
    defaultWidthMm: 800,
    availableWidthsMm: [400, 800],
    depthMm: 1000,
    heightMm: 900,
    electricKw: 8.0,
    gasKw: 0,
    exhaustFlowM3h: 950,
    heatDissipationSensibleWatts: 950,
    heatDissipationLatentWatts: 400,
    description: 'Bacia vitrocerâmica côncava ø300mm com 8kW de potência contínua para salteamento ultrarrápido em wok.',
    monolitheBenefit: 'Solda contínua no tampo em aço AISI 304 3mm sem fresta ou guarnição, facilitando higienização total pós-serviço.',
    manufacturer: 'Angelo Po Grandi Cucine / Marmon Foodservice Technologies',
    manufacturerUrl: 'https://www.angelopo.com/en/products/cooking/monolithe/',
    datasheetUrl: 'https://www.angelopo.com/en/products/cooking/induction-wok-technical-spec.pdf',
    cadModelUrl: 'https://www.angelopo.com/bim-cad-library/monolithe-wok-3dm.zip',
    defaultTopElementDetail: {
      bowlDiameterMm: 300,
      temperatureRange: '60°C - 300°C'
    },
    subComponentsTemplate: (w, d, h) => [
      {
        id: 'sub-wok-top',
        name: 'Tampo Contínuo Soldado c/ Rebaixo Côncavo 3mm',
        category: 'TOP_PLATE',
        materialGrade: 'AISI 304 Scotch-Brite',
        weightKg: 28.5,
        dimensionsMm: [w, d, 3],
        isDetachable: false,
        partNumber: 'APO-TOP-800-3MM',
        manufacturerLink: 'https://www.angelopo.com/en/products/cooking/monolithe/',
        description: 'Tampo monobloco soldado a laser sem juntas mecânicas com borda marinha anti-derramamento.',
        renderMaterial: { metalness: 0.88, roughness: 0.22, color: '#d8dee9', clearcoat: 0.1 }
      },
      {
        id: 'sub-wok-bowl',
        name: 'Cúpula Côncava Vitrocerâmica Ceran ø300mm',
        category: 'HEATING_ELEMENT',
        materialGrade: 'Schott Ceran Glass-Ceramic',
        weightKg: 4.8,
        dimensionsMm: [320, 320, 95],
        isDetachable: true,
        partNumber: 'SCHOTT-CERAN-WOK-300',
        manufacturerLink: 'https://www.schott.com/en-gb/products/ceran',
        description: 'Vidro cerâmico de alta resistência ao choque térmico (até 750°C) com anel de vedação sanitário em silicone fluorado.',
        renderMaterial: { metalness: 0.1, roughness: 0.05, color: '#111827', transmission: 0.15, clearcoat: 1.0 }
      },
      {
        id: 'sub-wok-inductor',
        name: 'Gerador Indutivo Octogonal 8kW c/ Bobina Toroidal',
        category: 'HEATING_ELEMENT',
        materialGrade: 'Cobre Eletrolítico / Ferrite',
        weightKg: 12.0,
        dimensionsMm: [340, 340, 180],
        isDetachable: true,
        partNumber: 'EGO-IND-GEN-8000W',
        manufacturerLink: 'https://www.egoproducts.com/en/commercial-cooking/induction',
        description: 'Gerador de frequência ressonante de 20-50kHz com modulação PWM precisa de 12 níveis.',
        renderMaterial: { metalness: 0.9, roughness: 0.35, color: '#b45309' }
      },
      {
        id: 'sub-wok-knob',
        name: 'Manípulo Rotativo Usinado em Metal Maciço R70',
        category: 'CONTROL_KNOB',
        materialGrade: 'AISI 316 Usinado',
        weightKg: 0.75,
        dimensionsMm: [70, 70, 45],
        isDetachable: true,
        partNumber: 'APO-KNOB-HEAVY-316',
        description: 'Manípulo ergonômico estanque IPX5 com indexação graduada de potência e anel O-ring.',
        renderMaterial: { metalness: 0.95, roughness: 0.15, color: '#e5e7eb' }
      },
      {
        id: 'sub-wok-chassis',
        name: 'Chassi Estrutural Autoportante com Pés Sanitários',
        category: 'CHASSIS',
        materialGrade: 'AISI 304 Estrutural 2mm',
        weightKg: 34.0,
        dimensionsMm: [w, d - 80, h - 60],
        isDetachable: false,
        partNumber: 'APO-CHS-800-MONO',
        description: 'Viga de sustentação com túnel interno para passagem segregada de cabos de força e eletrodutos.',
        renderMaterial: { metalness: 0.75, roughness: 0.35, color: '#64748b' }
      }
    ]
  },
  {
    id: 'elem-frytop-chrome',
    code: 'MONO-FRYTOP-800-CHROME',
    name: 'Plancha Frytop Cromo Duro Espelhado',
    italianName: 'Frytop Piastra Liscia Cromo',
    category: 'cooking',
    defaultWidthMm: 800,
    availableWidthsMm: [400, 800],
    depthMm: 1000,
    heightMm: 900,
    electricKw: 7.4,
    gasKw: 0,
    exhaustFlowM3h: 750,
    heatDissipationSensibleWatts: 1200,
    heatDissipationLatentWatts: 600,
    description: 'Chapa em aço composto FE510 revestida em cromo duro 50µm espelhado. Duas zonas térmicas independentes.',
    monolitheBenefit: 'Rebaixo perimetral embutido diretamente no tampo monolítico com orifício de drenagem direta para gaveta coletora.',
    manufacturer: 'Angelo Po Grandi Cucine',
    manufacturerUrl: 'https://www.angelopo.com/en/products/cooking/monolithe/',
    datasheetUrl: 'https://www.angelopo.com/en/products/cooking/frytop-chrome-spec.pdf',
    cadModelUrl: 'https://www.angelopo.com/bim-cad-library/monolithe-frytop-3dm.zip',
    defaultTopElementDetail: {
      planchaZones: 2,
      temperatureRange: '50°C - 300°C'
    },
    subComponentsTemplate: (w, d, h) => [
      {
        id: 'sub-frytop-plate',
        name: 'Placa Bimetálica FE510 c/ Banho Cromo Duro 50µm',
        category: 'TOP_PLATE',
        materialGrade: 'FE510 + Hard Chrome Mirror Finish',
        weightKg: 52.0,
        dimensionsMm: [w - 60, d - 180, 15],
        isDetachable: true,
        partNumber: 'APO-PLANCHA-CHROME-800',
        manufacturerLink: 'https://www.angelopo.com/en/products/cooking/monolithe/',
        description: 'Placa de alta condutividade térmica com acabamento espelhado de baixa emissividade de radiação para o operador.',
        renderMaterial: { metalness: 0.98, roughness: 0.04, color: '#f1f5f9', clearcoat: 1.0 }
      },
      {
        id: 'sub-frytop-heaters',
        name: 'Conjunto de Resistências Blindadas Incoloy 800 (2x 3.7kW)',
        category: 'HEATING_ELEMENT',
        materialGrade: 'Liga Incoloy 800',
        weightKg: 8.5,
        dimensionsMm: [w - 100, d - 220, 35],
        isDetachable: true,
        partNumber: 'WATLOW-INCOLOY-3700W',
        description: 'Elementos térmicos conformados sob pressão direta com condutores de níquel puro.',
        renderMaterial: { metalness: 0.8, roughness: 0.4, color: '#71717a' }
      },
      {
        id: 'sub-frytop-drain-drawer',
        name: 'Gaveta Coletora de Gordura GN com Baffle Antirrespingo',
        category: 'REFRIGERATION_BASE',
        materialGrade: 'AISI 304 1.5mm',
        weightKg: 3.2,
        dimensionsMm: [180, 450, 120],
        isDetachable: true,
        partNumber: 'APO-FAT-TRAY-GN',
        description: 'Gaveta de extração frontal com capacidade de 3.5L para recolhimento rápido de gorduras.',
        renderMaterial: { metalness: 0.85, roughness: 0.25, color: '#cbd5e1' }
      },
      {
        id: 'sub-frytop-knobs',
        name: 'Manípulos Duplos Graduados 50-300°C com Leds Bicolores',
        category: 'CONTROL_KNOB',
        materialGrade: 'AISI 316 + Alumínio Anodizado',
        weightKg: 1.2,
        dimensionsMm: [160, 70, 45],
        isDetachable: true,
        partNumber: 'APO-DUAL-KNOB-THERM',
        description: 'Controle termostático PID independente para a zona esquerda e direita da chapa.',
        renderMaterial: { metalness: 0.95, roughness: 0.15, color: '#e2e8f0' }
      }
    ]
  },
  {
    id: 'elem-gas-burner',
    code: 'MONO-GAS-600-2B',
    name: 'Fogão 2 Queimadores Flor de Latão 10kW',
    italianName: 'Fuochi Aperti a Gas con Spartifiamma Ottone',
    category: 'cooking',
    defaultWidthMm: 600,
    availableWidthsMm: [400, 600, 800],
    depthMm: 1000,
    heightMm: 900,
    electricKw: 0,
    gasKw: 20.0,
    exhaustFlowM3h: 1200,
    heatDissipationSensibleWatts: 2400,
    heatDissipationLatentWatts: 1500,
    description: 'Queimadores herméticos com corpo em ferro fundido e coroa em latão maciço. Válvula termopar de segurança.',
    monolitheBenefit: 'Bacia de retenção de líquidos estampada sem cantos vivos e com dreno de limpeza contínuo.',
    manufacturer: 'Angelo Po Grandi Cucine',
    manufacturerUrl: 'https://www.angelopo.com/en/products/cooking/monolithe/',
    datasheetUrl: 'https://www.angelopo.com/en/products/cooking/gas-burners-monolithe-spec.pdf',
    cadModelUrl: 'https://www.angelopo.com/bim-cad-library/monolithe-gas-burner-3dm.zip',
    defaultTopElementDetail: {
      burnerCount: 2,
      temperatureRange: 'Chama piloto modulável'
    },
    subComponentsTemplate: (w, d, h) => [
      {
        id: 'sub-gas-grates',
        name: 'Grelhas Pesadas R15 em Ferro Fundido Esmaltado',
        category: 'TOP_PLATE',
        materialGrade: 'Ferro Fundido GJL-200 Esmaltado Preto Fosco',
        weightKg: 18.0,
        dimensionsMm: [w - 40, d - 160, 45],
        isDetachable: true,
        partNumber: 'APO-GRATE-CASTIRON-600',
        manufacturerLink: 'https://www.angelopo.com/en/products/cooking/monolithe/',
        description: 'Grelhas contínuas que permitem deslizar caçarolas pesadas de caldo sem esforço.',
        renderMaterial: { metalness: 0.3, roughness: 0.8, color: '#1c1917' }
      },
      {
        id: 'sub-gas-brass-burners',
        name: 'Espalhadores Flor de Latão Maciço Dupla Coroa (2x 10kW)',
        category: 'BURNER_BRASS',
        materialGrade: 'Latão OT58 Forjado',
        weightKg: 5.4,
        dimensionsMm: [140, 140, 80],
        isDetachable: true,
        partNumber: 'SABAF-BRASS-DUAL-10KW',
        description: 'Chama concêntrica de alto rendimento térmico com queimador piloto interno protegido.',
        renderMaterial: { metalness: 0.85, roughness: 0.28, color: '#eab308' }
      },
      {
        id: 'sub-gas-valves',
        name: 'Válvulas de Gás com Termopar de Resposta Rápida Pel',
        category: 'PLUMBING_VALVE',
        materialGrade: 'Latão Niquelado + Cobre',
        weightKg: 2.1,
        dimensionsMm: [220, 90, 80],
        isDetachable: true,
        partNumber: 'PEL-GAS-VALVE-22S',
        description: 'Corte de segurança automático em menos de 10 segundos caso a chama se apague.',
        renderMaterial: { metalness: 0.9, roughness: 0.25, color: '#ca8a04' }
      },
      {
        id: 'sub-gas-stamped-basin',
        name: 'Bacia Estampada Estanque Anti-Vazamento AISI 304',
        category: 'TOP_PLATE',
        materialGrade: 'AISI 304 2mm',
        weightKg: 9.8,
        dimensionsMm: [w, d - 100, 65],
        isDetachable: false,
        partNumber: 'APO-STAMPED-BASIN-600',
        description: 'Raio de curvatura interno R20 sem soldas, permitindo higienização completa com água corrente.',
        renderMaterial: { metalness: 0.85, roughness: 0.2, color: '#cbd5e1' }
      }
    ]
  },
  {
    id: 'elem-pasta-cooker',
    code: 'MONO-PASTA-40L',
    name: 'Cozedor de Massas & Noodles com Skimmer',
    italianName: 'Cuocipasta con Sfioratore Amido',
    category: 'water',
    defaultWidthMm: 600,
    availableWidthsMm: [400, 600],
    depthMm: 1000,
    heightMm: 900,
    electricKw: 9.0,
    gasKw: 0,
    waterInDn: 15,
    drainDn: 25,
    exhaustFlowM3h: 600,
    heatDissipationSensibleWatts: 600,
    heatDissipationLatentWatts: 2800,
    description: 'Cuba em aço AISI 316 resistente à corrosão salina com skimmer contínuo para remoção de espuma de amido.',
    monolitheBenefit: 'Enchimento automático de água fria/quente direto da rede embutida sob a estrutura do Monolithe.',
    manufacturer: 'Angelo Po Grandi Cucine',
    manufacturerUrl: 'https://www.angelopo.com/en/products/cooking/monolithe/',
    datasheetUrl: 'https://www.angelopo.com/en/products/cooking/pasta-cooker-spec.pdf',
    cadModelUrl: 'https://www.angelopo.com/bim-cad-library/monolithe-pasta-cooker-3dm.zip',
    defaultTopElementDetail: {
      basinCapacityLiters: 40,
      temperatureRange: '98°C - 102°C fervura'
    },
    subComponentsTemplate: (w, d, h) => [
      {
        id: 'sub-pasta-basin',
        name: 'Cuba Profunda 40L Estampada em AISI 316L Anticorrosão',
        category: 'TOP_PLATE',
        materialGrade: 'AISI 316L Náutico',
        weightKg: 21.0,
        dimensionsMm: [w - 120, d - 350, 320],
        isDetachable: false,
        partNumber: 'APO-BASIN-PASTA-40L-316',
        description: 'Aço enriquecido com molibdênio para suporte contínuo a alta salinidade e fervura vigorosa.',
        renderMaterial: { metalness: 0.9, roughness: 0.18, color: '#e2e8f0' }
      },
      {
        id: 'sub-pasta-skimmer',
        name: 'Calha Perimetral de Desnate de Amido c/ Dreno de Rebaixo',
        category: 'PLUMBING_VALVE',
        materialGrade: 'AISI 316L',
        weightKg: 4.2,
        dimensionsMm: [w - 100, 80, 50],
        isDetachable: true,
        partNumber: 'APO-SKIM-RUNNER-316',
        description: 'Elimina películas de amido superficiais, evitando fervura descontrolada e contaminação do lote de água.',
        renderMaterial: { metalness: 0.92, roughness: 0.15, color: '#cbd5e1' }
      },
      {
        id: 'sub-pasta-heaters',
        name: 'Resistências Submersas Articuláveis de Rápida Manutenção (9kW)',
        category: 'HEATING_ELEMENT',
        materialGrade: 'Incoloy 825 Corrosão Salina',
        weightKg: 6.8,
        dimensionsMm: [w - 160, d - 400, 60],
        isDetachable: true,
        partNumber: 'APO-HEAT-SWING-9KW',
        description: 'Mecanismo basculante que sobe a resistência para higienização sem esforço do fundo da cuba.',
        renderMaterial: { metalness: 0.85, roughness: 0.3, color: '#94a3b8' }
      },
      {
        id: 'sub-pasta-baskets',
        name: 'Cestos Microperfurados em Inox c/ Punho Isotérmico',
        category: 'TOP_PLATE',
        materialGrade: 'AISI 304 Perfurado ø1.5mm',
        weightKg: 3.6,
        dimensionsMm: [140, 140, 240],
        isDetachable: true,
        partNumber: 'APO-BASKET-NOODLE-SET',
        description: 'Quartetos de cestos para porcionamento individual de noodles de arroz para Pad Thai / Pad Talay.',
        renderMaterial: { metalness: 0.88, roughness: 0.22, color: '#f8fafc' }
      }
    ]
  },
  {
    id: 'elem-bain-marie',
    code: 'MONO-BAIN-MARIE-GN11',
    name: 'Banho-Maria com Abastecimento Automático',
    italianName: 'Bagnomaria con Carico Automatico',
    category: 'water',
    defaultWidthMm: 800,
    availableWidthsMm: [400, 800],
    depthMm: 1000,
    heightMm: 900,
    electricKw: 3.0,
    gasKw: 0,
    waterInDn: 15,
    drainDn: 25,
    exhaustFlowM3h: 300,
    heatDissipationSensibleWatts: 350,
    heatDissipationLatentWatts: 850,
    description: 'Cuba para cubas GN até 2x GN 1/1 ou frações. Aquecimento indireto por resistências de contato.',
    monolitheBenefit: 'Integrado perfeitamente no tampo sem juntas de silicone degradáveis por alta temperatura.',
    manufacturer: 'Angelo Po Grandi Cucine',
    manufacturerUrl: 'https://www.angelopo.com/en/products/cooking/monolithe/',
    datasheetUrl: 'https://www.angelopo.com/en/products/cooking/bain-marie-spec.pdf',
    cadModelUrl: 'https://www.angelopo.com/bim-cad-library/monolithe-bain-marie-3dm.zip',
    defaultTopElementDetail: {
      basinCapacityLiters: 28,
      temperatureRange: '30°C - 90°C'
    },
    subComponentsTemplate: (w, d, h) => [
      {
        id: 'sub-bm-basin',
        name: 'Cuba Térmica GN 2/1 Estampada c/ Cantos Arredondados R25',
        category: 'TOP_PLATE',
        materialGrade: 'AISI 304 2mm',
        weightKg: 19.5,
        dimensionsMm: [w - 100, 530, 200],
        isDetachable: false,
        partNumber: 'APO-BM-BASIN-GN21',
        description: 'Capacidade para 2 cubas GN 1/1 ou frações de molhos tailandeses (Curry Verde, Nam Prik Pao).',
        renderMaterial: { metalness: 0.88, roughness: 0.2, color: '#e2e8f0' }
      },
      {
        id: 'sub-bm-silicone-heaters',
        name: 'Painéis Térmicos de Silicone de Contato Seco Externo (3kW)',
        category: 'HEATING_ELEMENT',
        materialGrade: 'Manta de Silicone + Níquel-Cromo',
        weightKg: 3.8,
        dimensionsMm: [w - 140, 480, 15],
        isDetachable: true,
        partNumber: 'WATLOW-SILICONE-MAT-3000',
        description: 'Aquecimento uniforme pelo fundo sem calcificação de resistências por contato direto com água.',
        renderMaterial: { metalness: 0.4, roughness: 0.6, color: '#e11d48' }
      },
      {
        id: 'sub-bm-valve',
        name: 'Válvula Esfera Inox DN25 de Dreno Rápido c/ Alavanca Oculta',
        category: 'PLUMBING_VALVE',
        materialGrade: 'AISI 316',
        weightKg: 1.8,
        dimensionsMm: [120, 80, 80],
        isDetachable: true,
        partNumber: 'GENEBRE-BALL-VALVE-DN25',
        description: 'Drenagem total de 28 litros em menos de 45 segundos direto para a rede de águas cinzas.',
        renderMaterial: { metalness: 0.9, roughness: 0.25, color: '#94a3b8' }
      }
    ]
  },
  {
    id: 'elem-refrig-drawers',
    code: 'MONO-REFRIG-BASE-GN',
    name: 'Base Refrigerada -2°C / +8°C com Gavetas GN 1/1',
    italianName: 'Base Refrigerata a Cassetti GN',
    category: 'refrigeration',
    defaultWidthMm: 800,
    availableWidthsMm: [800, 1200],
    depthMm: 1000,
    heightMm: 650,
    electricKw: 0.8,
    gasKw: 0,
    exhaustFlowM3h: 100,
    heatDissipationSensibleWatts: 500,
    heatDissipationLatentWatts: 0,
    description: 'Gavetas telescópicas com fechamento suave para armazenamento de frutos do mar e carnes sob a linha de cocção.',
    monolitheBenefit: 'Isolamento de poliuretano expandido de 60mm com barreira térmica especial contra o tampo aquecido.',
    manufacturer: 'Foster Refrigerator / Angelo Po',
    manufacturerUrl: 'https://www.fosterrefrigerator.com/en/products/counter-refrigeration',
    datasheetUrl: 'https://www.fosterrefrigerator.com/datasheets/monolithe-refrigerated-base.pdf',
    cadModelUrl: 'https://www.fosterrefrigerator.com/bim/foster-refrig-drawers-3dm.zip',
    defaultTopElementDetail: {
      temperatureRange: '-2°C a +8°C digital'
    },
    subComponentsTemplate: (w, d, h) => [
      {
        id: 'sub-refrig-compressor',
        name: 'Unidade Condensadora Hermética Tropicalizada R290',
        category: 'REFRIGERATION_BASE',
        materialGrade: 'Componentes Herméticos / Cobre / Alumínio',
        weightKg: 22.0,
        dimensionsMm: [320, 380, 240],
        isDetachable: true,
        partNumber: 'EMBRACO-ASPERA-R290-PROPANE',
        manufacturerLink: 'https://www.embraco.com/en/commercial-refrigeration',
        description: 'Gás ecológico R290 com alta eficiência energética e operação em ambientes quentes de até +43°C.',
        renderMaterial: { metalness: 0.7, roughness: 0.45, color: '#334155' }
      },
      {
        id: 'sub-refrig-drawers-telescopic',
        name: 'Gavetas com Guias Telescópicas de Extração Total 100kg',
        category: 'REFRIGERATION_BASE',
        materialGrade: 'AISI 304 + Guias Grass/Hettich',
        weightKg: 16.5,
        dimensionsMm: [w - 80, d - 150, 280],
        isDetachable: true,
        partNumber: 'APO-DRAWER-PULLOUT-100KG',
        description: 'Fechamento suave Soft-Close com gaxetas magnéticas de silicone substituíveis sem ferramentas.',
        renderMaterial: { metalness: 0.9, roughness: 0.22, color: '#e2e8f0' }
      },
      {
        id: 'sub-refrig-thermal-barrier',
        name: 'Barreira Térmica em Poliuretano Injetado 60mm + Placa Cerâmica',
        category: 'CHASSIS',
        materialGrade: 'Poliuretano Expandido 42kg/m³ + Revestimento Silicato',
        weightKg: 8.4,
        dimensionsMm: [w, d, 60],
        isDetachable: false,
        partNumber: 'APO-THERMAL-SHIELD-60MM',
        description: 'Bloqueia 99.2% da irradiação descendente das estações quentes de wok e fritura.',
        renderMaterial: { metalness: 0.1, roughness: 0.9, color: '#e2e8f0' }
      }
    ]
  },
  {
    id: 'elem-neutral-worktop',
    code: 'MONO-NEUTRAL-TOP',
    name: 'Tampo Neutro de Apoio com Bordo Marinho',
    italianName: 'Piano di Lavoro Neutro Bordo Marino',
    category: 'neutral',
    defaultWidthMm: 600,
    availableWidthsMm: [400, 600, 800],
    depthMm: 1000,
    heightMm: 900,
    electricKw: 0,
    gasKw: 0,
    exhaustFlowM3h: 0,
    heatDissipationSensibleWatts: 0,
    heatDissipationLatentWatts: 0,
    description: 'Superfície de apoio contínua em aço inox AISI 304 Scotch-Brite com rebaixo perimetral antivazamento.',
    monolitheBenefit: 'Continuidade física 100% lisa, servindo de transição higiênica e apoio de prato para empratamento.',
    manufacturer: 'Angelo Po Grandi Cucine',
    manufacturerUrl: 'https://www.angelopo.com/en/products/cooking/monolithe/',
    datasheetUrl: 'https://www.angelopo.com/en/products/cooking/neutral-worktop-spec.pdf',
    cadModelUrl: 'https://www.angelopo.com/bim-cad-library/monolithe-neutral-top-3dm.zip',
    defaultTopElementDetail: {},
    subComponentsTemplate: (w, d, h) => [
      {
        id: 'sub-neutral-plate',
        name: 'Tampo Maciço 3mm Scotch-Brite com Reforço Ômega Insonorizado',
        category: 'TOP_PLATE',
        materialGrade: 'AISI 304 3.0mm',
        weightKg: 24.0,
        dimensionsMm: [w, d, 3],
        isDetachable: false,
        partNumber: 'APO-NEUTRAL-3MM-OMEGA',
        description: 'Chapa com manta amortecedora de ruído de facas e panelas no verso.',
        renderMaterial: { metalness: 0.9, roughness: 0.22, color: '#d8dee9' }
      },
      {
        id: 'sub-neutral-shelf',
        name: 'Prateleira Inferior Vazada Sanitária AISI 304',
        category: 'CHASSIS',
        materialGrade: 'AISI 304 1.5mm',
        weightKg: 7.5,
        dimensionsMm: [w - 40, d - 100, 30],
        isDetachable: true,
        partNumber: 'APO-SHELF-LOWER-600',
        description: 'Apoio ventilado para bandejas e caixas plásticas de mise-en-place.',
        renderMaterial: { metalness: 0.85, roughness: 0.28, color: '#cbd5e1' }
      }
    ]
  },
  {
    id: 'elem-solid-top-induction',
    code: 'MONO-IND-SOLID-800',
    name: 'Fogão Indução Total 4 Zonas Solid Top',
    italianName: 'Tuttapiano ad Induzione 4 Zone',
    category: 'cooking',
    defaultWidthMm: 800,
    availableWidthsMm: [800, 1000],
    depthMm: 1000,
    heightMm: 900,
    electricKw: 14.0,
    gasKw: 0,
    exhaustFlowM3h: 1100,
    heatDissipationSensibleWatts: 1400,
    heatDissipationLatentWatts: 500,
    description: 'Placa contínua vitrocerâmica de 6mm com 4 bobinas indutivas octogonais independentes com detecção automática de panela.',
    monolitheBenefit: 'Transição suave de panelas em qualquer direção do tampo sem desníveis ou risco de tombamento.',
    manufacturer: 'Angelo Po / Marmon',
    manufacturerUrl: 'https://www.angelopo.com/en/products/cooking/monolithe/',
    datasheetUrl: 'https://www.angelopo.com/en/products/cooking/solid-top-induction-spec.pdf',
    cadModelUrl: 'https://www.angelopo.com/bim-cad-library/monolithe-solidtop-3dm.zip',
    defaultTopElementDetail: {
      planchaZones: 4,
      temperatureRange: '60°C - 320°C'
    },
    subComponentsTemplate: (w, d, h) => [
      {
        id: 'sub-solidtop-glass',
        name: 'Placa Vitrocerâmica Plana 6mm Ceran de Alta Carga Mecânica',
        category: 'TOP_PLATE',
        materialGrade: 'Schott Ceran High-Load 6mm',
        weightKg: 14.5,
        dimensionsMm: [w - 60, d - 180, 6],
        isDetachable: true,
        partNumber: 'SCHOTT-CERAN-FLAT-800',
        description: 'Capacidade de carga pontual de até 80kg por zona com borda biselada de encaixe estanque.',
        renderMaterial: { metalness: 0.15, roughness: 0.08, color: '#0f172a', clearcoat: 1.0 }
      },
      {
        id: 'sub-solidtop-inductors',
        name: 'Quad-Array de Indutores Octogonais de Alta Densidade (4x 3.5kW)',
        category: 'HEATING_ELEMENT',
        materialGrade: 'Cobre Esmaltado Classe H (180°C)',
        weightKg: 19.0,
        dimensionsMm: [w - 100, d - 220, 110],
        isDetachable: true,
        partNumber: 'EGO-QUAD-INDUCTOR-ARRAY',
        description: 'Matriz indutiva com reconhecimento de dimensão e posição da panela em milissegundos.',
        renderMaterial: { metalness: 0.88, roughness: 0.32, color: '#d97706' }
      }
    ]
  },
  {
    id: 'elem-pot-sink',
    code: 'MONO-SINK-POTFILLER-600',
    name: 'Bancada com Cuba & Torneira Pot-Filler Retrátil',
    italianName: 'Lavello con Miscelatore Pot-Filler Estraibile',
    category: 'water',
    defaultWidthMm: 600,
    availableWidthsMm: [400, 600, 800],
    depthMm: 1000,
    heightMm: 900,
    electricKw: 0,
    gasKw: 0,
    waterInDn: 15,
    drainDn: 40,
    exhaustFlowM3h: 0,
    heatDissipationSensibleWatts: 0,
    heatDissipationLatentWatts: 0,
    description: 'Cuba estampada sem solda no tampo com misturador monocomando retrátil de 1.2m para abastecimento de woks e caldeirões.',
    monolitheBenefit: 'Elimina o transporte manual de água pesada na praça quente, reduzindo risco de acidentes e acelerando o pré-preparo.',
    manufacturer: 'KWC Professional / Angelo Po',
    manufacturerUrl: 'https://www.kwc.com/professional-foodservice',
    datasheetUrl: 'https://www.kwc.com/datasheets/pot-filler-heavy-duty.pdf',
    cadModelUrl: 'https://www.angelopo.com/bim-cad-library/monolithe-pot-sink-3dm.zip',
    defaultTopElementDetail: {
      basinCapacityLiters: 22
    },
    subComponentsTemplate: (w, d, h) => [
      {
        id: 'sub-sink-faucet',
        name: 'Misturador Pot-Filler Articulado de Parede/Tampo em Latão Cromado',
        category: 'PLUMBING_VALVE',
        materialGrade: 'Latão Cromado Pesado CW617N',
        weightKg: 4.8,
        dimensionsMm: [120, 650, 420],
        isDetachable: true,
        partNumber: 'KWC-POTFILLER-PRO-1200',
        manufacturerLink: 'https://www.kwc.com/professional-foodservice',
        description: 'Braço duplo dobrável de 360° com vazão de 25 L/min a 3 bar para enchimento ultrarrápido.',
        renderMaterial: { metalness: 0.98, roughness: 0.05, color: '#f8fafc', clearcoat: 1.0 }
      },
      {
        id: 'sub-sink-basin',
        name: 'Cuba Estampada Monobloco 400x400x250mm AISI 304',
        category: 'TOP_PLATE',
        materialGrade: 'AISI 304 2.5mm',
        weightKg: 11.2,
        dimensionsMm: [450, 450, 250],
        isDetachable: false,
        partNumber: 'APO-INTEGRATED-SINK-400',
        description: 'Totalmente integrada por soldagem robotizada e polimento sem descontinuidade mecânica.',
        renderMaterial: { metalness: 0.9, roughness: 0.18, color: '#cbd5e1' }
      },
      {
        id: 'sub-sink-drain',
        name: 'Válvula de Dreno Cesto 1 1/2" com Tubo Ladrão Inox',
        category: 'PLUMBING_VALVE',
        materialGrade: 'AISI 304 + Borracha EPDM',
        weightKg: 1.5,
        dimensionsMm: [110, 110, 180],
        isDetachable: true,
        partNumber: 'BLANCO-DRAIN-BASKET-PRO',
        description: 'Retenção de detritos sólidos de vegetais e frutos do mar com desobstrução rápida.',
        renderMaterial: { metalness: 0.92, roughness: 0.2, color: '#94a3b8' }
      }
    ]
  }
];

export function createModuleFromCatalog(item: CatalogItem, index: number, customWidth?: number): MonolitheModule {
  const widthMm = customWidth || item.defaultWidthMm;
  const widthRatio = widthMm / item.defaultWidthMm;
  const scaledElectric = item.electricKw > 0 ? Number((item.electricKw * (widthRatio >= 1.5 ? 1.5 : (widthRatio <= 0.6 ? 0.6 : 1))).toFixed(1)) : 0;
  const scaledGas = item.gasKw > 0 ? Number((item.gasKw * (widthRatio >= 1.5 ? 1.5 : (widthRatio <= 0.6 ? 0.6 : 1))).toFixed(1)) : 0;

  const subComponents = item.subComponentsTemplate
    ? item.subComponentsTemplate(widthMm, item.depthMm, item.heightMm)
    : [];

  return {
    id: `mod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    code: item.code,
    name: item.name,
    type: item.id.includes('wok')
      ? 'induction_wok'
      : item.id.includes('frytop')
      ? 'frytop_chrome'
      : item.id.includes('gas')
      ? 'open_burner'
      : item.id.includes('pasta')
      ? 'pasta_cooker'
      : item.id.includes('bain')
      ? 'bain_marie'
      : item.id.includes('refrig')
      ? 'refrigerated_drawers'
      : item.id.includes('sink')
      ? 'pot_sink'
      : 'neutral_worktop',
    widthMm,
    depthMm: item.depthMm,
    heightMm: item.heightMm,
    positionIndex: index,
    electricKw: scaledElectric,
    gasKw: scaledGas,
    waterInDn: item.waterInDn,
    drainDn: item.drainDn,
    exhaustFlowM3h: item.exhaustFlowM3h,
    heatDissipationSensibleWatts: item.heatDissipationSensibleWatts,
    heatDissipationLatentWatts: item.heatDissipationLatentWatts,
    topElementDetail: { ...item.defaultTopElementDetail },
    rationale: item.description,
    manufacturer: item.manufacturer,
    manufacturerUrl: item.manufacturerUrl,
    datasheetUrl: item.datasheetUrl,
    cadModelUrl: item.cadModelUrl,
    ifcGuid: `2M$4_r${Math.random().toString(36).substring(2, 8)}xK`,
    serialNumber: `APO-MN-${item.code.substring(0, 8)}-${Math.floor(1000 + Math.random() * 9000)}`,
    operationalStatus: 'ACTIVE',
    subComponents
  };
}
