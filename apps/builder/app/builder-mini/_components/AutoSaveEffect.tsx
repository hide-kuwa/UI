'use client';

import { useEffect, useRef } from 'react';
import { useEditorStore } from '../../../../../packages/core/store/editor.store';

export default function AutoSaveEffect() {
  const [doc, lastSaved, computeSerialized, saveNow] = useEditorStore((s) => [
    s.doc,
    s.lastSaved,
    s.computeSerialized,
    s.saveNow,
  ]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty = computeSerialized() !== lastSaved;

  useEffect(() => {
    if (!dirty) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    timeoutRef.current = setTimeout(() => {
      if (computeSerialized() !== lastSaved) {
        saveNow();
      }
    }, 800);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [dirty, computeSerialized, lastSaved, saveNow, doc]);

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
