import type { PageDef, ThemeDef, ThemeId } from './types';
import { pages as animals } from './themes/animals';
import { pages as ocean } from './themes/ocean';
import { pages as dinosaurs } from './themes/dinosaurs';
import { pages as space } from './themes/space';
import { pages as transport } from './themes/transport';
import { pages as princess } from './themes/princess';
import { pages as robots } from './themes/robots';
import { pages as christmas } from './themes/christmas';
import { pages as fairytale } from './themes/fairytale';

export type { PageDef, Pen, ThemeDef, ThemeId } from './types';
export { renderOutline, rasterizeOutline } from './render';

/** Task 7 flips this to true once all 135 pages exist. */
export const CATALOG_COMPLETE = true;

const def = (id: ThemeId, color: string, pages: PageDef[]): ThemeDef => ({
  id,
  nameKey: `theme.${id}`,
  color,
  pages,
});

export const THEMES: ThemeDef[] = [
  def('animals', '#FFA94D', animals),
  def('ocean', '#4DABF7', ocean),
  def('dinosaurs', '#38D9A9', dinosaurs),
  def('space', '#9775FA', space),
  def('transport', '#FF6B5A', transport),
  def('princess', '#F783AC', princess),
  def('robots', '#74C0FC', robots),
  def('christmas', '#51CF66', christmas),
  def('fairytale', '#FFD43B', fairytale),
];

export function getPage(id: string): PageDef | undefined {
  for (const t of THEMES) for (const p of t.pages) if (p.id === id) return p;
  return undefined;
}
