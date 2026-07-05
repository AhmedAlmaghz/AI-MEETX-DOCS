'use client';

import { usePalette } from '@/lib/hooks';
import { colors, radius, spacing, typography } from '@aimeetx/ui';

interface FilterOption<T extends string> {
  readonly value: T;
  readonly label?: string;
  readonly count?: number;
}

interface FilterBarProps<T extends string> {
  readonly options: ReadonlyArray<FilterOption<T>>;
  readonly selected: T;
  readonly onChange: (value: T) => void;
}

export function FilterBar<T extends string = string>({ options, selected, onChange }: FilterBarProps<T>) {
  const { palette } = usePalette();
  return (
    <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const isActive = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding: `${spacing.xs} ${spacing.md}`,
              borderRadius: radius.md,
              border: `1px solid ${isActive ? colors.brand.primary : palette.border}`,
              backgroundColor: isActive ? colors.brand.primary : palette.surface,
              color: isActive ? '#FFFFFF' : palette.text,
              cursor: 'pointer',
              fontSize: typography.fontSize.sm,
              textTransform: 'capitalize',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 150ms ease',
            }}
          >
            {opt.label ?? opt.value}
            {opt.count !== undefined && (
              <span
                style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : palette.surfaceVariant,
                  padding: '0 6px',
                  borderRadius: radius.sm,
                  fontSize: typography.fontSize.xs,
                }}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
