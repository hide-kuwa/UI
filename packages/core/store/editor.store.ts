'use client';

import { create } from 'zustand';

export type NodeKind = 'text' | 'button';

export type EditorNode = {
  id: string;
  name: string;
  kind: NodeKind;
};

export type EditorDocument = {
  title: string;
  nodes: EditorNode[];
};

type EditorState = {
  doc: EditorDocument;
  selectedId: string | null;
  dirty: boolean;
  addNode: (kind: NodeKind) => void;
  selectNode: (id: string | null) => void;
  updateNodeName: (id: string, name: string) => void;
  saveNow: () => void;
  isDirty: () => boolean;
};

const createIsDirty = (dirty: boolean) => () => dirty;

const initialNodes: EditorNode[] = [
  { id: 'node-1', name: 'ヒーロー見出し', kind: 'text' },
  { id: 'node-2', name: 'Primary Button', kind: 'button' },
];

let nodeCounter = initialNodes.length;

const initialDoc: EditorDocument = {
  title: 'サンプルページ',
  nodes: initialNodes,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  doc: initialDoc,
  selectedId: null,
  dirty: false,
  addNode: (kind) => {
    set((state) => {
      const id = generateNodeId();
      const name = createDefaultNodeName(kind, state.doc.nodes.length + 1);
      return {
        doc: { ...state.doc, nodes: [...state.doc.nodes, { id, name, kind }] },
        selectedId: id,
        dirty: true,
        isDirty: createIsDirty(true),
      };
    });
  },
  selectNode: (id) =>
    set((state) => {
      if (id === null) return { selectedId: null };
      const exists = state.doc.nodes.some((node) => node.id === id);
      return exists ? { selectedId: id } : state;
    }),
  updateNodeName: (id, name) =>
    set((state) => {
      const index = state.doc.nodes.findIndex((node) => node.id === id);
      if (index === -1) return state;

      const target = state.doc.nodes[index];
      if (target.name === name) return state;

      const nextNodes = [...state.doc.nodes];
      nextNodes[index] = { ...target, name };

      return {
        doc: { ...state.doc, nodes: nextNodes },
        dirty: true,
        isDirty: createIsDirty(true),
      };
    }),
  saveNow: () => {
    if (!get().dirty) return;
    set({ dirty: false, isDirty: createIsDirty(false) });
  },
  isDirty: createIsDirty(false),
}));

function generateNodeId() {
  nodeCounter += 1;
  return `node-${nodeCounter}`;
}

function createDefaultNodeName(kind: NodeKind, index: number) {
  const base = kind === 'text' ? 'テキスト' : 'ボタン';
  return `${base} ${index}`;
}
