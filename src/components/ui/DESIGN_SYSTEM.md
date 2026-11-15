# Design System JVX SPEAK 2.0 — Fundação (Fase 1)

## Tokens Semânticos (`src/index.css`)

| Token CSS | Valor | Uso |
|---|---|---|
| `--jvx-bg` | `#07182E` | Background principal (modo escuro) |
| `--jvx-surface-card` | `#102A46` | Superfície padrão de cartões e painéis |
| `--jvx-surface-elevated` | `#16375B` | Painéis em destaque / elevação |
| `--jvx-gold` | `#D4AF37` | Ações principais, foco e destaque institucional |
| `--jvx-text-primary` | `#F4F6FA` | Texto principal |
| `--jvx-text-secondary` | `#9FB3C8` | Subtítulos e metadados |
| `--jvx-success` | `#22C9A4` | Progresso, acertos e domínio |
| `--jvx-info` | `#3B82F6` | Informações e navegação |

## Tipografia
- **Títulos:** `Montserrat` via classe utilitária `.jvx-heading` ou variável `--jvx-font-heading`.
- **Corpo e formulários:** `Inter` via `--jvx-font-sans`.

## Componentes Base (`@/components/ui`)
- `PageContainer`: container responsivo (`320px`–`1440px+`) com `min-w-0` e `.jvx-safe-bottom`.
- `PageHeader`: cabeçalho com `eyebrow`, `title` (`.jvx-heading`), `subtitle`, `icon` e `actions`.
- `ContentCard`: variantes `default`, `elevated`, `highlight`, `subtle`.
- `PrimaryButton` / `SecondaryButton`: botões acessíveis com `min-h-[44px]` no padrão `md`.
- `StatusBadge`: selo semântico que sempre combina ícone + texto (`success`, `info`, `gold`, `warning`, `danger`, `neutral`).
- `ProgressIndicator`: barra com `role="progressbar"` e valores `aria-*`.

## Exemplo de Uso
```tsx
import {
  PageContainer,
  PageHeader,
  ContentCard,
  PrimaryButton,
  StatusBadge,
  ProgressIndicator,
} from '@/components/ui';

<PageContainer>
  <PageHeader
    eyebrow="CEFR A1"
    title="Primeiro contato profissional"
    actions={<StatusBadge tone="success" label="Em andamento" />}
  />
  <ContentCard variant="highlight">
    <ProgressIndicator value={65} label="Domínio da unidade" tone="success" />
    <PrimaryButton fullWidth>Continuar</PrimaryButton>
  </ContentCard>
</PageContainer>
```
