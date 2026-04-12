# Workflow — Trunk-Based Development + AI Agents

> Regras de git, branches, PRs e commits para humanos e agentes AI.
> Este documento e **enforced automaticamente** por hooks do Claude Code e git hooks.

---

## Modelo: Trunk-Based Development

```
main (protegida, sempre deployavel)
  ├── feat/admin-guard        ← vive horas, nao semanas
  ├── fix/cpf-validation      ← merge no mesmo dia
  ├── ui/melhorar-dashboard   ← escopo restrito a views/styles
  └── proto/redesign-home     ← prototipos HTML/CSS isolados (Davi)
```

### Principios

1. **main e sempre verde** — todo commit em main passa CI + testes
2. **Branches vivem horas, nao semanas** — se uma feature leva 5 dias, sao 5 PRs
3. **PRs sao pequenas e atomicas** — max 400 linhas de diff, 1 responsabilidade
4. **Config changes merge PRIMEIRO** — antes do codigo que depende delas
5. **Squash merge** — cada PR vira 1 commit limpo em main
6. **Rebase antes de push** — `git pull --rebase origin main` antes de abrir PR
7. **Zero regressao** — testes + type check + build DEVEM passar antes de qualquer merge

---

## Regras de Branch

### Naming

```
feat/<descricao-curta>      Dev (Gabriel): features novas
fix/<descricao-curta>       Dev (Gabriel): bug fixes
refactor/<descricao-curta>  Dev (Gabriel): refatoracao
test/<descricao-curta>      Dev (Gabriel): testes
ui/<descricao-curta>        Designer (Davi): implementacao visual em hono/jsx
proto/<descricao-curta>     Designer (Davi): prototipos HTML/CSS puros
chore/<descricao-curta>     Ambos: config, CI, deps
docs/<descricao-curta>      Ambos: documentacao
```

### Lifetime

| Tipo | Max Lifetime | Se exceder |
|------|-------------|------------|
| fix/ | 1 dia | Algo esta errado, quebre em partes |
| feat/ | 2 dias | Quebre em sub-features |
| ui/ | 2 dias | Quebre em componentes |
| proto/ | 1 semana | Prototipos podem ser maiores, mas nao eternos |
| refactor/ | 1 dia | Quebre em etapas |

### Proibido

- Commits direto em `main` (bloqueado por hook)
- `git push --force` (bloqueado por hook)
- `git reset --hard` (bloqueado por hook)
- Branches empilhadas (stacked PRs manuais) — cada PR tem base em `main`

---

## Jornada de uma Feature (do zero ao deploy)

Uma feature passa por fases claras. Cada fase e uma branch/PR separada.
Ninguem pula fases. Ninguem mistura fases no mesmo commit.

```
┌─────────────────────────────────────────────────────────────────┐
│                    JORNADA DE UMA FEATURE                       │
│                                                                 │
│  FASE 1: PROTOTIPO (Davi)                                       │
│  Branch: proto/nome-da-feature                                  │
│  Onde: prototypes/nome-da-feature.html                          │
│  O que: HTML/CSS puro, layout visual, explorar ideias           │
│  Merge: PR para main (Gabriel aprova o visual)                  │
│                         │                                       │
│                         ▼                                       │
│  FASE 2: SPEC (Davi + Claude Code)                              │
│  Branch: docs/spec-nome-da-feature                              │
│  Onde: .claude/skills/view-expert/references/features/          │
│  O que: Rodar /design-to-spec → gerar spec de producao          │
│  Merge: PR para main (Gabriel aprova a spec)                    │
│                         │                                       │
│                         ▼                                       │
│  FASE 3: IMPLEMENTACAO SERVER (Gabriel + Claude Code)           │
│  Branch: feat/nome-server-side                                  │
│  Onde: src/routes/, src/views/, src/middleware/, src/adapters/   │
│  O que: Rotas SSR, API proxy, middleware, config                │
│  Merge: PR para main (Kodus AI + Gabriel review)                │
│                         │                                       │
│                         ▼                                       │
│  FASE 4: IMPLEMENTACAO CLIENT (Gabriel + Claude Code)           │
│  Branch: feat/nome-client                                       │
│  Onde: src/client/viewmodels/, src/client/services/             │
│  O que: ViewModel (reducer), Service (fetch), entry.tsx         │
│  Pipeline: /pipeline-maestro para cross-layer features          │
│  Merge: PR para main (Kodus AI + Gabriel review)                │
│                         │                                       │
│                         ▼                                       │
│  FASE 5: IMPLEMENTACAO VISUAL (Davi + Claude Code)              │
│  Branch: ui/nome-da-feature                                     │
│  Onde: src/client/views/pages/, src/client/views/components/    │
│  O que: Traduzir o prototipo HTML em hono/jsx/dom               │
│        Usar tokens de src/client/styles/tokens.ts               │
│        Seguir a spec gerada na Fase 2                           │
│  Merge: PR para main (Gabriel review obrigatorio)               │
│                         │                                       │
│                         ▼                                       │
│  FASE 6: POLISH + QA (Ambos)                                    │
│  Branch: fix/ajustes-nome                                       │
│  O que: Bug fixes, ajustes visuais, a11y, responsividade        │
│  Merge: PR para main                                            │
│                         │                                       │
│                         ▼                                       │
│                    ✅ FEATURE COMPLETA                           │
└─────────────────────────────────────────────────────────────────┘
```

### Exemplo Real: Admin Hub

```
proto/admin-hub-layout        Davi cria prototipo HTML do painel admin
docs/spec-admin-hub           Davi roda /design-to-spec com Claude Code
chore/admin-hub-config        Gabriel: adiciona admin-hub ao deno.json build
feat/admin-guard              Gabriel: middleware de RBAC + audit store
feat/admin-api-routes         Gabriel: rotas proxy /api/admin/*
feat/admin-viewmodel          Gabriel: reducer + types + service client
ui/admin-hub-views            Davi: implementa os componentes em hono/jsx
fix/admin-hub-polish          Ambos: ajustes finais
```

**8 PRs pequenas** em vez de 1 PR gigante de 9000 linhas.

---

## Guia do Designer (Davi)

### Quem e voce no projeto

- **Nome**: Davi Franklin (@DaviFranklin no GitHub)
- **Perfil**: Designer UI/UX usando Claude Code (claude.ai, nao CLI)
- **Foco**: Prototipos HTML/CSS, specs visuais, implementacao de views em hono/jsx

### Suas branches

| Tipo | Quando usar | Exemplo |
|------|-------------|---------|
| `proto/*` | Criar prototipos HTML/CSS puros | `proto/redesign-home` |
| `docs/*` | Specs de design, documentacao visual | `docs/spec-sage-garden` |
| `ui/*` | Implementar views em hono/jsx/dom | `ui/sage-garden-registration` |

### Seu diretorio para prototipos

```
prototypes/
  home-redesign-v1.html          ← prototipo HTML completo
  registration-wizard-v2.html    ← pode ser grande (1000+ linhas), e OK
  admin-hub-layout.html          ← explorar antes de implementar
```

**NUNCA** colocar prototipos na raiz do projeto. Sempre em `prototypes/`.

### O que voce PODE mexer

```
prototypes/            ✅  Prototipos HTML/CSS puros (branch proto/*)
src/client/views/      ✅  Pages e Components em hono/jsx/dom (branch ui/*)
src/client/styles/     ✅  Tokens e estilos em hono/css (branch ui/*)
src/views/             ✅  SSR layouts e pages em hono/jsx (branch ui/*)
static/                ✅  Imagens, fontes, assets (branch ui/* ou proto/*)
```

### O que voce NAO pode mexer

```
src/domain/            ❌  Pedir ao Gabriel
src/application/       ❌  Pedir ao Gabriel
src/adapters/          ❌  Pedir ao Gabriel
src/middleware/         ❌  Pedir ao Gabriel
src/routes/            ❌  Pedir ao Gabriel
src/server.ts          ❌  Pedir ao Gabriel
src/types.ts           ❌  Pedir ao Gabriel
src/client/viewmodels/ ❌  Pedir ao Gabriel (reducer, state, actions)
src/client/services/   ❌  Pedir ao Gabriel (fetch, API calls)
src/client/apps/       ❌  Pedir ao Gabriel (entry points)
deno.json              ❌  Pedir ao Gabriel
Dockerfile             ❌  Pedir ao Gabriel
CLAUDE.md              ❌  Pedir ao Gabriel
```

O pre-commit hook bloqueia automaticamente se voce tentar commitar fora do escopo numa branch `ui/*`.

### Workflow do Davi — Passo a Passo

#### Fase 1: Prototipo (branch proto/*)

```bash
git checkout main
git pull origin main
git checkout -b proto/redesign-home

# 1. Copie o template de intencoes:
cp prototypes/TEMPLATE.md prototypes/redesign-home.md

# 2. Preencha o TEMPLATE.md com:
#    - O que NAO pode faltar na tela final
#    - O que reprova direto (a11y, responsividade, usabilidade)
#    - Tokens/cores usados
#    - Interacoes e comportamentos
#    - Notas para o dev

# 3. Crie seu prototipo HTML:
#    Pode ser um HTML gigante com CSS inline — sem limites de tamanho

# 4. ANTES de commitar — rode as reviews automaticas no Claude Code:
#    /design-critique     → feedback de usabilidade, hierarquia, consistencia
#    /accessibility-review → audit WCAG 2.1 AA (contraste, touch targets, teclado)
#
#    Corrija os findings ANTES de abrir PR.
#    Se tiver findings criticos, NAO abra PR — corrija primeiro.

# 5. Commit AMBOS os arquivos:
git add prototypes/redesign-home.html prototypes/redesign-home.md
git commit -m "proto: home page redesign v2 with sage garden theme"
git push origin proto/redesign-home

# Abra PR no GitHub — Kodus AI revisa automaticamente
```

**IMPORTANTE**: todo prototipo DEVE ter:
1. Seu `.md` de intencoes preenchido (TEMPLATE.md)
2. Ter passado por `/design-critique` (feedback de design)
3. Ter passado por `/accessibility-review` (audit WCAG)

PR sem o template preenchido ou com findings criticos sera rejeitada.
O template garante que as intencoes do designer viajam junto com
o prototipo ate a implementacao final.

#### Fase 2: Spec (branch docs/*)

Rode o `/design-to-spec` no Claude Code apontando para seu prototipo:

```
/design-to-spec
> Quero especificar a home page baseada no prototipo em prototypes/home-redesign-v2.html
```

O Claude Code vai gerar specs em:
```
.claude/skills/view-expert/references/features/<nome>/
  01-feature-spec.md
  02-components.md
  03-states-and-flows.md
  04-copy-a11y-responsive.md
  README.md
```

```bash
git checkout main
git pull origin main
git checkout -b docs/spec-home-redesign

git add .claude/skills/view-expert/references/features/home-redesign/
git commit -m "docs(design): spec do redesign home page"
git push origin docs/spec-home-redesign
# Abrir PR — Gabriel aprova a spec
```

#### Fase 3: Implementacao Visual (branch ui/*)

Depois que Gabriel implementou o server-side e o viewmodel:

```bash
git checkout main
git pull origin main           # IMPORTANTE: main ja tem viewmodel + service
git checkout -b ui/home-redesign

# Use Claude Code para implementar baseado na spec:
# "Implementar os componentes da home page seguindo a spec em
#  .claude/skills/view-expert/references/features/home-redesign/"

# Modifique APENAS:
#   src/client/views/pages/
#   src/client/views/components/
#   src/client/styles/

# ANTES de commitar — rode as reviews automaticas:
#   /design-critique       → feedback visual da implementacao
#   /accessibility-review  → audit WCAG na implementacao
#   /design-handoff        → gerar spec sheet de handoff (opcional)

# Verifique que os criterios do TEMPLATE.md do prototipo foram atendidos:
#   - Tudo que era "inegociavel" esta implementado?
#   - Nenhum criterio de reprovacao esta falhando?

git add src/client/views/ src/client/styles/
git commit -m "ui(home): implement home page components with sage garden theme"
git push origin ui/home-redesign
# Abrir PR — Kodus AI + review automatico
```

**Na review da PR de ui/***: verificar contra o `prototypes/<feature>.md`:
- Tudo que estava em "NAO pode faltar" esta presente?
- Nenhum criterio de "reprova direto" esta falhando?
- Tokens usados batem com os do prototipo?

### Erros Comuns do Davi (e como evitar)

| Erro | Problema | Solucao |
|------|----------|---------|
| Prototipo HTML na raiz (`prototype-home.html`) | Polui o projeto, confunde build | Usar `prototypes/` |
| Modificar `src/client/viewmodels/` | Escopo de dev, pode quebrar estado | Pedir ao Gabriel |
| Commitar `static/js/*.js` (bundles) | Bundles sao gerados pelo build | `deno task build` e CI que gera |
| Commit gigante (33 arquivos) | Impossivel revisar | Separar proto/ vs ui/ vs docs/ |
| Misturar spec + implementacao | 2 fases no mesmo commit | Branch separada para cada fase |
| Branch sem pull de main | Conflitos com codigo novo do Gabriel | `git pull origin main` SEMPRE antes |

---

## Regras de Commit

### Tamanho

| Metrica | Limite | Acao |
|---------|--------|------|
| Arquivos por commit | max 10 | Quebre em commits menores |
| Linhas de diff por PR | max 400 | Quebre em PRs menores |
| Camadas por commit | max 1 | Separe domain, app, infra, client |

**Excecao**: branches `proto/*` nao tem limite de linhas (prototipos HTML sao grandes por natureza).

### Atomicidade

Cada commit faz **uma unica coisa** que pode ser descrita em uma frase:

```
feat(kernel): add CPF branded type with validation
feat(registry): add RegisterPatient use case
feat(admin): add admin guard middleware
fix(auth): handle expired PKCE verifier cleanup
proto: home page redesign with sage garden theme
ui(home): implement hero section component
docs(design): spec do redesign sage garden
```

**Teste de atomicidade**: se voce precisa de "e" na mensagem do commit, ele e grande demais.

### Conventional Commits

```
feat:      nova feature
fix:       bug fix
chore:     config, deps, CI
docs:      documentacao
refactor:  refatoracao sem mudanca de comportamento
test:      adicionar/corrigir testes
proto:     prototipo de design (HTML/CSS puro)
ui:        implementacao visual (hono/jsx)
```

---

## Seguranca e Anti-Regressao

### Gate Obrigatorio (TODA PR, sem excecao)

Antes de qualquer merge para main, TODOS os gates devem passar:

```
1. deno check src/**/*.ts src/**/*.tsx    ← type check
2. deno lint                               ← linting
3. deno test tests/                        ← TODOS os testes
4. deno task build                         ← bundles compilam
```

**Se qualquer gate falhar, o merge e BLOQUEADO.** Sem excecoes, sem "depois eu arrumo".

**Excecao**: branches `proto/*` so precisam que o prototipo nao quebre o build (nao toca `src/`).

### Pre-Push Hook (automatico)

O hook `.githooks/pre-push` roda automaticamente:
- Bloqueia push direto para main/master
- Roda `deno test tests/` antes de permitir push
- Se testes falham, push e bloqueado

**IMPORTANTE**: hooks locais sao conveniencia. A CI e a garantia real.

### Regras de Nao-Regressao

| Regra | Enforcement | Quem |
|-------|------------|------|
| Type check deve passar | pre-push hook + CI | Automatico |
| Zero testes falhando | pre-push hook + CI | Automatico |
| Build deve compilar | CI | Automatico |
| Nenhum secret commitado (.env) | pre-commit hook | Automatico |
| Nenhum commit direto em main | pre-commit hook + branch protection | Automatico |
| Review obrigatorio | GitHub branch protection | Kodus AI + humano |
| Cobertura nao pode cair | CI coverage gate | Automatico |

### Regra de Ouro

> **Se os testes passavam antes do seu commit e nao passam depois, o problema e SEU commit.**
> Nao commite. Nao faca push. Corrija primeiro.

### O que fazer quando testes quebram

1. `deno test tests/` — identificar quais testes falharam
2. Ler o teste que falhou — entender o que ele espera
3. Verificar se o teste esta correto (talvez o teste precise atualizar)
4. Corrigir o codigo OU o teste — nunca deletar teste para "resolver"
5. Rodar TODOS os testes novamente — garantir zero regressao
6. So entao fazer commit

### Nunca

- **Nunca deletar um teste para fazer o build passar**
- **Nunca usar `--no-verify` para pular hooks**
- **Nunca mergear com testes falhando** ("depois eu arrumo")
- **Nunca fazer force push para esconder historico**

---

## Config-First Rule

Arquivos compartilhados que toda feature toca:

```
deno.json          — build tasks, imports
Dockerfile         — build de producao
docker-compose.yml — dev environment
src/server.ts      — entrypoint, middleware chain
src/types.ts       — AppState types
CLAUDE.md          — regras de arquitetura
```

**Regra**: se uma feature precisa alterar qualquer arquivo acima, essa alteracao vai em um **PR separado que merge ANTES** do codigo da feature.

```
# Exemplo: preciso adicionar auth-hub ao build

PR 1: chore: add auth-hub to deno.json build task    ← merge primeiro
PR 2: feat(auth-hub): implement server-side routing   ← base em main atualizada
PR 3: feat(auth-hub): implement client viewmodel      ← base em main atualizada
```

---

## Workflow para AI Agents (Claude Code)

### Isolamento por Worktree

Cada tarefa do Claude Code roda em um **git worktree isolado** quando possivel:

```bash
# Claude cria automaticamente:
git worktree add ../wt-feat-admin-guard -b feat/admin-guard
# Trabalha isolado, sem conflito com o repo principal
# Ao terminar, limpa o worktree
```

Quando usando agents via `Agent` tool, usar `isolation: "worktree"`.

### Escopo Restrito por Tarefa

O Claude DEVE seguir estas regras ao receber uma tarefa:

1. **Listar arquivos que serao tocados ANTES de comecar**
2. **Se > 10 arquivos ou > 2 camadas** → quebrar em sub-tarefas
3. **Nunca modificar arquivos compartilhados** (deno.json, server.ts, etc.) junto com codigo de feature — PR separado
4. **1 branch = 1 responsabilidade** — nunca misturar concerns

### Checklist Pre-Commit (Claude DEVE verificar)

- [ ] `deno check src/**/*.ts src/**/*.tsx` passa
- [ ] `deno test tests/` passa (zero regressoes)
- [ ] `deno task build` compila
- [ ] Diff tem <= 400 linhas
- [ ] Commit toca apenas 1 camada
- [ ] Nenhum arquivo .env ou secret incluido

### Quando o Claude Deve PARAR e Perguntar

- Vai tocar > 10 arquivos numa unica tarefa
- Vai alterar arquivo compartilhado (server.ts, deno.json, etc.)
- Testes estao falhando e nao sabe por que
- Feature precisa de stacked PRs (discutir decomposicao)
- Mudanca pode quebrar outra feature existente

---

## Prototipos (proto/*)

Branches para **prototipos de design** em HTML/CSS puro. Regras especiais:

### Escopo Permitido

```
prototypes/          — UNICO diretorio permitido
```

Prototipos sao arquivos HTML standalone (um HTML gigante com CSS inline/embedded).
Servem para explorar visualmente ANTES de implementar em hono/jsx.

### Regras

1. **Tudo dentro de `prototypes/`** — nunca na raiz, nunca em `src/`
2. **Nenhum impacto no build** — prototipos NAO entram no bundle
3. **Nenhum impacto nos testes** — prototipos NAO quebram nada
4. **Pre-commit hook NAO bloqueia** tamanho de arquivo para `proto/*`
5. **Naming**: `prototypes/<feature>-<variante>.html`
6. **Sem limites de linhas** — prototipos podem ser grandes, e o ponto
7. **Merge para main e OK** — ficam como referencia visual para implementacao

---

## Anti-Patterns (PROIBIDO)

| Anti-Pattern | Por que e ruim | O que fazer |
|-------------|----------------|-------------|
| Commit gigante (50+ arquivos) | Impossivel de revisar, merge hell | Quebrar em commits atomicos |
| Stacked PRs manuais | Cascata de conflitos, single point of failure | Cada PR com base em main |
| Branch de longa vida (> 3 dias) | Drift de main, conflitos acumulados | Merge parcial com feature flag |
| Misturar config + feature | Conflito em todo PR paralelo | Config-first rule |
| Tocar todas as camadas num commit | Viola separation of concerns | 1 commit = 1 camada |
| Revert + re-commit | Polui historico, confunde reviewers | Interactive rebase para limpar |
| Commit "temp stash" ou "WIP" | Codigo incompleto no historico | Use `git stash`, nao commits |
| Deletar teste para build passar | Esconde bugs, regressao futura | Corrigir codigo ou atualizar teste |
| Mergear com teste falhando | Regressao em main | NUNCA — corrija primeiro |
| --no-verify em push | Pula safety checks | NUNCA — corrija o que falhou |
| Prototipo HTML na raiz do projeto | Polui repo, confunde build | Usar `prototypes/` |
| Commitar bundles JS gerados | Lixo no diff, conflitos | Bundles sao gerados pelo CI/build |

---

## Feature Flags (para features multi-PR)

Quando uma feature precisa de 3+ PRs para ficar completa, use feature flags:

```typescript
// src/shared/feature_flags.ts
const FEATURES = {
  ADMIN_HUB: false,       // owner: gabriel, expira: 2026-05-01
  NEW_REGISTRATION: false, // owner: gabriel, expira: 2026-05-15
} as const satisfies Record<string, boolean>;

export const isEnabled = (flag: keyof typeof FEATURES): boolean => FEATURES[flag];
```

**Regras de flag**:
- Cada flag tem owner e data de expiracao (comentario)
- Max 30 dias de vida para release flags
- AI pode mergear codigo parcial atras da flag
- Quando feature esta completa: remover a flag (nao deixar acumulando)
