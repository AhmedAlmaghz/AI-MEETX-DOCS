'use client';

import type { ReactNode } from 'react';
import { spacing } from '@aimeetx/ui';

export function PageLayout({ children }: { readonly children: ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>{children}</div>;
}

export function Section({ children }: { readonly children: ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>{children}</div>;
}

export function Grid({ children, minWidth = 280 }: { readonly children: ReactNode; readonly minWidth?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`, gap: spacing.md }}>
      {children}
    </div>
  );
}

export function FlexRow({ children, gap = spacing.md }: { readonly children: ReactNode; readonly gap?: string }) {
  return <div style={{ display: 'flex', gap, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>;
}
