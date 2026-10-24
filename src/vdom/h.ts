import { VNode, VNodeChild } from "./types";

export function h(type: any, props: any): VNode {
  const p = props || {};
  const children: VNodeChild[] = [];

  for (let i = 2; i < arguments.length; i++) {
    const c = arguments[i];
    if (c === null || c === undefined || typeof c === "boolean") continue;
    if (Array.isArray(c)) {
      for (let j = 0; j < c.length; j++) {
        const item = c[j];
        if (item !== null && item !== undefined && typeof item !== "boolean") {
          children.push(item);
        }
      }
    } else {
      children.push(c);
    }
  }

  p.children = children;
  return { type, props: p, key: p.key };
}

export function Fragment(props: { children?: VNodeChild[] }): any {
  return props.children;
}

export const createElement = h;
