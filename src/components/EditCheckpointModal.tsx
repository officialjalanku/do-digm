import React, { useState, useEffect } from 'react';
import { SignatureCheckpoint, SuratJalan } from '../utils/suratJalanRules';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import {
  PenTool,
  X,
  Check,
  RotateCcw,
  User,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface EditCheckpointModalProps {
  isOpen: boolean;
  role: 'dibuat' | 'diperiksa' | 'driver' | 'security' | 'penerima' | null;
  checkpoint: SignatureCheckpoint | null;
  onClose: () => void;
  onSave: (
    role: 'dibuat' | 'diperiksa' | 'driver' | 'security' | 'penerima',
    updatedCheckpoint: SignatureCheckpoint
  ) => void;
}

export const EditCheckpointModal: React.FC<EditCheckpointModalProps> = ({
  isOpen,
  role,
  checkpoint,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [status, setStatus] = useState<'PENDING' | 'SIGNED'>('SIGNED');
  const [notes, setNotes] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | undefined>(undefined);
  const [isReSigning, setIsReSigning] = useState(false);

  useEffect(() => {
    if (checkpoint && isOpen) {
      setName(checkpoint.name || '');
      setTitle(checkpoint.title || '');
      setJabatan(checkpoint.jabatan || '');
      setTimestamp(checkpoint.timestamp || '');
      setStatus(checkpoint.status || 'PENDING');
      setNotes(checkpoint.notes || '');
      setSignatureDataUrl(checkpoint.signatureDataUrl);
      setIsReSigning(false);
    }
  }, [checkpoint, isOpen]);

  if (!isOpen || !role || !checkpoint) return null;

  const roleLabels: Record<string, { label: string; badge: string; color: string }> = {
    dibuat: { label: 'Dibuat oleh (Admin Logistik)', badge: 'VERIFIED', color: 'text-emerald-700 bg-emerald-50' },
    diperiksa: { label: 'Diperiksa oleh (QC Gudang)', badge: 'QC PASSED', color: 'text-emerald-700 bg-emerald-50' },
    driver: { label: 'Driver (Pengemudi Truk)', badge: 'DISPATCHED', color: 'text-emerald-700 bg-emerald-50' },
    security: { label: 'Security (Pos Gerbang)', badge: 'GATE PASS OUT', color: 'text-indigo-700 bg-indigo-50' },
    penerima: { label: 'Penerima (Klien Lapangan)', badge: 'DITERIMA SAH', color: 'text-emerald-700 bg-emerald-50' },
  };

  const currentRole = roleLabels[role] || { label: role, badge: 'VERIFIED', color: 'text-blue-700 bg-blue-50' };

  const handleSetCurrentTime = () => {
    const now = new Date();
    const formatted = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${now.getFullYear()} ${now
      .getHours()
      .toString()
      .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now
      .getSeconds()
      .toString()
      .padStart(2, '0')} WIB`;
    setTimestamp(formatted);
  };

  const handleClearSignature = () => {
    setSignatureDataUrl(undefined);
    setStatus('PENDING');
    setIsReSigning(false);
  };

  const handleSaveSignaturePad = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    setStatus('SIGNED');
    if (!timestamp) {
      handleSetCurrentTime();
    }
    setIsReSigning(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: SignatureCheckpoint = {
      ...checkpoint,
      role,
      title: title.trim() || checkpoint.title,
      name: name.trim(),
      jabatan: jabatan.trim(),
      timestamp: status === 'SIGNED' ? (timestamp.trim() || new Date().toLocaleDateString('id-ID')) : undefined,
      status,
      signatureDataUrl: status === 'SIGNED' ? signatureDataUrl : undefined,
      notes: notes.trim(),
    };

    onSave(role, updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600">
              <PenTool className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Edit Data &amp; Tanda Tangan</h3>
              <p className="text-[11px] text-slate-400">Kolom Checkpoint: {currentRole.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="edit-checkpoint-form" onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs flex-1">
          
          {/* Status selector */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <label className="font-bold text-slate-800 block text-xs">
                Status Tanda Tangan:
              </label>
              <p className="text-[11px] text-slate-500">
                Tentukan apakah kolom ini sudah tervalidasi atau masih menunggu
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-300">
              <button
                type="button"
                onClick={() => setStatus('SIGNED')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  status === 'SIGNED'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sudah TTD (SIGNED)
              </button>
              <button
                type="button"
                onClick={() => setStatus('PENDING')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  status === 'PENDING'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Menunggu (PENDING)
              </button>
            </div>
          </div>

          {/* Name & Jabatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nama Penandatangan / Petugas:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Cartim / Logistik M41"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Jabatan / Keterangan:
              </label>
              <input
                type="text"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Contoh: Supervisor QC & Logistik"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Timestamp */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 block">
                Waktu &amp; Tanggal Checkpoint (WIB):
              </label>
              <button
                type="button"
                onClick={handleSetCurrentTime}
                className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
              >
                <Clock className="w-3 h-3" />
                <span>Gunakan Waktu Sekarang</span>
              </button>
            </div>
            <input
              type="text"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              placeholder="Contoh: 29/10/2026 08:30:15 WIB"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Catatan Checkpoint:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pemeriksaan dokumen dan fisik material selesai."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tanda Tangan Digital Preview & Canvas */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-xs">
                Spesimen Tanda Tangan Digital:
              </label>

              <div className="flex items-center gap-2">
                {signatureDataUrl && !isReSigning && (
                  <button
                    type="button"
                    onClick={handleClearSignature}
                    className="text-red-600 hover:text-red-700 text-[11px] flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus TTD</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsReSigning(!isReSigning)}
                  className="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg font-semibold text-[11px] transition-colors"
                >
                  {isReSigning ? 'Batal Gambar' : signatureDataUrl ? 'Ganti TTD' : '+ Goreskan TTD'}
                </button>
              </div>
            </div>

            {/* If user is drawing on canvas */}
            {isReSigning ? (
              <div className="mt-2">
                <DigitalSignaturePad
                  title={`Goreskan Tanda Tangan untuk ${name || currentRole.label}`}
                  subtitle="Gunakan sentuhan atau mouse untuk membubuhkan tanda tangan"
                  onSave={handleSaveSignaturePad}
                  onCancel={() => setIsReSigning(false)}
                />
              </div>
            ) : signatureDataUrl ? (
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl flex flex-col items-center justify-center min-h-[90px]">
                <img
                  src={signatureDataUrl}
                  alt="Tanda tangan saat ini"
                  className="max-h-16 w-auto object-contain"
                />
                <span className="text-[10px] text-slate-500 font-mono mt-1">
                  Spesimen Tanda Tangan Aktif
                </span>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-center text-amber-800 text-xs">
                Belum ada tanda tangan digital. Klik tombol <strong>+ Goreskan TTD</strong> untuk membubuhkan tanda tangan baru.
              </div>
            )}
          </div>

        </form>
        {/* Pinned Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200/80 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form="edit-checkpoint-form"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>

      </div>
    </div>
  );
};
