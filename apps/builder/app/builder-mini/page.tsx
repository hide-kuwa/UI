// Responsibility: Figma-like 3-pane layout shell (Left/Canvas/Right). Minimal UI only.
'use client';

import type { CSSProperties } from 'react';

import HeaderBar from './_components/HeaderBar';
import Canvas from './_components/Canvas';
import RightPane from './_components/RightPane';
import LeftPane from './_components/LeftPane';

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
};

const panesStyle: CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
};

const leftPaneStyle: CSSProperties = {
  width: 240,
  borderRight: '1px solid #e5e7eb',
  padding: '16px',
  overflowY: 'auto',
};

const canvasPaneStyle: CSSProperties = {
  flex: 1,
  padding: '16px',
  overflow: 'auto',
};

const rightPaneStyle: CSSProperties = {
  width: 320,
  borderLeft: '1px solid #e5e7eb',
  padding: '16px',
  overflowY: 'auto',
};

const BuilderMiniPage = () => {
  return (
    <div style={containerStyle}>
      <HeaderBar />
      <main style={panesStyle}>
        <section style={leftPaneStyle}>
          <LeftPane />
        </section>
        <section style={canvasPaneStyle}>
          <Canvas />
        </section>
        <section style={rightPaneStyle}>
          <RightPane />
        </section>
      </main>
    </div>
  );
};

export default BuilderMiniPage;
