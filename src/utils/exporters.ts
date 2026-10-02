import { DesignModel } from '../types/designModel';

/**
 * Generate STEP (ISO 10303-21) CAD data
 */
export function exportToSTEP(model: DesignModel): string {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const suite = model.monolithe;

  return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('MPK Monolithe Parametric Culinary Suite', 'Angelo Po Standard Seamless Top'), '2;1');
FILE_NAME('MPK_MONOLITHE_${model.id.substring(0, 8)}.stp', '${timestamp}', ('MPK Mellieri Engineering Team'), ('MPK Mellieri Professional Kitchens'), 'VUC CAD Kernel v1.0', 'Rhino / SolidWorks Certified', '');
FILE_SCHEMA(('CONFIG_CONTROL_DESIGN'));
ENDSEC;

DATA;
#1 = CARTESIAN_POINT('', (0., 0., 0.));
#2 = DIRECTION('', (0., 0., 1.));
#3 = DIRECTION('', (1., 0., 0.));
#4 = AXIS2_PLACEMENT_3D('', #1, #2, #3);
#5 = LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI., .METRE.);
#6 = UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(0.001), #5, 'DISTANCE_ACCURACY_VALUE', 'Maximum model tolerance');
#10 = PRODUCT_DEFINITION_FORMATION('1.0', 'First production release', #20);
#20 = PRODUCT('MPK_MONOLITHE_${suite.id}', 'Angelo Po Monolithe Top Block', 'AISI 304 Seamless Laser Welded', (#30));
#30 = PRODUCT_CONTEXT('', #40, 'mechanical');
#40 = APPLICATION_CONTEXT('mechanical design');

/* Monolithe Outer Bounding Geometry */
#100 = CARTESIAN_POINT('ORIGIN', (${suite.xMm}., ${suite.yMm}., 0.));
#101 = CARTESIAN_POINT('CORNER_OPPOSITE', (${suite.xMm + suite.lengthMm}., ${suite.yMm + suite.depthMm}., ${suite.heightMm}.));
#102 = PRODUCT_DEFINITION_SHAPE('Top Plate 3mm Solid', 'Monolithic Seamless Surface', #10);

/* Modules Definition */
${suite.modules
  .map(
    (m, idx) => `/* Module ${idx + 1}: ${m.name} (${m.code}) */
#${200 + idx * 10} = PRODUCT('${m.code}', '${m.name}', 'Type: ${m.type} | kW: ${m.electricKw + m.gasKw}', (#30));
#${201 + idx * 10} = CARTESIAN_POINT('POS_${idx}', (${suite.xMm + idx * m.widthMm}., ${suite.yMm}., 900.));`
  )
  .join('\n')}

ENDSEC;
END-ISO-10303-21;
`;
}

/**
 * Generate DXF (AutoCAD R12/2000) 2D Technical Drawing
 */
export function exportToDXF(model: DesignModel): string {
  const suite = model.monolithe;
  const room = model.room;

  let dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1009
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
6
0
LAYER
2
0
70
0
62
7
6
CONTINUOUS
0
LAYER
2
WALLS
70
0
62
7
6
CONTINUOUS
0
LAYER
2
MONOLITHE_TOP
70
0
62
1
6
CONTINUOUS
0
LAYER
2
MODULES
70
0
62
4
6
CONTINUOUS
0
LAYER
2
MEP_UTILITIES
70
0
62
2
6
DASHED
0
LAYER
2
DIMENSIONS
70
0
62
3
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  // Draw room boundary (WALLS layer)
  dxf += `0
POLYLINE
8
WALLS
66
1
70
1
0
VERTEX
8
WALLS
10
0.0
20
0.0
30
0.0
0
VERTEX
8
WALLS
10
${room.widthMm}
20
0.0
30
0.0
0
VERTEX
8
WALLS
10
${room.widthMm}
20
${room.depthMm}
30
0.0
0
VERTEX
8
WALLS
10
0.0
20
${room.depthMm}
30
0.0
0
SEQEND
`;

  // Draw Monolithe Continuous Top (MONOLITHE_TOP layer)
  const mx = suite.xMm;
  const my = suite.yMm;
  const mw = suite.lengthMm;
  const md = suite.depthMm;

  dxf += `0
POLYLINE
8
MONOLITHE_TOP
66
1
70
1
0
VERTEX
8
MONOLITHE_TOP
10
${mx}
20
${my}
30
0.0
0
VERTEX
8
MONOLITHE_TOP
10
${mx + mw}
20
${my}
30
0.0
0
VERTEX
8
MONOLITHE_TOP
10
${mx + mw}
20
${my + md}
30
0.0
0
VERTEX
8
MONOLITHE_TOP
10
${mx}
20
${my + md}
30
0.0
0
SEQEND
`;

  // Draw module subdivisions
  let currentX = mx;
  suite.modules.forEach(m => {
    dxf += `0
LINE
8
MODULES
10
${currentX}
20
${my}
30
0.0
11
${currentX}
21
${my + md}
31
0.0
0
TEXT
8
MODULES
10
${currentX + 50}
20
${my + md / 2}
30
0.0
40
80.0
1
${m.name}
`;
    currentX += m.widthMm;
  });

  dxf += `0
ENDSEC
0
EOF
`;

  return dxf;
}

/**
 * Generate IFC (Industry Foundation Classes 4) BIM export
 */
export function exportToIFC(model: DesignModel): string {
  const timestamp = new Date().toISOString();
  return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView_V2.0]', 'ExchangeRequirement [Architecture, MEP, Commercial Kitchen]'), '2;1');
FILE_NAME('MPK_MONOLITHE_BIM_${model.id.substring(0, 8)}.ifc', '${timestamp}', ('MPK Mellieri Professional Kitchens'), ('Angelo Po Monolithe Spec'), 'MPK VUC Studio', 'Rhino Grasshopper BIM Adapter', '');
FILE_SCHEMA(('IFC4'));
ENDSEC;

DATA;
#1 = IFCPROJECT('39KxXk7Z56Bv$WJ5E5Yq2F', #2, 'MPK Commercial Culinary Facility', 'Project configured for Thai Mee high-volume production', $, $, $, (#10), #20);
#2 = IFCOWNERHISTORY(#3, #4, $, .ADDED., $, $, $, ${Math.floor(Date.now() / 1000)});
#3 = IFCPERSON($, 'MPK Engineer', 'Mellieri', $, $, $, $, $);
#4 = IFCORGANIZATION($, 'MPK Mellieri Professional Kitchens', 'Bespoke Culinary Engineering', $, $);
#10 = IFCGEOMETRICREPRESENTATIONCONTEXT($, 'Model', 3, 1.E-05, #11, #12);
#11 = IFCAXIS2PLACEMENT3D(#13, $, $);
#12 = IFCDIRECTION((0., 1., 0.));
#13 = IFCCARTESIANPOINT((0., 0., 0.));
#20 = IFCUNITASSIGNMENT((#21, #22, #23));
#21 = IFCSIUNIT(*, .LENGTHUNIT., .MILLI., .METRE.);
#22 = IFCSIUNIT(*, .AREAUNIT., $, .SQUARE_METRE.);
#23 = IFCSIUNIT(*, .VOLUMEUNIT., $, .CUBIC_METRE.);

/* Monolithe Spatial Element */
#100 = IFCSITE('2O2Fr$t4X7Zf8NOew3FL9r', #2, 'Restaurant Culinary Site', 'Culinary Hub', $, #101, $, $, .ELEMENT., (0,0,0), (0,0,0), 0., $, $);
#101 = IFCLOCALPLACEMENT($, #11);
#200 = IFCCOMMERCIALAPPLIANCE('1nL0hR8W15Uv$gK4U1Zp1A', #2, 'Angelo Po Monolithe Top Block', 'Seamless continuous cooking block AISI 304', $, #201, $, $, .COOKINGRANGE.);
#201 = IFCLOCALPLACEMENT(#101, #202);
#202 = IFCAXIS2PLACEMENT3D(#203, $, $);
#203 = IFCCARTESIANPOINT((${model.monolithe.xMm}., ${model.monolithe.yMm}., 0.));

/* Modules in Assembly */
${model.monolithe.modules
  .map(
    (m, i) => `#${300 + i} = IFCCOMMERCIALAPPLIANCE('${(i + 10).toString(36).padEnd(22, 'x')}', #2, '${m.name}', '${m.code}', $, $, $, $, .COOKINGRANGE.);
#${400 + i} = IFCPROPERTYSET('${(i + 50).toString(36).padEnd(22, 'y')}', #2, 'Pset_KitchenAppliance${i}', $, (
  IFCPROPERTYSINGLEVALUE('ElectricLoadKw', 'Electric load in kW', IFCELECTRICCURRENTMEASURE(${m.electricKw}.), $),
  IFCPROPERTYSINGLEVALUE('GasLoadKw', 'Gas load in kW', IFCPRESIDENTMEASURE(${m.gasKw}.), $),
  IFCPROPERTYSINGLEVALUE('ExhaustFlowM3h', 'Extraction flow requirement', IFCVOLUMETRICFLOWRATEMEASURE(${m.exhaustFlowM3h}.), $)
));`
  )
  .join('\n')}

ENDSEC;
END-ISO-10303-21;
`;
}

/**
 * Generate Grasshopper / Rhino JSON Definition
 */
export function exportToGrasshopperJson(model: DesignModel): string {
  const ghData = {
    generator: "MPK Mellieri VUC Studio",
    schema: "rhino-grasshopper-vuc-v1.0",
    designModelId: model.id,
    units: "millimeters",
    tolerance: 0.001,
    monolitheSuite: {
      id: model.monolithe.id,
      dimensions: {
        length: model.monolithe.lengthMm,
        depth: model.monolithe.depthMm,
        height: model.monolithe.heightMm,
        topThickness: model.monolithe.topThicknessMm,
      },
      placement: {
        x: model.monolithe.xMm,
        y: model.monolithe.yMm,
        z: 0,
        rotationDeg: model.monolithe.rotationDeg,
      },
      material: {
        grade: model.monolithe.materialGrade,
        finish: "Scotch-Brite Brushed Directional",
        hygienicJointCount: 0,
      },
      modules: model.monolithe.modules.map((m, idx) => ({
        index: idx,
        name: m.name,
        code: m.code,
        type: m.type,
        width: m.widthMm,
        depth: m.depthMm,
        height: m.heightMm,
        offsetStartX: idx * m.widthMm,
        loads: {
          electricKw: m.electricKw,
          gasKw: m.gasKw,
          exhaustFlowM3h: m.exhaustFlowM3h,
          waterInDn: m.waterInDn || 0,
          drainDn: m.drainDn || 0,
        },
        geometryParameters: m.topElementDetail
      })),
    },
    room: {
      width: model.room.widthMm,
      depth: model.room.depthMm,
      height: model.room.heightMm,
      utilityPoints: model.room.utilityRoughIns
    },
    haltonVentilation: {
      enabled: model.haltonVentilation.enabled,
      hoodModel: model.haltonVentilation.hoodModel,
      captureJetReductionPct: model.haltonVentilation.captureJetReductionPct,
      hasMarvelDcv: model.haltonVentilation.hasMarvelDcv,
      hasCaptureRayUv: model.haltonVentilation.hasCaptureRayUv,
      referenceProject: model.haltonVentilation.referenceProject,
      effectiveExhaustFlowM3h: model.haltonVentilation.enabled
        ? Math.round(model.derivedCalculations.totalExhaustFlowM3h * (1 - model.haltonVentilation.captureJetReductionPct / 100))
        : model.derivedCalculations.totalExhaustFlowM3h,
    },
    vucEvidence: model.vucTrace ? {
      merkleRoot: model.vucTrace.merkle_root,
      promptHash: model.vucTrace.prompt_hash,
      signatureEd25519: model.vucTrace.ed25519_signature,
      publicKey: model.vucTrace.public_key,
      status: model.vucTrace.status,
    } : null
  };

  return JSON.stringify(ghData, null, 2);
}

/**
 * Trigger browser file download
 */
export function triggerFileDownload(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
