// Responsibility: editor state (select/update) & persistence (localStorage). No UI imports.

import { create } from 'zustand';
import { deserialize, serialize } from '../serialize/json';
import type { Document, Node } from '../types/node';

export type EditorNode = Node;               // UI用の型エイリアス（Canvas互換）
export type NodeKind = Node['kind'];         // UI用の型エイリアス（LeftPane互換）

const LS_KEY = 'uib:doc:default';
let lastLoadedSerialized: string | null = null;

// サンプル Doc（version=1 を厳守）
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
  // SSRなど window 不在時
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
  nodes.find((n) => n.id === id) ?? null;

// 一意 ID（UUID 優先／fallback: 時刻+rand）
const genId = (kind: NodeKind) => {
  const base = `node-${kind}-`;
  try {
    const c = (globalThis as unknown as { crypto?: Crypto & { randomUUID?: () => string } }).crypto;
    const uuid = c?.randomUUID?.();
    if (uuid) return base + uuid;
  } catch {
    /* ignore */
  }
  return base + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
};

type EditorState = {
  doc: Document;
  selectedId: string | null;

  // actions
  select: (id: string | null) => void;     // 既存API（維持）
  selectNode: (id: string | null) => void; // UI 互換エイリアス
  updateNodeName: (id: string, name: string) => void;
  addNode: (kind: NodeKind) => string;

  saveNow: () => void;
  lastSaved?: string | null;
  computeSerialized: () => string;
  isDirty: () => boolean;
};

export const useEditorStore = create<EditorState>((set, get) => {
  const initialDoc = loadDocument();
  const computeSerialized = () => serialize(get().doc);
  const initialSerialized = lastLoadedSerialized ?? computeSerialized();

  return {
    doc: initialDoc,
    selectedId: null,

    select: (id) => set({ selectedId: id }),
    selectNode: (id) => set({ selectedId: id }), // alias

    updateNodeName: (id, name) => {
      const { doc } = get();
      const target = findNode(doc.nodes, id);
      if (!target) return; // no-op

      const nodes = doc.nodes.map((n) => (n.id === id ? { ...n, name } : n));
      set({ doc: { ...doc, nodes } });
    },

    addNode: (kind) => {
      const { doc } = get();
      // 表示名は連番でわかりやすく
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
