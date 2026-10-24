/**
 * WebGraphics: HTML5 Canvas implementation of the Espruino Graphics API.
 * Renders 1:1 identical 200x200 pixel art as the physical Waveshare display.
 */

export const INK_BLACK = "#161616";
export const PAPER_WHITE = "#ECE8E1";

export class WebGraphics {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  private currentColor: number = 0; // 0 = black, 1 = white
  private fontSize: number = 12;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Could not get 2D context");
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
    this.clear();
  }

  public clear(): void {
    this.ctx.fillStyle = PAPER_WHITE;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public setColor(c: number): void {
    this.currentColor = c === 1 ? 1 : 0;
    const fill = this.currentColor === 1 ? PAPER_WHITE : INK_BLACK;
    this.ctx.fillStyle = fill;
    this.ctx.strokeStyle = fill;
  }

  public fillRect(x1: number, y1: number, x2: number, y2: number): void {
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const w = Math.abs(x2 - x1) + 1;
    const h = Math.abs(y2 - y1) + 1;
    this.ctx.fillRect(x, y, w, h);
  }

  public drawRect(x1: number, y1: number, x2: number, y2: number): void {
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);
    this.ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  }

  public drawLine(x1: number, y1: number, x2: number, y2: number): void {
    this.ctx.beginPath();
    this.ctx.lineWidth = 1;
    this.ctx.moveTo(x1 + 0.5, y1 + 0.5);
    this.ctx.lineTo(x2 + 0.5, y2 + 0.5);
    this.ctx.stroke();
  }

  public setFont(_font: string, size: number): void {
    this.fontSize = size;
    // Espruino Vector font is proportional; map to a geometric, high-legibility sans-serif
    this.ctx.font = `bold ${size}px "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
    this.ctx.textBaseline = "top";
  }

  public stringWidth(text: string): number {
    return Math.ceil(this.ctx.measureText(text).width);
  }

  public drawString(text: string, x: number, y: number): void {
    this.ctx.fillText(text, x, y);
  }

  public drawCircle(x: number, y: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.lineWidth = 1;
    this.ctx.arc(x + 0.5, y + 0.5, r, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  public fillCircle(x: number, y: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.arc(x + 0.5, y + 0.5, r, 0, Math.PI * 2);
    this.ctx.fill();
  }

  public fillPoly(pts: number[]): void {
    if (pts.length < 4) return;
    this.ctx.beginPath();
    this.ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) {
      this.ctx.lineTo(pts[i], pts[i + 1]);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }
}
