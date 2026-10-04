# MPKD Render — guia para Dev e DevOps

> **Regra principal: preview visual não é aprovação de engenharia.**

## Objetivo
Este documento é a referência de aceite para o Render MPKD v0.1. Ele existe para que Dev, DevOps e Agents saibam exatamente o que implementar, testar e relatar.

Fluxo:

    MPKD Project → Render Manifest → Scene Builder → Mock Rhino/Rhino/GH → Preview → Audit + Hash

Proibido: prompt ou imagem inventar geometria; preview virar aprovação; estado não verificado virar VERIFIED.

## 1. Dez itens funcionais de aceite

| # | Critério | Aceite |
|---|---|---|
| 1 | schemas/mpkd-render-v1.json | Existe e valida o manifesto |
| 2 | Scene Builder | Cria e atualiza objetos no Mock Rhino |
| 3 | Origem | Nenhum objeto é inventado por prompt ou imagem |
| 4 | Estados visuais | Os 5 estados estão implementados |
| 5 | Materiais | 6 materiais genéricos são resolvidos |
| 6 | Perfis/câmeras | 3 perfis e 4 câmeras são persistidos |
| 7 | Auditoria | Relatório e hashes são produzidos |
| 8 | Testes | Testes Python comportamentais passam |
| 9 | Node | npm install --no-audit --no-fund && npm run lint && npm run build passa |
| 10 | CI | Contrato e performance ficam verdes |

**Documentação não conta como implementação funcional.**

Percentual obrigatório: itens concluídos / 10 × 100.

## 2. Manifesto

O arquivo canônico deste sprint é schemas/mpkd-render-v1.json.

Ele deve validar o manifesto antes do Scene Builder consumi-lo. O manifesto deve preservar projeto, versão, instance_id, catalog_id, estado de verificação, referência de geometria, material, câmera, iluminação e versão do renderer.

Manifesto inválido = falha fechada. Não tentar corrigir silenciosamente.

## 3. Scene Builder

O Scene Builder transforma somente dados do manifesto em objetos.

Objetos existentes devem ser encontrados por MPKD_INSTANCE_ID. Pode criar objeto conhecido, atualizar objeto conhecido e atualizar metadados.

Não pode inventar dimensões, geometria ou equipamento; não pode transformar prompt/imagem em autoridade; não pode apagar órfãos automaticamente; não pode alterar aprovação de engenharia.

Sem origem verificável → não criar.

## 4. Cinco estados visuais

Os cinco estados definidos pelo contrato do produto precisam ter comportamento observável e reproduzível no Mock Rhino, por exemplo por layer, aparência e metadata.

Não substituir os cinco estados por um simples verified=true/false.

## 5. Materiais

Resolver seis materiais genéricos com IDs estáveis, definição determinística e testes comportamentais.

Material genérico não é dado técnico de fabricante. Não inventar propriedades.

## 6. Perfis e câmeras

Persistir 3 perfis e 4 câmeras determinísticas. Cada câmera precisa ter identidade e parâmetros suficientes para reconstrução.

Recarregar o mesmo manifesto deve produzir a mesma configuração.

## 7. Relatório e hashes

Produzir scene.json, audit.json e hash.

O relatório deve permitir identificar projeto, versão, objetos, instance_id, catalog_id, estados, câmera, perfil e renderer.

Hash só é evidência quando o conteúdo hasheado é definido e determinístico/canônico.

## 8. Testes

Testes Python devem provar comportamento: manifesto válido/inválido, criação, atualização por instance_id, rejeição de objeto sem origem, cinco estados, seis materiais, três perfis, quatro câmeras, relatório, hash, determinismo, preservação de órfão e bloqueio de aprovação indevida.

Node deve executar exatamente:

    npm install --no-audit --no-fund
    npm run lint
    npm run build

Não usar --force ou --legacy-peer-deps para esconder problemas.

## 9. CI

Contract CI deve verificar schema, Scene Builder, testes comportamentais e audit/hash.

Performance CI deve medir preview/adapter dentro dos limites definidos. Performance smoke não é benchmark de capacidade de produção.

Teste que não executou não é verde.

## 10. Tempo de preview

O tempo precisa ser medido, nunca estimado. Relatar preview_time_ms, ambiente, manifesto, número de objetos e método de medição.

## 11. Limitações do backend

Declarar explicitamente limitações reais. Exemplos: Rhino real pode não existir no GitHub Actions; Mock Rhino não prova compatibilidade geométrica completa; Scene Builder não implica renderer fotorealista; preview não valida engenharia; catálogo não verificado não vira fato técnico; ausência de geometria conhecida impede criação.

## 12. Definição de pronto

Não comunicar MVP de renderização enquanto os critérios funcionais não estiverem concluídos e os checks obrigatórios não estiverem verdes.

Mensagem permitida antes disso:

> Base de interoperabilidade CAD/Rhino entregue: contratos e checks verdes. O motor de renderização MPKD v0.1 ainda está em implementação; o próximo sprint deve concluir o Scene Builder comportamental, manifesto validado, materiais/luzes/câmeras e artefatos auditáveis.

## 13. Relato obrigatório ao final

Todo Agent deve responder com exatamente seis blocos:

1. **Arquivos alterados** — listar todos.
2. **Critérios concluídos e não concluídos** — marcar cada um dos 10 como CONCLUÍDO ou NÃO CONCLUÍDO.
3. **Número de testes e resultado** — Python, lint, build, Contract CI e Performance CI; sem PASS sem execução real.
4. **Tempo de preview medido** — valor medido, método e ambiente.
5. **Limitações do backend** — limitações reais.
6. **Percentual** — itens concluídos / 10 × 100. Documentação não entra no numerador.

## 14. Para o Agent

Antes de alterar código: leia este README, o schema, os testes e o Scene Builder. Não invente requisitos. Não transforme prompt/imagem em autoridade. Não declare CI verde sem execução. Não declare MVP sem os 10 itens. Se faltar dado essencial, pare em NEEDS_INPUT.

## 15. Para DevOps

Proteja o contrato:

    source → schema → tests → build → CI → artifact

Falha deve permanecer visível. Não remover testes nem mascarar incompatibilidades.

### Decisão

**O objetivo não é parecer renderizado. O objetivo é provar que a cena é uma projeção determinística, rastreável e não-autorizadora do modelo MPKD.**