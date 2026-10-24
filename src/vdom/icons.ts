export function drawIcon(g: Graphics, name: string, x: number, y: number): void {
  g.setColor(0);

  if (name === "lamp") {
    // Top hanging ring
    g.drawCircle(x, y - 8, 3);
    // Cap
    g.fillRect(x - 9, y - 4, x + 9, y - 2);
    g.fillRect(x - 6, y - 6, x + 6, y - 5);
    // Glass lantern chamber
    g.drawRect(x - 8, y - 1, x + 8, y + 12);
    // Inner diagonal corner struts
    g.drawLine(x - 8, y - 1, x - 4, y + 12);
    g.drawLine(x + 8, y - 1, x + 4, y + 12);
    // Flame
    g.fillCircle(x, y + 5, 3);
    g.drawLine(x, y + 1, x, y + 3);
    // Base
    g.fillRect(x - 11, y + 13, x + 11, y + 16);
  } else if (name === "skull") {
    // Cranium
    g.fillCircle(x, y - 2, 9);
    // Eye sockets (white)
    g.setColor(1);
    g.fillCircle(x - 4, y - 2, 2);
    g.fillCircle(x + 4, y - 2, 2);
    // Nose cavity
    g.fillRect(x - 1, y + 2, x + 1, y + 4);
    // Jaw & teeth
    g.setColor(0);
    g.fillRect(x - 5, y + 6, x + 5, y + 11);
    g.setColor(1);
    g.drawLine(x - 3, y + 7, x - 3, y + 10);
    g.drawLine(x, y + 7, x, y + 10);
    g.drawLine(x + 3, y + 7, x + 3, y + 10);
    g.setColor(0);
  } else if (name === "sword") {
    // Crossed swords
    // Sword 1
    g.drawLine(x - 10, y - 10, x + 10, y + 10);
    g.drawLine(x - 9, y - 10, x + 10, y + 9);
    g.drawLine(x + 5, y + 9, x + 9, y + 5);
    g.fillCircle(x + 11, y + 11, 2);
    // Sword 2
    g.drawLine(x + 10, y - 10, x - 10, y + 10);
    g.drawLine(x + 9, y - 10, x - 10, y + 9);
    g.drawLine(x - 5, y + 9, x - 9, y + 5);
    g.fillCircle(x - 11, y + 11, 2);
  } else if (name === "potion") {
    // Cork
    g.fillRect(x - 3, y - 10, x + 3, y - 7);
    // Neck
    g.drawRect(x - 2, y - 6, x + 2, y - 2);
    // Flask body
    g.drawRect(x - 8, y - 1, x + 8, y + 11);
    // Potion liquid
    g.fillRect(x - 6, y + 3, x + 6, y + 9);
    // White healing cross inside
    g.setColor(1);
    g.fillRect(x - 3, y + 5, x + 3, y + 7);
    g.fillRect(x - 1, y + 3, x + 1, y + 9);
    g.setColor(0);
  } else if (name === "chest") {
    // Lid
    g.drawRect(x - 14, y - 8, x + 14, y - 2);
    // Chest base
    g.drawRect(x - 13, y - 1, x + 13, y + 11);
    // Iron banding
    g.drawLine(x - 8, y - 8, x - 8, y + 11);
    g.drawLine(x + 8, y - 8, x + 8, y + 11);
    // Lock plate & keyhole
    g.fillRect(x - 3, y - 3, x + 3, y + 3);
    g.setColor(1);
    g.fillRect(x - 1, y - 1, x + 1, y + 1);
    g.setColor(0);
  } else if (name === "spider") {
    // Spider body & head
    g.fillCircle(x, y + 2, 5);
    g.fillCircle(x, y - 4, 3);
    // Legs left
    g.drawLine(x - 3, y - 2, x - 10, y - 6);
    g.drawLine(x - 4, y, x - 11, y);
    g.drawLine(x - 4, y + 2, x - 11, y + 5);
    g.drawLine(x - 3, y + 4, x - 9, y + 9);
    // Legs right
    g.drawLine(x + 3, y - 2, x + 10, y - 6);
    g.drawLine(x + 4, y, x + 11, y);
    g.drawLine(x + 4, y + 2, x + 11, y + 5);
    g.drawLine(x + 3, y + 4, x + 9, y + 9);
  } else if (name === "wolf") {
    // Wolf snout & head silhouette
    g.fillCircle(x, y, 6);
    // Snout
    g.fillPoly([x - 2, y + 2, x + 2, y + 2, x, y + 9]);
    // Ears
    g.fillPoly([x - 6, y - 2, x - 2, y - 2, x - 5, y - 9]);
    g.fillPoly([x + 2, y - 2, x + 6, y - 2, x + 5, y - 9]);
    // Eyes (white)
    g.setColor(1);
    g.fillRect(x - 3, y - 1, x - 1, y + 1);
    g.fillRect(x + 1, y - 1, x + 3, y + 1);
    g.setColor(0);
  } else if (name === "rat") {
    // Rat body
    g.fillCircle(x, y, 5);
    g.fillPoly([x + 2, y - 2, x + 2, y + 2, x + 8, y]);
    // Ear
    g.fillCircle(x - 1, y - 5, 2);
    // Tail
    g.drawLine(x - 4, y + 1, x - 10, y + 4);
    g.drawLine(x - 10, y + 4, x - 13, y + 2);
  } else if (name === "zombie") {
    // Zombie head with ragged jaw
    g.fillCircle(x, y - 2, 7);
    g.fillRect(x - 4, y + 3, x + 4, y + 9);
    // White crooked eye
    g.setColor(1);
    g.fillRect(x - 4, y - 3, x - 2, y - 1);
    g.fillRect(x + 2, y - 2, x + 4, y);
    g.setColor(0);
  }
}

export function drawDiceFace(g: Graphics, x: number, y: number, roll: number, size?: number): void {
  const s = size !== undefined ? size : 28;
  g.setColor(0);
  // Outer die box with 2px thick border
  g.drawRect(x, y, x + s, y + s);
  g.drawRect(x + 1, y + 1, x + s - 1, y + s - 1);

  const cx = x + Math.floor(s / 2);
  const cy = y + Math.floor(s / 2);
  const left = x + 7;
  const right = x + s - 7;
  const top = y + 7;
  const bottom = y + s - 7;
  const pipR = 2;

  // Draw pips according to roll (1-6)
  if (roll === 1 || roll === 3 || roll === 5) {
    g.fillCircle(cx, cy, pipR); // Center pip
  }
  if (roll >= 2) {
    g.fillCircle(left, top, pipR); // Top-left
    g.fillCircle(right, bottom, pipR); // Bottom-right
  }
  if (roll >= 4) {
    g.fillCircle(right, top, pipR); // Top-right
    g.fillCircle(left, bottom, pipR); // Bottom-left
  }
  if (roll === 6) {
    g.fillCircle(left, cy, pipR); // Mid-left
    g.fillCircle(right, cy, pipR); // Mid-right
  }
}
