# Design System -- Hudson LP Portal

Design philosophy: Dieter Rams. Less, but better. Every element earns its place.

## Typography

- **Primary**: Inter (400, 500, 600) -- body text, headings, labels
- **Numeric**: JetBrains Mono (400, 500) -- all financial values, chart axes, timestamps, code
- Loaded via `next/font/google`, tree-shaken to specified weights only

### Scale

| Token | Size | Usage |
|-------|------|-------|
| text-[24px] | 24px | Page headings (h1) |
| text-[17px] | 17px | Section headings (h2), nav items |
| text-[15px] | 15px | Body text, table cells, chat messages |
| text-[13px] | 13px | Labels, secondary info, buttons |
| text-[12px] | 12px | Timestamps, file sizes, captions |
| text-[11px] | 11px | Mobile nav labels |

### KPI Value Sizes

- **Personal KPIs**: 28px (font-mono, font-medium)
- **Fund overview KPIs**: 22px (font-mono, font-medium)

## Color System

CSS custom properties with light/dark mode via `prefers-color-scheme`.

### Core Tokens

| Token | Light | Dark |
|-------|-------|------|
| --background | #fafafa | #18181b |
| --surface | #ffffff | #27272a |
| --surface-raised | #f4f4f5 | #3f3f46 |
| --border | #e4e4e7 | #52525b |
| --border-subtle | #f4f4f5 | #27272a |
| --text-primary | #18181b | #fafafa |
| --text-secondary | #52525b | #d4d4d8 |
| --text-muted | #a1a1aa | #71717a |

### Accent & Semantic

| Token | Light | Dark |
|-------|-------|------|
| --accent | var(--fund-accent, #3b82f6) | same |
| --accent-subtle | var(--fund-accent-subtle, #eff6ff) | rgba(59,130,246,0.15) |
| --positive | #16a34a | #22c55e |
| --negative | #dc2626 | #ef4444 |
| --warning | #d97706 | #f59e0b |
| --error-bg | #fef2f2 | #450a0a |
| --error-border | #fca5a5 | #991b1b |
| --warning-bg | #fffbeb | #451a03 |
| --success-bg | #f0fdf4 | #052e16 |

## Layout

- **Desktop**: Fixed left sidebar (60px collapsed, 240px expanded at lg) + content area
- **Mobile**: Bottom navigation bar (56px), 3 items: Dashboard, Documents, Chat
- **Content max-width**: 960px
- **Chat max-width**: 720px
- **Form max-width**: 380px
- **Admin content max-width**: 800px

## Components

### KPI Card
- Surface background with border
- Value in font-mono at variant-specific size (28px primary, 22px secondary)
- Trend indicator shown ONLY when prior period data exists (no fake arrows)
- Trend: ArrowUp (positive), ArrowDown (negative), Minus (flat)

### Chat Message
- User: right-aligned, accent-subtle background
- Assistant: left-aligned, surface background with border
- Low confidence (0.70-0.75): warning left border + disclaimer text
- Citations: expandable previews below message

### Data Table
- Sortable columns, alternating row backgrounds
- Right-aligned numeric columns in font-mono

### File Upload
- Drag-and-drop zone with hover/valid/invalid states
- Progress bar during upload
- Success/error feedback inline

### Inline Banner
- 4 severities: error, warning, success, info
- Left border accent + semantic background
- Optional dismiss button

## Spacing

- Component padding: 24px (p-6)
- Card gap: 12px (gap-3)
- Section gap: 32px (mt-8)
- Border radius: 8px (rounded-md)

## Motion

- Transition duration: 150ms
- Skeleton pulse: 1.5s ease-in-out
- Respects `prefers-reduced-motion`

## Accessibility

- Skip-to-content link
- ARIA labels on KPI cards (value + trend description)
- Role="alert" on banners
- Min touch target: 44x44px on mobile
- Semantic HTML throughout
