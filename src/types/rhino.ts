export type RhinoDisplayMode =
  | 'rendered'   // PBR Studio with metallic surgical steel reflections
  | 'shaded'     // Classic Rhino Shaded with clean edges
  | 'ghosted'    // Semi-transparent 50% opacity to see internal MEP conduits
  | 'wireframe'  // NURBS / BREP structural isocurves only
  | 'technical'  // Pen-and-ink technical drafting blueprint style
  | 'arctic'     // Rhino Arctic mode with soft ambient occlusion and pure white/chalk
  | 'xray';      // Inverted depth X-Ray transparency

export type RhinoAnalysisTool =
  | 'none'
  | 'zebra'             // Zebra reflection stripe continuity (G0/G1/G2 check)
  | 'curvature'         // Gaussian / Mean curvature false-color gradient
  | 'draft_angle';      // Stamping / deep-draw draft angle evaluation

export interface RhinoClippingPlaneState {
  enabled: boolean;
  axis: 'x' | 'y' | 'z';
  positionMm: number; // offset along axis
  inverted: boolean;
}

export interface RhinoGumballState {
  enabled: boolean;
  activeTransform: 'translate_x' | 'translate_y' | 'translate_z' | 'rotate_y' | null;
  targetEntityId: string | null;
}

export interface RhinoCommandItem {
  id: string;
  command: string;
  name: string;
  description: string;
  category: 'VIEW' | 'ANALYSIS' | 'TRANSFORM' | 'EXPORT' | 'GEOMETRY';
  shortcut?: string;
}
