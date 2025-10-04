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

const SNAP = 8;
const RESIZE_ZONE = 12; // 右下隅のホットゾーン
const GUIDE_TOL = 6;    // スナップ許容差（画面上のピクセル基準）
const snapGrid = (v: number) => Math.round(v / SNAP) * SNAP;

export default function Canvas() {
  const nodes = useEditorStore((s) => s.doc.nodes);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectNode = useEditorStore((s) => s.selectNode);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const nudgeNode = useEditorStore((s) => s.nudgeNode);

  // viewport (パン/ズーム)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);
  const panningRef = useRef<{ x: number; y: number; sx: number; sy: number } | null>(null);

  // ガイド線の状態
  const [guide, setGuide] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });

  // ドラッグ/リサイズの状態
  const dragRef = useRef<{
    id: string; startX: number; startY: number; baseX: number; baseY: number; dup?: boolean
  } | null>(null);
  const resizeRef = useRef<{
    id: string; startX: number; startY: number; baseW: number; baseH: number
  } | null>(null);

  // Spaceでパン、矢印キーでナッジ、Cmd/Ctrl +/-/0 でズーム
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceHeld(e.type === 'keydown');

      // ズーム系
      if (e.ctrlKey || e.metaKey) {
        if (e.type === 'keydown') {
          if (e.key === '=' || e.key === '+') { e.preventDefault(); setZoom((z) => Math.min(2, z + 0.1)); return; }
          if (e.key === '-') { e.preventDefault(); setZoom((z) => Math.max(0.5, z - 0.1)); return; }
          if (e.key === '0') { e.preventDefault(); setZoom(1); setPan({ x: 0, y: 0 }); return; }
        }
      }

      // ナッジ
      if (!selectedId) return;
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.isContentEditable) return;
      const tag = el.tagName?.toLowerCase?.();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const step = e.shiftKey ? 10 : 1;
      if (e.type === 'keydown') {
        if (e.key === 'ArrowUp')    { e.preventDefault(); nudgeNode(selectedId, 0, -step); }
        if (e.key === 'ArrowDown')  { e.preventDefault(); nudgeNode(selectedId, 0,  step); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); nudgeNode(selectedId, -step, 0); }
        if (e.key === 'ArrowRight') { e.preventDefault(); nudgeNode(selectedId,  step, 0); }
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [selectedId, nudgeNode]);

  // Ctrl/Cmd + ホイールでズーム
  const onWheel: React.WheelEventHandler = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const delta = -e.deltaY;
    const next = Math.min(2, Math.max(0.5, zoom + (delta > 0 ? 0.05 : -0.05)));
    setZoom(next);
  };

  // Space中だけパン
  const onStageMouseDown = (e: ReactMouseEvent) => {
    if (!spaceHeld) return;
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

  // --- スマートガイド用ユーティリティ ---
  const buildGuideLines = (excludeId?: string) => {
    const xs: number[] = [];
    const ys: number[] = [];
    nodes.forEach((n) => {
      if (n.id === excludeId) return;
      const p: any = n.props ?? {};
      const x = p.x ?? 0;
      const y = p.y ?? 0;
      const w = p.width ?? (n.kind === 'text' ? 300 : 160);
      const h = p.height ?? (n.kind === 'text' ? 80 : 40);
      xs.push(x, x + w / 2, x + w);
      ys.push(y, y + h / 2, y + h);
    });
    return { xs, ys };
  };

  const snapToGuidesPos = (
    nx: number,
    ny: number,
    w: number,
    h: number,
    excludeId: string,
  ) => {
    const tol = GUIDE_TOL / zoom; // 画面上の見かけピクセル基準
    const { xs, ys } = buildGuideLines(excludeId);

    let snappedX: number | null = null;
    let snappedY: number | null = null;
    let bestDx = tol + 1;
    let bestDy = tol + 1;

    // x方向（左/中央/右）候補
    const candX = [
      { kind: 'left', val: nx },
      { kind: 'center', val: nx + w / 2 },
      { kind: 'right', val: nx + w },
    ];
    xs.forEach((gx) => {
      candX.forEach((c) => {
        const d = Math.abs(c.val - gx);
        if (d <= tol && d < bestDx) {
          bestDx = d;
          snappedX = gx;
          if (c.kind === 'left')  nx = gx;
          if (c.kind === 'center') nx = gx - w / 2;
          if (c.kind === 'right') nx = gx - w;
        }
      });
    });

    // y方向（上/中央/下）候補
    const candY = [
      { kind: 'top', val: ny },
      { kind: 'center', val: ny + h / 2 },
      { kind: 'bottom', val: ny + h },
    ];
    ys.forEach((gy) => {
      candY.forEach((c) => {
        const d = Math.abs(c.val - gy);
        if (d <= tol && d < bestDy) {
          bestDy = d;
          snappedY = gy;
          if (c.kind === 'top')    ny = gy;
          if (c.kind === 'center') ny = gy - h / 2;
          if (c.kind === 'bottom') ny = gy - h;
        }
      });
    });

    return { nx, ny, guideX: snappedX, guideY: snappedY };
  };

  const snapToGuidesSize = (
    x: number,
    y: number,
    w: number,
    h: number,
    excludeId: string,
  ) => {
    const tol = GUIDE_TOL / zoom;
    const { xs, ys } = buildGuideLines(excludeId);

    let snappedX: number | null = null;
    let snappedY: number | null = null;

    // 右端（x + w）をスナップ
    let right = x + w;
    let bestDx = tol + 1;
    xs.forEach((gx) => {
      const d = Math.abs(gx - right);
      if (d <= tol && d < bestDx) {
        bestDx = d;
        snappedX = gx;
        right = gx;
      }
    });
    w = Math.max(40, right - x);

    // 下端（y + h）をスナップ
    let bottom = y + h;
    let bestDy = tol + 1;
    ys.forEach((gy) => {
      const d = Math.abs(gy - bottom);
      if (d <= tol && d < bestDy) {
        bestDy = d;
        snappedY = gy;
        bottom = gy;
      }
    });
    h = Math.max(32, bottom - y);

    return { w, h, guideX: snappedX, guideY: snappedY };
  };

  // ノードドラッグ（Alt/Cmdで複製ドラッグ、Shiftで軸ロック）
  const startDrag = (node: EditorNode, e: ReactMouseEvent) => {
    if (spaceHeld) return; // パン中は無効
    selectNode(node.id);

    const props: any = node.props ?? {};
    const dup = e.altKey || e.metaKey;
    if (dup) {
      const newId = duplicateNode(node.id);
      const copy = nodes.find((n) => n.id === newId)!;
      const cp: any = copy.props ?? {};
      dragRef.current = {
        id: newId,
        startX: e.clientX,
        startY: e.clientY,
        baseX: cp.x ?? 0,
        baseY: cp.y ?? 0,
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
      const thisNode = nodes.find((n) => n.id === dragRef.current!.id);
      const p: any = thisNode?.props ?? {};
      const w = p.width ?? (thisNode?.kind === 'text' ? 300 : 160);
      const h = p.height ?? (thisNode?.kind === 'text' ? 80 : 40);

      let nx = dragRef.current.baseX + dx;
      let ny = dragRef.current.baseY + dy;

      // Shiftで軸ロック
      if (ev.shiftKey) {
        if (Math.abs(dx) > Math.abs(dy)) ny = dragRef.current.baseY;
        else nx = dragRef.current.baseX;
      }

      // 近接スナップ（他ノード）優先
      const snapped = snapToGuidesPos(nx, ny, w, h, dragRef.current.id);
      nx = snapped.nx;
      ny = snapped.ny;
      setGuide({ x: snapped.guideX ?? null, y: snapped.guideY ?? null });

      // ガイドが出ていない軸はグリッドスナップ
      if (snapped.guideX == null) nx = snapGrid(nx);
      if (snapped.guideY == null) ny = snapGrid(ny);

      updateNodeProps(dragRef.current.id, { x: nx, y: ny } as any);
    };
    const onUp = () => {
      dragRef.current = null;
      setGuide({ x: null, y: null });
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // リサイズ（右下ホットゾーン）
  const startResize = (node: EditorNode, e: ReactMouseEvent) => {
    e.stopPropagation();
    selectNode(node.id);
    const props: any = node.props ?? {};
    const x = props.x ?? 0;
    const y = props.y ?? 0;

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

      let w = Math.max(40, resizeRef.current.baseW + dx);
      let h = Math.max(32, resizeRef.current.baseH + dy);

      // 近接スナップ（右/下端）
      const snapped = snapToGuidesSize(x, y, w, h, resizeRef.current.id);
      w = snapped.w;
      h = snapped.h;
      setGuide({ x: snapped.guideX ?? null, y: snapped.guideY ?? null });

      // ガイドが出ていない軸はグリッドスナップ
      if (snapped.guideX == null) w = Math.max(40, snapGrid(w));
      if (snapped.guideY == null) h = Math.max(32, snapGrid(h));

      updateNodeProps(resizeRef.current.id, { width: w, height: h } as any);
    };
    const onUp = () => {
      resizeRef.current = null;
      setGuide({ x: null, y: null });
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
        {/* ガイド線（ステージ内に描画） */}
        {guide.x != null && (
          <div
            style={{
              position: 'absolute',
              left: guide.x,
              top: 0,
              width: 1,
              height: '100%',
              background: '#f43f5e',
              pointerEvents: 'none',
            }}
          />
        )}
        {guide.y != null && (
          <div
            style={{
              position: 'absolute',
              top: guide.y,
              left: 0,
              height: 1,
              width: '100%',
              background: '#f43f5e',
              pointerEvents: 'none',
            }}
          />
        )}

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
                if (spaceHeld) return;
                // 右下ホットゾーン判定
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const localX = e.clientX - rect.left;
                const localY = e.clientY - rect.top;
                if (localX >= rect.width - RESIZE_ZONE && localY >= rect.height - RESIZE_ZONE) {
                  startResize(node, e);
                } else {
                  startDrag(node, e);
                }
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
