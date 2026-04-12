# Prototipo: [NOME DA FEATURE]

> Preencha este arquivo junto com cada prototipo HTML.
> Ele viaja com o prototipo e garante que as intencoes do design
> sejam respeitadas na implementacao final em hono/jsx.

## Arquivo do Prototipo

- `prototypes/[nome-do-arquivo].html`

---

## O que NAO pode faltar na tela final

Liste aqui tudo que e **inegociavel**. Se a implementacao nao tiver isso,
ela esta ERRADA e deve ser corrigida antes de merge.

- [ ] (ex: botao de voltar visivel em todas as etapas do wizard)
- [ ] (ex: feedback visual ao salvar — loading spinner + mensagem de sucesso)
- [ ] (ex: campo CPF com mascara e validacao em tempo real)
- [ ] (ex: sidebar de navegacao sempre visivel em desktop)
- [ ]
- [ ]

---

## O que reprova direto se estiver errado

Criterios de usabilidade que reprovam a implementacao na review.
Se qualquer um destes falhar, a PR e REJEITADA.

### Acessibilidade (reprova direto)
- [ ] Contraste minimo 4.5:1 em todo texto (WCAG AA)
- [ ] Touch targets minimo 44px em mobile (WCAG 2.5.5)
- [ ] Navegacao por teclado funciona (Tab, Enter, Escape)
- [ ] Leitor de tela consegue entender a pagina (aria-labels)
- [ ] Focus ring visivel em todos os elementos interativos

### Responsividade (reprova direto)
- [ ] Funciona em 320px de largura (menor mobile)
- [ ] Funciona em 768px (tablet)
- [ ] Funciona em 1440px (desktop)
- [ ] Nenhum overflow horizontal em nenhuma resolucao
- [ ] Textos nao ficam cortados ou sobrepostos

### Usabilidade (reprova direto)
- [ ] Usuario sabe onde esta (breadcrumb, titulo, indicador de etapa)
- [ ] Usuario sabe o que fazer (CTAs claros, labels nos campos)
- [ ] Erros de formulario aparecem JUNTO ao campo, nao so no topo
- [ ] Loading states em toda operacao async (nunca "congelar" a tela)
- [ ] Confirmacao antes de acoes destrutivas (deletar, descartar)

---

## Tokens e cores usados

Liste as cores e espacamentos que voce usou no prototipo.
Isso ajuda o dev a mapear para os tokens de `src/client/styles/tokens.ts`.

| Uso | Valor no prototipo | Token esperado |
|-----|-------------------|----------------|
| (ex: fundo pagina) | (ex: #F5F2EB) | (ex: colors.background) |
| (ex: texto principal) | (ex: #2D3436) | (ex: colors.text) |
| (ex: botao primario) | (ex: #6B8F71) | (ex: colors.primary) |
| (ex: erro) | (ex: #D63031) | (ex: colors.error) |
| | | |

---

## Interacoes e comportamentos

Descreva como as coisas se movem, abrem, fecham.
O HTML estatico nao mostra isso — registre aqui.

| Elemento | Interacao | Detalhe |
|----------|-----------|---------|
| (ex: sidebar) | (ex: colapsa em mobile) | (ex: vira hamburger menu < 768px) |
| (ex: formulario) | (ex: salva rascunho) | (ex: salva no localStorage a cada 30s) |
| (ex: modal de erro) | (ex: fecha com Escape) | (ex: foco volta pro botao que abriu) |
| | | |

---

## Notas para o dev

Espaco livre para o designer deixar recados para quem vai implementar.

(ex: "A animacao de transicao entre etapas do wizard e importante para
a experiencia. Nao implementar sem ela — usar prefers-reduced-motion
para desabilitar se necessario.")

(ex: "O gradiente do header e sutil mas intencional. Nao trocar por
cor solida.")

---

## Checklist do designer (preencher antes de abrir PR)

- [ ] Todas as telas estao no HTML (nao falta nenhum estado)
- [ ] Estados de erro estao representados
- [ ] Estado vazio esta representado (lista sem itens, busca sem resultado)
- [ ] Loading states estao representados
- [ ] Mobile, tablet e desktop estao representados
- [ ] As cores usadas estao listadas na tabela acima
- [ ] As interacoes estao descritas na tabela acima
- [ ] O que e inegociavel esta listado acima
