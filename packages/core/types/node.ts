// FROZEN: true
// Responsibility: UI Builder document & node types (no deps; append-only)

export type NodeKind =
  | 'header'
  | 'footer'
  | 'sidebar'
  | 'hud'
  | 'text'
  | 'image'
  | 'button';

export type BaseNode = {
  id: string;
  name: string;
  kind: NodeKind;
};

export type HeaderNode = BaseNode & {
  kind: 'header';
  props: {
    height?: number;
    background?: string;
  };
};

export type FooterNode = BaseNode & {
  kind: 'footer';
  props: {
    height?: number;
    background?: string;
  };
};

export type SidebarNode = BaseNode & {
  kind: 'sidebar';
  props: {
    side: 'left' | 'right';
    width?: number;
    background?: string;
  };
};

export type HudNode = BaseNode & {
  kind: 'hud';
  props: {
    position?:
      | 'top-left'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-right';
    offsetX?: number;
    offsetY?: number;
    zIndex?: number;
  };
};

export type TextNode = BaseNode & {
  kind: 'text';
  props: {
    text: string;
    fontSize?: number;
    color?: string;
  };
};

export type ImageNode = BaseNode & {
  kind: 'image';
  props: {
    src: string;
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover';
  };
};

export type ButtonNode = BaseNode & {
  kind: 'button';
  props: {
    label: string;
  };
};

export type Node =
  | HeaderNode
  | FooterNode
  | SidebarNode
  | HudNode
  | TextNode
  | ImageNode
  | ButtonNode;

export type Document = {
  id: string;
  title: string;
  version: 1;
  nodes: Node[];
};
