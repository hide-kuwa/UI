'use client';

import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useEditorStore } from '../../../../../packages/core/store/editor.store';
import { useBuilder } from './builderContext';

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
};

const titleStyle: CSSProperties = { fontWeight: 600 };
const rightSectionStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 };
const statusStyle: CSSProperties = { fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 };
const buttonStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  cursor: 'pointer',
};

const isEditableElement = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return target.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select';
};

export default function HeaderBar() {
  const title = useEditorStore((s) => s.doc.title);
  const saveNow = useEditorStore((s) => s.saveNow);
  const isDirty = useEditorStore((s) => s.isDirty);
  const dirty = isDirty();

  const { addNode, focusNodeNameInput } = useBuilder();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      // Save: Cmd/Ctrl+S
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveNow();
        window.alert('Saved');
        return;
      }

      // Node shortcuts（テキスト入力中は無効）
      if (isEditableElement(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key.toLowerCase();
      if (k === 't') {
        addNode('text');
        setTimeout(focusNodeNameInput, 0);
      } else if (k === 'b') {
        addNode('button');
        setTimeout(focusNodeNameInput, 0);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saveNow, addNode, focusNodeNameInput]);

  const statusColor = dirty ? '#dc2626' : '#10b981';
  const statusLabel = dirty ? '● 未保存' : '✓ 保存済み';

  return (
    <header style={headerStyle}>
      <div style={titleStyle}>
        <strong>{title}</strong>
      </div>
      <div style={rightSectionStyle}>
        <span style={{ ...statusStyle, color: statusColor }}>{statusLabel}</span>
        <button type="button" style={buttonStyle} onClick={() => (saveNow(), window.alert('Saved'))}>
          保存
        </button>
      </div>
    </header>
  );
}
