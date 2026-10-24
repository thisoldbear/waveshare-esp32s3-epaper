export interface VNode<P = any> {
  type: string | Function;
  props: P & { children?: VNodeChild[] };
  key?: string | number | null;
}

export type VNodeChild = VNode<any> | string | number | boolean | null | undefined;

declare global {
  namespace JSX {
    interface Element extends VNode<any> {}
    interface ElementChildrenAttribute {
      children: {};
    }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
