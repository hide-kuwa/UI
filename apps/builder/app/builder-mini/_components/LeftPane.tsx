'use client';

import type { CSSProperties, MouseEvent } from 'react';
import { useCallback } from 'react';

import {
  useEditorStore,
  type NodeKind,
  type EditorNode,
} from '../../../../../packages/core/store/editor.store';
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

const helpStyle: CSSProperties = {
  fontSize: 12,
  color: '#9ca3af',
  marginTop: -6,
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

function getKindBadgeStyle(kind: NodeKind): CSSProperties {
  return {
    ...kindBadgeBase,
    backgroundColor: kind === 'text' ? '#ede9fe' : '#d1fae5',
    color: kind === 'text' ? '#5b21b6' : '#047857',
  };
}

function kindLabel(kind: NodeKind): string {
  return kind === 'text' ? 'テキスト' : 'ボタン';
}

function getItemStyle(active: boolean): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: active ? '1px solid #2563eb' : '1px solid #e5e7eb',
    backgroundColor: active ? '#eff6ff' : '#ffffff',
    cursor: 'pointer',
  };
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  gap: 6,
};

const actionBtnStyle: CSSProperties = {
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid #e5e7eb',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 12,
};

export default function LeftPane() {
  const nodes = useEditorStore((s) => s.doc.nodes);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectNode = useEditorStore((s) => s.selectNode);

  const deleteNode = useEditorStore((s) => s.deleteNode);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const moveNode = useEditorStore((s) => s.moveNode);

  const { addNode, focusNodeNameInput } = useBuilder();

  const handleAdd = useCallback(
    (kind: NodeKind) => {
      addNode(kind);
      setTimeout(focusNodeNameInput, 0);
    },
    [addNode, focusNodeNameInput]
  );

  const handleSelect = (id: string) => () => selectNode(id);

  const handleDuplicate = (id: string) => (e: MouseEvent) => {
    e.stopPropagation();
    duplicateNode(id);
  };

  const handleDelete = (id: string) => (e: MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const handleMoveUp = (id: string) => (e: MouseEvent) => {
    e.stopPropagation();
    moveNode(id, 'up');
  };

  const handleMoveDown = (id: string) => (e: MouseEvent) => {
    e.stopPropagation();
    moveNode(id, 'down');
  };

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
        <p style={helpStyle}>ショートカット: T でテキスト、B でボタン追加</p>
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
                <div
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  onClick={handleSelect(node.id)}
                  style={getItemStyle(active)}
                >
                  <span>
                    {node.name}{' '}
                    <span style={getKindBadgeStyle(node.kind)}>{kindLabel(node.kind)}</span>
                  </span>
                  <div style={actionsStyle} onClick={(e) => e.preventDefault()}>
                    <button type="button" title="上へ (Alt+↑)" style={actionBtnStyle} onClick={handleMoveUp(node.id)}>
                      ↑
                    </button>
                    <button type="button" title="下へ (Alt+↓)" style={actionBtnStyle} onClick={handleMoveDown(node.id)}>
                      ↓
                    </button>
                    <button
                      type="button"
                      title="複製 (Cmd/Ctrl+D)"
                      style={actionBtnStyle}
                      onClick={handleDuplicate(node.id)}
                    >
                      ⎘
                    </button>
                    <button
                      type="button"
                      title="削除 (Delete/Backspace)"
                      style={actionBtnStyle}
                      onClick={handleDelete(node.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <p style={helpStyle}>
          削除: Delete / Backspace ・ 複製: Cmd/Ctrl+D ・ 移動: Alt+↑/↓
        </p>
      </section>
    </div>
  );
}
