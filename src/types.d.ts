// Custom TypeScript declarations for Espruino globals on ESP32-S3

interface Pin {}

interface EspruinoGlobalScope {
  onInit?: () => void;
  main?: () => void;
  updatePRData?: (rawJson: unknown) => void;
  [key: string]: unknown;
}

declare const global: EspruinoGlobalScope;
declare var onInit: (() => void) | undefined;
declare var main: (() => void) | undefined;
declare var updatePRData: ((rawJson: unknown) => void) | undefined;

interface SPI {
  setup(options: { sck?: Pin; mosi?: Pin; miso?: Pin; baud?: number; mode?: number }): void;
  write(data: number | number[] | Uint8Array | string): void;
}

declare const SPI: {
  new (): SPI;
};

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
  data?: unknown;
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

// Networking & Espruino core modules
interface WifiConnectOptions {
  password?: string;
  dns?: string;
}

interface WifiIPInfo {
  ip: string;
  netmask: string;
  gw: string;
  mac: string;
}

interface WifiStatus {
  status: string;
  reason?: number;
}

interface WifiModule {
  connect(
    ssid: string,
    options: WifiConnectOptions,
    callback: (err?: string | Error) => void
  ): void;
  disconnect(callback?: () => void): void;
  getIP(): WifiIPInfo;
  getStatus(callback: (status: WifiStatus) => void): void;
}

interface HttpResponse {
  statusCode?: number;
  headers?: Record<string, string>;
  on(event: "data", callback: (chunk: string) => void): void;
  on(event: "close", callback: () => void): void;
}

interface HttpRequestOptions {
  host: string;
  port?: number;
  path: string;
  method?: string;
  protocol?: string;
  headers?: Record<string, string | number>;
}

interface ClientRequest {
  write(data: string): void;
  end(): void;
  on(event: "error", callback: (err: Error) => void): void;
}

interface HttpModule {
  request(
    options: HttpRequestOptions,
    callback: (res: HttpResponse) => void
  ): ClientRequest;
}

interface StorageModule {
  read(filename: string): string;
  write(filename: string, data: string, offset?: number, size?: number): boolean;
  erase(filename: string): void;
  list(): string[];
}

declare function require(moduleName: "Wifi"): WifiModule;
declare function require(moduleName: "http"): HttpModule;
declare function require(moduleName: "Storage"): StorageModule;
declare function require(moduleName: string): unknown;

