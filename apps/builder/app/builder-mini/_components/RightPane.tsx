'use client';

import { useEffect, useRef } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';

import { useEditorStore } from '../../../../../packages/core/store/editor.store';

const paneStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const placeholderStyle: CSSProperties = {
  color: '#9ca3af',
  fontSize: 14,
  margin: 0,
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const inputStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  fontSize: 14,
};

const metaStyle: CSSProperties = {
  fontSize: 12,
  color: '#6b7280',
  margin: 0,
};

const RightPane = () => {
  const selectedId = useEditorStore((state) => state.selectedId);
  const doc = useEditorStore((state) => state.doc);
  const updateNodeName = useEditorStore((state) => state.updateNodeName);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedNode = selectedId
    ? doc.nodes.find((node) => node.id === selectedId) ?? null
    : null;

  useEffect(() => {
    if (!selectedNode) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [selectedNode?.id]);

  if (!selectedNode) {
    return (
      <div style={paneStyle}>
        <p style={placeholderStyle}>ノードを選択してください</p>
      </div>
    );
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateNodeName(selectedNode.id, event.target.value);
  };

  return (
    <div style={paneStyle}>
      <label style={labelStyle} htmlFor='node-name'>
        ノード名
      </label>
      <input
        ref={inputRef}
        id='node-name'
        type='text'
        value={selectedNode.name}
        onChange={handleChange}
        style={inputStyle}
      />
      <p style={metaStyle}>id: {selectedNode.id}</p>
      <p style={metaStyle}>kind: {selectedNode.kind}</p>
    </div>
  );
};

export default RightPane;