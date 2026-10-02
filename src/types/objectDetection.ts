import { MonolitheModule, MaterialGrade } from './designModel';

export type IFCClassificationClass =
  | 'IfcKitchenEquipment'
  | 'IfcCovering'
  | 'IfcBuildingElementProxy'
  | 'IfcFlowTerminal'
  | 'IfcDistributionPort'
  | 'IfcController';

export type VUCComponentCategory =
  | 'THERMAL_INDUCTION'
  | 'THERMAL_GAS'
  | 'THERMAL_CHROME'
  | 'HYDRO_THERMAL'
  | 'REFRIGERATION'
  | 'SEAMLESS_SURFACE'
  | 'STRUCTURAL_CHASSIS'
  | 'VENTILATION_HALTON'
  | 'MEP_DISTRIBUTION'
  | 'CONTROL_INTERFACE';

export interface BoundingBox3D {
  min: [number, number, number];
  max: [number, number, number];
  center: [number, number, number];
  size: [number, number, number]; // width (x), height (y), depth (z)
}

export interface DetectedSceneObject {
  id: string;
  name: string;
  code: string;
  category: VUCComponentCategory;
  categoryLabel: string;
  ifcClass: IFCClassificationClass;
  omniClassCode: string;
  confidence: number; // e.g. 0.998 (99.8%)
  maskColor: string; // hex color for semantic mask
  maskColorRgb: [number, number, number]; // [r, g, b] 0-1
  boundingBox: BoundingBox3D;
  materialGrade: MaterialGrade | string;
  materialDescription: string;
  specs: {
    electricKw: number;
    gasKw: number;
    exhaustFlowM3h: number;
    operatingTempC?: string;
    sanitaryCompliance: string;
    dimensionsMm: string;
  };
  vucHash: string;
  parentEntityId: string; // e.g. suite id
  sourceModule?: MonolitheModule;
}
