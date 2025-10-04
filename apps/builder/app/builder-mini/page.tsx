'use client';

import type { CSSProperties } from 'react';
import HeaderBar from './_components/HeaderBar';
import RightPane from './_components/RightPane';
import Canvas from './_components/Canvas';
import AutoSaveEffect from './_components/AutoSaveEffect';
import { BuilderProvider } from './_components/builderContext';

type PaneProps = { title: string };

const containerStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#f9fafb',
};

const panesStyle: CSSProperties = {
  flex: 1,
  display: 'grid',
  gridTemplateColumns: '320px 1fr 320px',
  gap: 16,
  padding: 16,
};

const paneStyle: CSSProperties = {
  padding: 16,
  borderRadius: 12,
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
};

const titleStyle: CSSProperties = {
  margin: 0,
  marginBottom: 8,
  fontSize: 16,
  fontWeight: 600,
};

function PlaceholderPane({ title }: PaneProps) {
  return (
    <section style={paneStyle}>
      <h2 style={titleStyle}>{title}</h2>
      <p style={{ margin: 0, color: '#6b7280' }}>コンテンツ未実装</p>
    </section>
  );
}

const BuilderMiniPage = () => {
  return (
    <BuilderProvider>
      <AutoSaveEffect />
      <div style={containerStyle}>
        <HeaderBar />
        <main style={panesStyle}>
          <PlaceholderPane title="左ペイン" />
          <section style={{ ...paneStyle, padding: 0 }}>
            <div style={{ padding: 16, paddingBottom: 0 }}>
              <h2 style={titleStyle}>キャンバス</h2>
            </div>
            <div style={{ padding: 16, paddingTop: 8 }}>
              <Canvas />
            </div>
          </section>
          <section style={paneStyle}>
            <h2 style={titleStyle}>詳細</h2>
            <RightPane />
          </section>
        </main>
      </div>
    </BuilderProvider>
  );
};

export default BuilderMiniPage;
