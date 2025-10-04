'use client';

import { createContext, useCallback, useContext, useMemo, useRef, type PropsWithChildren } from 'react';

import { useEditorStore, type NodeKind } from '../../../../../packages/core/store/editor.store';

type BuilderContextValue = {
  addNode: (kind: NodeKind) => void;
  attachNodeNameInput: (input: HTMLInputElement | null) => void;
  focusNodeNameInput: () => void;
};

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function BuilderProvider({ children }: PropsWithChildren) {
  const addNodeStore = useEditorStore((s) => s.addNode);
  const nodeNameInputRef = useRef<HTMLInputElement | null>(null);

  const attachNodeNameInput = useCallback((el: HTMLInputElement | null) => {
    nodeNameInputRef.current = el;
  }, []);

  const focusNodeNameInput = useCallback(() => {
    const el = nodeNameInputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  const addNode = useCallback((kind: NodeKind) => {
    addNodeStore(kind);
  }, [addNodeStore]);

  const value = useMemo(
    () => ({ addNode, attachNodeNameInput, focusNodeNameInput }),
    [addNode, attachNodeNameInput, focusNodeNameInput],
  );

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilder() {
  const v = useContext(BuilderContext);
  if (!v) throw new Error('useBuilder must be used within <BuilderProvider>');
  return v;
}
