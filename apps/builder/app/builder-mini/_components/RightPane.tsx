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

  const handleWidthChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (Number.isNaN(value)) return;
    updateNodeProps(selectedNode.id, { width: Math.max(40, value) } as any);
  };

  const handleHeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (Number.isNaN(value)) return;
    updateNodeProps(selectedNode.id, { height: Math.max(32, value) } as any);
  };

  const handleXChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (!Number.isNaN(v)) updateNodeProps(selectedNode.id, { x: v } as any);
  };
  const handleYChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (!Number.isNaN(v)) updateNodeProps(selectedNode.id, { y: v } as any);
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

      <label style={labelStyle} htmlFor="node-x">X (px)</label>
      <input
        id="node-x"
        type="number"
        step={1}
        value={(selectedNode.props as any).x ?? 0}
        onChange={handleXChange}
        style={inputStyle}
      />

      <label style={labelStyle} htmlFor="node-y">Y (px)</label>
      <input
        id="node-y"
        type="number"
        step={1}
        value={(selectedNode.props as any).y ?? 0}
        onChange={handleYChange}
        style={inputStyle}
      />

      <label style={labelStyle} htmlFor="node-width">幅 (px)</label>
      <input
        id="node-width"
        type="number"
        min={40}
        step={1}
        value={(selectedNode.props as any).width ?? ''}
        onChange={handleWidthChange}
        style={inputStyle}
      />

      <label style={labelStyle} htmlFor="node-height">高さ (px)</label>
      <input
        id="node-height"
        type="number"
        min={32}
        step={1}
        value={(selectedNode.props as any).height ?? ''}
        onChange={handleHeightChange}
        style={inputStyle}
      />

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
