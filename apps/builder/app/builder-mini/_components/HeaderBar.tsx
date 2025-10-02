'use client';

import { useEffect } from 'react';
import type { CSSProperties } from 'react';

import { useEditorStore } from '../../../../../packages/core/store/editor.store';

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
};

const titleStyle: CSSProperties = {
  fontWeight: 600,
};

const rightSectionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const statusStyle: CSSProperties = {
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const buttonStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  cursor: 'pointer',
};

const isTextTarget = (target: EventTarget | null): target is HTMLElement => {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea';
};

const HeaderBar = () => {
  const title = useEditorStore((state) => state.doc.title);
  const saveNow = useEditorStore((state) => state.saveNow);
  const isDirty = useEditorStore((state) => state.isDirty);
  const addNode = useEditorStore((state) => state.addNode);
  const dirty = isDirty();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      const key = event.key.toLowerCase();

      if ((event.metaKey || event.ctrlKey) && key === 's') {
        event.preventDefault();
        saveNow();
        window.alert('Saved');
        return;
      }

      if (event.metaKey || event.ctrlKey) {
        return;
      }

      if (isTextTarget(event.target)) {
        return;
      }

      if (key === 't') {
        event.preventDefault();
        addNode('text');
        return;
      }

      if (key === 'b') {
        event.preventDefault();
        addNode('button');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveNow, addNode]);

  const statusColor = dirty ? '#dc2626' : '#10b981';
  const statusLabel = dirty ? '● 未保存' : '✓ 保存済み';

  const handleClick = () => {
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
        <button type='button' style={buttonStyle} onClick={handleClick}>
          保存
        </button>
      </div>
    </header>
  );
};

export default HeaderBar;