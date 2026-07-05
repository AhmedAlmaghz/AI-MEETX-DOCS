'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

import { colors, radius, spacing, typography } from '@aimeetx/ui';

interface ToastData {
  readonly id: string;
  readonly type: 'success' | 'error' | 'info';
  readonly message: string;
}

let toastIdCounter = 0;
let addToastFn: ((data: Omit<ToastData, 'id'>) => void) | null = null;

export function toast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  addToastFn?.({ type, message });
}

export function ToastContainer() {
  const [items, setItems] = useState<ReadonlyArray<ToastData>>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    clearTimeout(timersRef.current.get(id));
    timersRef.current.delete(id);
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((data: Omit<ToastData, 'id'>) => {
    const id = `toast_${++toastIdCounter}`;
    setItems((prev) => [...prev, { ...data, id }]);
    const timer = setTimeout(() => remove(id), 3500);
    timersRef.current.set(id, timer);
  }, [remove]);

  useEffect(() => { addToastFn = add; return () => { addToastFn = null; }; }, [add]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => { for (const t of timers.values()) clearTimeout(t); };
  }, []);

  if (items.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: spacing.sm, maxWidth: 360 }}>
      {items.map((item) => {
        const bg = item.type === 'success' ? '#059669' : item.type === 'error' ? '#DC2626' : colors.brand.primary;
        return (
          <div key={item.id} style={{ padding: `${spacing.sm} ${spacing.md}`, backgroundColor: bg, color: '#FFFFFF', borderRadius: radius.md, fontSize: typography.fontSize.sm, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', animation: 'slideUp 0.25s ease', display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <span style={{ flex: 1 }}>{item.message}</span>
            <button type="button" onClick={() => remove(item.id)} style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
          </div>
        );
      })}
    </div>
  );
}