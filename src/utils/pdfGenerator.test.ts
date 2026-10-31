import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeFilename } from './pdfGenerator';

test('sanitizeFilename removes illegal filesystem characters', () => {
  assert.equal(sanitizeFilename('SJ/01SKS/M41/IX/26.pdf'), 'SJ_01SKS_M41_IX_26.pdf');
  assert.equal(sanitizeFilename('Surat Jalan (PT Mulia 41).pdf'), 'Surat_Jalan__PT_Mulia_41_.pdf');
});
