"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.button = void 0;
const class_variance_authority_1 = require("class-variance-authority");
exports.button = (0, class_variance_authority_1.cva)('inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none', {
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
        },
    },
    defaultVariants: {
        variant: 'solid',
        size: 'md',
    },
});
