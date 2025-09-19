import { radius, spacing } from './tokens';

export const radii = radius;
export const space = spacing;

export type RadiusKey = keyof typeof radius;
export type SpacingKey = keyof typeof spacing;
