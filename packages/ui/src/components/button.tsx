import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { colors, radius, spacing, typography } from '../tokens/index.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly children: ReactNode;
  readonly fullWidth?: boolean;
}

/**
 * Button component — the most fundamental UI primitive.
 *
 * Per `05_CODING_STANDARDS.md` §16: Composable functions SHALL be stateless whenever possible.
 * State hoisting is mandatory.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  children,
  style,
  ...rest
}: ButtonProps) {
  const sizeStyles = getSizeStyles(size);
  const variantStyles = getVariantStyles(variant, disabled);

  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        fontFamily: typography.fontFamily.sans,
        fontWeight: typography.fontWeight.semibold,
        borderRadius: radius.md,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 150ms ease',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.5 : 1,
        ...sizeStyles,
        ...variantStyles,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function getSizeStyles(size: ButtonSize): React.CSSProperties {
  switch (size) {
    case 'sm':
      return {
        padding: `${spacing.xs} ${spacing.sm}`,
        fontSize: typography.fontSize.sm,
        minHeight: '32px',
      };
    case 'md':
      return {
        padding: `${spacing.sm} ${spacing.md}`,
        fontSize: typography.fontSize.base,
        minHeight: '40px',
      };
    case 'lg':
      return {
        padding: `${spacing.md} ${spacing.lg}`,
        fontSize: typography.fontSize.lg,
        minHeight: '48px',
      };
  }
}

function getVariantStyles(variant: ButtonVariant, disabled: boolean): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: disabled ? colors.brand.primary : colors.brand.primary,
        color: '#FFFFFF',
      };
    case 'secondary':
      return {
        backgroundColor: colors.light.surfaceVariant,
        color: colors.light.text,
        border: `1px solid ${colors.light.border}`,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        color: colors.brand.primary,
      };
    case 'danger':
      return {
        backgroundColor: colors.semantic.error,
        color: '#FFFFFF',
      };
  }
}