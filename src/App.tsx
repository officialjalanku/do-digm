import React, { useState } from 'react';
import { initialSuratJalanList } from './data/initialData';
import { SuratJalan } from './utils/suratJalanRules';
import { SuratJalanDocument } from './components/SuratJalanDocument';
import { VerificationPortal } from './components/VerificationPortal';
import { QrScannerModal } from './components/QrScannerModal';
import { CreateSuratJalanModal } from './components/CreateSuratJalanModal';
import { MuliaLogo } from './components/MuliaLogo';
import {
  FileText,
  ShieldCheck,
  QrCode,
  Plus,
  Printer,
  Truck,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  DownloadCloud,
} from 'lucide-react';
import { downloadSuratJalanPdf, triggerPrintSuratJalan } from './utils/pdfGenerator';

export default function App() {
  const [suratJalanList, setSuratJalanList] = useState<SuratJalan[]>(initialSuratJalanList);
  const [selectedId, setSelectedId] = useState<string>(initialSuratJalanList[0].id);
  const [activeTab, setActiveTab] = useState<'DOCUMENT' | 'VALIDATION' | 'LIST'>('DOCUMENT');
  
  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const currentSj = suratJalanList.find((s) => s.id === selectedId) || suratJalanList[0];

  const handleUpdateSuratJalan = (updated: SuratJalan) => {
    setSuratJalanList((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const handleCreateSuratJalan = (newSj: SuratJalan) => {
    setSuratJalanList([newSj, ...suratJalanList]);
    setSelectedId(newSj.id);
    setActiveTab('DOCUMENT');
  };

  // Filtered list
  const filteredList = suratJalanList.filter((sj) => {
    const matchesQuery =
      sj.nomorSuratJalan.toLowerCase().includes(searchFilter.toLowerCase()) ||
      sj.kepada.perusahaan.toLowerCase().includes(searchFilter.toLowerCase()) ||
      sj.noKendaraan.toLowerCase().includes(searchFilter.toLowerCase()) ||
      sj.project.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || sj.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      
      {/* ================= TOP NAVBAR ================= */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo and system title */}
            <div className="flex items-center gap-4">
              <div
                className="cursor-pointer"
                onClick={() => {
                  setSelectedId(initialSuratJalanList[0].id);
                  setActiveTab('DOCUMENT');
                }}
              >
                <MuliaLogo className="h-10" />
              </div>

              <div className="hidden md:block h-6 w-px bg-slate-200" />

              <div className="hidden sm:block">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Modul Surat Jalan Digital &amp; e-DO
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Validasi QR Code Real-Time • Form FRM.PRO.03.09
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('DOCUMENT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'DOCUMENT'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Format Resmi</span>
                <span className="sm:hidden">Format</span>
              </button>

              <button
                onClick={() => setActiveTab('VALIDATION')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'VALIDATION'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Validasi QR</span>
                {currentSj.status === 'GATE_OUT' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('LIST')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'LIST'
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Daftar SJ</span>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded-full text-slate-700">
                  {suratJalanList.length}
                </span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
                title="Pindai kode QR fisik atau uji simulasi"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Pindai QR</span>
              </button>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Buat Surat Jalan</span>
                <span className="md:hidden">Baru</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ================= SUB-HEADER TOOLBAR (Shipment selector & quick status) ================= */}
      <div className="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Active SJ dropdown selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Dokumen Aktif:</span>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900 py-1 px-2.5 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            >
              {suratJalanList.map((sj) => (
                <option key={sj.id} value={sj.id}>
                  {sj.nomorSuratJalan} — {sj.kepada.perusahaan} ({sj.status})
                </option>
              ))}
            </select>
          </div>

          {/* Real-time Quick Checkpoint Status Bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
              <Truck className="w-3.5 h-3.5 text-slate-400" />
              <span>Plat: <strong className="font-mono text-slate-900">{currentSj.noKendaraan}</strong></span>
            </div>

            <span className="text-slate-300">•</span>

            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-500">Status Pengiriman:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                currentSj.status === 'DELIVERED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentSj.status === 'GATE_OUT'
                  ? 'bg-indigo-100 text-indigo-800'
                  : currentSj.status === 'DISPATCHED'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {currentSj.status}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
              <button
                onClick={() => {
                  setActiveTab('DOCUMENT');
                  setTimeout(() => {
                    const clean = currentSj.nomorSuratJalan.replace(/[^a-zA-Z0-9]/g, '_');
                    downloadSuratJalanPdf({
                      elementId: 'surat-jalan-printable-doc',
                      filename: `Surat_Jalan_${clean}.pdf`,
                    });
                  }, 150);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 font-semibold text-[11px] transition-colors cursor-pointer"
                title="Unduh file dokumen PDF resmi ukuran A4"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>Unduh PDF</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('DOCUMENT');
                  setTimeout(() => {
                    triggerPrintSuratJalan('surat-jalan-printable-doc');
                  }, 150);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 font-medium text-[11px] transition-colors cursor-pointer"
                title="Cetak Surat Jalan ke printer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ================= MAIN CONTENT VIEW ================= */}
      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        {/* TAB 1: FORMAL DOCUMENT VIEW (Strictly matching image_2aafb878.png) */}
        {activeTab === 'DOCUMENT' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900 print:hidden">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>Format Resmi PT Mulia 41:</strong> Formulir disesuaikan persis dengan dokumen referensi (FRM.PRO.03.09).
                  QR code di bagian bawah dapat dipindai langsung dengan ponsel untuk memvalidasi status pengiriman secara real-time.
                </span>
              </div>
              <button
                onClick={() => setActiveTab('VALIDATION')}
                className="font-bold text-amber-800 underline hover:text-amber-950 flex-shrink-0 ml-2"
              >
                Coba Validasi &rarr;
              </button>
            </div>

            <SuratJalanDocument
              data={currentSj}
              onUpdateSuratJalan={handleUpdateSuratJalan}
              onOpenValidation={() => setActiveTab('VALIDATION')}
              onSignRole={(role) => {
                setActiveTab('VALIDATION');
              }}
            />
          </div>
        )}

        {/* TAB 2: REAL-TIME VERIFICATION PORTAL */}
        {activeTab === 'VALIDATION' && (
          <VerificationPortal
            suratJalan={currentSj}
            onUpdateSuratJalan={handleUpdateSuratJalan}
            onBackToDoc={() => setActiveTab('DOCUMENT')}
          />
        )}

        {/* TAB 3: LIST & SHIPMENT MANAGER */}
        {activeTab === 'LIST' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Daftar Surat Jalan PT Mulia 41</h2>
                <p className="text-xs text-slate-500">
                  Kelola manifest pengiriman, pantau checkpoint security, dan periksa validasi tanda tangan
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari No SJ, PT, Plat..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="CHECKED">Checked (QC)</option>
                  <option value="DISPATCHED">Dispatched</option>
                  <option value="GATE_OUT">Gate Out</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>
            </div>

            {/* Shipments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredList.map((sj) => {
                const isSelected = sj.id === selectedId;
                return (
                  <div
                    key={sj.id}
                    onClick={() => {
                      setSelectedId(sj.id);
                      setActiveTab('DOCUMENT');
                    }}
                    className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-100 shadow-xs'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {sj.nomorSuratJalan}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sj.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sj.status === 'GATE_OUT'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sj.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mb-1 truncate">
                      {sj.kepada.perusahaan}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mb-3">
                      {sj.kepada.alamat}
                    </p>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span className="font-mono">
                        Plat: <strong>{sj.noKendaraan}</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(sj.id);
                            setActiveTab('DOCUMENT');
                            setTimeout(() => {
                              const clean = sj.nomorSuratJalan.replace(/[^a-zA-Z0-9]/g, '_');
                              downloadSuratJalanPdf({
                                elementId: 'surat-jalan-printable-doc',
                                filename: `Surat_Jalan_${clean}.pdf`,
                              });
                            }, 150);
                          }}
                          className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                          title="Unduh file PDF"
                        >
                          <DownloadCloud className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(sj.id);
                            setActiveTab('DOCUMENT');
                            setTimeout(() => {
                              triggerPrintSuratJalan('surat-jalan-printable-doc');
                            }, 150);
                          }}
                          className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                          title="Cetak Dokumen"
                        >
                          <Printer className="w-3 h-3" />
                        </button>
                        <span className="text-blue-600 font-semibold flex items-center gap-0.5 ml-1">
                          Buka &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* ================= MODALS ================= */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        suratJalanList={suratJalanList}
        onSelectSuratJalan={(sj) => {
          setSelectedId(sj.id);
          setActiveTab('VALIDATION');
        }}
      />

      <CreateSuratJalanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateSuratJalan}
        existingSuratJalanList={suratJalanList}
      />

    </div>
  );
}
