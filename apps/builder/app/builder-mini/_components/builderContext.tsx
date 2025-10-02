'use client';

import { createContext, useCallback, useContext, useMemo, useRef, type PropsWithChildren } from 'react';
import { useEditorStore } from '../../../../../packages/core/store/editor.store';
import type { NodeKind } from '../../../../../packages/core/store/editor.store';

/**
 * Builder の UI ヘルパーだけを提供（データは Zustand に一元化）
 */
type BuilderContextValue = {
  addNode: (kind: NodeKind) => void;
  attachNodeNameInput: (input: HTMLInputElement | null) => void;
  focusNodeNameInput: () => void;
};

const Ctx = createContext<BuilderContextValue | null>(null);

export function BuilderProvider({ children }: PropsWithChildren) {
  const addNodeStore = useEditorStore((s) => s.addNode);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const attachNodeNameInput = useCallback((el: HTMLInputElement | null) => {
    inputRef.current = el;
  }, []);

  const focusNodeNameInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  const addNode = useCallback(
    (kind: NodeKind) => {
      addNodeStore(kind); // 追加→選択は store 側で実施
    },
    [addNodeStore],
  );

  const value = useMemo(
    () => ({ addNode, attachNodeNameInput, focusNodeNameInput }),
    [addNode, attachNodeNameInput, focusNodeNameInput],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBuilder() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBuilder must be used within <BuilderProvider>');
  return v;
}
