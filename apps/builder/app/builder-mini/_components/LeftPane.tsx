'use client';

import type { CSSProperties } from 'react';

import { useEditorStore } from '../../../../../packages/core/store/editor.store';

const wrapperStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#4b5563',
};

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const buttonStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  backgroundColor: '#f3f4f6',
  cursor: 'pointer',
  textAlign: 'left',
};

const LeftPane = () => {
  const addNode = useEditorStore((state) => state.addNode);

  const handleAddText = () => {
    addNode('text');
  };

  const handleAddButton = () => {
    addNode('button');
  };

  return (
    <aside style={wrapperStyle}>
      <div>
        <p style={sectionTitleStyle}>ノードを追加</p>
        <div style={buttonRowStyle}>
          <button type='button' style={buttonStyle} onClick={handleAddText}>
            Text を追加
          </button>
          <button type='button' style={buttonStyle} onClick={handleAddButton}>
            Button を追加
          </button>
        </div>
      </div>
    </aside>
  );
};

export default LeftPane;
