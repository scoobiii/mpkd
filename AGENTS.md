# VUC — Sistema de Agentes Técnicos (AGENTS.md)

Este documento define os agentes especializados que compõem o ecossistema VUC (Verifiable Universal Computation), suas responsabilidades, limites de atuação e fluxos de dados, obedecendo rigorosamente à regra de que o **DesignModel é a fonte única da verdade**.

---

## 1. Topologia de Agentes

```text
                  [ Usuário / Android / Mobile ]
                               |
                               v
                     [ EvidenceAgent ]
                               |
                               v
                     [ ModelAgent ] <=== (DesignModel SSOT)
                      /     |      \
                     /      |       \
        [ ParametricAgent ] |   [ GeometryAgent ]
                    \       |       /
                     v      v      v
              [ Collision & AuditAgent ]
                     |      |      |
         +-----------+      |      +-----------+
         |                  |                  |
         v                  v                  v
  [ ViewerAgent ]   [ DeliverablesAgent ]  [ VUCEvidenceAgent ]
  (Mobile 2D/3D GPU) (STEP/DXF/IFC/3DM)    (Ed25519/Merkle Root)
```

---

## 2. Descrição dos Agentes Especializados

### 1. EvidenceAgent
- **Responsabilidade**: Captura e normalização de evidências de entrada (dimensões da sala técnica, pontos de utilidades MEP, premissas de cardápio, volume de pratos/hora).
- **Entrada**: Dados do usuário, imagens, levantamentos in-loco.
- **Saída**: Estrutura `EvidencePayload` injetada no `ModelAgent`.
- **Restrição**: Proibido gerar geometria diretamente; atua exclusivamente no nível de parâmetros e evidências.

### 2. ModelAgent (Guardião do DesignModel)
- **Responsabilidade**: Manter a integridade do `DesignModel` como única fonte da verdade.
- **Princípio**: Nenhuma entidade visual ou exportador pode adicionar ou remover dados sem passar pelo `ModelAgent`.
- **Persistência**: Gravação síncrona/automática em `localStorage` e suporte a snapshots versionados.
- **Propriedades**: Dimensões milimétricas, módulos `MonolitheModule`, componentes atômicos `SubComponentDetail`, cálculo derivado de demandas energéticas.

### 3. ParametricKernelAgent
- **Responsabilidade**: Avaliação e solução de restrições paramétricas (constraints dimensionais, distâncias mínimas de circulação DIN 18860, normas de higiene NSF/ANSI Standard 2).
- **Funções**:
  - `auditKitchenDesignCorrectness(model)`
  - Cálculo de ar de exaustão e compensação Halton Capture Jet™
  - Auditoria de barreiras térmicas entre módulos quentes (fogões/woks) e bases refrigeradas.

### 4. GeometryKernelAgent
- **Responsabilidade**: Construção algorítmica de representações BREP sólidas, tesselação e operações booleanas.
- **Saída**:
  - Tampo contínuo sem juntas soldado a laser (3mm AISI 304/316)
  - Rebaixo marine edge anti-derramamento R15
  - Desmembramento de peças em nível atômico (cúpula vitrocerâmica, resistências, queimadores de latão, manípulos).

### 5. ViewerAgent (Mobile-First GPU 2D/3D)
- **Responsabilidade**: Renderização 2D/3D no browser e Android via WebGL / Three.js.
- **Funcionalidades**:
  - Menus 100% suspensos com acionamento por toque nas bordas extremas da tela
  - Modo "Tudo é Objeto" (Object Detect & Semantic Classification)
  - Modo 4 Vistas Rhinoceros sincronizado (`_4View` / `_1View`)
  - Inspetor paramétrico flutuante com edição em tempo real
  - Estúdio fotorealista PBR com iluminação de estúdio ACES Filmic e turntable 360°.

### 6. CollisionAgent (Detector de Colisão Física em Tempo Real)
- **Responsabilidade**: Detecção de sobreposições volumétricas (AABB 3D) entre equipamentos de cocção e redes de utilidades (eletrodutos 400V, tubos de gás Schedule 40, ramais de água e drenos).
- **Apresentação**: Malha visual de alto contraste pulsante no viewer 3D e modal interativo com resolução automática.

### 7. RhinoInteropAgent
- **Responsabilidade**: Interoperabilidade bidirecional com o ecossistema Rhinoceros e Grasshopper.
- **Recursos**:
  - Linha de comandos clássica do Rhino (`_Rendered`, `_Shaded`, `_Ghosted`, `_Zebra`, `_ClippingPlane`, `_Gumball`, `_Export3DM`)
  - Canvas de nós Grasshopper interativo (`GrasshopperNodeGraphModal`) com sliders e exportação de arquivo `.ghx`.

### 8. VUCEvidenceAgent (Prova de Execução Criptográfica)
- **Responsabilidade**: Prova matemática e criptográfica da execução conforme especificação `scoobiii/vuc`.
- **Garantias**:
  - Registro de modelo (`weights_sha256`, `tensor_merkle_root`, `quantization`, `runner_env`)
  - Cadeia de passos de inferência com `parentHash`
  - Raiz de Merkle determinística de folhas SHA-256
  - Assinatura digital autêntica Ed25519 de 512 bits (detached)
  - Bateria de testes automatizados com conformidade às 5 regras fundamentais.
