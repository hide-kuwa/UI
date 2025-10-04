'use client';

import { useCallback } from 'react';
import type { CSSProperties } from 'react';

import { useEditorStore, type EditorNode, type EditorStoreState, type NodeKind } from '../../../../../packages/core/store/editor.store';
import { useBuilder } from './builderContext';

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#6b7280',
};

const addRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
};

const addButtonStyle: CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  cursor: 'pointer',
  fontSize: 13,
};

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const emptyStateStyle: CSSProperties = {
  fontSize: 13,
  color: '#9ca3af',
};

const kindBadgeBase: CSSProperties = {
  fontSize: 12,
  padding: '2px 6px',
  borderRadius: 999,
  backgroundColor: '#e5e7eb',
  color: '#374151',
};

function getNodeButtonStyle(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: active ? '1px solid #2563eb' : '1px solid #e5e7eb',
    backgroundColor: active ? '#eff6ff' : '#ffffff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    color: '#111827',
  };
}

function getKindBadgeStyle(kind: NodeKind): CSSProperties {
  if (kind === 'text') {
    return { ...kindBadgeBase, backgroundColor: '#ede9fe', color: '#5b21b6' };
  }
  if (kind === 'button') {
    return { ...kindBadgeBase, backgroundColor: '#d1fae5', color: '#047857' };
  }
  return kindBadgeBase;
}

function kindLabel(kind: NodeKind): string {
  switch (kind) {
    case 'text':
      return 'テキスト';
    case 'button':
      return 'ボタン';
    case 'header':
      return 'ヘッダー';
    case 'footer':
      return 'フッター';
    case 'sidebar':
      return 'サイドバー';
    case 'hud':
      return 'HUD';
    case 'image':
      return 'イメージ';
    default:
      return kind;
  }
}

export default function LeftPane() {
  const nodes = useEditorStore((state: EditorStoreState) => state.doc.nodes);
  const selectedId = useEditorStore((state: EditorStoreState) => state.selectedId);
  const selectNode = useEditorStore((state: EditorStoreState) => state.selectNode);
  const { addNode, focusNodeNameInput } = useBuilder();

  const handleAdd = useCallback(
    (kind: NodeKind) => {
      addNode(kind);
      setTimeout(focusNodeNameInput, 0);
    },
    [addNode, focusNodeNameInput],
  );

  return (
    <div style={containerStyle}>
      <section>
        <p style={sectionTitleStyle}>ノードを追加</p>
        <div style={addRowStyle}>
          <button type="button" style={addButtonStyle} onClick={() => handleAdd('text')}>
            テキスト
          </button>
          <button type="button" style={addButtonStyle} onClick={() => handleAdd('button')}>
            ボタン
          </button>
        </div>
      </section>

      <section>
        <p style={sectionTitleStyle}>ノード一覧</p>
        <div style={listStyle}>
          {nodes.length === 0 ? (
            <p style={emptyStateStyle}>まだノードがありません</p>
          ) : (
            nodes.map((node: EditorNode) => {
              const active = node.id === selectedId;
              return (
                <button
                  key={node.id}
                  type="button"
                  style={getNodeButtonStyle(active)}
                  onClick={() => selectNode(node.id)}
                >
                  <span>{node.name}</span>
                  <span style={getKindBadgeStyle(node.kind)}>{kindLabel(node.kind)}</span>
                </button>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
