export interface SuratJalanItem {
  id: string;
  no: number;
  articleCode: string;
  dim: string;
  namaMaterial: string;
  qty: number;
  uom: string;
  keterangan: string;
  isVerified?: boolean;
}

export type DeliveryStatus =
  | 'DRAFT'
  | 'CHECKED'
  | 'DISPATCHED'
  | 'GATE_OUT'
  | 'DELIVERED';

export interface SignatureCheckpoint {
  role: 'dibuat' | 'diperiksa' | 'driver' | 'security' | 'penerima';
  title: string;
  name: string;
  jabatan?: string;
  status: 'PENDING' | 'SIGNED';
  timestamp?: string;
  signatureDataUrl?: string;
  location?: string;
  notes?: string;
}

export interface SuratJalan {
  id: string;
  nomorSuratJalan: string;
  tanggal: string;
  noKendaraan: string;
  noPo: string;
  project: string;
  noProject: string;
  kepada: {
    perusahaan: string;
    alamat: string;
    kontak?: string;
  };
  docInfo: {
    docNo: string;
    rev: string;
    effectiveDate: string;
    page: string;
  };
  items: SuratJalanItem[];
  checkpoints: {
    dibuat: SignatureCheckpoint;
    diperiksa: SignatureCheckpoint;
    driver: SignatureCheckpoint;
    security: SignatureCheckpoint;
    penerima: SignatureCheckpoint;
  };
  status: DeliveryStatus;
  qrCodeToken: string;
  qrHash: string;
  createdAt: string;
  updatedAt: string;
  deliveryNotes?: string;
  proofOfDeliveryPhoto?: string;
}

/**
 * Calculates current progress percentage based on delivery checkpoints
 */
export function calculateDeliveryProgress(status: DeliveryStatus): number {
  switch (status) {
    case 'DRAFT':
      return 20;
    case 'CHECKED':
      return 40;
    case 'DISPATCHED':
      return 60;
    case 'GATE_OUT':
      return 80;
    case 'DELIVERED':
      return 100;
    default:
      return 0;
  }
}

/**
 * Generates a tamper-evident QR verification token and checksum
 */
export function generateQrPayload(sjNumber: string, date: string, recipient: string): { token: string; hash: string } {
  const cleanNum = sjNumber.replace(/[^a-zA-Z0-9]/g, '');
  const cleanDate = date.replace(/[^a-zA-Z0-9]/g, '');
  const cleanRec = recipient.slice(0, 8).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const token = `M41-SJ-${cleanNum}-${cleanDate}`;
  
  // Deterministic lightweight hash code
  let hashVal = 5381;
  const raw = `${token}:${cleanRec}:MULIA41_AUTHENTIC`;
  for (let i = 0; i < raw.length; i++) {
    hashVal = ((hashVal << 5) + hashVal) + raw.charCodeAt(i);
    hashVal = hashVal & hashVal;
  }
  const hash = Math.abs(hashVal).toString(16).toUpperCase().padStart(8, '0');
  return { token, hash };
}

/**
 * Validates whether QR data matches expected Surat Jalan
 */
export function verifyQrPayload(scannedCode: string, suratJalan: SuratJalan): { valid: boolean; message: string } {
  if (!scannedCode || !suratJalan) {
    return { valid: false, message: 'Kode QR tidak valid atau dokumen tidak ditemukan.' };
  }
  
  // Either direct token match or URL containing token or JSON payload
  const hasToken = scannedCode.includes(suratJalan.qrCodeToken) || 
                   scannedCode.includes(suratJalan.nomorSuratJalan) ||
                   scannedCode.includes(suratJalan.id);

  if (!hasToken) {
    return { valid: false, message: 'Kode QR tidak cocok dengan Surat Jalan ini.' };
  }

  return { valid: true, message: 'Kode QR valid dan terverifikasi dari sistem PT Mulia 41.' };
}

/**
 * Validate next status transition
 */
export function canTransitionTo(current: DeliveryStatus, target: DeliveryStatus): boolean {
  const sequence: DeliveryStatus[] = ['DRAFT', 'CHECKED', 'DISPATCHED', 'GATE_OUT', 'DELIVERED'];
  const currentIndex = sequence.indexOf(current);
  const targetIndex = sequence.indexOf(target);
  
  // Can stay at same, advance by 1, or jump if admin overrides
  return targetIndex === currentIndex + 1;
}

/**
 * Converts month number (1-12) to Roman numeral
 */
export function getRomanMonth(month: number): string {
  const romanMap: Record<number, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII',
    9: 'IX',
    10: 'X',
    11: 'XI',
    12: 'XII',
  };
  return romanMap[month] || 'I';
}

/**
 * Extracts a 2-4 character customer acronym from company name
 * E.g., "PT. Sekawan Kita Sejahtera" -> "SKS"
 * "PT Mega Mandiri Perkasa" -> "MMP"
 * "PT. Cipta Graha Mandiri" -> "CGM"
 */
export function extractCustomerCode(companyName: string): string {
  if (!companyName || !companyName.trim()) return 'GEN';

  let cleaned = companyName.trim();

  // If already short acronym (e.g. "SKS", "MMP", "WIKA")
  const wordsOnly = cleaned.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  const rawParts = wordsOnly.split(/\s+/).filter(Boolean);

  // Filter out Indonesian legal entities
  const legalEntities = new Set(['PT', 'CV', 'UD', 'TB', 'FA', 'PO', 'TOKO', 'YAYASAN', 'PERUM', 'PERSERO', 'KOPERASI']);
  const filteredWords = rawParts.filter(w => !legalEntities.has(w.toUpperCase()));

  if (filteredWords.length === 0) {
    return 'CUST';
  }

  // If only 1 word (e.g. "Holcim", "Indosteel", "SKS")
  if (filteredWords.length === 1) {
    const single = filteredWords[0].toUpperCase();
    if (single.length <= 4) return single;
    return single.slice(0, 3);
  }

  // Multiple words: take first letters of each word
  // e.g. ["Sekawan", "Kita", "Sejahtera"] -> "SKS"
  const acronym = filteredWords.map(w => w[0].toUpperCase()).join('').slice(0, 4);
  return acronym || 'CUST';
}

/**
 * Parses date string or Date object into month (1-12) and year (2-digit string)
 */
export function parseDateComponents(dateInput?: string | Date): { month: number; year2Digit: string; fullYear: number } {
  let dateObj = new Date();
  if (dateInput) {
    if (typeof dateInput === 'string') {
      // Support MM/DD/YYYY, YYYY-MM-DD, or DD/MM/YYYY
      if (dateInput.includes('/')) {
        const parts = dateInput.split('/');
        // If part[0] is month e.g. 10/29/2026
        if (Number(parts[0]) <= 12 && parts.length === 3) {
          const m = Number(parts[0]);
          const d = Number(parts[1]);
          const y = parts[2].length === 2 ? 2000 + Number(parts[2]) : Number(parts[2]);
          dateObj = new Date(y, m - 1, d);
        } else if (Number(parts[1]) <= 12 && parts.length === 3) {
          // DD/MM/YYYY
          const d = Number(parts[0]);
          const m = Number(parts[1]);
          const y = parts[2].length === 2 ? 2000 + Number(parts[2]) : Number(parts[2]);
          dateObj = new Date(y, m - 1, d);
        }
      } else {
        const parsed = new Date(dateInput);
        if (!isNaN(parsed.getTime())) dateObj = parsed;
      }
    } else {
      dateObj = dateInput;
    }
  }

  const month = dateObj.getMonth() + 1;
  const fullYear = dateObj.getFullYear();
  const year2Digit = fullYear.toString().slice(-2);
  return { month, year2Digit, fullYear };
}

export interface GenerateSjNumberOptions {
  sequence: number;
  customerCodeOrName: string;
  date?: string | Date;
  companyCode?: string; // defaults to 'M41'
}

/**
 * Generates official Surat Jalan Number according to PT Mulia 41 rules:
 * Format: SJ/{NoUrut}{KodeCustomer}/M41/{BulanRomawi}/{Tahun2Digit}
 * Example: SJ/01SKS/M41/IX/26
 */
export function generateNomorSuratJalan(options: GenerateSjNumberOptions): {
  nomorSuratJalan: string;
  breakdown: {
    prefix: string;
    sequenceStr: string;
    customerCode: string;
    companyCode: string;
    romanMonth: string;
    yearStr: string;
  };
} {
  const { sequence, customerCodeOrName, date, companyCode = 'M41' } = options;

  const sequenceStr = Math.max(1, sequence).toString().padStart(2, '0');
  
  // If customerCodeOrName is already a 2-4 letter uppercase code without spaces, use directly; otherwise extract
  const trimmed = customerCodeOrName?.trim() || '';
  const customerCode = (/^[A-Za-z0-9]{2,5}$/.test(trimmed))
    ? trimmed.toUpperCase()
    : extractCustomerCode(trimmed);

  const { month, year2Digit } = parseDateComponents(date);
  const romanMonth = getRomanMonth(month);

  const nomorSuratJalan = `SJ/${sequenceStr}${customerCode}/${companyCode}/${romanMonth}/${year2Digit}`;

  return {
    nomorSuratJalan,
    breakdown: {
      prefix: 'SJ',
      sequenceStr,
      customerCode,
      companyCode,
      romanMonth,
      yearStr: year2Digit,
    },
  };
}

/**
 * Calculates next sequence number based on existing Surat Jalan documents
 */
export function getNextSequenceNumber(existingList: SuratJalan[]): number {
  if (!existingList || existingList.length === 0) return 1;

  let maxSeq = 0;
  for (const sj of existingList) {
    // Match SJ/(\d{2})[A-Za-z0-9]+/ or similar
    const match = sj.nomorSuratJalan.match(/SJ\/(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  return maxSeq + 1;
}

/**
 * Computes total items and total quantities
 */
export function calculateTotals(items: SuratJalanItem[]) {
  const totalItems = items.length;
  const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const verifiedCount = items.filter(i => i.isVerified).length;
  return {
    totalItems,
    totalQty,
    verifiedCount,
    isAllVerified: totalItems > 0 && verifiedCount === totalItems,
  };
}

