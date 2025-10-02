"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.badge = void 0;
const class_variance_authority_1 = require("class-variance-authority");
exports.badge = (0, class_variance_authority_1.cva)('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', {
    variants: {
        tone: {
            neutral: 'bg-muted text-text',
            accent: 'bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] text-[color-mix(in_oklab,var(--accent)_70%,black)]',
            success: 'bg-[color-mix(in_oklab,var(--primary)_20%,transparent)] text-[color-mix(in_oklab,var(--primary)_65%,black)]',
        },
    },
    defaultVariants: { tone: 'neutral' },
});
