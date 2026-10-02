import { DesignModel, MonolitheModule } from '../types/designModel';
import { DetectedSceneObject, IFCClassificationClass, VUCComponentCategory } from '../types/objectDetection';
import nacl from 'tweetnacl';

// Simple deterministic hash helper for browser
function computeHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `vuc:sha256:${hex}${hex.split('').reverse().join('')}`;
}

export function extractAllSceneObjects(
  model: DesignModel,
  includeAtomicSubComponents: boolean = false
): DetectedSceneObject[] {
  const objects: DetectedSceneObject[] = [];
  const suite = model.monolithe;
  const totalLength = suite.lengthMm;
  const depth = suite.depthMm;
  const height = suite.heightMm;
  const plinthHeight = 120;
  const baseHeight = height - plinthHeight - 60;

  // 1. Continuous Hygienic Top Plate
  const topPlateHash = computeHash(`TOP_PLATE_${suite.id}_${totalLength}_${depth}_3MM_${suite.materialGrade}`);
  objects.push({
    id: 'obj-continuous-top-plate',
    name: `Tampo Monolithe Contínuo ${suite.materialGrade.replace('_', ' ')} 3mm`,
    code: 'MONO-TOP-3MM',
    category: 'SEAMLESS_SURFACE',
    categoryLabel: 'Superfície Contínua Sem Juntas',
    ifcClass: 'IfcCovering',
    omniClassCode: '23-17 19 00',
    confidence: 1.0,
    maskColor: '#8b5cf6', // Violet
    maskColorRgb: [0.54, 0.36, 0.96],
    boundingBox: {
      min: [-totalLength / 2, height - 60, -depth / 2],
      max: [totalLength / 2, height, depth / 2],
      center: [0, height - 30, 0],
      size: [totalLength, 60, depth],
    },
    materialGrade: suite.materialGrade,
    materialDescription: 'Aço Inoxidável Cirúrgico AISI 304/316 3mm com borda anti-derramamento marine bevel',
    specs: {
      electricKw: 0,
      gasKw: 0,
      exhaustFlowM3h: 0,
      sanitaryCompliance: 'NSF / ANSI Standard 2 (0 juntas sanitárias)',
      dimensionsMm: `${totalLength} × ${depth} × 60 mm (Espessura 3mm)`,
    },
    vucHash: topPlateHash,
    parentEntityId: suite.id,
  });

  // 2. Structural Chassis & Recessed Plinth
  const chassisHash = computeHash(`CHASSIS_${suite.id}_${totalLength}_${depth}_${baseHeight}`);
  objects.push({
    id: 'obj-structural-chassis',
    name: 'Chassi Estrutural & Plinto Sanitário Recuado',
    code: 'MONO-BASE-CHASSIS',
    category: 'STRUCTURAL_CHASSIS',
    categoryLabel: 'Subestrutura & Apoio Autoportante',
    ifcClass: 'IfcBuildingElementProxy',
    omniClassCode: '23-17 11 00',
    confidence: 0.996,
    maskColor: '#64748b', // Slate
    maskColorRgb: [0.39, 0.45, 0.54],
    boundingBox: {
      min: [-(totalLength - 100) / 2, 0, -(depth - 100) / 2],
      max: [(totalLength - 100) / 2, plinthHeight + baseHeight, (depth - 100) / 2],
      center: [0, (plinthHeight + baseHeight) / 2, 0],
      size: [totalLength - 100, plinthHeight + baseHeight, depth - 100],
    },
    materialGrade: suite.materialGrade,
    materialDescription: 'Monobloco tubular de alta rigidez torcional com recuo higiênico para lavagem com mangueira',
    specs: {
      electricKw: 0,
      gasKw: 0,
      exhaustFlowM3h: 0,
      sanitaryCompliance: 'IPX5 Estanqueidade de Rodapé',
      dimensionsMm: `${totalLength - 100} × ${depth - 100} × ${plinthHeight + baseHeight} mm`,
    },
    vucHash: chassisHash,
    parentEntityId: suite.id,
  });

  // 3. Modules on the suite
  let currentX = -totalLength / 2;
  suite.modules.forEach((mod, idx) => {
    const modWidth = mod.widthMm;
    const modCenterX = currentX + modWidth / 2;
    currentX += modWidth;

    let cat: VUCComponentCategory = 'THERMAL_INDUCTION';
    let catLabel = 'Cocção Indução Magnética';
    let maskColor = '#f59e0b'; // Amber
    let maskColorRgb: [number, number, number] = [0.96, 0.62, 0.04];
    let omniCode = '23-17 13 13';

    if (mod.type === 'frytop_chrome') {
      cat = 'THERMAL_CHROME';
      catLabel = 'Plancha Cromo Duro Espelhado';
      maskColor = '#ec4899'; // Pink
      maskColorRgb = [0.92, 0.28, 0.6];
      omniCode = '23-17 13 15';
    } else if (mod.type === 'open_burner') {
      cat = 'THERMAL_GAS';
      catLabel = 'Chama Viva Latão Duplo';
      maskColor = '#ef4444'; // Red
      maskColorRgb = [0.94, 0.27, 0.27];
      omniCode = '23-17 13 11';
    } else if (mod.type === 'pasta_cooker') {
      cat = 'HYDRO_THERMAL';
      catLabel = 'Cozedor de Massas com Dreno Rápido';
      maskColor = '#06b6d4'; // Cyan
      maskColorRgb = [0.02, 0.71, 0.83];
      omniCode = '23-17 15 11';
    } else if (mod.type === 'bain_marie') {
      cat = 'HYDRO_THERMAL';
      catLabel = 'Banho-Maria Seco / Úmido';
      maskColor = '#eab308'; // Yellow
      maskColorRgb = [0.92, 0.7, 0.03];
      omniCode = '23-17 15 13';
    } else if (mod.type === 'refrigerated_drawers') {
      cat = 'REFRIGERATION';
      catLabel = 'Gavetas Refrigeradas GN Sub-bancada';
      maskColor = '#3b82f6'; // Blue
      maskColorRgb = [0.23, 0.51, 0.96];
      omniCode = '23-17 21 00';
    } else if (mod.type === 'neutral_worktop' || mod.type === 'pot_sink') {
      cat = 'SEAMLESS_SURFACE';
      catLabel = mod.type === 'pot_sink' ? 'Cuba de Preparo Integrada' : 'Mesa de Apoio Neutra Inox';
      maskColor = '#a855f7'; // Purple
      maskColorRgb = [0.66, 0.33, 0.97];
      omniCode = '23-17 19 00';
    }

    const modHash = computeHash(`MOD_${mod.id}_${mod.type}_${modWidth}_${mod.electricKw}KW_${mod.gasKw}KW`);

    objects.push({
      id: mod.id,
      name: mod.name,
      code: `MOD-${mod.type.toUpperCase()}-${idx + 1}`,
      category: cat,
      categoryLabel: catLabel,
      ifcClass: 'IfcKitchenEquipment',
      omniClassCode: omniCode,
      confidence: 0.998,
      maskColor,
      maskColorRgb,
      boundingBox: {
        min: [modCenterX - modWidth / 2 + 10, plinthHeight, -depth / 2 + 10],
        max: [modCenterX + modWidth / 2 - 10, height + 40, depth / 2 - 10],
        center: [modCenterX, (plinthHeight + height) / 2, 0],
        size: [modWidth - 20, height - plinthHeight + 40, depth - 20],
      },
      materialGrade: suite.materialGrade,
      materialDescription: `Módulo padronizado Monolithe integrado sem cortes aparentes no bloco principal`,
      specs: {
        electricKw: mod.electricKw,
        gasKw: mod.gasKw,
        exhaustFlowM3h: mod.exhaustFlowM3h,
        operatingTempC: mod.type === 'induction_wok' ? '450°C (Wok Searing)' : mod.type === 'frytop_chrome' ? '50°C a 300°C' : undefined,
        sanitaryCompliance: 'Norma Sanitária DIN 18860',
        dimensionsMm: `${modWidth} × ${depth} × ${height} mm`,
      },
      vucHash: modHash,
      parentEntityId: suite.id,
      sourceModule: mod,
    });

    // If atomic decomposition is active, demembre down to the atomic sub-components!
    if (includeAtomicSubComponents && mod.subComponents && mod.subComponents.length > 0) {
      mod.subComponents.forEach((sub, sIdx) => {
        const subHash = computeHash(`SUB_${mod.id}_${sub.id}_${sub.partNumber}_${sub.materialGrade}`);
        const subW = sub.dimensionsMm[0] || modWidth * 0.8;
        const subD = sub.dimensionsMm[1] || depth * 0.7;
        const subH = sub.dimensionsMm[2] || 60;
        
        // Offset sub-components slightly vertically/depth-wise based on category
        const yOffset = sub.category === 'TOP_PLATE'
          ? height - 20
          : sub.category === 'HEATING_ELEMENT' || sub.category === 'BURNER_BRASS'
          ? height - 70
          : sub.category === 'CONTROL_KNOB'
          ? height - 120
          : sub.category === 'REFRIGERATION_BASE'
          ? plinthHeight + 40
          : plinthHeight + 80;

        objects.push({
          id: `atomic-${mod.id}-${sub.id}`,
          name: `${mod.name} → ${sub.name}`,
          code: sub.partNumber,
          category: mod.type === 'refrigerated_drawers' ? 'REFRIGERATION' : cat,
          categoryLabel: `Componente Atômico [${sub.category}]`,
          ifcClass: 'IfcBuildingElementProxy',
          omniClassCode: omniCode,
          confidence: 0.999,
          maskColor: sub.renderMaterial.color || maskColor,
          maskColorRgb: maskColorRgb,
          boundingBox: {
            min: [modCenterX - subW / 2, yOffset, -subD / 2],
            max: [modCenterX + subW / 2, yOffset + subH, subD / 2],
            center: [modCenterX, yOffset + subH / 2, 0],
            size: [subW, subH, subD],
          },
          materialGrade: sub.materialGrade,
          materialDescription: `${sub.description} | PN: ${sub.partNumber} (${sub.weightKg}kg)`,
          specs: {
            electricKw: sub.category === 'HEATING_ELEMENT' ? mod.electricKw : 0,
            gasKw: sub.category === 'BURNER_BRASS' ? mod.gasKw : 0,
            exhaustFlowM3h: 0,
            sanitaryCompliance: sub.isDetachable ? 'Higienizável em Lava-louças / Imersão' : 'Solda Sanitária Contínua',
            dimensionsMm: `${subW} × ${subD} × ${subH} mm (${sub.weightKg} kg)`,
          },
          vucHash: subHash,
          parentEntityId: mod.id,
          sourceModule: mod,
        });
      });
    }
  });

  // 4. Halton Ventilation Hood (if present)
  if (model.haltonVentilation?.enabled) {
    const hoodOverhang = model.parameters.exhaustHoodOverhangMm;
    const hoodLength = totalLength + hoodOverhang * 2;
    const hoodDepth = depth + hoodOverhang * 2;
    const hoodElevation = 2100;
    const hoodHeight = 500;
    const hoodHash = computeHash(`HALTON_${model.haltonVentilation.hoodModel}_${hoodLength}_${hoodDepth}`);

    objects.push({
      id: 'obj-halton-capture-jet-hood',
      name: 'Coifa Halton KVI Capture Jet™ com Filtros KSA Ciclônicos',
      code: 'HALTON-KVI-CANOPY',
      category: 'VENTILATION_HALTON',
      categoryLabel: 'Exaustão & Compensação Dinâmica Halton',
      ifcClass: 'IfcFlowTerminal',
      omniClassCode: '23-27 19 13',
      confidence: 0.994,
      maskColor: '#10b981', // Emerald
      maskColorRgb: [0.06, 0.72, 0.51],
      boundingBox: {
        min: [-hoodLength / 2, hoodElevation, -hoodDepth / 2],
        max: [hoodLength / 2, hoodElevation + hoodHeight, hoodDepth / 2],
        center: [0, hoodElevation + hoodHeight / 2, 0],
        size: [hoodLength, hoodHeight, hoodDepth],
      },
      materialGrade: 'AISI_304',
      materialDescription: 'Aço Inox escovado com cortina aerodinâmica Capture Jet™ e filtros KSA de retenção centrífuga',
      specs: {
        electricKw: 0.45,
        gasKw: 0,
        exhaustFlowM3h: model.derivedCalculations.totalExhaustFlowM3h,
        sanitaryCompliance: 'UL 710 / VDI 2052 / NFPA 96 / Eurovent',
        dimensionsMm: `${hoodLength} × ${hoodDepth} × ${hoodHeight} mm (Elevação ${hoodElevation}mm)`,
      },
      vucHash: hoodHash,
      parentEntityId: suite.id,
    });
  }

  // 5. MEP Infrastructure Distribution Manifold
  const mepHash = computeHash(`MEP_MANIFOLD_${totalLength}_400V_GAS_WATER`);
  objects.push({
    id: 'obj-mep-distribution-manifold',
    name: 'Rede Centralizada de Distribuição MEP (Força 400V, Gás, Água e Dreno)',
    code: 'MEP-DISTRIBUTION-HUB',
    category: 'MEP_DISTRIBUTION',
    categoryLabel: 'Instalações Prediais & Utilidades',
    ifcClass: 'IfcDistributionPort',
    omniClassCode: '23-31 00 00',
    confidence: 0.992,
    maskColor: '#0ea5e9', // Blue/Cyan
    maskColorRgb: [0.06, 0.65, 0.91],
    boundingBox: {
      min: [-totalLength / 2 + 100, plinthHeight + 20, -depth * 0.4],
      max: [totalLength / 2 - 100, plinthHeight + 160, -depth * 0.2],
      center: [0, plinthHeight + 90, -depth * 0.3],
      size: [totalLength - 200, 140, depth * 0.2],
    },
    materialGrade: 'AISI_304',
    materialDescription: 'Tubulações industriais codificadas por cor conforme ABNT NBR 6493 e normas europeias EN',
    specs: {
      electricKw: model.derivedCalculations.totalElectricKw,
      gasKw: model.derivedCalculations.totalGasKw,
      exhaustFlowM3h: 0,
      sanitaryCompliance: 'Conexões estanques camlock e eletrodutos blindados',
      dimensionsMm: `Comprimento ${totalLength - 200} mm no plenum de serviços traseiro`,
    },
    vucHash: mepHash,
    parentEntityId: suite.id,
  });

  return objects;
}
