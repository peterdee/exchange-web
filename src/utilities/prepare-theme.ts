import { CSS_VARIABLES, PALETTE_DARK, PALETTE_LIGHT } from '../configuration';
import type { Theme } from '../types';

export const preparePalette = (theme: Theme) => theme === 'dark' ? PALETTE_DARK : PALETTE_LIGHT;

export const prepareVariables = (theme: Theme) => {
  const palette = theme === 'dark' ? PALETTE_DARK : PALETTE_LIGHT;
  const keys = Object.keys(palette) as Array<keyof typeof palette>;
  const strings = keys.map((key) => `${CSS_VARIABLES[key]}: ${palette[key]};`);
  return strings.join('');
};
