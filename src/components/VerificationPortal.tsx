import React, { useState } from 'react';
import { SuratJalan, calculateDeliveryProgress } from '../utils/suratJalanRules';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Calendar,
  FileText,
  UserCheck,
  Building,
  Check,
  PenTool,
  ArrowLeft,
  Share2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface VerificationPortalProps {
  suratJalan: SuratJalan;
  onUpdateSuratJalan: (updated: SuratJalan) => void;
  onBackToDoc: () => void;
}

export const VerificationPortal: React.FC<VerificationPortalProps> = ({
  suratJalan,
  onUpdateSuratJalan,
  onBackToDoc,
}) => {
  const [activeSigningRole, setActiveSigningRole] = useState<
    'dibuat' | 'diperiksa' | 'driver' | 'security' | 'penerima' | null
  >(null);
  const [signerName, setSignerName] = useState('');
  const [signerNotes, setSignerNotes] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const progress = calculateDeliveryProgress(suratJalan.status);

  const handleToggleItemVerified = (itemId: string) => {
    const updatedItems = suratJalan.items.map((item) =>
      item.id === itemId ? { ...item, isVerified: !item.isVerified } : item
    );
    onUpdateSuratJalan({
      ...suratJalan,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleVerifyAllItems = () => {
    const updatedItems = suratJalan.items.map((item) => ({ ...item, isVerified: true }));
    onUpdateSuratJalan({
      ...suratJalan,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveSignature = (dataUrl: string) => {
    if (!activeSigningRole) return;

    const role = activeSigningRole;
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${now.getFullYear()} ${now
      .getHours()
      .toString()
      .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now
      .getSeconds()
      .toString()
      .padStart(2, '0')} WIB`;

    const updatedCheckpoints = { ...suratJalan.checkpoints };

    // Default names if blank
    const defaultRoleNames: Record<string, string> = {
      dibuat: 'Staff Logistik M41',
      diperiksa: 'Hendra Kusuma (QC)',
      driver: 'Agus Supriyanto (Driver)',
      security: 'Pos Security 1 M41',
      penerima: 'Ir. Bambang Trihatmono',
    };

    updatedCheckpoints[role] = {
      ...updatedCheckpoints[role],
      name: signerName.trim() || updatedCheckpoints[role].name || defaultRoleNames[role],
      status: 'SIGNED',
      timestamp: formattedDate,
      signatureDataUrl: dataUrl,
      notes: signerNotes.trim() || updatedCheckpoints[role].notes || 'Tervalidasi secara digital',
    };

    // Determine new status if this advances the delivery state
    let newStatus = suratJalan.status;
    if (role === 'penerima') {
      newStatus = 'DELIVERED';
      // Auto verify all items
      suratJalan.items = suratJalan.items.map((i) => ({ ...i, isVerified: true }));
    } else if (role === 'security' && suratJalan.status !== 'DELIVERED') {
      newStatus = 'GATE_OUT';
    } else if (role === 'driver' && ['DRAFT', 'CHECKED'].includes(suratJalan.status)) {
      newStatus = 'DISPATCHED';
    } else if (role === 'diperiksa' && suratJalan.status === 'DRAFT') {
      newStatus = 'CHECKED';
    }

    const updated: SuratJalan = {
      ...suratJalan,
      checkpoints: updatedCheckpoints,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    onUpdateSuratJalan(updated);
    setActiveSigningRole(null);
    setSignerName('');
    setSignerNotes('');
    setSuccessToast(`Tanda tangan dan checkpoint "${role.toUpperCase()}" berhasil diverifikasi secara real-time!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDoc}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dokumen Surat Jalan</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={copyShareLink}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{copiedLink ? 'Tautan Tersalin!' : 'Bagikan Tautan'}</span>
          </button>
        </div>
      </div>

      {/* Success Banner Notification */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-200 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Validasi Berhasil!</p>
              <p className="text-xs text-emerald-100">{successToast}</p>
            </div>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 px-3 py-1 rounded"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Hero Authenticity Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>DOKUMEN ASLI &amp; TERVERIFIKASI PT MULIA 41</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Validasi Surat Jalan Real-Time
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300 font-mono">
              <span className="text-slate-100 font-semibold">{suratJalan.nomorSuratJalan}</span>
              <span>•</span>
              <span>Token: {suratJalan.qrCodeToken}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">SHA-Hash: #{suratJalan.qrHash}</span>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 backdrop-blur-xs">
            <div className="text-xs text-slate-400">Status Terkini:</div>
            <div className="text-lg font-bold text-white flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span>
                {suratJalan.status === 'DELIVERED'
                  ? 'Pengiriman Selesai (Diterima)'
                  : suratJalan.status === 'GATE_OUT'
                  ? 'Dalam Perjalanan (Gate Out)'
                  : suratJalan.status === 'DISPATCHED'
                  ? 'Driver Berangkat'
                  : suratJalan.status === 'CHECKED'
                  ? 'Lolos QC Gudang'
                  : 'Draft Disiapkan'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Kendaraan: <span className="text-white font-bold">{suratJalan.noKendaraan}</span>
            </div>
          </div>
        </div>

        {/* Real-time Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-700/70">
          <div className="flex items-center justify-between text-xs font-semibold mb-2 text-slate-300">
            <span>Kemajuan Pengiriman Real-Time</span>
            <span className="font-mono text-emerald-400">{progress}% Selesai</span>
          </div>
          <div className="w-full h-2.5 bg-slate-700/60 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5-Stage Checkpoint Timeline */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Alur Checkpoint Verifikasi Digital (5 Tahap)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {/* Step 1: Dibuat */}
          <div className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between ${
            suratJalan.checkpoints.dibuat.status === 'SIGNED'
              ? 'bg-emerald-50/50 border-emerald-300 text-slate-800'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[10px] tracking-wider uppercase text-slate-500">1. Logistik</span>
                {suratJalan.checkpoints.dibuat.status === 'SIGNED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Dibuat</h4>
              <p className="text-[11px] font-medium text-slate-700 mt-1">{suratJalan.checkpoints.dibuat.name}</p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
              {suratJalan.checkpoints.dibuat.timestamp || 'Menunggu'}
            </div>
          </div>

          {/* Step 2: Diperiksa */}
          <div className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between ${
            suratJalan.checkpoints.diperiksa.status === 'SIGNED'
              ? 'bg-emerald-50/50 border-emerald-300 text-slate-800'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[10px] tracking-wider uppercase text-slate-500">2. QC Gudang</span>
                {suratJalan.checkpoints.diperiksa.status === 'SIGNED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Diperiksa</h4>
              <p className="text-[11px] font-medium text-slate-700 mt-1">{suratJalan.checkpoints.diperiksa.name}</p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
              {suratJalan.checkpoints.diperiksa.timestamp || 'Menunggu QC'}
            </div>
          </div>

          {/* Step 3: Driver */}
          <div className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between ${
            suratJalan.checkpoints.driver.status === 'SIGNED'
              ? 'bg-emerald-50/50 border-emerald-300 text-slate-800'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[10px] tracking-wider uppercase text-slate-500">3. Ekspedisi</span>
                {suratJalan.checkpoints.driver.status === 'SIGNED' ? (
                  <Truck className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Driver</h4>
              <p className="text-[11px] font-medium text-slate-700 mt-1">{suratJalan.checkpoints.driver.name}</p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
              {suratJalan.checkpoints.driver.timestamp || 'Menunggu Muat'}
            </div>
          </div>

          {/* Step 4: Security */}
          <div className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between ${
            suratJalan.checkpoints.security.status === 'SIGNED'
              ? 'bg-emerald-50/50 border-emerald-300 text-slate-800'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[10px] tracking-wider uppercase text-slate-500">4. Pos Gerbang</span>
                {suratJalan.checkpoints.security.status === 'SIGNED' ? (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Security</h4>
              <p className="text-[11px] font-medium text-slate-700 mt-1">{suratJalan.checkpoints.security.name}</p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
              {suratJalan.checkpoints.security.timestamp || 'Menunggu Gate Out'}
            </div>
          </div>

          {/* Step 5: Penerima */}
          <div className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between ${
            suratJalan.checkpoints.penerima.status === 'SIGNED'
              ? 'bg-emerald-100/70 border-emerald-400 text-slate-800 shadow-2xs'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[10px] tracking-wider uppercase text-amber-700">5. Klien / Proyek</span>
                {suratJalan.checkpoints.penerima.status === 'SIGNED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Penerima</h4>
              <p className="text-[11px] font-medium text-slate-700 mt-1">
                {suratJalan.checkpoints.penerima.name || 'Menunggu Tanda Tangan'}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-amber-200 text-[10px] text-amber-800 font-mono">
              {suratJalan.checkpoints.penerima.timestamp || 'Tindakan Diperlukan'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Manifest Item Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Shipment & Destination Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Tujuan Pengiriman</span>
            </h3>

            <div>
              <h4 className="font-black text-slate-900 text-base">
                {suratJalan.kepada.perusahaan}
              </h4>
              <div className="flex items-start gap-2 mt-2 text-xs text-slate-600">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{suratJalan.kepada.alamat}</span>
              </div>
              {suratJalan.kepada.kontak && (
                <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-800">PIC:</span> {suratJalan.kepada.kontak}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Kendaraan:</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                  {suratJalan.noKendaraan}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal Dispatch:</span>
                <span className="font-mono font-medium text-slate-800">{suratJalan.tanggal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">No. PO:</span>
                <span className="font-mono text-slate-800">{suratJalan.noPo || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">No. Proyek:</span>
                <span className="font-mono font-bold text-slate-800">{suratJalan.noProject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Proyek:</span>
                <span className="text-right font-medium text-slate-800 max-w-[160px] truncate">
                  {suratJalan.project}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Box for Field Staff & Recipient */}
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200 text-slate-800 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-700" />
              <span>Aksi Petugas / Penerima</span>
            </h4>
            <p className="text-xs text-blue-800 leading-relaxed">
              Pilih peran Anda untuk membubuhkan tanda tangan digital langsung atau verifikasi checkpoint:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => {
                  setActiveSigningRole('penerima');
                  setSignerName(suratJalan.checkpoints.penerima.name || 'Ir. Bambang Trihatmono');
                }}
                className="col-span-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Tanda Tangan Penerima (Klien)</span>
              </button>

              <button
                onClick={() => {
                  setActiveSigningRole('security');
                  setSignerName('Joko Wibowo (Security)');
                }}
                className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-center transition-colors"
              >
                Sign: Security
              </button>

              <button
                onClick={() => {
                  setActiveSigningRole('driver');
                  setSignerName('Agus Supriyanto (Driver)');
                }}
                className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-center transition-colors"
              >
                Sign: Driver
              </button>

              <button
                onClick={() => {
                  setActiveSigningRole('diperiksa');
                  setSignerName('Hendra Kusuma (QC)');
                }}
                className="col-span-2 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-center transition-colors"
              >
                Sign: QC &amp; Gudang (Diperiksa)
              </button>
            </div>
          </div>
        </div>

        {/* Center & Right Column: Interactive Material Manifest Checklist */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Manifest Muatan &amp; Checklist Fisik Barang
              </h3>
              <p className="text-xs text-slate-500">
                Centang setiap material untuk memvalidasi kesesuaian fisik saat serah terima
              </p>
            </div>

            <button
              onClick={handleVerifyAllItems}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors"
            >
              Centang Semua Sesuai
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-1">
            {suratJalan.items.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handleToggleItemVerified(item.id)}
                className={`py-3 px-2 flex items-start gap-3 rounded-lg cursor-pointer transition-colors ${
                  item.isVerified ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                }`}
              >
                <div className="pt-0.5">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      item.isVerified
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>

                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-xs">
                      {index + 1}. {item.namaMaterial}
                    </span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {item.qty} {item.uom}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
                    <span>
                      Kode: <span className="font-mono text-slate-700">{item.articleCode}</span>
                    </span>
                    <span>
                      Dimensi: <span className="text-slate-700">{item.dim}</span>
                    </span>
                  </div>

                  {item.keterangan && (
                    <div className="mt-1 text-[11px] text-slate-600 italic">
                      Catatan: {item.keterangan}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Verification summary bottom banner */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Total Material Terverifikasi: <strong className="text-slate-900">{suratJalan.items.filter(i => i.isVerified).length}</strong> dari {suratJalan.items.length} item
            </span>
            {suratJalan.items.every(i => i.isVerified) && (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Semua Item Terverifikasi Lengkap
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Signature Modal Overlay */}
      {activeSigningRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <PenTool className="w-4 h-4 text-blue-600" />
                <span>
                  Validasi Digital &amp; Tanda Tangan: {activeSigningRole.toUpperCase()}
                </span>
              </h3>
              <button
                onClick={() => setActiveSigningRole(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700 block">
                Nama Lengkap / Petugas:
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Masukkan nama penandatangan..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700 block">
                Catatan / Keterangan Kondisi Barang:
              </label>
              <input
                type="text"
                value={signerNotes}
                onChange={(e) => setSignerNotes(e.target.value)}
                placeholder="Contoh: Barang diterima lengkap dalam kondisi baik..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <DigitalSignaturePad
              title="Goreskan Tanda Tangan"
              subtitle="Tanda tangan ini akan direkam sebagai bukti validasi resmi PT Mulia 41."
              onSave={handleSaveSignature}
              onCancel={() => setActiveSigningRole(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
