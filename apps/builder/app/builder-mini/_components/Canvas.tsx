'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react';
import { useEditorStore, type EditorNode } from '../../../../../packages/core/store/editor.store';

const wrapperStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  borderRadius: 16,
  border: '1px dashed #d1d5db',
  backgroundColor: '#f9fafb',
  overflow: 'hidden',
};

const stageStyleBase: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: 2000,
  height: 1400,
  backgroundImage: `
    linear-gradient(#f3f4f6 1px, transparent 1px),
    linear-gradient(90deg, #f3f4f6 1px, transparent 1px)
  `,
  backgroundSize: '8px 8px, 8px 8px',
};

const nodeBaseStyle: CSSProperties = {
  position: 'absolute',
  borderRadius: 12,
  background: '#fff',
  border: '1px solid transparent',
  boxSizing: 'border-box',
};

const textStyle: CSSProperties = { fontSize: 16, color: '#111827' };
const buttonInner: CSSProperties = {
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

const resizeHandle: CSSProperties = {
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

const SNAP = 8;
const snap = (v: number) => Math.round(v / SNAP) * SNAP;

export default function Canvas() {
  const nodes = useEditorStore((s) => s.doc.nodes);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectNode = useEditorStore((s) => s.selectNode);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const nudgeNode = useEditorStore((s) => s.nudgeNode);

  // viewport
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);
  const panningRef = useRef<{ x: number; y: number; sx: number; sy: number } | null>(null);

  // dragging/resizing one node
  const dragRef = useRef<{ id: string; startX: number; startY: number; baseX: number; baseY: number; dup?: boolean } | null>(null);
  const resizeRef = useRef<{ id: string; startX: number; startY: number; baseW: number; baseH: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceHeld(e.type === 'keydown');
      if (!selectedId) return;
      if ((e.target as HTMLElement)?.isContentEditable) return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase?.();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const step = e.shiftKey ? 10 : 1;
      if (e.type === 'keydown') {
        if (e.key === 'ArrowUp') { e.preventDefault(); nudgeNode(selectedId, 0, -step); }
        if (e.key === 'ArrowDown') { e.preventDefault(); nudgeNode(selectedId, 0, step); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); nudgeNode(selectedId, -step, 0); }
        if (e.key === 'ArrowRight') { e.preventDefault(); nudgeNode(selectedId, step, 0); }
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [selectedId, nudgeNode]);

  const onWheel: React.WheelEventHandler = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const delta = -e.deltaY;
    const next = Math.min(2, Math.max(0.5, zoom + (delta > 0 ? 0.05 : -0.05)));
    setZoom(next);
  };

  const onStageMouseDown = (e: ReactMouseEvent) => {
    if (!spaceHeld) return; // only pan with space
    panningRef.current = { x: pan.x, y: pan.y, sx: e.clientX, sy: e.clientY };
    const onMove = (ev: MouseEvent) => {
      if (!panningRef.current) return;
      setPan({
        x: panningRef.current.x + (ev.clientX - panningRef.current.sx),
        y: panningRef.current.y + (ev.clientY - panningRef.current.sy),
      });
    };
    const onUp = () => {
      panningRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startDrag = (node: EditorNode, e: ReactMouseEvent) => {
    if (spaceHeld) return; // do not drag while panning
    selectNode(node.id);
    const props: any = node.props ?? {};
    const dup = e.altKey || e.metaKey; // Alt(or Cmd) drag to duplicate
    if (dup) {
      const newId = duplicateNode(node.id);
      const copy = nodes.find((n) => n.id === newId)!;
      dragRef.current = {
        id: newId,
        startX: e.clientX,
        startY: e.clientY,
        baseX: (copy.props as any).x ?? 0,
        baseY: (copy.props as any).y ?? 0,
        dup: true,
      };
      selectNode(newId);
    } else {
      dragRef.current = {
        id: node.id,
        startX: e.clientX,
        startY: e.clientY,
        baseX: props.x ?? 0,
        baseY: props.y ?? 0,
      };
    }

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = (ev.clientX - dragRef.current.startX) / zoom;
      const dy = (ev.clientY - dragRef.current.startY) / zoom;
      let nx = dragRef.current.baseX + dx;
      let ny = dragRef.current.baseY + dy;

      if (ev.shiftKey) {
        // axis lock
        if (Math.abs(dx) > Math.abs(dy)) ny = dragRef.current.baseY;
        else nx = dragRef.current.baseX;
      }

      // snap
      updateNodeProps(dragRef.current.id, { x: snap(nx), y: snap(ny) } as any);
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startResize = (node: EditorNode, e: ReactMouseEvent) => {
    e.stopPropagation();
    selectNode(node.id);
    const props: any = node.props ?? {};
    resizeRef.current = {
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      baseW: props.width ?? 120,
      baseH: props.height ?? 48,
    };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const dx = (ev.clientX - resizeRef.current.startX) / zoom;
      const dy = (ev.clientY - resizeRef.current.startY) / zoom;
      const w = Math.max(40, snap(resizeRef.current.baseW + dx));
      const h = Math.max(32, snap(resizeRef.current.baseH + dy));
      updateNodeProps(resizeRef.current.id, { width: w, height: h } as any);
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div style={wrapperStyle} onWheel={onWheel}>
      <div
        style={{
          ...stageStyleBase,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          backgroundSize: `${8 * zoom}px ${8 * zoom}px, ${8 * zoom}px ${8 * zoom}px`,
          cursor: spaceHeld ? 'grab' : 'default',
        }}
        onMouseDown={onStageMouseDown}
      >
        {nodes.map((node) => {
          const p: any = node.props ?? {};
          const x = p.x ?? 0;
          const y = p.y ?? 0;
          const w = p.width ?? (node.kind === 'text' ? 300 : 160);
          const h = p.height ?? (node.kind === 'text' ? 80 : 40);
          const active = node.id === selectedId;

          return (
            <div
              key={node.id}
              role="button"
              tabIndex={0}
              onMouseDown={(e) => {
                // リサイズハンドルではない領域をドラッグ開始
                const target = e.target as HTMLElement;
                if (target.dataset?.resizeHandle === '1') return;
                startDrag(node, e);
              }}
              onClick={() => selectNode(node.id)}
              style={{
                ...nodeBaseStyle,
                left: x,
                top: y,
                width: w,
                height: h,
                border: active ? '1px solid #2563eb' : '1px solid transparent',
                boxShadow: active ? '0 0 0 3px #dbeafe' : 'none',
              }}
            >
              {node.kind === 'text' ? (
                <div style={{ padding: 12, width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
                  <p style={{ ...textStyle, fontSize: (p.fontSize ?? 16) }}>{p.text ?? node.name}</p>
                </div>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
                  <button type="button" style={buttonInner}>{p.label ?? node.name}</button>
                </div>
              )}
              <div
                data-resize-handle="1"
                style={resizeHandle}
                onMouseDown={(ev) => startResize(node, ev)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
