'use client';

import { createContext, useCallback, useContext, useMemo, useRef, type PropsWithChildren } from 'react';

import { useEditorStore, type EditorStoreState, type NodeKind } from '../../../../../packages/core/store/editor.store';

type BuilderContextValue = {
  addNode: (kind: NodeKind) => void;
  attachNodeNameInput: (input: HTMLInputElement | null) => void;
  focusNodeNameInput: () => void;
};

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function BuilderProvider({ children }: PropsWithChildren) {
  const addNodeStore = useEditorStore((state: EditorStoreState) => state.addNode);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const attachNodeNameInput = useCallback((element: HTMLInputElement | null) => {
    inputRef.current = element;
  }, []);

  const focusNodeNameInput = useCallback(() => {
    const element = inputRef.current;
    if (!element) {
      return;
    }
    element.focus();
    element.select();
  }, []);

  const addNode = useCallback(
    (kind: NodeKind) => {
      addNodeStore(kind); // Store selects the node immediately after creation.
    },
    [addNodeStore],
  );

  const value = useMemo(
    () => ({ addNode, attachNodeNameInput, focusNodeNameInput }),
    [addNode, attachNodeNameInput, focusNodeNameInput],
  );

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilder() {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error('useBuilder must be used within <BuilderProvider>');
  }
  return context;
}
