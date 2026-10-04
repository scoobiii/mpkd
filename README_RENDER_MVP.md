# MPKD Render — guia para Dev e DevOps

> **Preview visual não é aprovação de engenharia.**

## Aceite funcional

1. Manifesto mpkd-render/v1 existe e valida.
2. Scene Builder cria e atualiza objetos idempotentemente no MockRhinoApi.
3. Prompt/imagem nunca inventa objeto ou geometria.
4. Cinco estados oficiais: VERIFIED, PENDING, PLACEHOLDER, BLOCKED, CONFLICT.
5. Seis materiais genéricos determinísticos.
6. Três perfis e quatro câmeras determinísticos.
7. Preview técnico, relatório, hashes e proveniência.
8. Testes Python comportamentais com MockRhinoApi.
9. npm install --no-audit --no-fund, npm run lint e npm run build.
10. Contract CI e Performance CI verdes.

Documentação não conta como implementação funcional.

## Limites do projeto

Este repositório não declara que o sistema:
- substitui solver HVAC-R;
- substitui cálculo luminotécnico validado;
- certifica conformidade normativa;
- transforma uma imagem em fonte de verdade técnica;
- aprova um projeto de engenharia apenas por possuir uma prova VUC válida.

## Licença e fontes de catálogo

Referências de fabricantes, materiais, modelos e especificações devem ser tratadas conforme sua fonte, licença e status de verificação. Antes de redistribuir dados proprietários, confirme as permissões aplicáveis.

## Relato obrigatório

1. arquivos alterados;
2. critérios concluídos e não concluídos;
3. número de testes e resultado;
4. tempo de preview medido;
5. limitações do backend;
6. percentual = itens concluídos / 10.

