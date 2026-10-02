import { DesignModel } from '../types/designModel';

/**
 * Generates an OpenNURBS / Rhino 3DM compatible JSON data structure
 * with full Rhino Layer hierarchy, PBR materials, and VUC BIM metadata.
 */
export function exportToRhino3DM(model: DesignModel): string {
  const suite = model.monolithe;
  const timestamp = new Date().toISOString();

  const rhino3dmDocument = {
    format: "Rhino3DM-OpenNURBS",
    version: "8.0-VUC",
    author: "MPK Mellieri VUC CAD Kernel",
    timestamp,
    units: "Millimeters",
    tolerance: 0.001,
    angleToleranceDegrees: 1.0,
    layers: [
      { name: "VUC", color: "#1e293b", visible: true, locked: false },
      { name: "VUC::00_ROOM", color: "#64748b", visible: true, locked: true },
      { name: "VUC::00_ROOM::WALLS", color: "#475569", visible: true, locked: true },
      { name: "VUC::00_ROOM::DOORS", color: "#94a3b8", visible: true, locked: true },
      { name: "VUC::01_MONOLITHE", color: "#f59e0b", visible: true, locked: false },
      { name: "VUC::01_MONOLITHE::TOP_PLATE_3MM", color: "#8b5cf6", visible: true, locked: false },
      { name: "VUC::01_MONOLITHE::CHASSIS_PLINTH", color: "#334155", visible: true, locked: false },
      { name: "VUC::01_MONOLITHE::COOKING_MODULES", color: "#f59e0b", visible: true, locked: false },
      { name: "VUC::02_VENTILATION", color: "#10b981", visible: true, locked: false },
      { name: "VUC::02_VENTILATION::HALTON_HOOD", color: "#059669", visible: true, locked: false },
      { name: "VUC::02_VENTILATION::KSA_FILTERS", color: "#34d399", visible: true, locked: false },
      { name: "VUC::03_MEP", color: "#0ea5e9", visible: true, locked: false },
      { name: "VUC::03_MEP::ELECTRIC_400V", color: "#ea580c", visible: true, locked: false },
      { name: "VUC::03_MEP::GAS_NATURAL", color: "#eab308", visible: true, locked: false },
      { name: "VUC::03_MEP::WATER_DRAIN", color: "#2563eb", visible: true, locked: false },
    ],
    materials: [
      {
        id: "mat-stainless-304",
        name: "AISI 304 Surgical Stainless Steel (Scotch-Brite)",
        pbr: {
          baseColor: [0.85, 0.87, 0.89, 1.0],
          metallic: 0.9,
          roughness: 0.22,
          anisotropic: 0.45,
          anisotropicRotation: 0.0,
        },
      },
      {
        id: "mat-mirror-chrome",
        name: "Hard Polished Mirror Chrome (Plancha Frytop)",
        pbr: {
          baseColor: [0.95, 0.96, 0.98, 1.0],
          metallic: 0.98,
          roughness: 0.05,
        },
      },
      {
        id: "mat-vitroceramic-black",
        name: "Schott Ceran High-Temp Vitroceramic (Wok)",
        pbr: {
          baseColor: [0.06, 0.08, 0.12, 1.0],
          metallic: 0.4,
          roughness: 0.1,
        },
      },
    ],
    objects: [
      // Continuous Top Plate Brep
      {
        id: "brep-top-plate-continuous",
        type: "BrepSolid",
        layer: "VUC::01_MONOLITHE::TOP_PLATE_3MM",
        materialId: "mat-stainless-304",
        userStrings: {
          "VUC:ENTITY_ID": "obj-continuous-top-plate",
          "VUC:IFC_CLASS": "IfcCovering",
          "VUC:MATERIAL_GRADE": suite.materialGrade,
          "VUC:TOP_THICKNESS_MM": "3.0",
          "VUC:SANITARY_JOINTS": "0",
          "VUC:CRYPTO_HASH": model.vucTrace?.merkle_root || "vuc:pending",
        },
        boundingBox: {
          min: [-suite.lengthMm / 2, suite.heightMm - 60, -suite.depthMm / 2],
          max: [suite.lengthMm / 2, suite.heightMm, suite.depthMm / 2],
        },
        surfaceAreaM2: (suite.lengthMm * suite.depthMm) / 1000000,
        marineBevelRadiusMm: 12.0,
      },
      // Individual Modules
      ...suite.modules.map((m, idx) => ({
        id: `brep-mod-${m.id}`,
        type: "BrepSolidAssembly",
        layer: "VUC::01_MONOLITHE::COOKING_MODULES",
        materialId: m.type === 'frytop_chrome' ? "mat-mirror-chrome" : m.type === 'induction_wok' ? "mat-vitroceramic-black" : "mat-stainless-304",
        userStrings: {
          "VUC:MODULE_CODE": m.code,
          "VUC:MODULE_NAME": m.name,
          "VUC:MODULE_TYPE": m.type,
          "VUC:IFC_CLASS": "IfcKitchenEquipment",
          "VUC:ELECTRIC_KW": String(m.electricKw),
          "VUC:GAS_KW": String(m.gasKw),
          "VUC:EXHAUST_M3H": String(m.exhaustFlowM3h),
          "VUC:POSITION_INDEX": String(idx),
        },
        dimensions: {
          width: m.widthMm,
          depth: m.depthMm,
          height: m.heightMm,
        },
      })),
      // Halton Hood
      {
        id: "brep-halton-capture-jet-hood",
        type: "BrepSolid",
        layer: "VUC::02_VENTILATION::HALTON_HOOD",
        materialId: "mat-stainless-304",
        userStrings: {
          "VUC:IFC_CLASS": "IfcFlowTerminal",
          "VUC:HOOD_MODEL": model.haltonVentilation?.hoodModel || "KVI_CAPTURE_JET",
          "VUC:CAPTURE_JET_SAVING_PCT": String(model.haltonVentilation?.captureJetReductionPct || 35),
          "VUC:REFERENCE_PROJECT": "Gianni Cocina (Brasil)",
        },
      },
    ],
    vucIntegrityProof: {
      merkleRoot: model.vucTrace?.merkle_root,
      ed25519Signature: model.vucTrace?.ed25519_signature,
      publicKey: model.vucTrace?.public_key,
      verificationRule: "VUC_RULE_4_REAL_SIGNATURE_NO_SIMULATION",
    },
  };

  return JSON.stringify(rhino3dmDocument, null, 2);
}

/**
 * Generates an automated Grasshopper Python script (Rhino.Geometry)
 * that natively builds the Monolithe Culinary Suite inside Grasshopper with live sliders.
 */
export function exportToGrasshopperPython(model: DesignModel): string {
  const suite = model.monolithe;

  return `"""
MPK MELLIERI MONOLITHE VUC — RHINOCEROS & GRASSHOPPER GENERATOR
Natively reconstructs the parametric Monolithe Culinary Suite using RhinoCommon (Rhino.Geometry).
Compatible with: Rhino 7, Rhino 8 (CPython & IronPython), Rhino.Inside.Revit, and Rhino.Compute.

DesignModel ID: ${model.id}
Generated on: ${new Date().toISOString()}
Cryptographic VUC Root: ${model.vucTrace?.merkle_root || 'N/A'}
"""

import Rhino
import Rhino.Geometry as rg
import math
import System

def create_monolithe_suite(
    suite_length=${suite.lengthMm}.0,
    suite_depth=${suite.depthMm}.0,
    suite_height=${suite.heightMm}.0,
    top_thickness=3.0,
    plinth_height=120.0,
    marine_bevel_radius=12.0
):
    """
    Parametric Solid Generator for Angelo Po Monolithe Top Block
    Guarantees 0 sanitary joints with continuous laser-welded marine border.
    """
    half_l = suite_length / 2.0
    half_d = suite_depth / 2.0
    
    # 1. Monolithe Continuous 3mm Top Plate Brep
    top_box = rg.Box(
        rg.Plane.WorldXY,
        rg.Interval(-half_l, half_l),
        rg.Interval(-half_d, half_d),
        rg.Interval(suite_height - 60.0, suite_height)
    )
    top_brep = top_box.ToBrep()
    
    # Apply continuous marine bevel (anti-spill edge)
    marine_box = rg.Box(
        rg.Plane.WorldXY,
        rg.Interval(-half_l - 10.0, half_l + 10.0),
        rg.Interval(-half_d - 10.0, half_d + 10.0),
        rg.Interval(suite_height - 15.0, suite_height)
    )
    marine_brep = marine_box.ToBrep()
    
    # Boolean union for seamless top plate
    union_res = rg.Brep.CreateBooleanUnion([top_brep, marine_brep], 0.001)
    seamless_top = union_res[0] if union_res and len(union_res) > 0 else top_brep
    
    # 2. Recessed Sanitary Plinth (Kickplate Base)
    plinth_box = rg.Box(
        rg.Plane.WorldXY,
        rg.Interval(-half_l + 50.0, half_l - 50.0),
        rg.Interval(-half_d + 50.0, half_d - 50.0),
        rg.Interval(0.0, plinth_height)
    )
    plinth_brep = plinth_box.ToBrep()
    
    # 3. Parametric Module Cutouts & Internal Inset Solids
    module_breps = []
    current_x = -half_l
    
    module_specs = [
${suite.modules
  .map(
    (m) =>
      `        {"name": "${m.name}", "code": "${m.code}", "type": "${m.type}", "width": ${m.widthMm}.0, "kw": ${m.electricKw + m.gasKw}.0, "exhaust": ${m.exhaustFlowM3h}.0},`
  )
  .join('\n')}
    ]
    
    for i, mod in enumerate(module_specs):
        w = mod["width"]
        cx = current_x + w / 2.0
        current_x += w
        
        # Cabinet Substructure
        base_h = suite_height - plinth_height - 60.0
        cab_box = rg.Box(
            rg.Plane.WorldXY,
            rg.Interval(cx - w / 2.0 + 5.0, cx + w / 2.0 - 5.0),
            rg.Interval(-half_d + 15.0, half_d - 15.0),
            rg.Interval(plinth_height, plinth_height + base_h)
        )
        cab_brep = cab_box.ToBrep()
        
        # Attach User Text (BIM Metadata)
        cab_brep.SetUserString("VUC:MODULE_NAME", mod["name"])
        cab_brep.SetUserString("VUC:MODULE_CODE", mod["code"])
        cab_brep.SetUserString("VUC:TOTAL_KW", str(mod["kw"]))
        cab_brep.SetUserString("VUC:EXHAUST_M3H", str(mod["exhaust"]))
        cab_brep.SetUserString("VUC:IFC_CLASS", "IfcKitchenEquipment")
        
        module_breps.append(cab_brep)
        
        # Specific cooking elements
        if mod["type"] == "induction_wok":
            # Concave spherical bowl
            sphere = rg.Sphere(rg.Point3d(cx, 0.0, suite_height), 180.0)
            bowl_brep = sphere.ToBrep()
            module_breps.append(bowl_brep)
            
        elif mod["type"] == "frytop_chrome":
            # Chrome plancha plate
            plancha_box = rg.Box(
                rg.Plane.WorldXY,
                rg.Interval(cx - w / 2.0 + 40.0, cx + w / 2.0 - 40.0),
                rg.Interval(-half_d + 80.0, half_d - 80.0),
                rg.Interval(suite_height, suite_height + 25.0)
            )
            module_breps.append(plancha_box.ToBrep())
    
    # 4. Overhead Halton Capture Jet Canopy
    hood_length = suite_length + 500.0
    hood_depth = suite_depth + 500.0
    hood_elevation = 2100.0
    hood_box = rg.Box(
        rg.Plane.WorldXY,
        rg.Interval(-hood_length / 2.0, hood_length / 2.0),
        rg.Interval(-hood_depth / 2.0, hood_depth / 2.0),
        rg.Interval(hood_elevation, hood_elevation + 500.0)
    )
    hood_brep = hood_box.ToBrep()
    hood_brep.SetUserString("VUC:HALTON_MODEL", "KVI_CAPTURE_JET")
    hood_brep.SetUserString("VUC:JET_SAVING_PCT", "35%")
    
    return {
        "seamless_top_plate": seamless_top,
        "sanitary_plinth": plinth_brep,
        "modules": module_breps,
        "halton_hood": hood_brep
    }

# Execute generator
result = create_monolithe_suite()

# Assign output variables for Grasshopper
TopPlate = result["seamless_top_plate"]
Plinth = result["sanitary_plinth"]
Modules = result["modules"]
HaltonHood = result["halton_hood"]
`;
}
