import type { InputHTMLAttributes, ReactNode } from 'react';

import { colors, radius, spacing, typography } from '../tokens/index.js';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  readonly label?: string;
  readonly error?: string;
  readonly children?: ReactNode;
}

/**
 * Input component — text input with label and error states.
 *
 * Per `05_CODING_STANDARDS.md` §16: Composable functions SHALL be stateless whenever possible.
 */
export function Input({ label, error, disabled, style, id, ...rest }: InputProps) {
  const inputId = id ?? `input-${label?.replace(/\s+/g, '-').toLowerCase() ?? 'field'}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.light.text,
          }}
        >
          {label}
        </label>
      )}
      <input
        {...rest}
        id={inputId}
        disabled={disabled}
        style={{
          padding: `${spacing.sm} ${spacing.md}`,
          fontSize: typography.fontSize.base,
          fontFamily: typography.fontFamily.sans,
          color: colors.light.text,
          backgroundColor: colors.light.background,
          border: `1px solid ${error ? colors.semantic.error : colors.light.border}`,
          borderRadius: radius.md,
          outline: 'none',
          transition: 'border-color 150ms ease',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
          ...style,
        }}
      />
      {error && (
        <span
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.semantic.error,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}