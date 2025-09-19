"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tailwindcss_animate_1 = __importDefault(require("tailwindcss-animate"));
const config = {
    darkMode: 'class',
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
                    foreground: 'var(--primary-fg)',
                },
                accent: 'var(--accent)',
            },
            borderRadius: {
                lg: 'var(--radius-lg)',
                xl: 'var(--radius-xl)',
            },
            boxShadow: {
                sm: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
            },
        },
    },
    plugins: [tailwindcss_animate_1.default],
};
exports.default = config;
