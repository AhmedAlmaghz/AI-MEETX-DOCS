'use client';

import { useMemo } from 'react';
import { useTheme, colors } from '@aimeetx/ui';

export interface Palette {
  readonly background: string;
  readonly surface: string;
  readonly surfaceVariant: string;
  readonly border: string;
  readonly text: string;
  readonly textSecondary: string;
  readonly textDisabled: string;
}

export function usePalette(): { isDark: boolean; palette: Palette } {
  const { mode } = useTheme();
  const isDark = useMemo(() => mode === 'dark', [mode]);
  const palette = useMemo<Palette>(
    () => (isDark ? colors.dark : colors.light) as Palette,
    [isDark],
  );
  return { isDark, palette };
}
