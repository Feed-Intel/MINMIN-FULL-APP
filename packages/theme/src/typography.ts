export const font = {
  sans: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
};

export const typeScale = {
  h1: { size: '32px', line: '40px', weight: 700 },
  h2: { size: '24px', line: '32px', weight: 700 },
  h3: { size: '20px', line: '28px', weight: 600 },
  body: { size: '16px', line: '24px', weight: 400 },
  small: { size: '14px', line: '20px', weight: 400 },
};

export type TypeScaleKey = keyof typeof typeScale;
