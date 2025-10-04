'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { CSSProperties, ChangeEvent } from 'react';

import { useEditorStore, type EditorNode } from '../../../../../packages/core/store/editor.store';
import { useBuilder } from './builderContext';

const paneStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 };
const placeholderStyle: CSSProperties = { color: '#9ca3af', fontSize: 14, margin: 0 };
const labelStyle: CSSProperties = { fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' };
const inputStyle: CSSProperties = { padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 };
const metaStyle: CSSProperties = { fontSize: 12, color: '#6b7280', margin: 0 };

export default function RightPane() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const doc = useEditorStore((s) => s.doc);
  const updateNodeName = useEditorStore((s) => s.updateNodeName);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const { attachNodeNameInput, focusNodeNameInput } = useBuilder();

  const inputRef = useRef<HTMLInputElement>(null);

  const selectedNode = useMemo(() => {
    if (!selectedId) return null;
    return doc.nodes.find((node: EditorNode) => node.id === selectedId) ?? null;
  }, [doc.nodes, selectedId]);

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

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateNodeName(selectedNode.id, event.target.value);
  };

  const handleTextValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateNodeProps(selectedNode.id, { text: e.target.value });
  };

  const handleFontSizeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (Number.isNaN(value)) return;
    updateNodeProps(selectedNode.id, { fontSize: value });
  };

  const handleButtonLabelChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateNodeProps(selectedNode.id, { label: e.target.value });
  };

  return (
    <aside style={paneStyle}>
      <label style={labelStyle} htmlFor="node-name">ノード名</label>
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

      {selectedNode.kind === 'text' ? (
        <>
          <label style={labelStyle} htmlFor="node-text">表示テキスト</label>
          <input
            id="node-text"
            type="text"
            value={selectedNode.props.text}
            onChange={handleTextValueChange}
            style={inputStyle}
          />
          <label style={labelStyle} htmlFor="node-font-size">フォントサイズ</label>
          <input
            id="node-font-size"
            type="number"
            min={8}
            max={128}
            step={1}
            value={selectedNode.props.fontSize}
            onChange={handleFontSizeChange}
            style={inputStyle}
          />
        </>
      ) : null}

      {selectedNode.kind === 'button' ? (
        <>
          <label style={labelStyle} htmlFor="node-label">ラベル</label>
          <input
            id="node-label"
            type="text"
            value={selectedNode.props.label}
            onChange={handleButtonLabelChange}
            style={inputStyle}
          />
        </>
      ) : null}
    </aside>
  );
}
