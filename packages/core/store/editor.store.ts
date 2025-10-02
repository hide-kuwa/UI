// Responsibility: editor state (select/update) & persistence (localStorage). No UI imports.

import { create } from 'zustand';
import { deserialize, serialize } from '../serialize/json';
import type { Document, Node } from '../types/node';

export type EditorNode = Node;                 // ← Canvas互換の型エイリアス
export type NodeKind = Node['kind'];           // ← LeftPane互換の型エイリアス

const LS_KEY = 'uib:doc:default';
let lastLoadedSerialized: string | null = null;

// サンプルDoc（version=1を厳守）
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
    lastLoadedSerialized = null;
    return createSampleDocument();
  }
  const raw = window.localStorage.getItem(LS_KEY);
  if (!raw) {
    lastLoadedSerialized = null;
    return createSampleDocument();
  }
  try {
    const doc = deserialize(raw);
    lastLoadedSerialized = raw;
    return doc;
  } catch {
    lastLoadedSerialized = null;
    return createSampleDocument();
  }
};

const findNode = (nodes: Document['nodes'], id: string): Node | null =>
  nodes.find((n) => n.id === id) ?? null;

// 一意ID（UUID優先）
const genId = (kind: NodeKind) => {
  const base = `node-${kind}-`;
  try {
    const c = (globalThis as unknown as { crypto?: Crypto & { randomUUID?: () => string } }).crypto;
    const uuid = c?.randomUUID?.();
    if (uuid) return base + uuid;
  } catch { /* ignore */ }
  return base + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
};

type EditorState = {
  doc: Document;
  selectedId: string | null;

  // actions
  select: (id: string | null) => void;     // 既存API（維持）
  selectNode: (id: string | null) => void; // 新規：Canvas/LeftPane互換用エイリアス
  updateNodeName: (id: string, name: string) => void;
  addNode: (kind: NodeKind) => string;

  saveNow: () => void;
  lastSaved?: string | null;
  computeSerialized: () => string;
  isDirty: () => boolean;
};

export const useEditorStore = create<EditorState>((set, get) => {
  const initialDoc = loadDocument();
  const initialSerialized = lastLoadedSerialized ?? serialize(initialDoc);
  const computeSerialized = () => serialize(get().doc);

  return {
    doc: initialDoc,
    selectedId: null,

    select: (id) => set({ selectedId: id }),
    selectNode: (id) => set({ selectedId: id }), // エイリアス

    updateNodeName: (id, name) => {
      const { doc } = get();
      const target = findNode(doc.nodes, id);
      if (!target) return;
      const nodes = doc.nodes.map((n) => (n.id === id ? { ...n, name } : n));
      set({ doc: { ...doc, nodes } });
    },

    addNode: (kind) => {
      const { doc } = get();
      // 表示名は連番のまま維持（UX的に分かりやすい）
      const count = doc.nodes.filter((n) => n.kind === kind).length + 1;
      const id = genId(kind);
      const node: Node =
        kind === 'text'
          ? { id, name: `Text ${count}`, kind: 'text', props: { text: 'New Text', fontSize: 16 } }
          : { id, name: `Button ${count}`, kind: 'button', props: { label: 'New Button' } };

      set((state) => ({
        doc: { ...state.doc, nodes: [...state.doc.nodes, node] },
        selectedId: id,
      }));
      return id;
    },

    saveNow: () => {
      const serialized = computeSerialized();
      let ok = false;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(LS_KEY, serialized);
          ok = true;
        } catch (e) {
          console.warn('saveNow: localStorage failed', e);
        }
      }
      if (ok) set({ lastSaved: serialized });
    },

    lastSaved: initialSerialized,
    computeSerialized,
    isDirty: () => computeSerialized() !== get().lastSaved,
  };
});
