import React, { useState, useRef, useEffect } from 'react';
import { SuratJalan } from '../utils/suratJalanRules';
import { Camera, QrCode, Search, CheckCircle2, AlertCircle, X, Sparkles, RefreshCw } from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  suratJalanList: SuratJalan[];
  onSelectSuratJalan: (sj: SuratJalan) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  suratJalanList,
  onSelectSuratJalan,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanSuccess(null);
      setCameraError(null);
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsScanningActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Kamera tidak dapat diakses atau izin ditolak. Gunakan opsi simulasi instan atau masukkan nomor SJ.');
      setIsScanningActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanningActive(false);
  };

  const handleSimulateScan = (sj: SuratJalan) => {
    setScanSuccess(`Kode QR untuk ${sj.nomorSuratJalan} berhasil dipindai!`);
    setTimeout(() => {
      onSelectSuratJalan(sj);
      onClose();
    }, 900);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const query = manualCode.trim().toLowerCase();
    const match = suratJalanList.find(
      (sj) =>
        sj.nomorSuratJalan.toLowerCase().includes(query) ||
        sj.qrCodeToken.toLowerCase().includes(query) ||
        sj.id.toLowerCase() === query ||
        sj.noKendaraan.toLowerCase().includes(query)
    );

    if (match) {
      handleSimulateScan(match);
    } else {
      setCameraError(`Surat Jalan dengan nomor/token "${manualCode}" tidak ditemukan.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Pemindai QR Code Real-Time</h3>
              <p className="text-[11px] text-slate-400">Validasi Pengiriman &amp; Penerimaan Surat Jalan</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Success state */}
          {scanSuccess && (
            <div className="p-4 rounded-xl bg-emerald-600 text-white text-center flex flex-col items-center justify-center gap-2 animate-scale-in">
              <CheckCircle2 className="w-8 h-8 text-white animate-bounce" />
              <p className="font-bold text-sm">{scanSuccess}</p>
              <p className="text-xs text-emerald-100">Membuka detail validasi...</p>
            </div>
          )}

          {/* Camera Scanner View */}
          <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center border border-slate-800 text-center p-4">
            {isScanningActive ? (
              <>
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-2 border-emerald-400/80 m-8 rounded-lg pointer-events-none animate-pulse flex items-center justify-center">
                  <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-[ping_2s_infinite]" />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-300">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">Gunakan Kamera untuk Pindai Fisik</p>
                  <p className="text-slate-400 text-[11px] mt-0.5 max-w-xs">
                    Arahkan kamera ke QR code yang tertera pada lembar fisik Surat Jalan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Buka Kamera Pemindai
                </button>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Quick 1-Click Simulation Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Simulasi Pindai Instan (Demo Mode)</span>
              </span>
              <span className="text-[10px] text-slate-500">Pilih dokumen untuk di-scan</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {suratJalanList.map((sj) => (
                <button
                  key={sj.id}
                  onClick={() => handleSimulateScan(sj)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between text-left text-xs transition-colors group"
                >
                  <div>
                    <span className="font-bold text-slate-900 font-mono group-hover:text-blue-700">
                      {sj.nomorSuratJalan}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {sj.kepada.perusahaan} • Kendaraan: {sj.noKendaraan}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {sj.status}
                    </span>
                    <span className="text-xs text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                      Pindai &rarr;
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSearch} className="pt-3 border-t border-slate-100 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Atau ketik No. SJ / Token / Plat (contoh: W 8779 UT)"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Cari
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
