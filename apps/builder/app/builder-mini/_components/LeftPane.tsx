'use client';

import type { CSSProperties } from 'react';
import { useCallback, useState } from 'react';

import {
  useEditorStore,
  type NodeKind,
  type EditorNode,
} from '../../../../../packages/core/store/editor.store';
import { useBuilder } from './builderContext';

const containerStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };

const sectionTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#6b7280',
};

const helpStyle: CSSProperties = { fontSize: 12, color: '#9ca3af', marginTop: -6 };

const addRowStyle: CSSProperties = { display: 'flex', gap: 8 };

const addButtonStyle: CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  cursor: 'pointer',
  fontSize: 13,
};

const listStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 };

const emptyStateStyle: CSSProperties = { fontSize: 13, color: '#9ca3af' };

const kindBadgeBase: CSSProperties = {
  fontSize: 12,
  padding: '2px 6px',
  borderRadius: 999,
  backgroundColor: '#e5e7eb',
  color: '#374151',
};

function getKindBadgeStyle(kind: NodeKind): CSSProperties {
  switch (kind) {
    case 'text':
      return { ...kindBadgeBase, backgroundColor: '#ede9fe', color: '#5b21b6' };
    case 'button':
      return { ...kindBadgeBase, backgroundColor: '#d1fae5', color: '#047857' };
    case 'header':
      return { ...kindBadgeBase, backgroundColor: '#fee2e2', color: '#b91c1c' };
    case 'footer':
      return { ...kindBadgeBase, backgroundColor: '#dbeafe', color: '#1d4ed8' };
    default:
      return kindBadgeBase;
  }
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
    default:
      return kind;
  }
}

function getItemStyle(active: boolean, showTop: boolean, showBottom: boolean, dragging: boolean): CSSProperties {
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
    cursor: 'grab',
    opacity: dragging ? 0.5 : 1,
    boxShadow: showTop
      ? 'inset 0 2px 0 0 #2563eb'
      : showBottom
      ? 'inset 0 -2px 0 0 #2563eb'
      : 'none',
  };
}

const actionsStyle: CSSProperties = { display: 'flex', gap: 6 };

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
  const reorderNode = useEditorStore((s) => s.reorderNode);

  const { addNode, focusNodeNameInput } = useBuilder();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleAdd = useCallback(
    (kind: NodeKind) => {
      addNode(kind);
      setTimeout(focusNodeNameInput, 0);
    },
    [addNode, focusNodeNameInput]
  );

  const onDragStart = (id: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDropIndex(null);
  };

  const onDragOverItem = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const before = e.clientY - rect.top < rect.height / 2;
    setDropIndex(before ? index : index + 1);
    e.dataTransfer.dropEffect = 'move';
  };

  const onDragLeaveItem = () => {
    // no-op
  };

  const onDragOverList = (e: React.DragEvent) => {
    e.preventDefault();
    if (nodes.length > 0 && dropIndex == null) setDropIndex(nodes.length);
  };

  const onDropList = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id || dropIndex == null) return;

    const from = nodes.findIndex((n) => n.id === id);
    if (from === -1) return;

    const to = dropIndex > from ? dropIndex - 1 : dropIndex;
    if (to !== from) reorderNode(id, to);

    setDraggingId(null);
    setDropIndex(null);
  };

  const handleSelect = (id: string) => () => selectNode(id);
  const handleDuplicate = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNode(id);
  };
  const handleDelete = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };
  const handleMoveUp = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    moveNode(id, 'up');
  };
  const handleMoveDown = (id: string) => (e: React.MouseEvent) => {
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
        <p style={helpStyle}>ドラッグ＆ドロップで並べ替えできます</p>
      </section>

      <section>
        <p style={sectionTitleStyle}>プリセット</p>
        <div style={addRowStyle}>
          <button type="button" style={addButtonStyle} onClick={() => handleAdd('header')}>
            ヘッダー
          </button>
          <button type="button" style={addButtonStyle} onClick={() => handleAdd('footer')}>
            フッター
          </button>
        </div>
        <p style={helpStyle}>ドラッグで移動、右下辺のホットゾーンでリサイズ</p>
      </section>

      <section onDragOver={onDragOverList} onDrop={onDropList}>
        <p style={sectionTitleStyle}>ノード一覧</p>
        <div style={listStyle}>
          {nodes.length === 0 ? (
            <p style={emptyStateStyle}>まだノードがありません</p>
          ) : (
            nodes.map((node: EditorNode, index) => {
              const active = node.id === selectedId;
              const showTop = dropIndex === index;
              const showBottom = dropIndex === index + 1;
              const dragging = draggingId === node.id;

              return (
                <div
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  draggable
                  onDragStart={onDragStart(node.id)}
                  onDragEnd={onDragEnd}
                  onDragOver={onDragOverItem(index)}
                  onDragLeave={onDragLeaveItem}
                  onClick={handleSelect(node.id)}
                  style={getItemStyle(active, showTop, showBottom, dragging)}
                >
                  <span>
                    {node.name}{' '}
                    <span style={getKindBadgeStyle(node.kind)}>{kindLabel(node.kind)}</span>
                  </span>
                  <div style={actionsStyle} onClick={(e) => e.preventDefault()}>
                    <button type="button" title="上へ" style={actionBtnStyle} onClick={handleMoveUp(node.id)}>
                      ↑
                    </button>
                    <button type="button" title="下へ" style={actionBtnStyle} onClick={handleMoveDown(node.id)}>
                      ↓
                    </button>
                    <button type="button" title="複製" style={actionBtnStyle} onClick={handleDuplicate(node.id)}>
                      ⎘
                    </button>
                    <button type="button" title="削除" style={actionBtnStyle} onClick={handleDelete(node.id)}>
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
