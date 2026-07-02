/**
 * @aimeetx/config — Shared configuration presets.
 *
 * This package exports TypeScript configuration presets that other packages
 * can extend. The actual JSON files are in the `tsconfig/` directory.
 */

export const PRESETS = {
  library: '@aimeetx/config/tsconfig/library.json',
  react: '@aimeetx/config/tsconfig/react.json',
  app: '@aimeetx/config/tsconfig/app.json',
} as const;

export type PresetName = keyof typeof PRESETS;