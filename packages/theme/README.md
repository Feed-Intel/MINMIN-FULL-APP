# @minmin/theme

Design system tokens and helpers shared between the MinMin web dashboard and Expo mobile app.

## Development

```bash
# from packages/theme
npm install
npm run build
```

The build step emits TypeScript declarations and compiled JS into `dist/`. The Expo app consumes the file dependency declared in `restaurantFE/package.json`.

## Contents

- `tokens` – base color, spacing, and radii scales.
- `semantic` – light/dark runtime palettes derived from tokens.
- `typography` and `elevations` – shared type ramp and shadow presets.
- `web/` – Tailwind and shadcn/ui recipes aligned with the dashboard mockups.
- `mobile/` – NativeWind config and lightweight primitive components for Expo.

## Usage

```ts
import { mobileTheme } from '@minmin/theme/dist/mobile/theme';

mobileTheme.light.primary; // -> '#73b661'
```

The Expo app wires these values into React Navigation and React Native Paper themes in `src/theme/minminTheme.ts`.
