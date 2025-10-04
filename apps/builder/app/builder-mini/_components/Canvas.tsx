'use client';

import { useCallback, useRef, useState } from 'react';
import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';

import { useEditorStore, type EditorNode } from '../../../../../packages/core/store/editor.store';

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

const emptyStateStyle: CSSProperties = { textAlign: 'center', color: '#9ca3af', fontSize: 14 };

function getNodeContainerStyle(
  active: boolean,
  showTop: boolean,
  showBottom: boolean,
  dragging: boolean,
): CSSProperties {
  return {
    padding: 12,
    borderRadius: 12,
    backgroundColor: active ? '#dbeafe' : '#ffffff',
    border: active ? '1px solid #2563eb' : '1px solid transparent',
    cursor: 'grab',
    opacity: dragging ? 0.5 : 1,
    position: 'relative',
    boxShadow: showTop
      ? 'inset 0 2px 0 0 #2563eb'
      : showBottom
      ? 'inset 0 -2px 0 0 #2563eb'
      : 'none',
  };
}

const textStyle: CSSProperties = { fontSize: 16, color: '#111827' };

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

const resizeHandleStyle: CSSProperties = {
  position: 'absolute',
  right: 4,
  bottom: 4,
  width: 12,
  height: 12,
  borderRadius: 2,
  border: '1px solid #2563eb',
  background: '#eff6ff',
  cursor: 'nwse-resize',
};

function CanvasNode({
  node,
  active,
  onSelect,
  draggableProps,
  showTop,
  showBottom,
  dragging,
}: {
  node: EditorNode;
  active: boolean;
  onSelect: () => void;
  draggableProps: {
    draggable: true;
    onDragStart: (e: ReactDragEvent) => void;
    onDragEnd: () => void;
    onDragOver: (e: ReactDragEvent<HTMLDivElement>) => void;
    onDragLeave: () => void;
  };
  showTop: boolean;
  showBottom: boolean;
  dragging: boolean;
}) {
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const [live, setLive] = useState<{ w: number; h: number } | null>(null);
  const startRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const liveRef = useRef<{ w: number; h: number } | null>(null);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  };

  const startResize = useCallback(
    (e: ReactMouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const w = (node.props as any)?.width ?? 240;
      const h = (node.props as any)?.height ?? 80;
      startRef.current = { x: e.clientX, y: e.clientY, w, h };
      liveRef.current = { w, h };
      setLive({ w, h });

      const onMove = (ev: MouseEvent) => {
        if (!startRef.current) return;
        const dx = ev.clientX - startRef.current.x;
        const dy = ev.clientY - startRef.current.y;
        const nextW = Math.max(40, Math.round(startRef.current.w + dx));
        const nextH = Math.max(32, Math.round(startRef.current.h + dy));
        const next = { w: nextW, h: nextH };
        liveRef.current = next;
        setLive(next);
      };

      const onUp = () => {
        const finalSize = liveRef.current;
        if (startRef.current && finalSize) {
          updateNodeProps(node.id, { width: finalSize.w, height: finalSize.h } as any);
        }
        startRef.current = null;
        liveRef.current = null;
        setLive(null);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [node.id, node.props, updateNodeProps],
  );

  const w = live?.w ?? (node.props as any)?.width ?? undefined;
  const h = live?.h ?? (node.props as any)?.height ?? undefined;
  const sizedStyle: CSSProperties = {
    ...(w !== undefined ? { width: w } : {}),
    ...(h !== undefined ? { height: h } : {}),
  };

  if (node.kind === 'text') {
    const textProps = node.props ?? { text: node.name, fontSize: textStyle.fontSize ?? 16 };
    const displayText = textProps.text ?? node.name;
    const fontSize = textProps.fontSize ?? textStyle.fontSize ?? 16;

    return (
      <div
        style={{ ...getNodeContainerStyle(active, showTop, showBottom, dragging), ...sizedStyle }}
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={handleKeyDown}
        {...draggableProps}
      >
        <p style={{ ...textStyle, fontSize }}>{displayText}</p>
        <div style={resizeHandleStyle} onMouseDown={startResize} />
      </div>
    );
  }

  return (
    <div
      style={{ ...getNodeContainerStyle(active, showTop, showBottom, dragging), ...sizedStyle }}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      {...draggableProps}
    >
      <button type="button" style={buttonStyle}>
        {node.props?.label ?? node.name}
      </button>
      <div style={resizeHandleStyle} onMouseDown={startResize} />
    </div>
  );
}

export default function Canvas() {
  const nodes = useEditorStore((s) => s.doc.nodes);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectNode = useEditorStore((s) => s.selectNode);
  const reorderNode = useEditorStore((s) => s.reorderNode);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const onDragStart = (id: string) => (e: ReactDragEvent) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDropIndex(null);
  };

  const onDragOverItem = (index: number) => (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const before = e.clientY - rect.top < rect.height / 2;
    setDropIndex(before ? index : index + 1);
    e.dataTransfer.dropEffect = 'move';
  };

  const onDragLeaveItem = () => {
    // no-op
  };

  const onDragOverCanvas = (e: ReactDragEvent) => {
    e.preventDefault();
    if (nodes.length > 0 && dropIndex == null) setDropIndex(nodes.length);
  };

  const onDropCanvas = (e: ReactDragEvent) => {
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

  if (nodes.length === 0) {
    return (
      <div style={canvasStyle}>
        <p style={emptyStateStyle}>左のペインからノードを追加してください</p>
      </div>
    );
  }

  return (
    <div style={canvasStyle} onDragOver={onDragOverCanvas} onDrop={onDropCanvas}>
      {nodes.map((node, index) => {
        const active = node.id === selectedId;
        const showTop = dropIndex === index;
        const showBottom = dropIndex === index + 1;
        const dragging = draggingId === node.id;
        return (
          <CanvasNode
            key={node.id}
            node={node}
            active={active}
            onSelect={() => selectNode(node.id)}
            draggableProps={{
              draggable: true,
              onDragStart: onDragStart(node.id),
              onDragEnd,
              onDragOver: onDragOverItem(index),
              onDragLeave: onDragLeaveItem,
            }}
            showTop={showTop}
            showBottom={showBottom}
            dragging={dragging}
          />
        );
      })}
    </div>
  );
}
