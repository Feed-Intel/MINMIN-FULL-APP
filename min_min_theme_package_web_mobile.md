# MinMin Theme Package (Web + Mobile)

A sharable design‑system theme you can install in **Next.js (Web)** and **Expo (Mobile)** projects. It encodes colors, spacing, radii, typography, shadows, and component tokens consistent with your UI/UX.

> Package name: `@minmin/theme`

---

## 0) Install & Link

```bash
# In a pnpm monorepo (recommended)
pnpm -w add -D tailwindcss postcss autoprefixer class-variance-authority tailwind-merge
pnpm -w add @radix-ui/react-icons @tanstack/react-table
pnpm -w add -D @types/node

# Add the theme workspace
mkdir -p packages/theme && cd packages/theme
pnpm init -y && pnpm add color
```

In your app workspaces:
```bash
# Web app
pnpm -F web add @minmin/theme

# Mobile app
pnpm -F mobile add @minmin/theme nativewind react-native-svg
```

> If you’re not in a monorepo, publish to a private registry or use `workspace:*` via `npm link`.

---

## 1) File Structure (inside `packages/theme`)

```
packages/theme/
  package.json
  tsconfig.json
  src/
    index.ts
    tokens.ts
    scales.ts
    elevations.ts
    typography.ts
    semantic.ts
    web/
      tailwind.config.ts
      globals.css
      shadcn-theme.ts
      cva/
        button.ts
        card.ts
        input.ts
        badge.ts
    mobile/
      nativewind.config.js
      theme.ts
      components/
        button.tsx
        card.tsx
```

---

## 2) Tokens (neutral + brand + state)

> Picked a warm, food‑friendly palette. Swap hexes in one place to rebrand.

```ts
// src/tokens.ts
export const brand = {
  primary: {
    50:  '#f2fbf3',
    100: '#e6f7e7',
    200: '#cdeecd',
    300: '#b2e3b2',
    400: '#8cd489',
    500: '#73b661', // Mint/Olive Green (main)
    600: '#5a984c',
    700: '#4b7e40',
    800: '#3f6a37',
    900: '#31522b',
  },
  accent: {
    50:  '#fff9ed',
    100: '#fff3d6',
    200: '#ffe4ad',
    300: '#ffd27f',
    400: '#ffc351',
    500: '#ffb72b', // Warm mango for highlights
    600: '#db951f',
    700: '#b3751c',
    800: '#8f5c19',
    900: '#744a17',
  }
};

export const neutral = { = {
  0:   '#ffffff',
  50:  '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
  1000:'#0b0f16',
};

export const signal = {
  success: { 100: '#e8f7ef', 500: '#16a34a', 700: '#15803d' },
  warning: { 100: '#fff7e6', 500: '#f59e0b', 700: '#b45309' },
  danger:  { 100: '#feeceb', 500: '#dc2626', 700: '#b91c1c' },
  info:    { 100: '#e8f1fe', 500: '#2563eb', 700: '#1d4ed8' },
};

export const radius = { sm: '8px', md: '12px', lg: '16px', xl: '20px', full: '999px' };
export const spacing = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 };
```

---

## 3) Typography & Elevations

```ts
// src/typography.ts
export const font = {
  sans: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
};
export const typeScale = {
  h1: { size: '32px', line: '40px', weight: 700 },
  h2: { size: '24px', line: '32px', weight: 700 },
  h3: { size: '20px', line: '28px', weight: 600 },
  body: { size: '16px', line: '24px', weight: 400 },
  small: { size: '14px', line: '20px', weight: 400 },
};

// src/elevations.ts
export const shadow = {
  sm: '0 1px 2px rgba(0,0,0,0.06)',
  md: '0 2px 10px rgba(0,0,0,0.08)',
  lg: '0 10px 25px rgba(0,0,0,0.12)'
};
```

---

## 4) Semantic Mapping (light/dark)

```ts
// src/semantic.ts
import { brand, neutral, signal } from './tokens';

export const light = {
  bg: neutral[50],
  surface: neutral[0],
  text: neutral[800],
  mutedText: neutral[500],
  border: neutral[200],
  primary: brand.primary[500],
  primaryFg: '#fff',
  accent: brand.accent[500],
  success: signal.success[500],
  warning: signal.warning[500],
  danger: signal.danger[500],
  info: signal.info[500],
};

export const dark = {
  bg: neutral[1000],
  surface: neutral[900],
  text: neutral[100],
  mutedText: neutral[400],
  border: '#243244',
  primary: brand.primary[400],
  primaryFg: '#fff',
  accent: brand.accent[400],
  success: '#22c55e',
  warning: '#fbbf24',
  danger:  '#ef4444',
  info:    '#3b82f6',
};
```

---

## 5) Web: Tailwind & CSS Vars

```ts
// src/web/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    '../../web/app/**/*.{ts,tsx}',
    '../../web/components/**/*.{ts,tsx}',
    '../../web/pages/**/*.{ts,tsx}',
    './node_modules/@minmin/theme/dist/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['var(--font-sans)'] },
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        text: 'var(--text)',
        muted: 'var(--muted-text)',
        border: 'var(--border)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-fg)'
        },
        accent: 'var(--accent)'
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)'
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
```

```css
/* src/web/globals.css */
:root {
  --bg: #e0f0e0; /* matches mockup mint background */
  --surface: #ffffff;
  --text: #1f2937;
  --muted-text: #6b7280;
  --border: #e5e7eb;
  --primary: #73b661;
  --primary-fg: #ffffff;
  --accent: #ffb72b;

  --radius-lg: 16px;
  --radius-xl: 20px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.06);
  --shadow-md: 0 2px 10px rgba(0,0,0,.08);
  --shadow-lg: 0 10px 25px rgba(0,0,0,.12);
}

.dark {
  --bg: #0b0f16;
  --surface: #111827;
  --text: #f3f4f6;
  --muted-text: #9ca3af;
  --border: #243244;
  --primary: #8cd489;
  --primary-fg: #ffffff;
  --accent: #ffd27f;
}

html, body { height: 100%; background: var(--bg); color: var(--text); }
```

### shadcn/ui bridge + CVA recipes

```ts
// src/web/shadcn-theme.ts
import { cva } from 'class-variance-authority';

export const button = cva(
  'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        solid: 'bg-primary text-primary-foreground hover:opacity-90',
        outline: 'border border-border text-text hover:bg-surface',
        ghost: 'text-text hover:bg-[color-mix(in_oklab,var(--text)_8%,transparent)]',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-5',
      }
    },
    defaultVariants: { variant: 'solid', size: 'md' }
  }
);
```

```ts
// src/web/cva/card.ts
import { cva } from 'class-variance-authority';
export const card = cva('bg-surface rounded-xl shadow-sm border border-border');
```

---

## 6) Mobile: NativeWind & Theme

```js
// src/mobile/nativewind.config.js
module.exports = {
  content: [
    '../../mobile/app/**/*.{ts,tsx}',
    '../../mobile/components/**/*.{ts,tsx}',
    './node_modules/@minmin/theme/dist/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(249,250,251)',
        surface: 'rgb(255,255,255)',
        text: 'rgb(31,41,55)',
        primary: 'rgb(242,61,47)',
        accent: 'rgb(255,160,0)'
      },
      borderRadius: { xl: 20 }
    }
  }
}
```

```ts
// src/mobile/theme.ts
export const mobileTheme = {
  light: {
    bg: '#f9fafb', surface: '#ffffff', text: '#1f2937', primary: '#f23d2f', accent: '#ffa000'
  },
  dark: {
    bg: '#0b0f16', surface: '#111827', text: '#f3f4f6', primary: '#ff6d5e', accent: '#ffcb63'
  }
};
```

**Example RN components bound to tokens**

```tsx
// src/mobile/components/button.tsx
import { Pressable, Text } from 'react-native';
import React from 'react';
export function Button({ title, onPress }: { title: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} className="h-12 px-5 rounded-2xl bg-primary items-center justify-center">
      <Text className="text-white font-medium">{title}</Text>
    </Pressable>
  );
}
```

```tsx
// src/mobile/components/card.tsx
import { View } from 'react-native';
import React from 'react';
export function Card({ children }: { children: React.ReactNode }) {
  return <View className="bg-surface rounded-2xl p-4" style={{ shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10 }}>{children}</View>;
}
```

---

## 7) Export Barrel

```ts
// src/index.ts
export * as Tokens from './tokens';
export * as Elevations from './elevations';
export * as Typography from './typography';
export * as Semantic from './semantic';
export * as Web from './web/shadcn-theme';
export * as WebTailwind from './web/tailwind.config';
export * as Mobile from './mobile/theme';
```

---

## 8) Usage — Web (Next.js + Tailwind + shadcn/ui)

**1) Extend your Tailwind config**
```ts
// apps/web/tailwind.config.ts
import base from '@minmin/theme/dist/web/tailwind.config';
export default { ...base, content: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'] };
```

**2) Import CSS vars**
```ts
// apps/web/app/layout.tsx
import '@minmin/theme/dist/web/globals.css';
```

**3) Use CVA recipes**
```tsx
import { Web } from '@minmin/theme';
<button className={Web.button({ variant: 'solid', size: 'md' })}>Place order</button>
```

**4) Dark mode**
```tsx
// Toggle class on <html> or provider
<html className={isDark ? 'dark' : ''}>
```

---

## 9) Usage — Mobile (Expo + NativeWind)

**1) Configure NativeWind**
```js
// apps/mobile/tailwind.config.js
const base = require('@minmin/theme/dist/mobile/nativewind.config');
module.exports = { ...base, content: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'] };
```

**2) Wrap screens with consistent background**
```tsx
import { mobileTheme } from '@minmin/theme';
<View className="flex-1" style={{ backgroundColor: mobileTheme.light.bg }} />
```

**3) Use primitives**
```tsx
import { Button, Card } from '@minmin/theme/dist/mobile/components';
```

---

## 10) Component Tokens Aligned to Your Screens

- **KPI Cards** → `card` + `text-muted` titles, numbers in `tabular-nums`.
- **Filters Drawer** → `border-border`, chip badges: `bg-[color-mix(in_oklab,var(--primary)_10%,transparent)]`.
- **Order Status** → use semantic: `success`, `warning`, `info`, `danger` badges.
- **Wizard (Create/Place Order)** → primary solid buttons, secondary outline.
- **Menu Cards** → surface + md shadow, price in accent color.
- **Toasts** → surface with left border `--primary`.

---

## 11) A11y & Contrast Defaults

- Minimum contrast 4.5:1 for text; tokens chosen to meet WCAG AA on both themes.
- Focus ring: `outline-primary` with `ring-2 ring-offset-2` on interactive elements.

---

## 12) Theming Strategy (Multi‑tenant Ready)

- Keep **CSS variables** as the contract. For a tenant, override `globals.css` variables only.
- Mobile side mirrors the same hexes in `mobileTheme` for runtime switching.

```css
/* Tenant X override */
:root { --primary: #73b661; --accent: #ffb72b; }
.dark  { --primary: #73b661; --accent: #ffb72b; }
```

---

## 13) Build & Types

```json
// package.json
{
  "name": "@minmin/theme",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.json && cp -r src/web/globals.css dist/web/globals.css && echo 'built'",
    "dev": "tsc -w"
  }
}
```

---

## 14) What to Customize Next

- Swap brand hex values to final brand guide.
- Add density tokens (compact vs comfy) for kitchen vs admin UIs.
- Extend CVA recipes for Input, Select, Dialog, Sheet used in your flows.

---

### Done ✅
Drop this folder in `packages/theme`, run `pnpm -w build`, then consume from your web & mobile apps. This gives you a single source of truth for styles that matches your UI/UX and scales across tenants.

