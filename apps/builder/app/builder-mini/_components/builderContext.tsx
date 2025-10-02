'use client';

import { createContext, useCallback, useContext, useMemo, useRef, type PropsWithChildren } from 'react';
import { useEditorStore } from '../../../../../packages/core/store/editor.store';

/**
 * Builder UI helpers only:
 * - addNode: データ操作はZustandに委譲（単一の真実のソース）
 * - attach/focus: 右ペインの入力フォーカス制御（UI専用）
 */
type NodeKind = 'text' | 'button';

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
      // Zustand側で追加＆選択まで実施済み（前工程で実装ずみ）
      addNodeStore(kind);
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
  if (!ctx) {
    throw new Error('useBuilder must be used within <BuilderProvider>');
  }
  return ctx;
}
