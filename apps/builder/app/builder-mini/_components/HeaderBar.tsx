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

  // 追加されたノード操作 API
  const selectedId = useEditorStore((s) => s.selectedId);
  const deleteNode = useEditorStore((s) => s.deleteNode);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const moveNode = useEditorStore((s) => s.moveNode);

  const { addNode, focusNodeNameInput } = useBuilder();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;

      // Save: Cmd/Ctrl+S
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveNow();
        window.alert('Saved');
        return;
      }

      // テキスト入力中はノード系ショートカット無効
      if (isEditableElement(event.target)) return;

      // 選択中ノードに対する操作
      if (selectedId) {
        // Delete / Backspace で削除
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault();
          deleteNode(selectedId);
          return;
        }

        // 複製: Cmd/Ctrl + D
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
          event.preventDefault();
          duplicateNode(selectedId);
          return;
        }

        // 並び替え: Alt + ↑/↓
        if (event.altKey && event.key === 'ArrowUp') {
          event.preventDefault();
          moveNode(selectedId, 'up');
          return;
        }
        if (event.altKey && event.key === 'ArrowDown') {
          event.preventDefault();
          moveNode(selectedId, 'down');
          return;
        }
      }

      // Enter で右ペインの名前入力へ
      if (event.key === 'Enter') {
        event.preventDefault();
        focusNodeNameInput();
        return;
      }

      // 修飾キー付きはここで終了
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      // 追加ショートカット: t / b
      const k = event.key.toLowerCase();
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
  }, [saveNow, addNode, focusNodeNameInput, selectedId, deleteNode, duplicateNode, moveNode]);

  const dirty = isDirty();
  const statusColor = dirty ? '#dc2626' : '#10b981';
  const statusLabel = dirty ? '未保存' : '保存済み';

  const handleSave = () => {
    saveNow();
    window.alert('Saved');
  };

  return (
    <header style={headerStyle}>
      <div style={titleStyle}>
        <strong>{title}</strong>
      </div>
      <div style={rightSectionStyle}>
        <span style={{ ...statusStyle, color: statusColor }}>{statusLabel}</span>
        <button type="button" style={buttonStyle} onClick={handleSave}>
          保存
        </button>
      </div>
    </header>
  );
}
