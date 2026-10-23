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

function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class WaveshareEPaper154 {
  private pwrPin = D6;
  private busyPin = D8;
  private rstPin = D9;
  private dcPin = D10;
  private csPin = D11;
  private sckPin = D12;
  private mosiPin = D13;

  private sendCommand(cmd: number): void {
    digitalWrite(this.dcPin, 0); // DC = command
    digitalWrite(this.csPin, 0); // CS = active
    SPI1.write(cmd);
    digitalWrite(this.csPin, 1); // CS = inactive
  }

  private sendData(data: number | number[] | Uint8Array): void {
    digitalWrite(this.dcPin, 1); // DC = data
    digitalWrite(this.csPin, 0); // CS = active
    if (data instanceof Uint8Array && data.length > 1024) {
      const chunkSize = 1024;
      for (let offset = 0; offset < data.length; offset += chunkSize) {
        const end = Math.min(offset + chunkSize, data.length);
        SPI1.write(data.subarray(offset, end) as any);
      }
    } else {
      SPI1.write(data as any);
    }
    digitalWrite(this.csPin, 1); // CS = inactive
  }

  private waitUntilIdle(timeoutMs?: number): Promise<void> {
    const timeout = timeoutMs || 15000;
    const startTime = Date.now();
    return new Promise((resolve) => {
      const check = () => {
        if (digitalRead(this.busyPin) === 0) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          console.log("[EPD] Busy timeout reached, proceeding");
          resolve();
        } else {
          setTimeout(check, 20);
        }
      };
      check();
    });
  }

  private setWindows(xStart: number, yStart: number, xEnd: number, yEnd: number): void {
    this.sendCommand(0x44);
    this.sendData([(xStart >> 3) & 0xFF, (xEnd >> 3) & 0xFF]);
    this.sendCommand(0x45);
    this.sendData([
      yStart & 0xFF,
      (yStart >> 8) & 0xFF,
      yEnd & 0xFF,
      (yEnd >> 8) & 0xFF
    ]);
  }

  private setCursor(x: number, y: number): void {
    this.sendCommand(0x4E);
    this.sendData((x >> 3) & 0xFF);
    this.sendCommand(0x4F);
    this.sendData([y & 0xFF, (y >> 8) & 0xFF]);
  }

  private setLut(): void {
    this.sendCommand(0x32);
    this.sendData(WF_FULL_1IN54.subarray(0, 153));
    this.sendCommand(0x3F);
    this.sendData(WF_FULL_1IN54[153]);
    this.sendCommand(0x03);
    this.sendData(WF_FULL_1IN54[154]);
    this.sendCommand(0x04);
    this.sendData([
      WF_FULL_1IN54[155],
      WF_FULL_1IN54[156],
      WF_FULL_1IN54[157]
    ]);
    this.sendCommand(0x2C);
    this.sendData(WF_FULL_1IN54[158]);
  }

  public init(): Promise<void> {
    console.log("[EPD] Initializing display...");

    digitalWrite(this.pwrPin, 1);
    digitalWrite(this.csPin, 1);
    digitalWrite(this.dcPin, 0);
    digitalWrite(this.rstPin, 1);
    pinMode(this.busyPin, "input", false);

    SPI1.setup({
      sck: this.sckPin,
      mosi: this.mosiPin,
      baud: 4000000,
      order: "msb",
      bits: 8
    });

    // Hardware reset pulse
    digitalWrite(this.rstPin, 1);
    return delayMs(50)
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
        this.sendCommand(0x01); // Driver output control
        this.sendData([0xC7, 0x00, 0x01]);

        this.sendCommand(0x11); // Data entry mode
        this.sendData(0x01);

        this.setWindows(0, EPD_WIDTH - 1, EPD_HEIGHT - 1, 0);

        this.sendCommand(0x3C); // Border waveform
        this.sendData(0x01);

        this.sendCommand(0x18); // Temperature sensor control
        this.sendData(0x80);

        this.sendCommand(0x22); // Load Temperature & waveform setting
        this.sendData(0xB1);
        this.sendCommand(0x20); // Master activation
        return this.waitUntilIdle();
      })
      .then(() => {
        this.setCursor(0, EPD_HEIGHT - 1);
        this.setLut();
        console.log("[EPD] Display initialized successfully.");
      });
  }

  public display(buffer: ArrayBuffer | Uint8Array): Promise<void> {
    console.log("[EPD] Writing image buffer to display RAM...");
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

    this.setCursor(0, EPD_HEIGHT - 1);
    this.sendCommand(0x24); // Write RAM
    this.sendData(bytes);

    console.log("[EPD] Refreshing display...");
    this.sendCommand(0x22); // Display Update Control 2
    this.sendData(0xC7);
    this.sendCommand(0x20); // Master Activation
    return this.waitUntilIdle().then(() => {
      console.log("[EPD] Refresh complete!");
    });
  }

  public sleep(): Promise<void> {
    console.log("[EPD] Entering deep sleep...");
    this.sendCommand(0x10); // Deep sleep mode
    this.sendData(0x01);
    return delayMs(100).then(() => {
      digitalWrite(this.pwrPin, 0); // Power off display rail
      console.log("[EPD] Display sleeping.");
    });
  }
}
