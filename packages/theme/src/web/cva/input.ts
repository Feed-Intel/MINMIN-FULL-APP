import { cva } from 'class-variance-authority';

export const input = cva(
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-text placeholder:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60'
);
