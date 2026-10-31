import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

interface DigitalSignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  onSave,
  onCancel,
  title = 'Tanda Tangan Digital',
  subtitle = 'Goreskan tanda tangan Anda pada area di bawah ini menggunakan mouse atau sentuhan jari',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<string>('#1e3a8a'); // Formal blue ink default

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI display
    const ratio = Math.ceil(window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);

    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [penColor]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-5 max-w-md w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {/* Color picker & Clear toolbar */}
        <div className="flex items-center justify-between mb-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">Tinta:</span>
            <button
              type="button"
              onClick={() => setPenColor('#1e3a8a')}
              className={`w-5 h-5 rounded-full bg-blue-900 border-2 transition-transform ${penColor === '#1e3a8a' ? 'scale-110 border-blue-400 ring-2 ring-blue-300' : 'border-transparent'}`}
              title="Tinta Biru Resmi"
            />
            <button
              type="button"
              onClick={() => setPenColor('#0f172a')}
              className={`w-5 h-5 rounded-full bg-slate-900 border-2 transition-transform ${penColor === '#0f172a' ? 'scale-110 border-slate-400 ring-2 ring-slate-300' : 'border-transparent'}`}
              title="Tinta Hitam"
            />
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-slate-500 hover:text-red-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Bersihkan</span>
          </button>
        </div>

        {/* Signature canvas */}
        <div className="relative border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 overflow-hidden touch-none h-44">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {!hasDrawn && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-medium">
              Bubuhkan tanda tangan di sini
            </div>
          )}

          {/* Guidelines line */}
          <div className="absolute bottom-8 left-6 right-6 border-b border-slate-200 pointer-events-none text-[10px] text-slate-400 flex justify-between">
            <span>X Tanda Tangan Sah</span>
            <span>PT MULIA 41 E-SIGN</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Batal
          </button>
        )}
        <button
          type="button"
          disabled={!hasDrawn}
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Simpan & Verifikasi</span>
        </button>
      </div>
    </div>
  );
};
