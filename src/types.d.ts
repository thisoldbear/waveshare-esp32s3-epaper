// Custom TypeScript declarations for Espruino globals on ESP32-S3

interface Pin {}

declare const global: any;

declare const D0: Pin;
declare const D3: Pin;
declare const D6: Pin;
declare const D8: Pin;
declare const D9: Pin;
declare const D10: Pin;
declare const D11: Pin;
declare const D12: Pin;
declare const D13: Pin;
declare const D18: Pin;
declare const BTN: Pin;

declare function pinMode(pin: Pin, mode?: string, automatic?: boolean): void;
declare function digitalWrite(pin: Pin, val: boolean | number): void;
declare function digitalRead(pin: Pin): number;
declare function getTime(): number;

declare function save(): void;
declare function reset(): void;

interface WatchOptions {
  repeat?: boolean;
  edge?: "rising" | "falling" | "both";
  debounce?: number;
  data?: any;
}

declare function setWatch(
  callback: (e: { state: boolean; time: number; lastTime: number }) => void,
  pin: Pin,
  options?: WatchOptions
): number;

declare function clearWatch(id?: number): void;

interface GraphicsBufferOptions {
  msb?: boolean;
  vertical_byte?: boolean;
}

interface Graphics {
  buffer: ArrayBuffer;
  setColor(color: number): Graphics;
  setColor(r: number, g: number, b: number): Graphics;
  setFont(fontName: string, size?: number): Graphics;
  setFontAlign(x: number, y: number, rotation?: number): Graphics;
  drawString(text: string, x: number, y: number): Graphics;
  fillRect(x1: number, y1: number, x2: number, y2: number): Graphics;
  drawRect(x1: number, y1: number, x2: number, y2: number): Graphics;
  drawLine(x1: number, y1: number, x2: number, y2: number): Graphics;
}

declare namespace Graphics {
  function createArrayBuffer(
    width: number,
    height: number,
    bpp: number,
    options?: GraphicsBufferOptions
  ): Graphics;
}
