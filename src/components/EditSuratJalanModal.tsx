import React, { useState, useEffect } from 'react';
import { SuratJalan, SuratJalanItem, generateQrPayload } from '../utils/suratJalanRules';
import { Plus, Trash2, FileEdit, X, Building, Truck, Package, Check, ShieldCheck } from 'lucide-react';

interface EditSuratJalanModalProps {
  isOpen: boolean;
  suratJalan: SuratJalan | null;
  onClose: () => void;
  onSave: (updatedSj: SuratJalan) => void;
}

export const EditSuratJalanModal: React.FC<EditSuratJalanModalProps> = ({
  isOpen,
  suratJalan,
  onClose,
  onSave,
}) => {
  const [nomorSuratJalan, setNomorSuratJalan] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [noKendaraan, setNoKendaraan] = useState('');
  const [noPo, setNoPo] = useState('');
  const [project, setProject] = useState('');
  const [noProject, setNoProject] = useState('');
  const [perusahaan, setPerusahaan] = useState('');
  const [alamat, setAlamat] = useState('');
  const [kontak, setKontak] = useState('');
  const [status, setStatus] = useState<SuratJalan['status']>('DRAFT');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [items, setItems] = useState<SuratJalanItem[]>([]);

  useEffect(() => {
    if (suratJalan && isOpen) {
      setNomorSuratJalan(suratJalan.nomorSuratJalan);
      setTanggal(suratJalan.tanggal);
      setNoKendaraan(suratJalan.noKendaraan);
      setNoPo(suratJalan.noPo || '');
      setProject(suratJalan.project);
      setNoProject(suratJalan.noProject);
      setPerusahaan(suratJalan.kepada.perusahaan);
      setAlamat(suratJalan.kepada.alamat);
      setKontak(suratJalan.kepada.kontak || '');
      setStatus(suratJalan.status);
      setDeliveryNotes(suratJalan.deliveryNotes || '');
      setItems(JSON.parse(JSON.stringify(suratJalan.items)));
    }
  }, [suratJalan, isOpen]);

  if (!isOpen || !suratJalan) return null;

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

    // Re-generate QR payload if number, date or company changed
    const { token, hash } = generateQrPayload(nomorSuratJalan, tanggal, perusahaan);

    const updatedSj: SuratJalan = {
      ...suratJalan,
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
      items,
      status,
      deliveryNotes,
      qrCodeToken: token,
      qrHash: hash,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedSj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600">
              <FileEdit className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Edit Surat Jalan Digital</h3>
              <p className="text-[11px] text-slate-400">Modifikasi data dokumen: {suratJalan.nomorSuratJalan}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form id="edit-surat-jalan-form" onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 text-xs flex-1">
          
          {/* Section 1: Nomor Surat Jalan & Status */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nomor Surat Jalan:
              </label>
              <input
                type="text"
                required
                value={nomorSuratJalan}
                onChange={(e) => setNomorSuratJalan(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Tanggal Dokumen:
              </label>
              <input
                type="text"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Status Pengiriman:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SuratJalan['status'])}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
              >
                <option value="DRAFT">DRAFT (Disiapkan)</option>
                <option value="CHECKED">CHECKED (Lolos QC)</option>
                <option value="DISPATCHED">DISPATCHED (In Transit)</option>
                <option value="GATE_OUT">GATE_OUT (Security Checked)</option>
                <option value="DELIVERED">DELIVERED (Diterima & Sah)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Customer / Destination Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Informasi Penerima / Klien</span>
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
                  onChange={(e) => setPerusahaan(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
                />
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

          {/* Section 3: Proyek & PO */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Detail Proyek &amp; PO</span>
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

              <div className="md:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">
                  Catatan Pengiriman:
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Catatan rute / instruksi..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Items Editor */}
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
                      placeholder="Kode Material"
                      value={item.articleCode}
                      onChange={(e) => handleItemChange(item.id, 'articleCode', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono text-[11px]"
                    />
                  </div>

                  <div className="col-span-4">
                    <input
                      type="text"
                      required
                      placeholder="Nama Material"
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

        </form>

        {/* Form Actions (Pinned) */}
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
            form="edit-surat-jalan-form"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Perubahan Dokumen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
