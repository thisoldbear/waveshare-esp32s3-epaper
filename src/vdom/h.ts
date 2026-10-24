import { VNode, VNodeChild } from "./types";

export function h(type: any, props: any): VNode {
  props = props || {};
  const flatChildren: VNodeChild[] = [];

  function addChildren(c: any): void {
    if (c === null || c === undefined || typeof c === "boolean") return;
    if (Array.isArray(c)) {
      for (let i = 0; i < c.length; i++) {
        addChildren(c[i]);
      }
    } else {
      flatChildren.push(c);
    }
  }

  for (let i = 2; i < arguments.length; i++) {
    addChildren(arguments[i]);
  }

  const finalProps: any = {};
  for (const key in props) {
    if (Object.prototype.hasOwnProperty.call(props, key)) {
      finalProps[key] = props[key];
    }
  }
  finalProps.children = flatChildren;

  return {
    type,
    props: finalProps,
    key: props.key
  };
}

export function Fragment(props: { children?: VNodeChild[] }): any {
  return props.children;
}

export const createElement = h;
