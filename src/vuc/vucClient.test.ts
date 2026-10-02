import { describe, expect, it } from 'vitest';
import {
  TOKENIZER_VOCABULARY,
  lookupTokenId,
  sha256Hex,
  computeMerkleRoot,
  generateNativeVucProof,
  verifyVucTrace,
  auditKitchenDesignCorrectness,
} from './vucClient';
import { DesignModel } from '../types/designModel';

function model(overrides: Partial<DesignModel['monolithe']> = {}, modules: DesignModel['monolithe']['modules'] = []): DesignModel {
  return {
    schema_version: '1.0.0', id: 'test', name: 'test',
    chefBackstory: { inspiredBy: '', signatureDish: '', originNote: '', philosophy: '' },
    room: { widthMm: 5000, depthMm: 3000, heightMm: 3000, wallThicknessMm: 150, doors: [], windows: [], utilityRoughIns: [] },
    parameters: { aisleWidthMinMm: 1100, targetCoversPerNight: 100, operatingHoursPerDay: 8, exhaustHoodOverhangMm: 200, ventilationCompensationRatio: .8 },
    monolithe: { id: 'suite', name: 'suite', lengthMm: 3000, depthMm: 1000, heightMm: 900, topThicknessMm: 3, materialGrade: 'AISI_304', xMm: 500, yMm: 1000, rotationDeg: 0, modules, ...overrides },
    haltonVentilation: { enabled: false, hoodModel: 'KVI_CAPTURE_JET', hasMarvelDcv: false, hasCaptureRayUv: false, hasWaterWash: false, hasPolluStop: false, captureJetReductionPct: 35, marvelEnergySavingsPct: 50, referenceProject: { name:'', url:'', location:'', description:'', technologiesUsed:[] } },
    peripherals: [], derivedCalculations: { totalElectricKw: 0, totalGasKw: 0, totalExhaustFlowM3h: 0, freshAirCompensationM3h: 0, linearMetersOfContinuousTop: 0, sanitaryJointCount: 0, estimatedPlateCapacityPerHour: 0 }, clashes: [], provenance: { author:'test', createdAt:'', updatedAt:'', generatorMode:'MANUAL_PARAMETRIC' }
  };
}

describe('vucClient deterministic primitives', () => {
  it('covers vocabulary and deterministic fallback token ids', () => {
    expect(TOKENIZER_VOCABULARY.WOK).toBe(104);
    expect(lookupTokenId(' wok- ')).toBe(104);
    expect(lookupTokenId('not_in_vocab')).toBe(lookupTokenId('not_in_vocab'));
    expect(lookupTokenId('not_in_vocab')).toBeGreaterThanOrEqual(1000);
    expect(lookupTokenId('not_in_vocab')).toBeLessThanOrEqual(32000);
  });

  it('computes SHA-256 deterministically', async () => {
    expect(await sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(await sha256Hex('VORTEX')).toHaveLength(64);
  });

  it('covers empty, single and odd Merkle trees', async () => {
    expect(await computeMerkleRoot([])).toBe(await sha256Hex('EMPTY_TREE'));
    const one = await sha256Hex('one');
    expect(await computeMerkleRoot([one])).toBe(one);
    const a = await sha256Hex('a'), b = await sha256Hex('b'), c = await sha256Hex('c');
    expect(await computeMerkleRoot([a,b,c])).toHaveLength(64);
  });
});

describe('VUC proof lifecycle', () => {
  it('generates and verifies an empty trace', async () => {
    const proof = await generateNativeVucProof('empty', []);
    const result = await verifyVucTrace(proof);
    expect(result.isCryptographicallyValid).toBe(true);
    expect(result.chainIntegrity).toBe(true);
    expect(result.merkleIntegrity).toBe(true);
    expect(result.signatureValid).toBe(true);
  });

  it('generates, verifies and rejects tampering', async () => {
    const proof = await generateNativeVucProof('prompt', ['WOK', 'THAI_MEE', 'UNKNOWN']);
    expect(proof.trace_steps).toHaveLength(3);
    expect((await verifyVucTrace(proof)).isCryptographicallyValid).toBe(true);

    const chain = structuredClone(proof);
    chain.trace_steps[1].parentHash = '0'.repeat(64);
    expect((await verifyVucTrace(chain)).chainIntegrity).toBe(false);

    const step = structuredClone(proof);
    step.trace_steps[0].stepHash = '0'.repeat(64);
    expect((await verifyVucTrace(step)).isCryptographicallyValid).toBe(false);

    const merkle = structuredClone(proof);
    merkle.merkle_root = '0'.repeat(64);
    expect((await verifyVucTrace(merkle)).merkleIntegrity).toBe(false);

    const sig = structuredClone(proof);
    sig.ed25519_signature = 'zz';
    expect((await verifyVucTrace(sig)).signatureValid).toBe(false);
  });
});

describe('independent kitchen correctness audit', () => {
  it('detects aisle undersize and wall overflow', () => {
    const issues = auditKitchenDesignCorrectness(model({ lengthMm: 6000, xMm: 0, depthMm: 1000, yMm: 0 }));
    expect(issues.map(i => i.code)).toEqual(expect.arrayContaining(['AISLE_UNDERSIZE', 'WALL_OVERFLOW']));
  });

  it('detects thermal conflict only when cold and gas coexist', () => {
    const base = { id:'m', code:'m', name:'m', widthMm:1000, depthMm:1000, heightMm:900, positionIndex:0, electricKw:0, gasKw:1, exhaustFlowM3h:0, heatDissipationSensibleWatts:0, heatDissipationLatentWatts:0, topElementDetail:{}, rationale:'' };
    const gas = { ...base, type:'open_burner' as const };
    const cold = { ...base, type:'refrigerated_drawers' as const, gasKw:0 };
    expect(auditKitchenDesignCorrectness(model({}, [gas, cold])).some(i => i.code === 'HEAT_COLD_COLLISION')).toBe(true);
    expect(auditKitchenDesignCorrectness(model({}, [gas])).some(i => i.code === 'HEAT_COLD_COLLISION')).toBe(false);
  });
});
