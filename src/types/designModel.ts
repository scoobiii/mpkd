export type MaterialGrade = 'AISI_304' | 'AISI_316';

export interface SubComponentDetail {
  id: string;
  name: string;
  category:
    | 'CHASSIS'
    | 'TOP_PLATE'
    | 'HEATING_ELEMENT'
    | 'CONTROL_KNOB'
    | 'REFRIGERATION_BASE'
    | 'PLUMBING_VALVE'
    | 'BURNER_BRASS'
    | 'SENSOR'
    | 'EXHAUST_BAFFLE';
  materialGrade: string;
  weightKg: number;
  dimensionsMm: [number, number, number]; // [W, D, H]
  isDetachable: boolean;
  partNumber: string;
  manufacturerLink?: string;
  description: string;
  renderMaterial: {
    metalness: number;
    roughness: number;
    color: string;
    clearcoat?: number;
    transmission?: number;
    emissive?: string;
  };
}

export interface RoomDefinition {
  widthMm: number;
  depthMm: number;
  heightMm: number;
  wallThicknessMm: number;
  doors: Array<{ id: string; x: number; y: number; width: number; wall: 'north' | 'south' | 'east' | 'west' }>;
  windows: Array<{ id: string; x: number; y: number; width: number; wall: 'north' | 'south' | 'east' | 'west' }>;
  utilityRoughIns: Array<{
    id: string;
    type: 'water_cold' | 'water_hot' | 'gas_lpg' | 'gas_nat' | 'electric_400v' | 'drain_floor' | 'exhaust_riser';
    x: number;
    y: number;
    elevationMm: number;
    capacity: string;
  }>;
}

export type MonolitheModuleType =
  | 'induction_wok'
  | 'frytop_chrome'
  | 'open_burner'
  | 'solid_top_induction'
  | 'pasta_cooker'
  | 'bain_marie'
  | 'refrigerated_drawers'
  | 'neutral_worktop'
  | 'pot_sink';

export interface MonolitheModule {
  id: string;
  code: string;
  name: string;
  type: MonolitheModuleType;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  positionIndex: number;
  electricKw: number;
  gasKw: number;
  waterInDn?: number;
  drainDn?: number;
  exhaustFlowM3h: number;
  heatDissipationSensibleWatts: number;
  heatDissipationLatentWatts: number;
  topElementDetail: {
    bowlDiameterMm?: number;
    planchaZones?: number;
    burnerCount?: number;
    basinCapacityLiters?: number;
    temperatureRange?: string;
  };
  rationale: string;
  // Real object links & manufacturer data
  manufacturer?: string;
  manufacturerUrl?: string;
  datasheetUrl?: string;
  cadModelUrl?: string;
  ifcGuid?: string;
  serialNumber?: string;
  operationalStatus?: 'ACTIVE' | 'STANDBY' | 'MAINTENANCE';
  // Atomic demembered sub-components
  subComponents?: SubComponentDetail[];
}

export interface MonolitheSuite {
  id: string;
  name: string;
  lengthMm: number;
  depthMm: number;
  heightMm: number;
  topThicknessMm: number;
  materialGrade: MaterialGrade;
  xMm: number;
  yMm: number;
  rotationDeg: number;
  modules: MonolitheModule[];
}

export interface PeripheralEquipment {
  id: string;
  name: string;
  category: 'prep' | 'refrigeration' | 'dishwashing' | 'ventilation' | 'pass';
  widthMm: number;
  depthMm: number;
  heightMm: number;
  xMm: number;
  yMm: number;
  rotationDeg: number;
  electricKw: number;
  gasKw: number;
  waterInDn?: number;
  drainDn?: number;
}

export interface ClashReport {
  id: string;
  code: 'AISLE_UNDERSIZE' | 'HEAT_COLD_COLLISION' | 'DRAIN_MISSING' | 'MEP_OUT_OF_RANGE' | 'WALL_OVERFLOW';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  entityId: string;
  message: string;
  actualValue: string;
  requiredValue: string;
}

export interface VUCEvidence {
  prompt_hash: string;
  merkle_root: string;
  ed25519_signature: string;
  public_key: string;
  trace_length: number;
  trace_steps: Array<{
    step: number;
    token: string;
    tokenId: number;
    parentHash: string;
    stepHash: string;
  }>;
  model_registration: {
    model_id: string;
    weights_sha256: string;
    tensor_merkle_root: string;
    quantization: string;
    runner_env: string;
    publicKeyHex: string;
    repository?: string;
    spec_standard?: string;
  };
  status: 'VERIFIED_VALID' | 'INVALID_CHAIN' | 'INVALID_SIGNATURE';
  validity_is_correctness_warning: string;
}

export interface HaltonVentilationConfig {
  enabled: boolean;
  hoodModel: 'KVI_CAPTURE_JET' | 'KVE_CAPTURE_JET' | 'UV_CAPTURE_RAY' | 'COLD_MIST_WOK';
  hasMarvelDcv: boolean; // Demand-Controlled Ventilation with IR sensors
  hasCaptureRayUv: boolean; // UV-C photolysis grease breakdown
  hasWaterWash: boolean; // Automatic hot water grease wash
  hasPolluStop: boolean; // Ecology filtration unit for urban discharge
  captureJetReductionPct: number; // 35% to 40% reduction in required airflow
  marvelEnergySavingsPct: number; // up to 52% fan energy savings
  referenceProject: {
    name: string;
    url: string;
    location: string;
    description: string;
    technologiesUsed: string[];
  };
}

export interface DesignModel {
  schema_version: '1.0.0';
  id: string;
  name: string;
  chefBackstory: {
    inspiredBy: string;
    signatureDish: string;
    originNote: string;
    philosophy: string;
  };
  room: RoomDefinition;
  parameters: {
    aisleWidthMinMm: number;
    targetCoversPerNight: number;
    operatingHoursPerDay: number;
    exhaustHoodOverhangMm: number;
    ventilationCompensationRatio: number;
  };
  monolithe: MonolitheSuite;
  haltonVentilation: HaltonVentilationConfig;
  peripherals: PeripheralEquipment[];
  derivedCalculations: {
    totalElectricKw: number;
    totalGasKw: number;
    totalExhaustFlowM3h: number;
    freshAirCompensationM3h: number;
    linearMetersOfContinuousTop: number;
    sanitaryJointCount: number; // For Monolithe, this is 0! (Monolithic hygienic weld)
    estimatedPlateCapacityPerHour: number;
  };
  clashes: ClashReport[];
  provenance: {
    author: string;
    createdAt: string;
    updatedAt: string;
    generatorMode: 'MANUAL_PARAMETRIC' | 'AI_VISION_SPACE' | 'AI_MENU_OPTIMIZED';
  };
  vucTrace?: VUCEvidence;
}
