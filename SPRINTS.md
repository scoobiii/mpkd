# VUC — Roadmap de Desenvolvimento em Sprints (SPRINTS.md)

Este documento registra o roadmap e o detalhamento técnico dos Sprints do VUC (Verifiable Universal Computation), orientados à arquitetura onde o **DesignModel é a fonte única da verdade**.

---

## Índice de Sprints

| Sprint | Nome / Escopo | Status | Entregáveis |
|---|---|---|---|
| **S01** | Core DesignModel & Tipos | CONCLUÍDO | `src/types/designModel.ts`, single source of truth |
| **S02** | Motor de Constraints & Auditoria Física | CONCLUÍDO | Regras de corredor, distâncias mínimas, barreiras térmicas |
| **S03** | Catálogo Monolithe & Desmembramento Atômico | CONCLUÍDO | Módulos e subcomponentes reais (`SubComponentDetail`) |
| **S04** | Prova de Execução VUC (`scoobiii/vuc`) | CONCLUÍDO | Encadeamento, Merkle Tree, Assinatura Ed25519, 5 testes |
| **S05** | Planta Baixa 2D Mobile-First | CONCLUÍDO | Editor SVG interativo com cotas paramétricas |
| **S06** | Viewer 3D GPU & Menus 100% Suspensos | CONCLUÍDO | Gatilhos de borda, viewport desobstruído, "Tudo é Objeto" |
| **S07** | Sobreposição de Colisão Física em Tempo Real | CONCLUÍDO | Malha visual de alto contraste, modal de inspeção |
| **S08** | Capacidades Rhinoceros & Grasshopper | CONCLUÍDO | Linha de comando, 4 vistas, Gumball, corte dinâmico, GH |
| **S09** | Persistência & Edição Real de Componentes | CONCLUÍDO | `localStorage`, atualização reativa do DesignModel |
| **S10** | Render Fotorealista PBR 360° por Objeto | CONCLUÍDO | Turntable, controle de metalicidade/rugosidade, PNG 4K |
| **S11** | Entregável CAD STEP (ISO 10303-21 AP242) | CONCLUÍDO | Exportador STEP com geometria e metadados de produto |
| **S12** | Entregável DXF (AutoCAD R12/2000) | CONCLUÍDO | Planta baixa técnica com camadas WALLS, MONOLITHE, MEP |
| **S13** | Entregável BIM IFC 4.0 | CONCLUÍDO | Modelo IFC com IfcKitchenEquipment e conexões |
| **S14** | Entregável Rhino OpenNURBS 3DM | CONCLUÍDO | Camadas coloridas, sólidos BREP e atributos de materiais |
| **S15** | Entregável Grasshopper Definition (.ghx) | CONCLUÍDO | Arquivo XML/GHX com nós algorítmicos executáveis |
| **S16** | Suíte de Validação & Auditoria Automatizada | CONCLUÍDO | `vuc.test.ts` com 100% de aprovação (Regras 1 a 5) |

---

## Detalhamento dos Sprints

### Sprint S01 — Fundamentos do DesignModel
- Definição do schema imutável onde evidências geram modelos, que geram parâmetros, que geram geometria.
- Tipagem estrita TypeScript para o bloco Monolithe, sala técnica, coifa Halton e utilidades MEP.

### Sprint S02 — Restrições Paramétricas & Auditoria de Ergonomia
- Verificação de corredor mínimo de 1100mm para circulação de 2 cozinheiros em praça quente.
- Verificação de barreira térmica entre gavetas refrigeradas GN e queimadores abertos a gás.

### Sprint S03 — Catálogo & Desmembramento Atômico de Componentes
- Módulos catalogados com especificações reais da Angelo Po Monolithe, Halton, Foster e KWC.
- Decomposição em componentes atômicos: chassis 2mm, tampo contínuo 3mm, cúpula vitrocerâmica Ceran ø300mm, resistências Incoloy 800, espalhadores de latão OT58, manípulos torneados R70.

### Sprint S04 — Prova de Execução Criptográfica VUC (`scoobiii/vuc`)
- Implementação estrita das regras de Verifiable Universal Computation.
- Assinatura digital autêntica Ed25519 (512-bit detached) gerada pela chave mestra do modelo.
- Construção de árvore de Merkle binária a partir dos hashes de cada passo de inferência.

### Sprint S05 — Planta Baixa Técnica 2D Mobile-First
- Renderizador 2D SVG responsivo com grid milimétrico e cotas dinâmicas.
- Detecção de portas, paredes, utilidades brutas (água, luz, gás, esgoto) e rotação do bloco culinário.

### Sprint S06 — Viewer 3D GPU & Menus 100% Suspensos
- Visualização 3D WebGL / Three.js de alto desempenho.
- Menus que se recolhem automaticamente e só aparecem ao tocar ou arrastar nas bordas extremas da tela.
- Modo "Tudo é Objeto" (Object Detect & Semantic Classification) com classificação IFC e mira HUD.

### Sprint S07 — Detecção de Colisão Física em Tempo Real
- Cálculo AABB 3D de sobreposição física entre módulos e tubulações MEP.
- Representação por malha pulsante de alto contraste vermelho e amarelo.
- Modal flutuante interativo com botões de auto-resolução paramétrica.

### Sprint S08 — Funcionalidades Rhinoceros & Grasshopper
- Suporte a modos de exibição Rhino: Rendered, Shaded, Ghosted, Wireframe, Technical, Arctic, X-Ray.
- Layout clássico de 4 vistas (Top, Front, Right, Perspective).
- Widget de manipulação Gumball e plano de corte ClippingPlane.
- Visualizador de nós algorítmicos Grasshopper com sliders e download de script `.ghx`.

### Sprint S09 — Persistência & Funcionalidade Editável Real
- Armazenamento em `localStorage` para retenção permanente de modificações do usuário.
- Edição paramétrica em tempo real diretamente conectada ao `DesignModel`.

### Sprint S10 — Estúdio de Render Fotorealista PBR 360°
- Modal dedicado de iluminação de estúdio ACES Filmic com piso de contato difuso.
- Ajuste fino de metalicidade, rugosidade e acabamentos (*AISI 304 Scotch-Brite*, *Cromo Espelhado*, *Latão*, *Ferro Fundido*).
- Captura e exportação direta em alta resolução (PNG 4K).

### Sprints S11 a S16 — Entregáveis Técnicos & Validação
- Exportação em STEP AP242, DXF 2D, IFC 4.0, Rhino 3DM e Grasshopper GHX.
- Bateria de testes automatizados com conformidade às 5 regras fundamentais da plataforma.
