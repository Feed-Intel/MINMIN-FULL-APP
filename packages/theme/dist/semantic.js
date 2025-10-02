"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dark = exports.light = void 0;
const tokens_1 = require("./tokens");
exports.light = {
    bg: tokens_1.neutral[50],
    surface: tokens_1.neutral[0],
    text: tokens_1.neutral[800],
    mutedText: tokens_1.neutral[500],
    border: tokens_1.neutral[200],
    primary: tokens_1.brand.primary[500],
    primaryFg: '#ffffff',
    accent: tokens_1.brand.accent[500],
    success: tokens_1.signal.success[500],
    warning: tokens_1.signal.warning[500],
    danger: tokens_1.signal.danger[500],
    info: tokens_1.signal.info[500],
};
exports.dark = {
    bg: tokens_1.neutral[1000],
    surface: tokens_1.neutral[900],
    text: tokens_1.neutral[100],
    mutedText: tokens_1.neutral[400],
    border: '#243244',
    primary: tokens_1.brand.primary[400],
    primaryFg: '#ffffff',
    accent: tokens_1.brand.accent[400],
    success: '#22c55e',
    warning: '#fbbf24',
    danger: '#ef4444',
    info: '#3b82f6',
};
