import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, CheckCircle2, Copy, ExternalLink, ShieldCheck } from 'lucide-react';

interface QrCodeDisplayProps {
  value: string;
  size?: number;
  label?: string;
  onScanClick?: () => void;
  showDetails?: boolean;
}

export const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({
  value,
  size = 130,
  label,
  onScanClick,
  showDetails = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      },
      (error) => {
        if (error) console.error('QR Code error:', error);
      }
    );
  }, [value, size]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center p-2.5 bg-white rounded-lg border border-slate-200 shadow-xs">
      <div className="relative group cursor-pointer" onClick={onScanClick} title="Klik untuk membuka validasi QR">
        <canvas ref={canvasRef} className="rounded" />
        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex flex-col items-center justify-center text-white text-xs font-medium p-1 text-center">
          <ShieldCheck className="w-5 h-5 mb-1 text-emerald-400" />
          <span>Buka Validasi</span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-2 w-full text-center">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-Time Validated
          </div>

          {label && (
            <p className="text-[11px] font-mono font-medium text-slate-600 mt-1 truncate max-w-[140px]">
              {label}
            </p>
          )}

          <div className="flex items-center justify-center gap-2 mt-1.5">
            <button
              onClick={handleCopy}
              className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
              title="Salin token QR"
            >
              {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Tersalin' : 'Salin Token'}</span>
            </button>

            {onScanClick && (
              <button
                onClick={onScanClick}
                className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
                title="Buka portal validasi"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Validasi</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
