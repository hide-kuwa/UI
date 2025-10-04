'use client';

import { useEffect, useRef } from 'react';
import { useEditorStore } from '../../../../../packages/core/store/editor.store';

export default function AutoSaveEffect() {
  const [isDirty, saveNow] = useEditorStore((s) => [s.isDirty, s.saveNow]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty = isDirty();

  useEffect(() => {
    if (!dirty) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (isDirty()) {
        saveNow();
      }
    }, 800);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [dirty, isDirty, saveNow]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return null;
}
