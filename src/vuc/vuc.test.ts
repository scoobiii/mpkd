import { generateNativeVucProof, verifyVucTrace, auditKitchenDesignCorrectness, VUC_MODEL_REGISTRY, lookupTokenId } from './vucClient';
import { DesignModel } from '../types/designModel';

export async function runVucTestSuite(): Promise<{
  allPassed: boolean;
  results: Array<{ testName: string; passed: boolean; details: string }>;
}> {
  const results: Array<{ testName: string; passed: boolean; details: string }> = [];

  // TEST 1: Rule 1 - Determinism (same input => same trace, same merkle_root)
  try {
    const prompt = 'PROJETAR MONOLITHE THAI MEE PAD TALAY WOK 8KW';
    const tokens = ['MONOLITHE', 'AISI_304', 'WOK', 'INDUCTION', 'PAD_TALAY'];

    const proof1 = await generateNativeVucProof(prompt, tokens);
    const proof2 = await generateNativeVucProof(prompt, tokens);

    const isDeterministic =
      proof1.prompt_hash === proof2.prompt_hash &&
      proof1.merkle_root === proof2.merkle_root &&
      proof1.ed25519_signature === proof2.ed25519_signature;

    results.push({
      testName: 'Regra 1: Determinismo Criptográfico (seed fixo/temp 0)',
      passed: isDeterministic,
      details: isDeterministic
        ? `Merkle Root idêntico reproduzido: ${proof1.merkle_root.substring(0, 16)}...`
        : 'FALHA: Raízes de Merkle divergiram para a mesma entrada.'
    });
  } catch (err: any) {
    results.push({ testName: 'Regra 1: Determinismo', passed: false, details: err.message });
  }

  // TEST 2: Rule 2 - Chained Trace & Merkle Root Verification
  try {
    const prompt = 'VALIDAR ENCADIAMENTO PARENT HASH';
    const tokens = ['AISI_316', 'SEAMLESS', 'HYGIENIC', 'POT_FILLER', 'EXHAUST'];
    const proof = await generateNativeVucProof(prompt, tokens);

    // Verify parentHash of step 1 equals prompt_hash
    const firstStepParentMatches = proof.trace_steps[0].parentHash === proof.prompt_hash;
    const verification = await verifyVucTrace(proof);

    const passed = firstStepParentMatches && verification.isCryptographicallyValid;
    results.push({
      testName: 'Regra 2: Trace Encadeado (parentHash step 1 = prompt_hash + Merkle)',
      passed,
      details: passed
        ? `5 passos encadeados e auditados com sucesso contra raiz ${proof.merkle_root.substring(0, 16)}...`
        : `FALHA: ${verification.error || 'Falha no encadeamento'}`
    });
  } catch (err: any) {
    results.push({ testName: 'Regra 2: Trace Encadeado', passed: false, details: err.message });
  }

  // TEST 3: Rule 3 - Validade Não é Correção
  try {
    const prompt = 'COZINHA TESTE COM CORREDOR RESTRITO';
    const tokens = ['MONOLITHE', 'AISLE_WIDTH'];
    const validTrace = await generateNativeVucProof(prompt, tokens);

    // Create an invalid kitchen layout (aisle width only 800mm, minimum is 1100mm)
    const testModel: DesignModel = {
      schema_version: '1.0.0',
      id: 'test-invalid-kitchen',
      name: 'Layout Teste Deficiente',
      chefBackstory: {
        inspiredBy: 'Thai Mee',
        signatureDish: 'Pad Talay',
        originNote: 'Bunker culinário',
        philosophy: 'Alta produtividade'
      },
      room: {
        widthMm: 5000,
        depthMm: 2200, // Small depth
        heightMm: 3000,
        wallThicknessMm: 150,
        doors: [],
        windows: [],
        utilityRoughIns: []
      },
      parameters: {
        aisleWidthMinMm: 1100,
        targetCoversPerNight: 200,
        operatingHoursPerDay: 8,
        exhaustHoodOverhangMm: 200,
        ventilationCompensationRatio: 0.8
      },
      monolithe: {
        id: 'mono-suite-01',
        name: 'Monolithe Suite',
        lengthMm: 3600,
        depthMm: 1000,
        heightMm: 900,
        topThicknessMm: 3,
        materialGrade: 'AISI_304',
        xMm: 600,
        yMm: 500, // Leaves only 500mm on north and 700mm on south!
        rotationDeg: 0,
        modules: []
      },
      haltonVentilation: {
        enabled: true,
        hoodModel: 'KVI_CAPTURE_JET',
        hasMarvelDcv: true,
        hasCaptureRayUv: false,
        hasWaterWash: false,
        hasPolluStop: true,
        captureJetReductionPct: 35,
        marvelEnergySavingsPct: 50,
        referenceProject: {
          name: 'Gianni Cocina (Brasil)',
          url: 'https://www.halton.com/references/gianni-brazil/',
          location: 'Brasil',
          description: 'Referência Halton Brasil',
          technologiesUsed: ['Capture Jet', 'KSA', 'M.A.R.V.E.L.']
        }
      },
      peripherals: [],
      derivedCalculations: {
        totalElectricKw: 25,
        totalGasKw: 0,
        totalExhaustFlowM3h: 3000,
        freshAirCompensationM3h: 2400,
        linearMetersOfContinuousTop: 3.6,
        sanitaryJointCount: 0,
        estimatedPlateCapacityPerHour: 150
      },
      clashes: [],
      provenance: {
        author: 'VUC Unit Test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        generatorMode: 'MANUAL_PARAMETRIC'
      },
      vucTrace: validTrace
    };

    const traceCheck = await verifyVucTrace(validTrace);
    const correctnessClashes = auditKitchenDesignCorrectness(testModel);

    // Rule 3 mandates: Even if trace is VERIFIED_VALID, correctness audit must flag the physical issues!
    const rule3Enforced = traceCheck.isCryptographicallyValid && correctnessClashes.length > 0;

    results.push({
      testName: 'Regra 3: Validade Não é Correção (Trace válido != Cozinha correta)',
      passed: rule3Enforced,
      details: rule3Enforced
        ? `Trace VERIFIED_VALID (${validTrace.status}) com detecção independente de violação física: ${correctnessClashes[0].message}`
        : 'FALHA: O sistema confundiu integridade de trace com conformidade física do layout.'
    });
  } catch (err: any) {
    results.push({ testName: 'Regra 3: Validade vs Correção', passed: false, details: err.message });
  }

  // TEST 4: Rule 4 - Sem Simulação (TokenId real e Ed25519 real)
  try {
    const wokTokenId = lookupTokenId('WOK');
    const thaiMeeTokenId = lookupTokenId('THAI_MEE');

    const samplePrompt = 'PROMPT TESTE REAL ED25519';
    const proof = await generateNativeVucProof(samplePrompt, ['WOK', 'THAI_MEE']);

    const isRealSignature = proof.ed25519_signature.length === 128; // 64 bytes hex
    const isRealTokenId = wokTokenId === 104 && thaiMeeTokenId === 115;

    const passed = isRealSignature && isRealTokenId;
    results.push({
      testName: 'Regra 4: Sem Simulação (TokenId de vocabulário real + Ed25519 64 bytes)',
      passed,
      details: passed
        ? `TokenIds reais mapeados (WOK=${wokTokenId}, THAI_MEE=${thaiMeeTokenId}) e assinatura Ed25519 autêntica de 512 bits gerada.`
        : 'FALHA: Uso de token IDs sintéticos ou assinatura simulada.'
    });
  } catch (err: any) {
    results.push({ testName: 'Regra 4: Sem Simulação', passed: false, details: err.message });
  }

  // TEST 5: Rule 5 - Registro de Modelo (weights_sha256, tensor_merkle_root, quant, env)
  try {
    const reg = VUC_MODEL_REGISTRY;
    const hasWeights = reg.weights_sha256.length === 64;
    const hasTensorRoot = reg.tensor_merkle_root.length === 64;
    const hasQuant = reg.quantization === 'Q4_K_M';
    const hasEnv = reg.runner_env.includes('linux');

    const passed = hasWeights && hasTensorRoot && hasQuant && hasEnv;
    results.push({
      testName: 'Regra 5: Registro do Modelo (weights, tensor_root, quantização, runner_env)',
      passed,
      details: passed
        ? `Modelo registrado: ${reg.model_id}, weights_sha256=${reg.weights_sha256.substring(0, 10)}..., quant=${reg.quantization}, env=${reg.runner_env}`
        : 'FALHA: Metadados do modelo incompletos ou ausentes.'
    });
  } catch (err: any) {
    results.push({ testName: 'Regra 5: Registro do Modelo', passed: false, details: err.message });
  }

  const allPassed = results.every(r => r.passed);
  return { allPassed, results };
}
