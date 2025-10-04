'use client';

import type { CSSProperties } from 'react';

import HeaderBar from './_components/HeaderBar';
import LeftPane from './_components/LeftPane';
import Canvas from './_components/Canvas';
import RightPane from './_components/RightPane';
import AutoSaveEffect from './_components/AutoSaveEffect';
import { BuilderProvider } from './_components/builderContext';

const containerStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#f3f4f6',
};

const mainStyle: CSSProperties = {
  flex: 1,
  display: 'grid',
  gridTemplateColumns: '320px 1fr 320px',
  gap: 16,
  padding: 16,
  boxSizing: 'border-box',
};

const paneShellStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  borderRadius: 12,
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
};

const paneContentStyle: CSSProperties = {
  flex: 1,
  padding: 16,
  overflow: 'auto',
};

const canvasContentStyle: CSSProperties = {
  flex: 1,
  padding: 24,
  overflow: 'auto',
};

const BuilderMiniPage = () => {
  return (
    <BuilderProvider>
      <AutoSaveEffect />
      <div style={containerStyle}>
        <HeaderBar />
        <main style={mainStyle}>
          <section style={paneShellStyle}>
            <div style={paneContentStyle}>
              <LeftPane />
            </div>
          </section>
          <section style={paneShellStyle}>
            <div style={canvasContentStyle}>
              <Canvas />
            </div>
          </section>
          <section style={paneShellStyle}>
            <div style={paneContentStyle}>
              <RightPane />
            </div>
          </section>
        </main>
      </div>
    </BuilderProvider>
  );
};

export default BuilderMiniPage;
