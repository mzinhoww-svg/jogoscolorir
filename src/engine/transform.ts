export interface ClientRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Maps pointer client (CSS px) coordinates to the logical page space (default 1000×1000). */
export class ViewTransform {
  constructor(
    readonly rect: ClientRect,
    readonly logical = 1000,
  ) {}

  toLogical(clientX: number, clientY: number): { x: number; y: number } {
    const { left, top, width, height } = this.rect;
    return {
      x: width > 0 ? ((clientX - left) / width) * this.logical : 0,
      y: height > 0 ? ((clientY - top) / height) * this.logical : 0,
    };
  }

  /** Backing-store size for a visible canvas: CSS size × devicePixelRatio (at least 1 px). */
  static backingSize(rect: ClientRect, dpr: number): { width: number; height: number } {
    return {
      width: Math.max(1, Math.round(rect.width * dpr)),
      height: Math.max(1, Math.round(rect.height * dpr)),
    };
  }
}
