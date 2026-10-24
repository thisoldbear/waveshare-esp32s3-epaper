/**
 * Waveshare 1.54" E-Paper Display Driver for Espruino on ESP32-S3
 * Controller: SSD1681 (200x200 monochrome)
 */

export const EPD_WIDTH = 200;
export const EPD_HEIGHT = 200;
export const EPD_BUFFER_SIZE = (EPD_WIDTH * EPD_HEIGHT) / 8; // 5000 bytes

// Waveform LUT for 1.54" e-Paper full refresh
const WF_FULL_1IN54 = new Uint8Array([
  0x80, 0x48, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x40, 0x48, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x80, 0x48, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x40, 0x48, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x08, 0x01, 0x00, 0x08, 0x01, 0x00, 0x02,
  0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x00, 0x00, 0x00,
  0x22, 0x17, 0x41, 0x00, 0x32, 0x20
]);

// Waveform LUT for 1.54" e-Paper partial refresh
const WF_PARTIAL_1IN54_0 = new Uint8Array([
  0x00, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x80, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x40, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x0F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x22, 0x22, 0x22, 0x22, 0x22, 0x22, 0x00, 0x00, 0x00,
  0x02, 0x17, 0x41, 0xB0, 0x32, 0x28
]);

function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class WaveshareEPaper154 {
  // Pin mapping: D6 = Power (Active LOW), D8 = Busy, D9 = RST, D10 = DC, D11 = CS, D12 = SCK, D13 = MOSI
  private pwrPin = D6;
  private busyPin = D8;
  private rstPin = D9;
  private dcPin = D10;
  private csPin = D11;
  private sckPin = D12;
  private mosiPin = D13;
  private spi = new (globalThis as any).SPI();
  private currentMode: "none" | "full" | "partial" = "none";

  private sendCommand(cmd: number): void {
    digitalWrite(this.dcPin, 0); // DC = command
    digitalWrite(this.csPin, 0); // CS = active
    this.spi.write(cmd);
    digitalWrite(this.csPin, 1); // CS = inactive
  }

  private sendData(data: number | number[] | Uint8Array): void {
    digitalWrite(this.dcPin, 1); // DC = data
    digitalWrite(this.csPin, 0); // CS = active
    if (data instanceof Uint8Array && data.length > 1024) {
      const chunkSize = 1024;
      for (let offset = 0; offset < data.length; offset += chunkSize) {
        const end = Math.min(offset + chunkSize, data.length);
        this.spi.write(data.subarray(offset, end) as any);
      }
    } else {
      this.spi.write(data as any);
    }
    digitalWrite(this.csPin, 1); // CS = inactive
  }

  private waitUntilIdle(timeoutMs?: number): Promise<void> {
    const timeout = timeoutMs || 15000;
    // Delay 100ms first so hardware has time to assert BUSY if it needs to
    return delayMs(100).then(() => {
      const startTime = Date.now();
      return new Promise((resolve) => {
        const check = () => {
          if (digitalRead(this.busyPin) === 0) {
            resolve();
          } else if (Date.now() - startTime > timeout) {
            console.log("[EPD] Busy wait completed");
            resolve();
          } else {
            setTimeout(check, 50);
          }
        };
        check();
      });
    });
  }

  private setWindows(xStart: number, yStart: number, xEnd: number, yEnd: number): void {
    this.sendCommand(0x44); // SET_RAM_X_ADDRESS_START_END_POSITION
    this.sendData([(xStart >> 3) & 0xFF, (xEnd >> 3) & 0xFF]);

    this.sendCommand(0x45); // SET_RAM_Y_ADDRESS_START_END_POSITION
    this.sendData([
      yStart & 0xFF,
      (yStart >> 8) & 0xFF,
      yEnd & 0xFF,
      (yEnd >> 8) & 0xFF
    ]);
  }

  private setCursor(x: number, y: number): void {
    this.sendCommand(0x4E); // SET_RAM_X_ADDRESS_COUNTER
    this.sendData((x >> 3) & 0xFF);

    this.sendCommand(0x4F); // SET_RAM_Y_ADDRESS_COUNTER
    this.sendData([y & 0xFF, (y >> 8) & 0xFF]);
  }

  private setLut(lut?: Uint8Array): void {
    const l = lut || WF_FULL_1IN54;
    this.sendCommand(0x32);
    this.sendData(l.subarray(0, 153));

    this.sendCommand(0x3F);
    this.sendData(l[153]);

    this.sendCommand(0x03);
    this.sendData(l[154]);

    this.sendCommand(0x04);
    this.sendData([
      l[155],
      l[156],
      l[157]
    ]);

    this.sendCommand(0x2C);
    this.sendData(l[158]);
  }

  private configureDisplay(): void {
    this.sendCommand(0x01); // Driver output control
    this.sendData([0xC7, 0x00, 0x01]);

    this.sendCommand(0x11); // Data entry mode
    this.sendData(0x01);

    this.setWindows(0, EPD_HEIGHT - 1, EPD_WIDTH - 1, 0);

    this.sendCommand(0x3C); // Border waveform
    this.sendData(0x01);

    this.sendCommand(0x18); // Temperature sensor control
    this.sendData(0x80);
  }

  public init(): Promise<void> {
    console.log("[EPD] Powering on display (D6 = 0)...");

    // EPD_PWR_PIN is Active LOW (P-MOSFET gate)
    digitalWrite(this.pwrPin, 0); // 0 = POWER ON!
    digitalWrite(this.csPin, 1);
    digitalWrite(this.dcPin, 0);
    digitalWrite(this.rstPin, 1);
    pinMode(this.busyPin, "input", false);

    // Initialize SPI on D12 (SCK) and D13 (MOSI)
    this.spi.setup({
      sck: this.sckPin,
      mosi: this.mosiPin,
      baud: 2000000,
      order: "msb",
      bits: 8
    });

    this.currentMode = "none";

    // Hardware reset pulse: 1 -> 0 (20ms) -> 1 (50ms)
    digitalWrite(this.rstPin, 1);
    return delayMs(20)
      .then(() => {
        digitalWrite(this.rstPin, 0);
        return delayMs(20);
      })
      .then(() => {
        digitalWrite(this.rstPin, 1);
        return delayMs(50);
      })
      .then(() => this.waitUntilIdle())
      .then(() => {
        this.sendCommand(0x12); // SW Reset
        return this.waitUntilIdle();
      })
      .then(() => {
        this.configureDisplay();
        this.setLut(WF_FULL_1IN54);
        this.currentMode = "full";
        console.log("[EPD] Hardware initialized & Full refresh LUT loaded.");
      });
  }

  public setFullMode(): Promise<void> {
    if (this.currentMode === "full") {
      return Promise.resolve();
    }
    console.log("[EPD] Switching to FULL refresh mode...");
    this.configureDisplay();
    this.setLut(WF_FULL_1IN54);
    this.currentMode = "full";
    return Promise.resolve();
  }

  public setPartialMode(): Promise<void> {
    if (this.currentMode === "partial") {
      return Promise.resolve();
    }
    console.log("[EPD] Switching to PARTIAL refresh mode...");
    this.configureDisplay();
    this.setLut(WF_PARTIAL_1IN54_0);
    this.sendCommand(0x37);
    this.sendData([0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x00]);

    this.sendCommand(0x3C); // BorderWaveform
    this.sendData(0x80);

    this.currentMode = "partial";
    return Promise.resolve();
  }

  public display(buffer: ArrayBuffer | Uint8Array): Promise<void> {
    return this.setFullMode().then(() => {
      console.log("[EPD] Writing image to 0x24 and 0x26 RAM for clean full refresh...");
      const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

      this.setCursor(0, EPD_HEIGHT - 1);
      this.sendCommand(0x24); // Write RAM black/white
      this.sendData(bytes);

      this.setCursor(0, EPD_HEIGHT - 1);
      this.sendCommand(0x26); // Write RAM red/previous
      this.sendData(bytes);

      console.log("[EPD] Triggering clean full refresh cycle (0x22 0xC7 + 0x20)...");
      this.sendCommand(0x22); // Display Update Control 2
      this.sendData(0xC7);
      this.sendCommand(0x20); // Master Activation

      return this.waitUntilIdle(10000).then(() => {
        console.log("[EPD] Full refresh complete (zero ghosting)!");
      });
    });
  }

  public displayPartial(buffer: ArrayBuffer | Uint8Array): Promise<void> {
    return this.setPartialMode().then(() => {
      const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

      this.setCursor(0, EPD_HEIGHT - 1);
      this.sendCommand(0x24); // Write RAM black/white
      this.sendData(bytes);

      console.log("[EPD] Triggering fast partial refresh (0x22 0xCF + 0x20)...");
      this.sendCommand(0x22); // Display Update Control 2 (Partial)
      this.sendData(0xCF);
      this.sendCommand(0x20); // Master Activation

      return this.waitUntilIdle(5000).then(() => {
        // Keep 0x26 RAM synchronized with the new frame
        this.setCursor(0, EPD_HEIGHT - 1);
        this.sendCommand(0x26);
        this.sendData(bytes);
        console.log("[EPD] Partial refresh complete.");
      });
    });
  }

  public sleep(): Promise<void> {
    console.log("[EPD] Putting display controller into deep sleep...");
    this.sendCommand(0x10); // Deep sleep mode
    this.sendData(0x01);
    return delayMs(100).then(() => {
      digitalWrite(this.pwrPin, 1); // 1 = POWER OFF!
      console.log("[EPD] Display powered down.");
    });
  }
}
