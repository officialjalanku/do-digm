import React, { useState } from 'react';
import { SuratJalan, SignatureCheckpoint } from '../utils/suratJalanRules';
import { MuliaLogo } from './MuliaLogo';
import { QrCodeDisplay } from './QrCodeDisplay';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Printer,
  Check,
  QrCode,
  FileDown,
  Loader2,
  DownloadCloud,
  Pencil,
  FileEdit,
} from 'lucide-react';
import { downloadSuratJalanPdf, triggerPrintSuratJalan } from '../utils/pdfGenerator';
import { EditCheckpointModal } from './EditCheckpointModal';
import { EditSuratJalanModal } from './EditSuratJalanModal';

interface SuratJalanDocumentProps {
  data: SuratJalan;
  onUpdateSuratJalan?: (updated: SuratJalan) => void;
  onOpenValidation?: () => void;
  onSignRole?: (role: 'dibuat' | 'diperiksa' | 'driver' | 'security' | 'penerima') => void;
  isPrintMode?: boolean;
}

export const SuratJalanDocument: React.FC<SuratJalanDocumentProps> = ({
  data,
  onUpdateSuratJalan,
  onOpenValidation,
  onSignRole,
  isPrintMode = false,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfToast, setPdfToast] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<'dibuat' | 'diperiksa' | 'driver' | 'security' | 'penerima' | null>(null);
  const [isEditDocModalOpen, setIsEditDocModalOpen] = useState(false);

  // Ensure we display at least 12 rows to match the spreadsheet format height
  const MIN_ROWS = 12;
  const emptyRowsCount = Math.max(0, MIN_ROWS - data.items.length);
  const emptyRows = Array.from({ length: emptyRowsCount }, (_, i) => i);

  // Status mapping
  const statusLabels: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'DRAFT (Disiapkan)', color: 'bg-slate-100 text-slate-700 border-slate-300' },
    CHECKED: { label: 'DIPERIKSA (QC Passed)', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    DISPATCHED: { label: 'PENGIRIMAN (In Transit)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    GATE_OUT: { label: 'GATE OUT (Security Checked)', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    DELIVERED: { label: 'SELESAI (Diterima & Sah)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  };

  const currentStatus = statusLabels[data.status] || { label: data.status, color: 'bg-slate-100 text-slate-800' };

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    const cleanNumber = data.nomorSuratJalan.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Surat_Jalan_${cleanNumber}.pdf`;

    await downloadSuratJalanPdf({
      elementId: 'surat-jalan-printable-doc',
      filename,
      scale: 2.5,
      onProgress: (status, msg) => {
        if (msg) setPdfToast(msg);
        if (status === 'COMPLETED' || status === 'ERROR') {
          setTimeout(() => setPdfToast(null), 4000);
        }
      },
    });

    setIsGeneratingPdf(false);
  };

  const handlePrint = () => {
    setPdfToast('Membuka dialog cetak dokumen A4...');
    triggerPrintSuratJalan('surat-jalan-printable-doc');
    setTimeout(() => setPdfToast(null), 3000);
  };

  const handleSaveCheckpoint = (
    role: 'dibuat' | 'diperiksa' | 'driver' | 'security' | 'penerima',
    updatedCheckpoint: SignatureCheckpoint
  ) => {
    if (onUpdateSuratJalan) {
      const updatedCheckpoints = {
        ...data.checkpoints,
        [role]: updatedCheckpoint,
      };

      // Determine updated status if needed
      let newStatus = data.status;
      if (role === 'penerima' && updatedCheckpoint.status === 'SIGNED') {
        newStatus = 'DELIVERED';
      }

      onUpdateSuratJalan({
        ...data,
        checkpoints: updatedCheckpoints,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      setPdfToast(`Data & Tanda Tangan "${updatedCheckpoint.title}" berhasil diperbarui!`);
      setTimeout(() => setPdfToast(null), 3500);
    }
  };

  const handleSaveDocument = (updatedDoc: SuratJalan) => {
    if (onUpdateSuratJalan) {
      onUpdateSuratJalan(updatedDoc);
      setPdfToast('Perubahan data Surat Jalan berhasil disimpan!');
      setTimeout(() => setPdfToast(null), 3500);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white font-sans text-black shadow-xl print:shadow-none print:max-w-none print:m-0 print:p-0 border border-slate-300 print:border-none">
      {/* Top Banner Toolbar (hidden on print) */}
      {!isPrintMode && (
        <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm tracking-wide">Format Resmi: FRM.PRO.03.09</span>
            <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentStatus.color}`}>
              {currentStatus.label}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Surat Jalan Button */}
            <button
              onClick={() => setIsEditDocModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Edit nomor, tanggal, material, dan data surat jalan ini"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Edit Dokumen</span>
            </button>

            {/* Real PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Unduh berkas dokumen PDF resmi ukuran A4"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <DownloadCloud className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
            </button>

            {/* Direct Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-xs font-medium text-white transition-colors cursor-pointer"
              title="Cetak format A4 Surat Jalan langsung ke printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak (Print)</span>
            </button>

            {/* Verification portal */}
            <button
              onClick={onOpenValidation}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Portal Validasi QR</span>
            </button>
          </div>
        </div>
      )}

      {/* PDF Generation Status Toast */}
      {pdfToast && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 flex items-center justify-between text-xs text-emerald-900 print:hidden animate-fade-in">
          <div className="flex items-center gap-2">
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span className="font-medium">{pdfToast}</span>
          </div>
          <button
            onClick={() => setPdfToast(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Document Body (Strictly styled like image_2aafb878.png) */}
      <div id="surat-jalan-printable-doc" className="p-4 sm:p-6 lg:p-8 bg-white print:p-0">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="border border-black grid grid-cols-12 text-xs">
          
          {/* Top Left: Logo */}
          <div className="col-span-12 sm:col-span-3 border-b sm:border-b-0 sm:border-r border-black p-2 flex flex-col items-center justify-center bg-white min-h-[90px]">
            <MuliaLogo className="h-12" />
          </div>

          {/* Top Center: PT MULIA 41 Title + Surat Jalan */}
          <div className="col-span-12 sm:col-span-6 border-b sm:border-b-0 sm:border-r border-black flex flex-col">
            <div className="bg-[#D3D3D3] text-center font-bold text-base py-1.5 border-b border-black tracking-wider uppercase text-black">
              PT MULIA 41
            </div>
            <div className="flex-1 flex items-center justify-center py-3 bg-white">
              <h1 className="text-xl sm:text-2xl font-black text-black tracking-normal">
                Surat Jalan
              </h1>
            </div>
          </div>

          {/* Top Right: Document Control Table */}
          <div className="col-span-12 sm:col-span-3 flex flex-col justify-center text-[11px] bg-white">
            <div className="grid grid-cols-12 border-b border-black py-1 px-2">
              <span className="col-span-5 font-semibold text-black">Doc.</span>
              <span className="col-span-7 font-mono font-medium text-black">: {data.docInfo.docNo}</span>
            </div>
            <div className="grid grid-cols-12 border-b border-black py-1 px-2">
              <span className="col-span-5 font-semibold text-black">Rev.</span>
              <span className="col-span-7 font-mono font-medium text-black">: {data.docInfo.rev}</span>
            </div>
            <div className="grid grid-cols-12 border-b border-black py-1 px-2">
              <span className="col-span-5 font-semibold text-black">Effective date</span>
              <span className="col-span-7 font-mono font-medium text-black">: {data.docInfo.effectiveDate}</span>
            </div>
            <div className="grid grid-cols-12 py-1 px-2">
              <span className="col-span-5 font-semibold text-black">Page</span>
              <span className="col-span-7 font-mono font-medium text-black">: {data.docInfo.page}</span>
            </div>
          </div>
        </div>

        {/* ================= RECIPIENT & DISPATCH METADATA SECTION ================= */}
        <div className="border-x border-b border-black grid grid-cols-12 text-xs">
          
          {/* Left Column: Kepada */}
          <div className="col-span-12 sm:col-span-6 border-b sm:border-b-0 sm:border-r border-black p-3 flex flex-col justify-between bg-white min-h-[140px]">
            <div>
              <div className="font-semibold text-black text-xs mb-2">Kepada :</div>
              <div className="pl-4 sm:pl-8 text-center sm:text-left">
                <h2 className="font-bold text-sm sm:text-base text-black mb-1">
                  {data.kepada.perusahaan}
                </h2>
                <p className="text-xs text-slate-800 leading-relaxed font-normal">
                  {data.kepada.alamat}
                </p>
                {data.kepada.kontak && (
                  <p className="text-[11px] text-slate-600 mt-1">
                    Kontak: {data.kepada.kontak}
                  </p>
                )}
              </div>
            </div>

            {/* QR verification badge (also printable) */}
            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-600">
              <div className="flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>QR Auth Token: {data.qrCodeToken}</span>
              </div>
              <span className="font-mono font-bold bg-slate-100 px-1 py-0.5 rounded">HASH: #{data.qrHash}</span>
            </div>
          </div>

          {/* Right Column: Key Details Table */}
          <div className="col-span-12 sm:col-span-6 flex flex-col text-xs bg-white">
            <div className="grid grid-cols-12 border-b border-black py-1 px-2">
              <span className="col-span-4 font-semibold text-black">No</span>
              <span className="col-span-8 font-mono font-bold text-black">: {data.nomorSuratJalan}</span>
            </div>
            <div className="grid grid-cols-12 border-b border-black py-1 px-2">
              <span className="col-span-4 font-semibold text-black">Tanggal</span>
              <span className="col-span-8 font-mono font-medium text-black">: {data.tanggal}</span>
            </div>
            <div className="grid grid-cols-12 border-b border-black py-1 px-2">
              <span className="col-span-4 font-semibold text-black">No.Kendaraan</span>
              <span className="col-span-8 font-bold font-mono text-black">: {data.noKendaraan}</span>
            </div>
            <div className="grid grid-cols-12 border-b border-black py-1 px-2">
              <span className="col-span-4 font-semibold text-black">No. PO</span>
              <span className="col-span-8 font-mono font-medium text-black">: {data.noPo || '-'}</span>
            </div>
            <div className="grid grid-cols-12 border-b border-black py-1 px-2">
              <span className="col-span-4 font-semibold text-black">Project</span>
              <span className="col-span-8 font-medium text-black">: {data.project}</span>
            </div>
            <div className="grid grid-cols-12 py-1 px-2">
              <span className="col-span-4 font-semibold text-black">No. Project</span>
              <span className="col-span-8 font-mono font-bold text-black">: {data.noProject}</span>
            </div>
          </div>
        </div>

        {/* ================= ITEMS TABLE ================= */}
        <div className="border-x border-b border-black overflow-x-auto">
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="bg-[#C8D1FD] text-black font-bold border-b border-black text-center select-none">
                <th className="border-r border-black py-1.5 px-2 w-10">No</th>
                <th className="border-r border-black py-1.5 px-2 w-32">Article Code</th>
                <th className="border-r border-black py-1.5 px-2 w-40">Dim</th>
                <th className="border-r border-black py-1.5 px-3">Nama Material</th>
                <th className="border-r border-black py-1.5 px-2 w-16">Qty</th>
                <th className="border-r border-black py-1.5 px-2 w-16">UoM</th>
                <th className="py-1.5 px-3 w-48">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-b border-black hover:bg-slate-50 transition-colors ${item.isVerified ? 'bg-emerald-50/40' : ''}`}
                >
                  <td className="border-r border-black py-1.5 px-2 text-center font-mono font-medium">
                    {idx + 1}
                  </td>
                  <td className="border-r border-black py-1.5 px-2 font-mono font-semibold text-slate-800">
                    {item.articleCode}
                  </td>
                  <td className="border-r border-black py-1.5 px-2 text-slate-700">
                    {item.dim}
                  </td>
                  <td className="border-r border-black py-1.5 px-3 font-semibold text-black">
                    <div className="flex items-center justify-between">
                      <span>{item.namaMaterial}</span>
                      {item.isVerified && (
                        <span className="inline-flex items-center text-[10px] text-emerald-700 font-normal">
                          <Check className="w-3 h-3 text-emerald-600 mr-0.5" />
                          Checked
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border-r border-black py-1.5 px-2 text-center font-bold font-mono">
                    {item.qty}
                  </td>
                  <td className="border-r border-black py-1.5 px-2 text-center font-semibold uppercase">
                    {item.uom}
                  </td>
                  <td className="py-1.5 px-3 text-slate-700 text-[11px]">
                    {item.keterangan || '-'}
                  </td>
                </tr>
              ))}

              {/* Pad remaining rows to match the 12+ rows spreadsheet layout */}
              {emptyRows.map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-black h-7">
                  <td className="border-r border-black py-1.5 px-2 text-center text-transparent">-</td>
                  <td className="border-r border-black py-1.5 px-2 text-transparent">-</td>
                  <td className="border-r border-black py-1.5 px-2 text-transparent">-</td>
                  <td className="border-r border-black py-1.5 px-3 text-transparent">-</td>
                  <td className="border-r border-black py-1.5 px-2 text-transparent">-</td>
                  <td className="border-r border-black py-1.5 px-2 text-transparent">-</td>
                  <td className="py-1.5 px-3 text-transparent">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= SIGNATURES & VERIFICATION CHECKPOINTS ================= */}
        {/* Exactly 5 columns with purple header: Dibuat oleh | Diperiksa oleh | Driver | Security | Penerima */}
        <div className="border-x border-b border-black">
          {/* Header Row */}
          <div className="grid grid-cols-5 bg-[#C8D1FD] text-black font-bold text-center text-xs border-b border-black py-1.5">
            <div className="border-r border-black">Dibuat oleh</div>
            <div className="border-r border-black">Diperiksa oleh</div>
            <div className="border-r border-black">Driver</div>
            <div className="border-r border-black">Security</div>
            <div>Penerima</div>
          </div>

          {/* Signature Box Content */}
          <div className="grid grid-cols-5 text-center text-xs">
            {/* 1. Dibuat oleh */}
            <div
              onClick={() => setEditingRole('dibuat')}
              className="border-r border-black p-2 min-h-[110px] flex flex-col justify-between items-center relative group cursor-pointer hover:bg-blue-50/50 transition-colors"
              title="Klik untuk mengedit nama, tanggal, atau tanda tangan Dibuat oleh"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingRole('dibuat');
                }}
                className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 px-1.5 py-0.5 bg-white/95 hover:bg-white text-blue-700 rounded shadow-xs text-[9px] font-semibold flex items-center gap-1 border border-slate-300 print:hidden z-10 transition-opacity"
              >
                <Pencil className="w-2.5 h-2.5" />
                <span>Edit</span>
              </button>

              {data.checkpoints.dibuat.signatureDataUrl ? (
                <div className="w-full flex flex-col items-center justify-center flex-1">
                  <img
                    src={data.checkpoints.dibuat.signatureDataUrl}
                    alt="TTD Dibuat"
                    className="max-h-12 w-auto object-contain my-1 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex items-center gap-1 text-[9px] text-emerald-700 font-semibold bg-emerald-50 px-1 py-0.5 rounded">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>VERIFIED</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-blue-600 font-medium group-hover:underline print:hidden flex items-center gap-1">
                    <Pencil className="w-3 h-3" />
                    <span>+ Tanda Tangan</span>
                  </span>
                </div>
              )}
              <div className="w-full border-t border-slate-300 pt-1 text-[11px]">
                <p className="font-bold text-black truncate">{data.checkpoints.dibuat.name || '(.......................)'}</p>
                <p className="text-[9px] text-slate-600 truncate">{data.checkpoints.dibuat.timestamp || 'Admin Logistik M41'}</p>
              </div>
            </div>

            {/* 2. Diperiksa oleh */}
            <div
              onClick={() => setEditingRole('diperiksa')}
              className="border-r border-black p-2 min-h-[110px] flex flex-col justify-between items-center relative group cursor-pointer hover:bg-blue-50/50 transition-colors"
              title="Klik untuk mengedit nama, tanggal, atau tanda tangan Diperiksa oleh"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingRole('diperiksa');
                }}
                className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 px-1.5 py-0.5 bg-white/95 hover:bg-white text-blue-700 rounded shadow-xs text-[9px] font-semibold flex items-center gap-1 border border-slate-300 print:hidden z-10 transition-opacity"
              >
                <Pencil className="w-2.5 h-2.5" />
                <span>Edit</span>
              </button>

              {data.checkpoints.diperiksa.signatureDataUrl ? (
                <div className="w-full flex flex-col items-center justify-center flex-1">
                  <img
                    src={data.checkpoints.diperiksa.signatureDataUrl}
                    alt="TTD Diperiksa"
                    className="max-h-12 w-auto object-contain my-1 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex items-center gap-1 text-[9px] text-emerald-700 font-semibold bg-emerald-50 px-1 py-0.5 rounded">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>QC PASSED</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-blue-600 font-medium group-hover:underline print:hidden flex items-center gap-1">
                    <Pencil className="w-3 h-3" />
                    <span>+ Tanda Tangan</span>
                  </span>
                </div>
              )}
              <div className="w-full border-t border-slate-300 pt-1 text-[11px]">
                <p className="font-bold text-black truncate">{data.checkpoints.diperiksa.name || '(.......................)'}</p>
                <p className="text-[9px] text-slate-600 truncate">{data.checkpoints.diperiksa.timestamp || 'Supervisor QC'}</p>
              </div>
            </div>

            {/* 3. Driver */}
            <div
              onClick={() => setEditingRole('driver')}
              className="border-r border-black p-2 min-h-[110px] flex flex-col justify-between items-center relative group cursor-pointer hover:bg-blue-50/50 transition-colors"
              title="Klik untuk mengedit nama, tanggal, atau tanda tangan Driver"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingRole('driver');
                }}
                className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 px-1.5 py-0.5 bg-white/95 hover:bg-white text-blue-700 rounded shadow-xs text-[9px] font-semibold flex items-center gap-1 border border-slate-300 print:hidden z-10 transition-opacity"
              >
                <Pencil className="w-2.5 h-2.5" />
                <span>Edit</span>
              </button>

              {data.checkpoints.driver.signatureDataUrl ? (
                <div className="w-full flex flex-col items-center justify-center flex-1">
                  <img
                    src={data.checkpoints.driver.signatureDataUrl}
                    alt="TTD Driver"
                    className="max-h-12 w-auto object-contain my-1 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex items-center gap-1 text-[9px] text-emerald-700 font-semibold bg-emerald-50 px-1 py-0.5 rounded">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>DISPATCHED</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-blue-600 font-medium group-hover:underline print:hidden flex items-center gap-1">
                    <Pencil className="w-3 h-3" />
                    <span>+ Tanda Tangan</span>
                  </span>
                </div>
              )}
              <div className="w-full border-t border-slate-300 pt-1 text-[11px]">
                <p className="font-bold text-black truncate">{data.checkpoints.driver.name || '(.......................)'}</p>
                <p className="text-[9px] text-slate-600 truncate">{data.checkpoints.driver.timestamp || 'Pengemudi Truk'}</p>
              </div>
            </div>

            {/* 4. Security */}
            <div
              onClick={() => setEditingRole('security')}
              className="border-r border-black p-2 min-h-[110px] flex flex-col justify-between items-center relative group cursor-pointer hover:bg-blue-50/50 transition-colors"
              title="Klik untuk mengedit nama, tanggal, atau tanda tangan Security"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingRole('security');
                }}
                className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 px-1.5 py-0.5 bg-white/95 hover:bg-white text-blue-700 rounded shadow-xs text-[9px] font-semibold flex items-center gap-1 border border-slate-300 print:hidden z-10 transition-opacity"
              >
                <Pencil className="w-2.5 h-2.5" />
                <span>Edit</span>
              </button>

              {data.checkpoints.security.signatureDataUrl ? (
                <div className="w-full flex flex-col items-center justify-center flex-1">
                  <img
                    src={data.checkpoints.security.signatureDataUrl}
                    alt="TTD Security"
                    className="max-h-12 w-auto object-contain my-1 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex items-center gap-1 text-[9px] text-indigo-700 font-semibold bg-indigo-50 px-1 py-0.5 rounded">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>GATE PASS OUT</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-blue-600 font-medium group-hover:underline print:hidden flex items-center gap-1">
                    <Pencil className="w-3 h-3" />
                    <span>+ Tanda Tangan</span>
                  </span>
                </div>
              )}
              <div className="w-full border-t border-slate-300 pt-1 text-[11px]">
                <p className="font-bold text-black truncate">{data.checkpoints.security.name || '(.......................)'}</p>
                <p className="text-[9px] text-slate-600 truncate">{data.checkpoints.security.timestamp || 'Pos Security 1'}</p>
              </div>
            </div>

            {/* 5. Penerima */}
            <div
              onClick={() => setEditingRole('penerima')}
              className="p-2 min-h-[110px] flex flex-col justify-between items-center relative bg-amber-50/20 group cursor-pointer hover:bg-amber-100/40 transition-colors"
              title="Klik untuk mengedit nama, tanggal, atau tanda tangan Penerima"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingRole('penerima');
                }}
                className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 px-1.5 py-0.5 bg-white/95 hover:bg-white text-blue-700 rounded shadow-xs text-[9px] font-semibold flex items-center gap-1 border border-slate-300 print:hidden z-10 transition-opacity"
              >
                <Pencil className="w-2.5 h-2.5" />
                <span>Edit</span>
              </button>

              {data.checkpoints.penerima.status === 'SIGNED' && data.checkpoints.penerima.signatureDataUrl ? (
                <div className="w-full flex flex-col items-center justify-center flex-1">
                  <img
                    src={data.checkpoints.penerima.signatureDataUrl}
                    alt="TTD Penerima"
                    className="max-h-12 w-auto object-contain my-1 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex items-center gap-1 text-[9px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>DITERIMA SAH</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-1">
                  <div className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium bg-amber-100/80 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3" />
                    <span>Menunggu Penerima</span>
                  </div>
                  <span className="mt-1.5 text-[10px] font-semibold text-blue-600 group-hover:underline print:hidden flex items-center gap-1">
                    <Pencil className="w-3 h-3" />
                    <span>Tanda Tangan / Edit</span>
                  </span>
                </div>
              )}
              <div className="w-full border-t border-slate-300 pt-1 text-[11px]">
                <p className="font-bold text-black truncate">{data.checkpoints.penerima.name || '(.......................)'}</p>
                <p className="text-[9px] text-slate-600 truncate">{data.checkpoints.penerima.timestamp || 'Stempel / Tanda Tangan'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= FOOTER WITH REAL-TIME QR INTEGRATION ================= */}
        <div className="mt-4 pt-3 border-t border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <QrCodeDisplay
              value={`https://ais-pre-yvgqyufygiwtlqbruv2spt-825213481881.asia-southeast1.run.app/verify?token=${data.qrCodeToken}&sj=${encodeURIComponent(data.nomorSuratJalan)}`}
              size={90}
              showDetails={false}
              onScanClick={onOpenValidation}
            />
            <div className="text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Validasi Digital Real-Time PT Mulia 41
              </p>
              <p className="text-slate-600">
                Pindai QR code ini dengan kamera smartphone untuk melihat status pengiriman,
                manifest muatan real-time, dan verifikasi tanda tangan digital.
              </p>
              <p className="font-mono text-[10px] text-slate-500">
                Security Hash: <span className="font-semibold text-slate-800">{data.qrHash}</span> | Dokumen Resmi ISO 9001:2015
              </p>
            </div>
          </div>

          <div className="text-right text-[10px] text-slate-500 font-mono hidden sm:block">
            <p>PT Mulia 41 Logistik &amp; Pergudangan</p>
            <p>Sistem Surat Jalan Elektronik (e-DO)</p>
            <p>Dicetak: {new Date().toLocaleDateString('id-ID')} WIB</p>
          </div>
        </div>

      </div>

      {/* Checkpoint Edit Modal */}
      <EditCheckpointModal
        isOpen={editingRole !== null}
        role={editingRole}
        checkpoint={editingRole ? data.checkpoints[editingRole] : null}
        onClose={() => setEditingRole(null)}
        onSave={handleSaveCheckpoint}
      />

      {/* Document Full Edit Modal */}
      <EditSuratJalanModal
        isOpen={isEditDocModalOpen}
        suratJalan={data}
        onClose={() => setIsEditDocModalOpen(false)}
        onSave={handleSaveDocument}
      />
    </div>
  );
};
