import { VNode, VNodeChild } from "./types";
import { drawIcon, drawDiceFace } from "./icons";

export function renderToGraphics(vnode: VNodeChild, g: Graphics): void {
  if (vnode === null || vnode === undefined || typeof vnode === "boolean") {
    return;
  }

  if (Array.isArray(vnode)) {
    for (let i = 0; i < vnode.length; i++) {
      renderToGraphics(vnode[i], g);
    }
    return;
  }

  if (typeof vnode === "string" || typeof vnode === "number") {
    // Bare string/number rendered without container defaults to body text
    g.setColor(0);
    g.setFont("Vector", 12);
    g.drawString(String(vnode), 4, 30);
    return;
  }

  const node = vnode as VNode;
  const type = node.type;
  const props = node.props;

  // Function component
  if (typeof type === "function") {
    const rendered = type(props);
    renderToGraphics(rendered, g);
    return;
  }

  const tag = typeof type === "string" ? type.toLowerCase() : "";

  if (tag === "screen") {
    g.setColor(1);
    g.fillRect(0, 0, 199, 199);
    g.setColor(0);
    if (props.doubleBorder) {
      g.drawRect(0, 0, 199, 199);
      g.drawRect(2, 2, 197, 197);
    } else if (props.border) {
      g.drawRect(0, 0, 199, 199);
    }
  } else if (tag === "box") {
    const x = props.x || 0;
    const y = props.y || 0;
    const w = props.w || 10;
    const h = props.h || 10;
    g.setColor(props.color || 0);
    if (props.fill) {
      g.fillRect(x, y, x + w - 1, y + h - 1);
    }
    if (props.border || !props.fill) {
      g.drawRect(x, y, x + w - 1, y + h - 1);
    }
  } else if (tag === "line") {
    g.setColor(props.color || 0);
    g.drawLine(props.x1 || 0, props.y1 || 0, props.x2 || 0, props.y2 || 0);
  } else if (tag === "text") {
    const size = props.size || 12;
    const textStr = String(
      props.text !== undefined
        ? props.text
        : props.children && props.children[0] !== undefined
        ? props.children[0]
        : ""
    );
    g.setFont(props.font || "Vector", size);
    g.setColor(props.color || 0);

    let x = props.x || 0;
    const width = g.stringWidth(textStr);
    if (props.align === "center") {
      const centerX = props.x !== undefined ? props.x : 100;
      x = centerX - Math.floor(width / 2);
    } else if (props.align === "right") {
      const rightX = props.x !== undefined ? props.x : 196;
      x = rightX - width;
    }
    g.drawString(textStr, x, props.y || 0);
  } else if (tag === "header") {
    // Header bar y=0..20
    g.setColor(0);
    g.drawLine(0, 20, 199, 20);

    // Title / location
    const title = props.title || "THE DARK WOOD";
    g.setFont("Vector", 12);
    g.setColor(0);
    g.drawString(title, 4, 3);

    // HP indicator
    if (props.hp !== undefined) {
      const maxHp = props.maxHp || 13;
      const hpStr = `HP:${props.hp}/${maxHp}`;
      g.setFont("Vector", 10);
      g.drawString(hpStr, 110, 4);
    }

    // Lamp indicator
    if (props.lamps !== undefined) {
      const lampStr = `L:${props.lamps}/10`;
      g.setFont("Vector", 10);
      g.drawString(lampStr, 164, 4);
    }
  } else if (tag === "footer") {
    // Footer button hints y=173..199
    g.setColor(0);
    g.drawLine(0, 173, 199, 173);

    // Left button (BOOT)
    if (props.bootLabel) {
      g.setColor(0);
      g.fillRect(4, 176, 96, 196);
      g.setColor(1);
      g.setFont("Vector", 10);
      const str = `[B] ${props.bootLabel}`;
      const w = g.stringWidth(str);
      g.drawString(str, 50 - Math.floor(w / 2), 181);
    }

    // Right button (PWR)
    if (props.pwrLabel) {
      g.setColor(0);
      g.fillRect(103, 176, 195, 196);
      g.setColor(1);
      g.setFont("Vector", 10);
      const str = `[P] ${props.pwrLabel}`;
      const w = g.stringWidth(str);
      g.drawString(str, 149 - Math.floor(w / 2), 181);
    }
  } else if (tag === "dicebox") {
    const x = props.x || 86;
    const y = props.y || 95;
    const roll = props.roll || 1;
    drawDiceFace(g, x, y, roll, 28);

    if (props.hit !== undefined) {
      g.setFont("Vector", 11);
      if (props.hit) {
        g.setColor(0);
        g.fillRect(x + 34, y + 4, x + 72, y + 22);
        g.setColor(1);
        g.drawString("HIT!", x + 40, y + 7);
      } else {
        g.setColor(0);
        g.drawRect(x + 34, y + 4, x + 76, y + 22);
        g.drawString("MISS", x + 38, y + 7);
      }
    }
  } else if (tag === "icon") {
    drawIcon(g, props.name || "lamp", props.x || 100, props.y || 100);
  }

  // Render children recursively
  if (props && props.children) {
    for (let i = 0; i < props.children.length; i++) {
      renderToGraphics(props.children[i], g);
    }
  }
}
