# Contributing — app-conecta-web (ACDG)

> **Workflow completo e detalhado em WORKFLOW.md** — este arquivo e o resumo.

## Perfis de Contribuidor

| Perfil | Pessoa | Responsabilidades | Branch prefix |
|--------|--------|-------------------|---------------|
| **Dev** | Gabriel (@gabriel-aderaldo) | Server-side, seguranca, estados, domain, application, middleware, testes | `feat/`, `fix/`, `refactor/`, `test/` |
| **Designer** | Davi (@DaviFranklin) | Prototipos, UI/UX, visual, componentes, estilos, acessibilidade | `proto/`, `ui/`, `docs/` |

---

## Gitflow (Trunk-Based)

```
main (protegida — so via PR, squash merge)
  |
  ├── feat/nome-da-feature       Dev: features novas
  ├── fix/nome-do-bug            Dev: bug fixes
  ├── refactor/nome              Dev: refatoracoes
  ├── test/nome                  Dev: testes
  |
  ├── proto/nome-do-prototipo    Designer: prototipos HTML/CSS puros
  ├── ui/nome-da-melhoria        Designer: implementacao visual em hono/jsx
  |
  ├── chore/nome                 Ambos: config, docs, CI
  └── docs/nome                  Ambos: documentacao
```

### Regras

1. **NUNCA commitar direto na `main`** — sempre via Pull Request
2. **NUNCA force push** (`git push --force` nao e permitido)
3. **NUNCA criar PRs empilhadas** — toda PR tem base em `main`
4. **Testes devem passar** na CI antes de merge
5. **Max 400 linhas de diff por PR** — se maior, quebre em PRs menores
6. **Config-first** — mudancas em deno.json, Dockerfile, server.ts vao em PR separada
7. **Kodus AI** revisa automaticamente todos os PRs

---

## Jornada de uma Feature

```
proto/ → docs/ → feat/(server) → feat/(client) → ui/(visual) → fix/(polish)
```

Cada fase e uma branch/PR separada. Ver WORKFLOW.md para detalhes completos.

---

## Workflow do Designer (Davi)

### 1. Prototipo (branch proto/*)

```bash
git checkout main && git pull origin main
git checkout -b proto/redesign-home

# Copie o template e preencha:
cp prototypes/TEMPLATE.md prototypes/redesign-home.md

# Crie o prototipo HTML em prototypes/
# Rode /design-critique e /accessibility-review no Claude Code
# Corrija findings antes de commitar

git add prototypes/
git commit -m "proto: home page redesign"
git push origin proto/redesign-home
# Abrir PR
```

### 2. Spec (branch docs/*)

```bash
git checkout main && git pull origin main
git checkout -b docs/spec-home-redesign

# No Claude Code: /design-to-spec
git add .claude/skills/view-expert/references/features/
git commit -m "docs(design): spec do redesign home"
git push origin docs/spec-home-redesign
```

### 3. Implementacao Visual (branch ui/*)

```bash
git checkout main && git pull origin main  # main ja tem viewmodel + service
git checkout -b ui/home-redesign

# Modifique APENAS: src/client/views/, src/client/styles/, src/views/, static/
# Rode /design-critique e /accessibility-review antes de commitar

git add src/client/views/ src/client/styles/
git commit -m "ui(home): implement home page components"
git push origin ui/home-redesign
```

### O que voce NAO pode mexer

```
src/domain/ src/application/ src/adapters/ src/middleware/
src/routes/ src/server.ts src/types.ts
src/client/viewmodels/ src/client/services/ src/client/apps/
deno.json Dockerfile CLAUDE.md
→ Pedir ao Gabriel
```

---

## Workflow do Dev (Gabriel)

```bash
git checkout main && git pull origin main
git checkout -b feat/minha-feature

# Implementar seguindo /pipeline-maestro ou /quick-path
# deno task test — testes passando
# deno task build — bundles compilando

git push origin feat/minha-feature
# Abrir PR — Kodus AI revisa automaticamente
```

---

## Setup para Novos Contribuidores

```bash
# 1. Clone
git clone git@github.com:acdgbrasil/app-conecta-web.git
cd app-conecta-web

# 2. Configurar hooks
git config core.hooksPath .githooks

# 3. Criar sua branch
git checkout -b proto/meu-prototipo   # designer
git checkout -b feat/minha-feature    # dev

# 4. Build e rodar
deno task build
docker compose up --build

# 5. Acessar
# http://localhost:8081

# 6. Antes de push
deno task test      # testes
deno task build       # bundles
```

---

## Convencoes

### Commits (Conventional Commits)

```
feat:      nova feature
fix:       bug fix
proto:     prototipo de design (HTML/CSS puro)
ui:        implementacao visual (hono/jsx)
chore:     config, deps, CI
docs:      documentacao
refactor:  refatoracao sem mudanca de comportamento
test:      adicionar/corrigir testes
```

### CSS / Estilos

- Usar **APENAS** `hono/css` com tokens de `src/client/styles/tokens.ts`
- **NUNCA** usar Tailwind, styled-components, ou inline styles com valores hardcoded
- CSP nonce via `<Style nonce={nonce} />`

### Acessibilidade

- Contraste minimo 4.5:1 para texto (WCAG AA)
- Touch targets minimo 44px (WCAG 2.5.5)
- `aria-label` em elementos interativos
- `prefers-reduced-motion` respeitado em animacoes
- Rodar `/accessibility-review` antes de abrir PR

---

## Review

Todos os PRs sao revisados automaticamente:
- **Kodus AI** — qualidade, seguranca, performance, aderencia aos padroes
- **Design skills** — `/design-critique` e `/accessibility-review` (Davi roda antes de abrir PR)
- **Gabriel** — review manual quando necessario (nao para visual)

Findings criticos bloqueiam merge. Corrigir antes de aprovar.
