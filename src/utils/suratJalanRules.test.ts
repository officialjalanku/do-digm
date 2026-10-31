import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDeliveryProgress,
  generateQrPayload,
  verifyQrPayload,
  canTransitionTo,
  calculateTotals,
  getRomanMonth,
  extractCustomerCode,
  generateNomorSuratJalan,
  getNextSequenceNumber,
  SuratJalan,
} from './suratJalanRules';

test('calculateDeliveryProgress returns correct step percentages', () => {
  assert.equal(calculateDeliveryProgress('DRAFT'), 20);
  assert.equal(calculateDeliveryProgress('CHECKED'), 40);
  assert.equal(calculateDeliveryProgress('DISPATCHED'), 60);
  assert.equal(calculateDeliveryProgress('GATE_OUT'), 80);
  assert.equal(calculateDeliveryProgress('DELIVERED'), 100);
});

test('generateQrPayload generates deterministic tokens and hashes', () => {
  const { token, hash } = generateQrPayload('SJ/01SKS/M41/IX/26', '2026-10-29', 'PT Sekawan');
  assert.match(token, /^M41-SJ-/);
  assert.equal(hash.length, 8);

  // Calling with same input yields same output
  const check = generateQrPayload('SJ/01SKS/M41/IX/26', '2026-10-29', 'PT Sekawan');
  assert.equal(token, check.token);
  assert.equal(hash, check.hash);
});

test('verifyQrPayload correctly verifies matching and rejects mismatched codes', () => {
  const mockSj = {
    id: 'sj-101',
    nomorSuratJalan: 'SJ/01SKS/M41/IX/26',
    qrCodeToken: 'M41-SJ-01SKS-20261029',
  } as SuratJalan;

  // Matching full URL with token
  const resValid = verifyQrPayload('https://mulia41.com/verify?token=M41-SJ-01SKS-20261029', mockSj);
  assert.equal(resValid.valid, true);

  // Mismatch
  const resInvalid = verifyQrPayload('https://other.com/unknown', mockSj);
  assert.equal(resInvalid.valid, false);
});

test('canTransitionTo enforces sequential checkpoint workflow', () => {
  assert.equal(canTransitionTo('DRAFT', 'CHECKED'), true);
  assert.equal(canTransitionTo('CHECKED', 'DISPATCHED'), true);
  assert.equal(canTransitionTo('DISPATCHED', 'GATE_OUT'), true);
  assert.equal(canTransitionTo('GATE_OUT', 'DELIVERED'), true);
  // Skipping steps is disallowed
  assert.equal(canTransitionTo('DRAFT', 'DELIVERED'), false);
});

test('calculateTotals computes correct counts and verification flags', () => {
  const items = [
    { id: '1', no: 1, articleCode: 'A1', dim: '1x2', namaMaterial: 'Plat', qty: 10, uom: 'LBR', keterangan: '', isVerified: true },
    { id: '2', no: 2, articleCode: 'A2', dim: '2x3', namaMaterial: 'Baja', qty: 5, uom: 'PCS', keterangan: '', isVerified: false },
  ];
  const totals = calculateTotals(items);
  assert.equal(totals.totalItems, 2);
  assert.equal(totals.totalQty, 15);
  assert.equal(totals.verifiedCount, 1);
  assert.equal(totals.isAllVerified, false);
});

test('getRomanMonth converts all 12 months correctly', () => {
  assert.equal(getRomanMonth(1), 'I');
  assert.equal(getRomanMonth(5), 'V');
  assert.equal(getRomanMonth(9), 'IX');
  assert.equal(getRomanMonth(10), 'X');
  assert.equal(getRomanMonth(12), 'XII');
});

test('extractCustomerCode extracts proper acronyms ignoring PT/CV', () => {
  assert.equal(extractCustomerCode('PT. Sekawan Kita Sejahtera'), 'SKS');
  assert.equal(extractCustomerCode('PT Mega Mandiri Perkasa'), 'MMP');
  assert.equal(extractCustomerCode('PT. Cipta Graha Mandiri'), 'CGM');
  assert.equal(extractCustomerCode('CV. Jaya Abadi'), 'JA');
  assert.equal(extractCustomerCode('SKS'), 'SKS');
});

test('generateNomorSuratJalan generates exact PT Mulia 41 format', () => {
  // Test case matching reference image 1
  const result1 = generateNomorSuratJalan({
    sequence: 1,
    customerCodeOrName: 'PT. Sekawan Kita Sejahtera',
    date: '2026-09-15',
    companyCode: 'M41',
  });
  assert.equal(result1.nomorSuratJalan, 'SJ/01SKS/M41/IX/26');

  // Test case matching October 2026 for PT Mega Mandiri Perkasa
  const result2 = generateNomorSuratJalan({
    sequence: 2,
    customerCodeOrName: 'PT. Mega Mandiri Perkasa',
    date: '10/29/2026',
    companyCode: 'M41',
  });
  assert.equal(result2.nomorSuratJalan, 'SJ/02MMP/M41/X/26');

  // Test case for 3rd document with Cipta Graha Mandiri
  const result3 = generateNomorSuratJalan({
    sequence: 3,
    customerCodeOrName: 'PT. Cipta Graha Mandiri',
    date: '10/29/2026',
  });
  assert.equal(result3.nomorSuratJalan, 'SJ/03CGM/M41/X/26');
});

