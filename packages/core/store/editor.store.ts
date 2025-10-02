// Responsibility: editor state (select/update) & persistence (localStorage). No UI imports.

import { create } from 'zustand';

import { deserialize, serialize } from '../serialize/json';
import type { Document, Node } from '../types/node';

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
      props: {
        text: 'Hello world',
        fontSize: 32,
      },
    },
    {
      id: 'node-button-1',
      name: 'Primary Action',
      kind: 'button',
      props: {
        label: 'Click me',
      },
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

const findNode = (nodes: Document['nodes'], id: string): Node | null => {
  return nodes.find((node) => node.id === id) ?? null;
};

const genId = (kind: 'text' | 'button'): string => {
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return `node-${kind}-${globalThis.crypto.randomUUID()}`;
  }

  const random = Math.random().toString(36).slice(2, 8);
  return `node-${kind}-${Date.now()}-${random}`;
};

type EditorState = {
  doc: Document;
  selectedId: string | null;
  select: (id: string | null) => void;
  updateNodeName: (id: string, name: string) => void;
  saveNow: () => void;
  lastSaved?: string | null;
  computeSerialized: () => string;
  isDirty: () => boolean;
  addNode: (kind: 'text' | 'button') => string;
};

export const useEditorStore = create<EditorState>((set, get) => {
  const initialDoc = loadDocument();
  const initialSerialized = lastLoadedSerialized ?? serialize(initialDoc);
  const computeSerialized = () => serialize(get().doc);

  return {
    doc: initialDoc,
    selectedId: null,
    select: (id) => set({ selectedId: id }),
    updateNodeName: (id, name) => {
      const { doc } = get();
      const target = findNode(doc.nodes, id);

      if (!target) {
        return;
      }

      const nodes = doc.nodes.map((node) =>
        node.id === id ? { ...node, name } : node,
      );

      set({
        doc: { ...doc, nodes },
      });
    },
    saveNow: () => {
      const serialized = computeSerialized();
      let ok = false;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(LS_KEY, serialized);
          ok = true;
        } catch (error) {
          console.warn('saveNow: localStorage failed', error);
        }
      }
      if (ok) {
        set({
          lastSaved: serialized,
        });
      }
    },
    lastSaved: initialSerialized,
    computeSerialized,
    isDirty: () => computeSerialized() !== get().lastSaved,
    addNode: (kind) => {
      const { doc } = get();
      const id = genId(kind);
      const count = doc.nodes.filter((node) => node.kind === kind).length + 1;

      const node =
        kind === 'text'
          ? {
              id,
              name: `Text ${count}`,
              kind: 'text',
              props: {
                text: 'New Text',
                fontSize: 16,
              },
            }
          : {
              id,
              name: `Button ${count}`,
              kind: 'button',
              props: {
                label: 'New Button',
              },
            };

      set((state) => ({
        doc: {
          ...state.doc,
          nodes: [...state.doc.nodes, node],
        },
        selectedId: id,
      }));

      return id;
    },
  };
});