/**
 * Espruino TypeScript "Hello World" App
 * For Waveshare ESP32-S3 e-Paper 1.54" (200x200)
 */

import { WaveshareEPaper154, EPD_WIDTH, EPD_HEIGHT } from "./epaper";

function main(): Promise<void> {
  console.log("=== Starting Waveshare ESP32-S3 Espruino App ===");

  const epd = new WaveshareEPaper154();

  return epd.init().then(() => {
    console.log("[App] Rendering graphics buffer...");

    // Create 200x200 1-bit monochrome graphics buffer
    const g = Graphics.createArrayBuffer(EPD_WIDTH, EPD_HEIGHT, 1, { msb: true });

    // 1 = White background, 0 = Black ink
    g.setColor(1);
    g.fillRect(0, 0, EPD_WIDTH - 1, EPD_HEIGHT - 1);

    // Draw decorative double outer border
    g.setColor(0);
    g.drawRect(4, 4, EPD_WIDTH - 5, EPD_HEIGHT - 5);
    g.drawRect(6, 6, EPD_WIDTH - 7, EPD_HEIGHT - 7);

    // Top header banner
    g.fillRect(10, 10, EPD_WIDTH - 11, 40);
    g.setColor(1); // Inverted white text on black banner
    g.setFont("6x8", 2);
    g.setFontAlign(0, 0);
    g.drawString("ESPRUINO", 100, 25);

    // Main "Hello World!" message
    g.setColor(0);
    g.setFont("6x8", 2);
    g.setFontAlign(0, 0);
    g.drawString("Hello World!", 100, 85);

    // Divider line
    g.drawLine(20, 115, 180, 115);

    // Subtitle info
    g.setFont("6x8", 1);
    g.drawString("ESP32-S3 * 1.54\" EPD", 100, 135);
    g.drawString("TypeScript -> JS", 100, 155);

    // Decorative bottom dots
    g.drawString("* * * * *", 100, 175);

    console.log("[App] Pushing buffer to e-paper display...");
    return epd.display(g.buffer);
  }).then(() => {
    console.log("=== Hello World successfully displayed! ===");
  }).catch((err) => {
    console.log("[App] Error:", err);
  });
}

// Global Espruino lifecycle hook (runs on reboot/power up)
(globalThis as any).onInit = function(): void {
  main();
};

// Also run immediately upon code upload
main();
