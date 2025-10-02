'use client';

import type { CSSProperties } from 'react';

import { useEditorStore } from '../../../../../packages/core/store/editor.store';

const wrapperStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const itemBaseStyle: CSSProperties = {
  width: '100%',
  textAlign: 'left',
  padding: '12px',
  borderRadius: 8,
  backgroundColor: '#ffffff',
  border: '1px solid #d1d5db',
  cursor: 'pointer',
};

const titleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#4b5563',
  margin: 0,
};

const nodeNameStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  margin: 0,
};

const nodeMetaStyle: CSSProperties = {
  fontSize: 12,
  color: '#6b7280',
  margin: '4px 0 0',
};

const Canvas = () => {
  const doc = useEditorStore((state) => state.doc);
  const selectedId = useEditorStore((state) => state.selectedId);
  const select = useEditorStore((state) => state.select);

  return (
    <div style={wrapperStyle}>
      <h2 style={titleStyle}>{doc.title}</h2>
      <div style={listStyle}>
        {doc.nodes.map((node) => {
          const textPreview = node.kind === 'text' ? node.props.text : null;
          const isSelected = node.id === selectedId;
          return (
            <button
              key={node.id}
              type='button'
              onClick={() => select(node.id)}
              style={{
                ...itemBaseStyle,
                border: isSelected ? '2px solid #2563eb' : '1px solid #d1d5db',
                boxShadow: isSelected
                  ? '0 0 0 2px rgba(37,99,235,0.1)'
                  : 'none',
              }}
            >
              <p style={nodeNameStyle}>{node.name}</p>
              <p style={nodeMetaStyle}>({node.kind})</p>
              {textPreview ? (
                <p style={nodeMetaStyle}>{textPreview}</p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Canvas;

