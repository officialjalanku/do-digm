import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

export interface GeneratePdfOptions {
  elementId: string;
  filename?: string;
  scale?: number;
  onProgress?: (status: 'CAPTURING' | 'GENERATING' | 'COMPLETED' | 'ERROR', message?: string) => void;
}

/**
 * Clean filename to ensure filesystem compatibility
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
}

/**
 * Renders the Surat Jalan DOM element using native browser rendering engine (via SVG foreignObject)
 * avoiding any modern CSS color issues (e.g. Tailwind v4 oklch), and exports to a pristine A4 PDF.
 */
export async function downloadSuratJalanPdf(options: GeneratePdfOptions): Promise<boolean> {
  const { elementId, filename = 'Surat_Jalan_PT_Mulia_41.pdf', scale = 2.5, onProgress } = options;

  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    console.error(`Element with id "${elementId}" not found for PDF export.`);
    onProgress?.('ERROR', 'Elemen dokumen tidak ditemukan.');
    return false;
  }

  try {
    onProgress?.('CAPTURING', 'Merender tampilan dokumen Surat Jalan...');

    // Use html-to-image for native browser CSS engine support (supports oklch, grid, flexbox, svg)
    const imgDataUrl = await htmlToImage.toPng(targetElement, {
      quality: 0.98,
      pixelRatio: scale,
      backgroundColor: '#ffffff',
      cacheBust: true,
      filter: (node) => {
        // Exclude elements with print:hidden or data-exclude-pdf
        if (node instanceof HTMLElement) {
          if (node.classList.contains('print:hidden') || node.getAttribute('data-exclude-pdf') === 'true') {
            return false;
          }
        }
        return true;
      },
    });

    onProgress?.('GENERATING', 'Menyusun halaman PDF standar A4...');

    // Load image to determine exact dimensions
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(new Error('Gagal memuat gambar render'));
      img.src = imgDataUrl;
    });

    // Initialize A4 Portrait document (210 x 297 mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8; // 8mm margin
    const maxWidth = pageWidth - (margin * 2); // 194mm
    const maxHeight = pageHeight - (margin * 2); // 281mm

    // Calculate dimensions maintaining aspect ratio
    let printWidth = maxWidth;
    let printHeight = (img.height * maxWidth) / img.width;

    // If height exceeds 1 page, scale down to fit exactly 1 page (FRM.PRO.03.09 Page 1 of 1)
    if (printHeight > maxHeight) {
      const scaleFactor = maxHeight / printHeight;
      printHeight = maxHeight;
      printWidth = printWidth * scaleFactor;
    }

    // Center horizontally on page
    const xOffset = margin + (maxWidth - printWidth) / 2;
    const yOffset = margin;

    pdf.addImage(imgDataUrl, 'PNG', xOffset, yOffset, printWidth, printHeight, undefined, 'FAST');

    const cleanName = sanitizeFilename(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    pdf.save(cleanName);

    onProgress?.('COMPLETED', `File "${cleanName}" berhasil diunduh!`);
    return true;
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    onProgress?.('ERROR', 'Gagal memproses file PDF. Sedang membuka dialog cetak browser sebagai alternatif...');
    
    // Graceful fallback to print dialog
    triggerPrintSuratJalan(elementId);
    return false;
  }
}

/**
 * Triggers document printing with iframe sandbox fallback
 */
export function triggerPrintSuratJalan(elementId: string): boolean {
  try {
    window.print();
    return true;
  } catch (e) {
    console.warn('Direct window.print encountered issue, creating print frame:', e);
    
    const targetElement = document.getElementById(elementId);
    if (!targetElement) return false;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${document.title}</title>
            <style>
              @page { size: A4 portrait; margin: 10mm; }
              body { font-family: sans-serif; background: #fff; margin: 0; padding: 0; color: #000; }
              * { box-sizing: border-box; }
            </style>
          </head>
          <body>
            ${targetElement.outerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } finally {
          setTimeout(() => document.body.removeChild(iframe), 2000);
        }
      }, 500);
      return true;
    }
    return false;
  }
}
