'use client';

import { useEffect, useRef } from 'react';
import { useEditorStore } from '../../../../../packages/core/store/editor.store';

export default function AutoSaveEffect() {
  // ⚠️ 配列セレクタをやめ、個別に購読して参照の不安定化を回避
  const serialized = useEditorStore((s) => s.computeSerialized());
  const lastSaved = useEditorStore((s) => s.lastSaved);
  const saveNow = useEditorStore((s) => s.saveNow);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty = serialized !== lastSaved;

  useEffect(() => {
    // 変更が無ければタイマーをクリア
    if (!dirty) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // デバウンス 800ms
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // 最新の比較でも dirty なら保存
      if (serialized !== lastSaved) {
        saveNow();
      }
    }, 800);

    // クリーンアップ
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [dirty, serialized, lastSaved, saveNow]);

  // アンマウント時のクリーンアップ
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
