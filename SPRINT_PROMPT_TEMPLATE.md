# VUC — Template de Prompt de Sprint (SPRINT_PROMPT_TEMPLATE.md)

Utilize este modelo padronizado para instruir o agente técnico na execução de qualquer novo sprint ou evolução no ecossistema VUC.

---

```markdown
# [VUC-SPRINT-XXX] Título do Sprint

## 1. Contexto & Objetivo
- **Objetivo do Sprint**: [Descreva claramente o que deve ser implementado ou otimizado]
- **Dispositivo Alvo**: Mobile-First Android e Web Desktop
- **Interoperabilidade**: Compatibilidade com ecossistema Rhinoceros / Grasshopper

---

## 2. Evidências de Entrada (EvidenceAgent)
- **Evidências Físicas**: [Dimensões do espaço, fotos de campo, pontos de utilidade]
- **Requisitos Culinários / Operacionais**: [Cardápio, meta de pratos/hora, tipo de cocção]

---

## 3. Impacto no DesignModel (Fonte Única da Verdade)
- **Modificações de Parâmetros**: [Novos campos ou atualizações no schema]
- **Módulos / Componentes**: [Módulos Monolithe adicionados ou alterados]
- **Componentes Atômicos**: [Detalhamento ao nível mínimo de peças e materiais]

---

## 4. Restrições Paramétricas & Validação Física (ParametricKernelAgent)
- **Regras Dimensionais**: [Corredores mínimos, recuos, desníveis]
- **Auditoria de Conflitos**: [Detecção de colisão física com utilidades MEP]
- **Normas Sanitárias**: [Conformidade com NSF/ANSI 2, DIN 18860, UL 710]

---

## 5. Experiência Visual & Viewer (ViewerAgent)
- **Viewport**: 100% desobstruído no centro da tela
- **Menus**: 100% suspensos com acionamento por bordas extremas
- **Modo Objeto**: Detecção e classificação semântica ("Tudo é Objeto")
- **Renderização**: Modo PBR fotorealista (global e turntable por objeto)

---

## 6. Prova de Execução Criptográfica VUC (VUCEvidenceAgent)
- **Encadeamento de Trace**: parentHash[0] = prompt_hash
- **Árvore de Merkle**: Raiz computada a partir dos hashes de cada passo
- **Assinatura Ed25519**: Assinatura real de 512 bits com chave do modelo
- **Referência**: Repositório `scoobiii/vuc` (Regras 1 a 5)

---

## 7. Entregáveis Técnicos Gerados (DeliverablesAgent)
- [ ] STEP AP242 (ISO 10303-21)
- [ ] DXF AutoCAD 2D (Plantas e elevações cotadas)
- [ ] IFC 4.0 BIM
- [ ] Rhino OpenNURBS 3DM
- [ ] Grasshopper Definition (.ghx)

---

## 8. Critérios de Aceite & Testes
- [ ] Bateria de testes automatizados (`runVucTestSuite`) executando com `allPassed: true`
- [ ] Compilação TypeScript limpa (`compile_applet`) sem erros
- [ ] Linter sem violações (`lint_applet`)
- [ ] Persistência em `localStorage` verificada.
```
