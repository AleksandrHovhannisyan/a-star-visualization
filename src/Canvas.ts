/**
 * Helper around `HTMLCanvasElement`. Pass a canvas to it and it provides methods for drawing.
 */
export default class Canvas {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
  
    constructor(canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      this.ctx = this.canvas.getContext("2d")!;
    }
  
    get width() {
      return this.canvas.width;
    }
  
    get height() {
      return this.canvas.height;
    }
  
    /** Clears the canvas with a solid color.
     */
    clear(color: string) {
      this.rect({ x: 0, y: 0, width: this.width, height: this.height, fill: color });
    }

    /** Draws a rectangle on the canvas. */
    rect({ x, y, width, height, fill, stroke }: { x: number, y: number, width: number; height: number; fill?: string; stroke?: string }) {
      this.ctx.beginPath();
      if (fill) {
        this.ctx.fillStyle = fill;
      }
      if (stroke) {
        this.ctx.strokeStyle = stroke;
      }
      this.ctx.rect(x, y, width, height);
      if (fill) {
        this.ctx.fill();
      }
      if (stroke) {
        this.ctx.stroke();
      }
      this.ctx.closePath();
    }
  
    /** Draws a circle on the canvas at the specified coordinates.
     */
    circle({
      x,
      y,
      radius,
      color,
    }: {
      x: number;
      y: number;
      radius: number;
      color: string;
    }) {
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2, false);
      this.ctx.fill();
    }
  
    /** Draws a line on the canvas from `(x1, y1)` to `(x2, y2)`.
     */
    line({
      x1,
      y1,
      x2,
      y2,
      color,
      strokeWidth = 1,
    }: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      strokeWidth: number;
    }) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
  }