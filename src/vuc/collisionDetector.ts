import { DesignModel, MonolitheModule } from '../types/designModel';

export interface BoundingAABB {
  min: [number, number, number];
  max: [number, number, number];
}

export interface CollisionEntity {
  id: string;
  name: string;
  category: 'EQUIPMENT' | 'UTILITY_CONDUIT' | 'ROOM_ROUGH_IN' | 'CLEARANCE_ZONE';
  ifcClass: string;
  boundingBox: BoundingAABB;
}

export interface PhysicalCollision {
  id: string;
  title: string;
  code: string;
  severity: 'CRITICAL' | 'WARNING';
  entityA: CollisionEntity;
  entityB: CollisionEntity;
  intersectionBox: {
    min: [number, number, number];
    max: [number, number, number];
    center: [number, number, number];
    size: [number, number, number];
  };
  penetrationDepthMm: number;
  normativeStandard: string;
  description: string;
  recommendedAction: string;
}

// AABB intersection calculation
export function checkAABBIntersection(boxA: BoundingAABB, boxB: BoundingAABB): {
  intersects: boolean;
  intersectionBox?: {
    min: [number, number, number];
    max: [number, number, number];
    center: [number, number, number];
    size: [number, number, number];
  };
  overlapDepth?: number;
} {
  const minX = Math.max(boxA.min[0], boxB.min[0]);
  const maxX = Math.min(boxA.max[0], boxB.max[0]);
  const minY = Math.max(boxA.min[1], boxB.min[1]);
  const maxY = Math.min(boxA.max[1], boxB.max[1]);
  const minZ = Math.max(boxA.min[2], boxB.min[2]);
  const maxZ = Math.min(boxA.max[2], boxB.max[2]);

  if (minX <= maxX && minY <= maxY && minZ <= maxZ) {
    const sizeX = maxX - minX;
    const sizeY = maxY - minY;
    const sizeZ = maxZ - minZ;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const depth = Math.min(sizeX, sizeY, sizeZ);

    return {
      intersects: true,
      intersectionBox: {
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ],
        center: [centerX, centerY, centerZ],
        size: [Math.max(10, sizeX), Math.max(10, sizeY), Math.max(10, sizeZ)],
      },
      overlapDepth: depth,
    };
  }

  return { intersects: false };
}

/**
 * Detects all physical overlaps between kitchen equipment, utility conduits,
 * and room infrastructure in real-time.
 */
export function detectPhysicalCollisions(
  model: DesignModel,
  mepOffsetZ: number = 0,
  elecOffsetY: number = 0
): PhysicalCollision[] {
  const collisions: PhysicalCollision[] = [];
  const suite = model.monolithe;
  const totalLength = suite.lengthMm;
  const depth = suite.depthMm;
  const height = suite.heightMm;
  const plinthHeight = 120;

  // 1. Define utility conduits in the suite's coordinate space
  // Base coordinates with user offsets for interactive simulation
  const waterZ = -depth * 0.35 + mepOffsetZ;
  const waterY = plinthHeight + 80;

  const gasZ = -depth * 0.30 + mepOffsetZ;
  const gasY = plinthHeight + 140;

  const elecZ = -depth * 0.25 + mepOffsetZ;
  const elecY = plinthHeight + 40 + elecOffsetY;

  const elecConduitEntity: CollisionEntity = {
    id: 'util-elec-conduit-400v',
    name: 'Eletroduto Blindado Trifásico 400V 63A',
    category: 'UTILITY_CONDUIT',
    ifcClass: 'IfcDistributionPort',
    boundingBox: {
      min: [-totalLength / 2 + 50, elecY - 15, elecZ - 15],
      max: [totalLength / 2 - 50, elecY + 15, elecZ + 15],
    },
  };

  const gasPipeEntity: CollisionEntity = {
    id: 'util-gas-manifold-pipe',
    name: 'Tubulação Manifold de Gás Natural DN25',
    category: 'UTILITY_CONDUIT',
    ifcClass: 'IfcDistributionPort',
    boundingBox: {
      min: [-totalLength / 2 + 100, gasY - 18, gasZ - 18],
      max: [totalLength / 2 - 100, gasY + 18, gasZ + 18],
    },
  };

  const waterPipeEntity: CollisionEntity = {
    id: 'util-water-supply-pipe',
    name: 'Rede Hidráulica de Alimentação DN20',
    category: 'UTILITY_CONDUIT',
    ifcClass: 'IfcDistributionPort',
    boundingBox: {
      min: [-totalLength / 2 + 100, waterY - 15, waterZ - 15],
      max: [totalLength / 2 - 100, waterY + 15, waterZ + 15],
    },
  };

  // 2. Check Gas Clearance Envelope (DIN 18860 / NFPA 96 / ABNT NBR 14518)
  // Combustible gas line requires minimum 150mm separation from high-voltage conduit
  // If distance < 150mm, the clearance envelope intersects the conduit
  const gasClearanceEnvelope: BoundingAABB = {
    min: [gasPipeEntity.boundingBox.min[0], gasY - 120, gasZ - 120],
    max: [gasPipeEntity.boundingBox.max[0], gasY + 120, gasZ + 120],
  };

  const gasClearanceRes = checkAABBIntersection(elecConduitEntity.boundingBox, gasClearanceEnvelope);
  if (gasClearanceRes.intersects && gasClearanceRes.intersectionBox) {
    const distY = Math.abs(gasY - elecY);
    const distZ = Math.abs(gasZ - elecZ);
    const actualDist = Math.round(Math.sqrt(distY * distY + distZ * distZ));
    const penetration = 150 - actualDist;

    if (penetration > 0) {
      collisions.push({
        id: 'clash-elec-gas-clearance',
        title: 'Interferência Crítica: Elétrica 400V × Gás Natural',
        code: 'MEP_ELEC_GAS_PROXIMITY_OVERLAP',
        severity: 'CRITICAL',
        entityA: elecConduitEntity,
        entityB: gasPipeEntity,
        intersectionBox: {
          min: [
            Math.max(elecConduitEntity.boundingBox.min[0], gasPipeEntity.boundingBox.min[0]),
            Math.min(elecY, gasY) - 10,
            Math.min(elecZ, gasZ) - 10,
          ],
          max: [
            Math.min(elecConduitEntity.boundingBox.max[0], gasPipeEntity.boundingBox.max[0]),
            Math.max(elecY, gasY) + 10,
            Math.max(elecZ, gasZ) + 10,
          ],
          center: [
            0,
            (elecY + gasY) / 2,
            (elecZ + gasZ) / 2,
          ],
          size: [
            totalLength * 0.85,
            Math.max(40, Math.abs(gasY - elecY) + 20),
            Math.max(40, Math.abs(gasZ - elecZ) + 20),
          ],
        },
        penetrationDepthMm: penetration,
        normativeStandard: 'ABNT NBR 14518 / NFPA 96 / DIN 18860 (Afastamento mínimo de 150mm)',
        description: `Eletroduto 400V está a apenas ${actualDist}mm do manifold de gás natural no plenum traseiro. O envelope de segurança regulamentar de 150mm está sendo violado em ${penetration}mm.`,
        recommendedAction: 'Afastar o leito elétrico verticalmente em +150mm ou adicionar barreira corta-fogo certificada EI-120.',
      });
    }
  }

  // 3. Check Module Equipment Intersections with Utilities
  let currentX = -totalLength / 2;
  suite.modules.forEach((mod) => {
    const modWidth = mod.widthMm;
    const modCenterX = currentX + modWidth / 2;
    currentX += modWidth;

    // A. Pasta Cooker / Bain-Marie Drain & Water Siphon
    if (mod.type === 'pasta_cooker' || mod.type === 'bain_marie') {
      // Deep basin and drainage drop tube
      const drainDropBox: BoundingAABB = {
        min: [modCenterX - 40, plinthHeight, waterZ - 30],
        max: [modCenterX + 40, height - 100, waterZ + 30],
      };

      // Check if drainage drop intersects the electrical conduit path
      const drainElecOverlap = checkAABBIntersection(drainDropBox, elecConduitEntity.boundingBox);
      if (drainElecOverlap.intersects && drainElecOverlap.intersectionBox) {
        collisions.push({
          id: `clash-drain-elec-${mod.id}`,
          title: `Conflito Físico: Dreno Hidráulico (${mod.name}) × Conduíte 400V`,
          code: 'WATER_DRAIN_ELEC_COLLISION',
          severity: 'CRITICAL',
          entityA: {
            id: mod.id,
            name: `${mod.name} (Tubo de Descarga DN40)`,
            category: 'EQUIPMENT',
            ifcClass: 'IfcKitchenEquipment',
            boundingBox: drainDropBox,
          },
          entityB: elecConduitEntity,
          intersectionBox: drainElecOverlap.intersectionBox,
          penetrationDepthMm: Math.round(drainElecOverlap.overlapDepth || 25),
          normativeStandard: 'Norma Sanitária DIN 18860 / NBR 5410 (Segregação Hidroelétrica)',
          description: `Descarga de água quente/dreno do ${mod.name} cruza fisicamente o trajeto do eletroduto trifásico no plenum interno.`,
          recommendedAction: 'Desviar sifão de drenagem em 45° ou rebaixar leito elétrico.',
        });
      }
    }

    // B. Induction Wok Generator Box vs Gas Pipe Clearance
    if (mod.type === 'induction_wok') {
      const wokGenBox: BoundingAABB = {
        min: [modCenterX - 180, height - 420, -depth / 2 + 40],
        max: [modCenterX + 180, height - 50, depth / 2 - 40],
      };

      // Check if generator box penetrates rear plenum occupied by gas manifold
      const wokGasOverlap = checkAABBIntersection(wokGenBox, gasPipeEntity.boundingBox);
      if (wokGasOverlap.intersects && wokGasOverlap.intersectionBox) {
        collisions.push({
          id: `clash-wok-gas-${mod.id}`,
          title: `Interseção de Chassi: Gerador Wok Indução × Tubo de Gás`,
          code: 'EQUIPMENT_CHASSIS_GAS_OVERLAP',
          severity: 'CRITICAL',
          entityA: {
            id: mod.id,
            name: `${mod.name} (Carcaça do Inversor 8kW)`,
            category: 'EQUIPMENT',
            ifcClass: 'IfcKitchenEquipment',
            boundingBox: wokGenBox,
          },
          entityB: gasPipeEntity,
          intersectionBox: wokGasOverlap.intersectionBox,
          penetrationDepthMm: Math.round(wokGasOverlap.overlapDepth || 18),
          normativeStandard: 'VDE 0700 / NFPA 54 / NBR 13103',
          description: `Carcaça traseira do inversor de frequência do ${mod.name} invade a cota de passagem do manifold de gás.`,
          recommendedAction: 'Avançar gerador ou instalar manifold em calha rebaixada de serviço.',
        });
      }
    }
  });

  // 4. Room Utility Rough-Ins Penetration into Suite Base
  // Convert room rough-in coordinates into local suite coordinates
  const suiteX = model.monolithe.xMm;
  const suiteY = model.monolithe.yMm;

  model.room.utilityRoughIns.forEach((roughIn) => {
    // Relative coordinates to suite center
    const localX = roughIn.x - (suiteX + totalLength / 2);
    const localZ = roughIn.y - (suiteY + depth / 2);

    // If rough-in is within suite footprint
    if (
      localX >= -totalLength / 2 - 50 &&
      localX <= totalLength / 2 + 50 &&
      localZ >= -depth / 2 - 50 &&
      localZ <= depth / 2 + 50
    ) {
      const roughInBox: BoundingAABB = {
        min: [localX - 35, 0, localZ - 35],
        max: [localX + 35, roughIn.elevationMm, localZ + 35],
      };

      // Plinth kickplate wall boundary
      const kickplateFrontZ = depth / 2 - 50;
      const kickplateRearZ = -depth / 2 + 50;

      // Check collision with kickplate wall
      if (
        (Math.abs(localZ - kickplateFrontZ) < 40 || Math.abs(localZ - kickplateRearZ) < 40) &&
        roughIn.elevationMm > 40
      ) {
        collisions.push({
          id: `clash-roughin-plinth-${roughIn.id}`,
          title: `Penetração Não-Estanque: Espera de ${roughIn.type.toUpperCase()} × Plinto`,
          code: 'ROUGH_IN_PLINTH_PENETRATION',
          severity: 'WARNING',
          entityA: {
            id: `roughin-${roughIn.id}`,
            name: `Espera Predial ${roughIn.type} (${roughIn.capacity})`,
            category: 'ROOM_ROUGH_IN',
            ifcClass: 'IfcDistributionPort',
            boundingBox: roughInBox,
          },
          entityB: {
            id: 'obj-structural-chassis',
            name: 'Plinto Sanitário Recuado AISI 304',
            category: 'EQUIPMENT',
            ifcClass: 'IfcBuildingElementProxy',
            boundingBox: {
              min: [-totalLength / 2, 0, kickplateRearZ - 10],
              max: [totalLength / 2, plinthHeight, kickplateRearZ + 10],
            },
          },
          intersectionBox: {
            min: [localX - 30, 0, kickplateRearZ - 15],
            max: [localX + 30, Math.min(plinthHeight, roughIn.elevationMm), kickplateRearZ + 15],
            center: [localX, Math.min(plinthHeight, roughIn.elevationMm) / 2, kickplateRearZ],
            size: [60, Math.min(plinthHeight, roughIn.elevationMm), 30],
          },
          penetrationDepthMm: 30,
          normativeStandard: 'Estanqueidade Sanitária IPX5 (DIN 18860-2)',
          description: `Ponto de alimentação predial (${roughIn.type}) atinge o rodapé/plinto sem colar de vedação estanque.`,
          recommendedAction: 'Instalar passa-muro sanitário com junta de vedação EPDM lavável.',
        });
      }
    }
  });

  return collisions;
}
