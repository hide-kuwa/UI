// Responsibility: editor state (select/update) & persistence (localStorage). No UI imports.

import { create, type StateCreator } from 'zustand';

import { deserialize, serialize } from '../serialize/json';
import type { Document, Node, NodeKind as CoreNodeKind } from '../types/node';

export type EditorNode = Node;
export type NodeKind = CoreNodeKind;

const LS_KEY = 'uib:doc:default';
let lastLoadedSerialized: string | null = null;

const createSampleDocument = (): Document => ({
  id: 'doc-default',
  title: 'Demo Page',
  version: 1,
  nodes: [
    {
      id: 'node-text-1',
      name: 'Hero Title',
      kind: 'text',
      props: { text: 'Hello world', fontSize: 32 },
    },
    {
      id: 'node-button-1',
      name: 'Primary Action',
      kind: 'button',
      props: { label: 'Click me' },
    },
  ],
});

const loadDocument = (): Document => {
  if (typeof window === 'undefined') {
    const doc = createSampleDocument();
    lastLoadedSerialized = serialize(doc);
    return doc;
  }

  const raw = window.localStorage.getItem(LS_KEY);
  if (!raw) {
    const doc = createSampleDocument();
    lastLoadedSerialized = serialize(doc);
    return doc;
  }

  try {
    const doc = deserialize(raw);
    lastLoadedSerialized = raw;
    return doc;
  } catch {
    const doc = createSampleDocument();
    lastLoadedSerialized = serialize(doc);
    return doc;
  }
};

const findNode = (nodes: Document['nodes'], id: string): Node | null =>
  nodes.find((node) => node.id === id) ?? null;

const genId = (kind: NodeKind): string => {
  const prefix = `node-${kind}-`;
  try {
    const crypto = (globalThis as unknown as { crypto?: Crypto & { randomUUID?: () => string } }).crypto;
    const uuid = crypto?.randomUUID?.();
    if (uuid) {
      return prefix + uuid;
    }
  } catch {
    // ignore
  }

  return prefix + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
};

const createNodeForKind = (kind: NodeKind, id: string, index: number): Node => {
  switch (kind) {
    case 'text':
      return { id, name: `Text ${index}`, kind, props: { text: 'New Text', fontSize: 16 } };
    case 'button':
      return { id, name: `Button ${index}`, kind, props: { label: 'New Button' } };
    case 'header':
      return { id, name: `Header ${index}`, kind, props: { height: 64, background: '#ffffff' } };
    case 'footer':
      return { id, name: `Footer ${index}`, kind, props: { height: 64, background: '#ffffff' } };
    case 'sidebar':
      return { id, name: `Sidebar ${index}`, kind, props: { side: 'left', width: 280, background: '#f9fafb' } };
    case 'hud':
      return {
        id,
        name: `HUD ${index}`,
        kind,
        props: { position: 'top-right', offsetX: 16, offsetY: 16, zIndex: 10 },
      };
    case 'image':
      return { id, name: `Image ${index}`, kind, props: { src: '', width: 320, height: 180, fit: 'contain' } };
  }

  const exhaustiveCheck: never = kind;
  return exhaustiveCheck;
};

type EditorState = {
  doc: Document;
  selectedId: string | null;
  lastSaved: string;

  select: (id: string | null) => void;
  selectNode: (id: string | null) => void;
  updateNodeName: (id: string, name: string) => void;
  addNode: (kind: NodeKind) => string;

  saveNow: () => void;
  computeSerialized: () => string;
  isDirty: () => boolean;

  updateNodeProps: (
    id: string,
    props: Partial<{ text: string; fontSize: number } | { label: string }>,
  ) => void;

  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => string;
  moveNode: (id: string, direction: 'up' | 'down') => void;
};

export type EditorStoreState = EditorState;

const editorStoreCreator: StateCreator<EditorState> = (set, get) => {
  const initialDoc = loadDocument();
  const computeSerialized = () => serialize(get().doc);
  const initialSerialized = lastLoadedSerialized ?? computeSerialized();

  return {
    doc: initialDoc,
    selectedId: null,

    select: (id) => set({ selectedId: id }),
    selectNode: (id) => set({ selectedId: id }),

    updateNodeName: (id, name) => {
      const { doc } = get();
      const target = findNode(doc.nodes, id);
      if (!target) return;

      const nodes = doc.nodes.map((node) => (node.id === id ? { ...node, name } : node));
      set({ doc: { ...doc, nodes } });
    },

    updateNodeProps: (id, props) => {
      const { doc } = get();
      const target = findNode(doc.nodes, id);
      if (!target) return;

      if (target.kind === 'text') {
        const nextProps = { ...target.props };
        let changed = false;

        if (props.text !== undefined && props.text !== nextProps.text) {
          nextProps.text = props.text;
          changed = true;
        }
        if (props.fontSize !== undefined && props.fontSize !== nextProps.fontSize) {
          nextProps.fontSize = props.fontSize;
          changed = true;
        }
        if (!changed) return;

        const nodes = doc.nodes.map((n) => (n.id === id ? { ...n, props: nextProps } : n));
        set({ doc: { ...doc, nodes } });
        return;
      }

      if (target.kind === 'button') {
        const nextProps = { ...target.props };
        let changed = false;

        if (props.label !== undefined && props.label !== nextProps.label) {
          nextProps.label = props.label;
          changed = true;
        }
        if (!changed) return;

        const nodes = doc.nodes.map((n) => (n.id === id ? { ...n, props: nextProps } : n));
        set({ doc: { ...doc, nodes } });
      }
    },

    addNode: (kind) => {
      const { doc } = get();
      const nextIndex = doc.nodes.filter((node) => node.kind === kind).length + 1;
      const id = genId(kind);
      const node = createNodeForKind(kind, id, nextIndex);

      set((state) => ({
        doc: { ...state.doc, nodes: [...state.doc.nodes, node] },
        selectedId: id,
      }));

      return id;
    },

    deleteNode: (id) => {
      const { doc, selectedId } = get();
      const index = doc.nodes.findIndex((n) => n.id === id);
      if (index === -1) return;

      const nextNodes = doc.nodes.filter((n) => n.id !== id);

      let nextSelected = selectedId;
      if (selectedId === id) {
        const next = nextNodes[index] ?? nextNodes[index - 1] ?? null;
        nextSelected = next ? next.id : null;
      }

      set({
        doc: { ...doc, nodes: nextNodes },
        selectedId: nextSelected ?? null,
      });
    },

    duplicateNode: (id) => {
      const { doc } = get();
      const index = doc.nodes.findIndex((n) => n.id === id);
      if (index === -1) return id;

      const target = doc.nodes[index];
      const newId = genId(target.kind);
      const duplicated: Node = {
        ...target,
        id: newId,
        name: `${target.name} Copy`,
        props: { ...target.props },
      };

      const nextNodes = [...doc.nodes];
      nextNodes.splice(index + 1, 0, duplicated);

      set({
        doc: { ...doc, nodes: nextNodes },
        selectedId: newId,
      });

      return newId;
    },

    moveNode: (id, direction) => {
      const { doc } = get();
      const index = doc.nodes.findIndex((n) => n.id === id);
      if (index === -1) return;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= doc.nodes.length) return;

      const nextNodes = [...doc.nodes];
      const [node] = nextNodes.splice(index, 1);
      nextNodes.splice(targetIndex, 0, node);

      set({ doc: { ...doc, nodes: nextNodes } });
    },

    saveNow: () => {
      const serialized = computeSerialized();

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(LS_KEY, serialized);
          set({ lastSaved: serialized });
        } catch (error) {
          console.warn('saveNow: localStorage failed', error);
        }
      }
    },

    lastSaved: initialSerialized,
    computeSerialized,
    isDirty: () => computeSerialized() !== get().lastSaved,
  };
};

export const useEditorStore = create<EditorState>(editorStoreCreator);
