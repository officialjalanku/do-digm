import React, { useState, useEffect } from 'react';
import {
  SuratJalan,
  SuratJalanItem,
  generateQrPayload,
  generateNomorSuratJalan,
  extractCustomerCode,
  getNextSequenceNumber,
  getRomanMonth,
  parseDateComponents,
} from '../utils/suratJalanRules';
import {
  Plus,
  Trash2,
  FileCheck,
  X,
  Building,
  Truck,
  Package,
  Wand2,
  Lock,
  Unlock,
  Info,
  Calendar,
  Hash,
} from 'lucide-react';

interface CreateSuratJalanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newSj: SuratJalan) => void;
  existingSuratJalanList?: SuratJalan[];
}

export const CreateSuratJalanModal: React.FC<CreateSuratJalanModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  existingSuratJalanList = [],
}) => {
  // Form fields
  const [tanggal, setTanggal] = useState('10/29/2026');
  const [perusahaan, setPerusahaan] = useState('PT. Cipta Graha Mandiri');
  const [kodePelanggan, setKodePelanggan] = useState('CGM');
  const [nomorUrut, setNomorUrut] = useState<number>(3);
  const [isAutoNumbering, setIsAutoNumbering] = useState<boolean>(true);
  const [nomorSuratJalan, setNomorSuratJalan] = useState('');

  const [noKendaraan, setNoKendaraan] = useState('L 8920 WK');
  const [noPo, setNoPo] = useState('PO-2026/PROJ-108');
  const [project, setProject] = useState('Proyek Konstruksi Gudang Baja Karangpilang');
  const [noProject, setNoProject] = useState('26-0255C');
  const [alamat, setAlamat] = useState('Jl. Mastrip No. 88, Karangpilang, Surabaya');
  const [kontak, setKontak] = useState('Bpk. Darmawan (+62 811-2233-4455)');

  const [items, setItems] = useState<SuratJalanItem[]>([
    {
      id: 'it-1',
      no: 1,
      articleCode: 'ART-WF-200',
      dim: '200 x 100 x 5.5 x 8 mm x 12M',
      namaMaterial: 'Baja Wide Flange (WF 200) Krakatau Steel',
      qty: 12,
      uom: 'BTG',
      keterangan: 'Grade SS400, Mill Test Attached',
      isVerified: false,
    },
    {
      id: 'it-2',
      no: 2,
      articleCode: 'ART-PLT-004',
      dim: '4.0 x 1200 x 2400 mm',
      namaMaterial: 'Plat Baja Hitam Hot Rolled Coil (HRC)',
      qty: 15,
      uom: 'LBR',
      keterangan: 'Bebas cacat, bundling rapi',
      isVerified: false,
    },
    {
      id: 'it-3',
      no: 3,
      articleCode: 'ART-HLW-050',
      dim: '50 x 50 x 2.8 mm x 6M',
      namaMaterial: 'Besi Hollow Hitam Konstruksi',
      qty: 45,
      uom: 'BTG',
      keterangan: 'Toleransi tebal 0.2mm',
      isVerified: false,
    },
  ]);

  // Initialize next sequence on open
  useEffect(() => {
    if (isOpen) {
      const nextSeq = getNextSequenceNumber(existingSuratJalanList);
      setNomorUrut(nextSeq);
      const code = extractCustomerCode(perusahaan);
      setKodePelanggan(code);
    }
  }, [isOpen, existingSuratJalanList]);

  // Recalculate automatic Nomor Surat Jalan whenever inputs change
  useEffect(() => {
    if (!isAutoNumbering) return;

    const { nomorSuratJalan: generated } = generateNomorSuratJalan({
      sequence: nomorUrut,
      customerCodeOrName: kodePelanggan || perusahaan,
      date: tanggal,
      companyCode: 'M41',
    });

    setNomorSuratJalan(generated);
  }, [nomorUrut, kodePelanggan, perusahaan, tanggal, isAutoNumbering]);

  if (!isOpen) return null;

  // Handle changing company name: auto-suggest acronym
  const handlePerusahaanChange = (val: string) => {
    setPerusahaan(val);
    const suggested = extractCustomerCode(val);
    setKodePelanggan(suggested);
  };

  const handleAddItem = () => {
    const newItem: SuratJalanItem = {
      id: `it-${Date.now()}`,
      no: items.length + 1,
      articleCode: `ART-MAT-0${items.length + 1}`,
      dim: 'Standard Size',
      namaMaterial: '',
      qty: 1,
      uom: 'PCS',
      keterangan: '',
      isVerified: false,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof SuratJalanItem, value: any) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { token, hash } = generateQrPayload(nomorSuratJalan, tanggal, perusahaan);

    const newSuratJalan: SuratJalan = {
      id: `sj-${Date.now()}`,
      nomorSuratJalan,
      tanggal,
      noKendaraan,
      noPo,
      project,
      noProject,
      kepada: {
        perusahaan,
        alamat,
        kontak,
      },
      docInfo: {
        docNo: 'FRM.PRO.03.09',
        rev: '01',
        effectiveDate: '27-06-2022',
        page: '1 of 1',
      },
      items,
      checkpoints: {
        dibuat: {
          role: 'dibuat',
          title: 'Dibuat oleh',
          name: 'Cartim / Logistik M41',
          jabatan: 'Staff Warehouse Dispatch',
          status: 'SIGNED',
          timestamp: `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')} WIB`,
          signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M15,40 Q35,10 60,35 T110,25 Q130,50 145,20" stroke="%231e3a8a" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>',
          location: 'PT Mulia 41 Central Warehouse',
          notes: 'Dibuat dan diterbitkan ke sistem digital.',
        },
        diperiksa: {
          role: 'diperiksa',
          title: 'Diperiksa oleh',
          name: 'Hendra Kusuma',
          jabatan: 'Supervisor QC & Logistik',
          status: 'PENDING',
        },
        driver: {
          role: 'driver',
          title: 'Driver',
          name: 'Agus Supriyanto',
          status: 'PENDING',
        },
        security: {
          role: 'security',
          title: 'Security',
          name: 'Pos Security 1',
          status: 'PENDING',
        },
        penerima: {
          role: 'penerima',
          title: 'Penerima',
          name: '',
          status: 'PENDING',
        },
      },
      status: 'DRAFT',
      qrCodeToken: token,
      qrHash: hash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deliveryNotes: 'Dokumen baru diterbitkan, menunggu pemeriksaan fisik oleh QC Gudang.',
    };

    onCreate(newSuratJalan);
    onClose();
  };

  const { month, year2Digit } = parseDateComponents(tanggal);
  const romanMonth = getRomanMonth(month);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600">
              <FileCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Buat Surat Jalan Digital Baru</h3>
              <p className="text-[11px] text-slate-400">Penomoran Otomatis Standar PT Mulia 41 (FRM.PRO.03.09)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* Section 0: AUTO-GENERATED NOMOR SURAT JALAN BOX */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 p-4 rounded-xl border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-blue-600 text-white">
                  <Wand2 className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-slate-900 text-xs">
                  Penomoran Surat Jalan Otomatis
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full border border-blue-300">
                  Format Resmi: SJ/[NoUrut][KodeCustomer]/M41/[BulanRomawi]/[Tahun]
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsAutoNumbering(!isAutoNumbering)}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-300 transition-colors"
              >
                {isAutoNumbering ? (
                  <>
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>Mode Otomatis</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3 text-amber-600" />
                    <span>Mode Manual</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Output Preview */}
            <div className="bg-white p-3.5 rounded-lg border border-blue-300 shadow-2xs">
              <label className="font-semibold text-slate-700 block mb-1 text-xs">
                Nomor Surat Jalan:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  readOnly={isAutoNumbering}
                  value={nomorSuratJalan}
                  onChange={(e) => setNomorSuratJalan(e.target.value)}
                  className={`w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border ${
                    isAutoNumbering
                      ? 'bg-slate-50 border-blue-300 text-blue-900'
                      : 'bg-white border-amber-400 text-slate-900 ring-2 ring-amber-100'
                  } focus:outline-none`}
                />
              </div>

              {/* Component Breakdown Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-[10px] font-mono">
                <span className="text-slate-500 font-sans font-medium">Struktur:</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-bold border border-slate-200">
                  SJ
                </span>
                <span className="text-slate-400">/</span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold border border-emerald-300" title="Nomor Urut 2 Digit">
                  {nomorUrut.toString().padStart(2, '0')}
                </span>
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-bold border border-purple-300" title="Singkatan/Kode Customer">
                  {kodePelanggan || 'CUST'}
                </span>
                <span className="text-slate-400">/</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-bold border border-slate-200" title="Kode Perusahaan PT Mulia 41">
                  M41
                </span>
                <span className="text-slate-400">/</span>
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold border border-amber-300" title={`Bulan Romawi: Bulan ${month}`}>
                  {romanMonth}
                </span>
                <span className="text-slate-400">/</span>
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold border border-blue-300" title="Tahun 2 Digit">
                  {year2Digit}
                </span>
              </div>
            </div>

            {/* Quick Adjustment Controls for Auto-Numbering */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-[11px] flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-500" />
                  <span>Nomor Urut (Otomatis):</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setNomorUrut(Math.max(1, nomorUrut - 1))}
                    className="w-7 h-7 flex items-center justify-center bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={nomorUrut}
                    onChange={(e) => setNomorUrut(parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-center font-mono font-bold text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setNomorUrut(nomorUrut + 1)}
                    className="w-7 h-7 flex items-center justify-center bg-white border border-slate-300 rounded font-bold text-slate-700 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-[11px] flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-500" />
                  <span>Kode Singkatan Pelanggan:</span>
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={kodePelanggan}
                  onChange={(e) => setKodePelanggan(e.target.value.toUpperCase())}
                  placeholder="e.g. SKS, MMP, CGM"
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold uppercase text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-[11px] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>Tanggal &amp; Bulan Romawi:</span>
                </label>
                <input
                  type="text"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  placeholder="MM/DD/YYYY"
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 1: Customer & Delivery Destination Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Informasi Penerima / Pelanggan</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Kepada (Perusahaan Klien):
                </label>
                <input
                  type="text"
                  required
                  value={perusahaan}
                  onChange={(e) => handlePerusahaanChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Inisial nama perusahaan otomatis diubah menjadi kode surat jalan.
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Alamat Pengiriman / Plus Code:
                </label>
                <input
                  type="text"
                  required
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Kontak / PIC Lapangan:
                </label>
                <input
                  type="text"
                  value={kontak}
                  onChange={(e) => setKontak(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  No. Kendaraan (Plat Nomor):
                </label>
                <input
                  type="text"
                  required
                  value={noKendaraan}
                  onChange={(e) => setNoKendaraan(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold uppercase"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Logistik & Proyek */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Detail Proyek &amp; Referensi PO</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  No. PO (Purchase Order):
                </label>
                <input
                  type="text"
                  value={noPo}
                  onChange={(e) => setNoPo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">
                  Nama Proyek:
                </label>
                <input
                  type="text"
                  required
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  No. Proyek:
                </label>
                <input
                  type="text"
                  required
                  value={noProject}
                  onChange={(e) => setNoProject(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Material Items Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                <Package className="w-4 h-4 text-purple-600" />
                <span>Daftar Material Muatan ({items.length} Item)</span>
              </h4>

              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris Material</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-slate-200 bg-white grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-1 text-center font-bold text-slate-500">
                    #{idx + 1}
                  </div>

                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Kode Material (ART-..)"
                      value={item.articleCode}
                      onChange={(e) => handleItemChange(item.id, 'articleCode', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono text-[11px]"
                    />
                  </div>

                  <div className="col-span-4">
                    <input
                      type="text"
                      required
                      placeholder="Nama Material Lengkap"
                      value={item.namaMaterial}
                      onChange={(e) => handleItemChange(item.id, 'namaMaterial', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded font-medium text-[11px]"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Dimensi"
                      value={item.dim}
                      onChange={(e) => handleItemChange(item.id, 'dim', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-[11px]"
                    />
                  </div>

                  <div className="col-span-1">
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => handleItemChange(item.id, 'qty', parseInt(e.target.value) || 1)}
                      className="w-full px-1.5 py-1.5 border border-slate-300 rounded text-center font-bold text-[11px]"
                    />
                  </div>

                  <div className="col-span-1 flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="UoM"
                      value={item.uom}
                      onChange={(e) => handleItemChange(item.id, 'uom', e.target.value)}
                      className="w-12 px-1 py-1.5 border border-slate-300 rounded text-center uppercase font-semibold text-[10px]"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>Terbitkan Surat Jalan &amp; Buat QR Code</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
