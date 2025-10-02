'use client';

import type { CSSProperties, ChangeEvent } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { useEditorStore } from '../../../../../packages/core/store/editor.store';
import { useBuilder } from './builderContext';

const paneStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 };
const placeholderStyle: CSSProperties = { color: '#9ca3af', fontSize: 14, margin: 0 };
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
const metaStyle: CSSProperties = { fontSize: 12, color: '#6b7280', margin: 0 };

export default function RightPane() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const doc = useEditorStore((s) => s.doc);
  const updateNodeName = useEditorStore((s) => s.updateNodeName);
  const { attachNodeNameInput, focusNodeNameInput } = useBuilder();

  const inputRef = useRef<HTMLInputElement>(null);
  const selectedNode = useMemo(
    () => (selectedId ? doc.nodes.find((n) => n.id === selectedId) ?? null : null),
    [doc.nodes, selectedId]
  );

  useEffect(() => {
    attachNodeNameInput(inputRef.current);
    return () => attachNodeNameInput(null);
  }, [attachNodeNameInput]);

  useEffect(() => {
    if (selectedNode) focusNodeNameInput();
  }, [selectedNode, focusNodeNameInput]);

  if (!selectedNode) {
    return (
      <aside style={paneStyle}>
        <p style={placeholderStyle}>ノードを選択してください</p>
      </aside>
    );
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateNodeName(selectedNode.id, e.target.value);
  };

  return (
    <aside style={paneStyle}>
      <label style={labelStyle} htmlFor="node-name">
        ノード名
      </label>
      <input
        id="node-name"
        ref={inputRef}
        type="text"
        value={selectedNode.name}
        onChange={handleChange}
        style={inputStyle}
      />
      <p style={metaStyle}>id: {selectedNode.id}</p>
      <p style={metaStyle}>kind: {selectedNode.kind}</p>
    </aside>
  );
}
