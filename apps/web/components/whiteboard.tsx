'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

import { Button, colors, radius, spacing } from '@aimeetx/ui';

const COLORS = ['#FFFFFF', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#000000'];
const LINE_WIDTHS = [2, 4, 6, 10];

interface WhiteboardProps {
  readonly isDark: boolean;
  readonly palette: {
    readonly background: string;
    readonly surface: string;
    readonly border: string;
    readonly text: string;
    readonly textSecondary: string;
  };
}

interface StrokePoint {
  x: number;
  y: number;
}

interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
}

export default function Whiteboard({ isDark, palette }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [color, setColor] = useState<string>(COLORS[0] ?? '#FFFFFF');
  const [lineWidth, setLineWidth] = useState<number>(LINE_WIDTHS[1] ?? 4);
  const [isDrawing, setIsDrawing] = useState(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = isDark ? '#1F2937' : '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const s of strokes) {
      drawStroke(ctx, s);
    }
    if (currentStroke) {
      drawStroke(ctx, currentStroke);
    }
  }, [strokes, currentStroke, isDark]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [redraw]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): StrokePoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      if (!touch) return { x: 0, y: 0 };
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setCurrentStroke({ points: [getPos(e)], color, width: lineWidth });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    setCurrentStroke((prev) => {
      if (!prev) return null;
      return { ...prev, points: [...prev.points, getPos(e)] };
    });
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(false);
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          padding: spacing.sm,
          backgroundColor: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: radius.md,
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: c,
                border: color === c ? `3px solid ${colors.semantic.info}` : `2px solid ${c === '#FFFFFF' || c === '#000000' ? palette.border : 'transparent'}`,
                cursor: 'pointer',
                outline: color === c ? `2px solid ${colors.semantic.info}` : undefined,
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
        <div style={{ width: 1, height: 24, backgroundColor: palette.border }} />
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {LINE_WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setLineWidth(w)}
              style={{
                width: 28,
                height: 28,
                borderRadius: radius.sm,
                border: lineWidth === w ? `2px solid ${colors.semantic.info}` : `1px solid ${palette.border}`,
                backgroundColor: palette.background,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: w * 1.5, height: w * 1.5, borderRadius: '50%', backgroundColor: color }} />
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <Button variant="secondary" size="sm" onClick={handleUndo} disabled={strokes.length === 0}>
          Undo
        </Button>
        <Button variant="danger" size="sm" onClick={handleClear} disabled={strokes.length === 0}>
          Clear
        </Button>
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          borderRadius: radius.lg,
          overflow: 'hidden',
          border: `1px solid ${palette.border}`,
          minHeight: 0,
          cursor: isDrawing ? 'crosshair' : 'default',
          touchAction: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length < 2) return;
  ctx.beginPath();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const start = stroke.points[0];
  if (!start) return;
  ctx.moveTo(start.x, start.y);
  for (let i = 1; i < stroke.points.length; i++) {
    const pt = stroke.points[i];
    if (pt) ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();
}
