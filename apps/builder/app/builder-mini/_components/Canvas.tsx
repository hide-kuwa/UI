'use client';

import type { CSSProperties, KeyboardEvent } from 'react';

import { useEditorStore } from '../../../../../packages/core/store/editor.store';
import type { EditorNode } from '../../../../../packages/core/store/editor.store';

const canvasStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 24,
  borderRadius: 16,
  border: '1px dashed #d1d5db',
  backgroundColor: '#f9fafb',
  minHeight: '100%',
  boxSizing: 'border-box',
};

const emptyStateStyle: CSSProperties = {
  textAlign: 'center',
  color: '#9ca3af',
  fontSize: 14,
};

function getNodeContainerStyle(active: boolean): CSSProperties {
  return {
    padding: 12,
    borderRadius: 12,
    backgroundColor: active ? '#dbeafe' : '#ffffff',
    border: active ? '1px solid #2563eb' : '1px solid transparent',
    cursor: 'pointer',
  };
}

const textStyle: CSSProperties = {
  fontSize: 16,
  color: '#111827',
};

const buttonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 16px',
  borderRadius: 8,
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  fontSize: 14,
};

function CanvasNode({ node, active, onSelect }: { node: EditorNode; active: boolean; onSelect: () => void }) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  };

  if (node.kind === 'text') {
    return (
      <div
        style={getNodeContainerStyle(active)}
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={handleKeyDown}
      >
        <p style={textStyle}>{node.name}</p>
      </div>
    );
  }

  return (
    <div
      style={getNodeContainerStyle(active)}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
    >
      <button type="button" style={buttonStyle}>
        {node.name}
      </button>
    </div>
  );
}

export default function Canvas() {
  const nodes = useEditorStore((s) => s.doc.nodes);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectNode = useEditorStore((s) => s.selectNode);

  if (nodes.length === 0) {
    return (
      <div style={canvasStyle}>
        <p style={emptyStateStyle}>左のペインからノードを追加してください</p>
      </div>
    );
  }

  return (
    <div style={canvasStyle}>
      {nodes.map((node) => (
        <CanvasNode key={node.id} node={node} active={node.id === selectedId} onSelect={() => selectNode(node.id)} />
      ))}
    </div>
  );
}
