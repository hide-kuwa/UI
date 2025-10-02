'use client';

import { createContext, useCallback, useContext, useMemo, useRef, type PropsWithChildren } from 'react';
import { useEditorStore } from '../../../../../packages/core/store/editor.store';
import type { NodeKind } from '../../../../../packages/core/store/editor.store';

/**
 * Builder の UI ヘルパーだけを提供（データはZustandに一元化）
 */
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

  const addNode = useCallback(
    (kind: NodeKind) => {
      addNodeStore(kind); // 追加→選択はstore側で実施
    },
    [addNodeStore]
  );

  const value = useMemo(
    () => ({ addNode, attachNodeNameInput, focusNodeNameInput }),
    [addNode, attachNodeNameInput, focusNodeNameInput]
  );

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error('useBuilder must be used within <BuilderProvider>');
  return ctx;
}
