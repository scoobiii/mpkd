# MPKD — VUC Kitchen Design & Render Interoperability

**MPKD** é a camada semântica e paramétrica para projetos de cozinhas profissionais, ambientes técnicos e redes **MEP/HVAC-R**, com interoperabilidade para **Rhino** e **Grasshopper**.

## Regra central

> **O modelo MPKD/DesignModel é a fonte única da verdade.**

O render, o CAD, o Rhino e o Grasshopper são **projeções do modelo — nunca fontes semânticas independentes.**

```
                    ┌──────────────────────┐
                    │   MPKD / DesignModel │
                    │   SOURCE OF TRUTH    │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ↓                ↓                ↓
           Viewer           CAD JSON        VUC Proof
           2D/3D          Determinístico    Evidence
              │                │                │
              ↓                ↓                ↓
           Render        Rhino/GH Adapter    Hash/Merkle
                              │                │
                              ↓                ↓
                         Rhino / GH        Ed25519
```

## Visão geral

O MPKD combina:

- **DesignModel tipado** para parâmetros, componentes e evidências;
- **auditoria física e paramétrica** para restrições de circulação, conflitos e utilidades;
- **catálogo de equipamentos e componentes atômicos**;
- **viewer 2D/3D WebGL** com edição paramétrica;
- **interoperabilidade CAD** com contratos JSON determinísticos;
- **adaptadores Rhino/Grasshopper**, preservando identidade e proveniência;
- **prova VUC** com hash encadeado, Merkle Root e assinatura Ed25519;
- **exportadores técnicos** para formatos CAD/BIM e arquivos de projeto.

## Arquitetura

```
MPKD
 │
 ├── DesignModel
 ├── parâmetros
 ├── componentes
 ├── geometria
 ├── restrições
 ├── utilidades
 ├── evidências
 └── proveniência
       │
       ├──→ WebGL Viewer
       ├──→ Render Engine
       ├──→ mpkd-cad/v1
       │       ├──→ Rhino
       │       └──→ Grasshopper
       ├──→ CAD/BIM exporters
       └──→ VUC evidence/proof
```

## Interoperabilidade

A direção semântica é:

```
MPKD/DesignModel
      ↓
contrato determinístico
      ↓
projeção CAD/render
      ↓
Rhino / Grasshopper / Viewer
```

### Regra de retorno

Alterações feitas em Rhino/Grasshopper **não se tornam automaticamente verdade**.

```
Rhino/GH
   ↓
diff
   ↓
CAD patch
   ↓
MPKD/DesignModel
   ↓
validation
   ↓
new canonical state
```

**Rhino edita geometria; MPKD mantém a semântica.**

## Render

O render é uma projeção do modelo:

```
DesignModel
    ↓
validated projection
    ↓
Render Scene
    ↓
Preview / Render
```

O render:

- não inventa objetos;
- não corrige o projeto;
- não esconde conflitos;
- não altera parâmetros;
- não promove `PENDING` para `VERIFIED`;
- não aprova engenharia.

> **Preview visual não é aprovação de engenharia.**

## VUC

A camada VUC fornece governança e evidência da transformação:

```
MPKD operation
      ↓
canonical input
      ↓
deterministic execution
      ↓
output
      ↓
SHA-256
      ↓
Merkle Root
      ↓
Ed25519 signature
```

A separação fundamental é:

```
MPKD        = modelo semântico e paramétrico
CAD/Rhino   = representação/interoperabilidade geométrica
Render      = projeção visual
VUC         = governança e evidência
```

## Princípios

1. **Single Source of Truth** — MPKD/DesignModel é a autoridade semântica.
2. **Determinismo** — contratos e projeções devem ser reproduzíveis.
3. **Identidade preservada** — `project_id`, `instance_id` e `catalog_id` acompanham o objeto.
4. **Proveniência** — objetos e dados devem possuir origem rastreável.
5. **Fail-closed** — ausência de evidência ou origem válida não deve produzir uma falsa aprovação.
6. **Render ≠ validação** — visualização nunca substitui validação física ou de engenharia.
7. **Interoperabilidade por contrato** — adapters não devem assumir autoridade sobre o modelo semântico.
8. **VUC como evidência** — operações verificáveis devem produzir evidência auditável.

## Estado do projeto

A base de interoperabilidade CAD/Rhino e o contrato de render estão sendo implementados incrementalmente.

O **MVP de renderização só deve ser comunicado como entregue quando os critérios funcionais e os checks definidos em `README_RENDER_MVP.md` estiverem efetivamente concluídos**.

Consulte:

- `README_RENDER_MVP.md` — critérios de aceite para Dev, DevOps e Agents;
- `schemas/mpkd-cad-v1.json` — contrato CAD, quando presente;
- `schemas/mpkd-render-v0.1.json` — contrato de render, quando presente;
- `integrations/rhino/` — adapters Rhino;
- `integrations/grasshopper/` — boundary Grasshopper.

## Regra para Agents e DevOps

Antes de alterar o sistema:

1. leia o contrato correspondente;
2. preserve a fonte única de verdade;
3. não invente geometria a partir de prompt ou imagem;
4. não trate preview como aprovação;
5. execute os testes;
6. não declare CI verde sem execução real;
7. produza os artefatos de auditoria exigidos;
8. relate explicitamente o que foi e não foi concluído.

## Licença

Consulte os arquivos de licença e as condições de distribuição do repositório antes de redistribuir o software.
