export type ThemeId =
  | 'animals'
  | 'ocean'
  | 'dinosaurs'
  | 'space'
  | 'transport'
  | 'princess'
  | 'robots'
  | 'christmas'
  | 'fairytale';

export interface Pen {
  circle(cx: number, cy: number, r: number): void;
  ellipse(cx: number, cy: number, rx: number, ry: number, rot?: number): void;
  rect(x: number, y: number, w: number, h: number): void;
  roundRect(x: number, y: number, w: number, h: number, r: number): void;
  poly(pts: [number, number][], closed?: boolean): void;
  star(cx: number, cy: number, rOuter: number, rInner: number, points: number): void;
  heart(cx: number, cy: number, size: number): void;
  path(d: string): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
}

export interface PageDef {
  id: string;
  themeId: ThemeId;
  index: number;
  nameKey: string;
  draw(p: Pen): void;
}

export interface ThemeDef {
  id: ThemeId;
  nameKey: string;
  color: string;
  pages: PageDef[];
}
