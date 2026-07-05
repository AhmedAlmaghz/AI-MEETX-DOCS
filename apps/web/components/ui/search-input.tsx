'use client';

import { usePalette } from '@/lib/hooks';
import { radius, spacing, typography } from '@aimeetx/ui';

interface SearchInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }: SearchInputProps) {
  const { palette } = usePalette();
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      style={{
        width: '100%',
        padding: `${spacing.xs} ${spacing.sm}`,
        borderRadius: radius.md,
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.surface,
        color: palette.text,
        fontSize: typography.fontSize.sm,
        outline: 'none',
        boxSizing: 'border-box',
      }}
    />
  );
}
