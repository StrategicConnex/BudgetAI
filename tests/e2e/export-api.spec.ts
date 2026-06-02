// ===== E2E TESTS (Playwright) — API Export Endpoints =====
// Tests the authenticated export endpoints: PDF, DOCX, and HTML
// Run with: npx playwright test tests/e2e/export-api.spec.ts

import { test, expect } from '@playwright/test';
import { generateFakeBudgetData } from '../fixtures/synthetic-data';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

test.describe('API Export Endpoints (Auth Required in Prod, Mocked in Test)', () => {
  
  test('should export PDF via POST /api/export/pdf', async ({ request }) => {
    const budget = generateFakeBudgetData({
      numero: 'PRES-2026-PDF-E2E',
      titulo: 'E2E Test Budget PDF',
    });

    const response = await request.post(`${BASE_URL}/api/export/pdf`, {
      data: { budget },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/pdf');
    expect(response.headers()['content-disposition']).toContain('attachment;');
    expect(response.headers()['content-disposition']).toContain('.pdf"');
    
    const buffer = await response.body();
    expect(buffer.length).toBeGreaterThan(0);
  });

  test('should export DOCX via POST /api/export/docx', async ({ request }) => {
    const budget = generateFakeBudgetData({
      numero: 'PRES-2026-DOCX-E2E',
      titulo: 'E2E Test Budget DOCX',
    });

    const response = await request.post(`${BASE_URL}/api/export/docx`, {
      data: { budget },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(response.headers()['content-disposition']).toContain('attachment;');
    expect(response.headers()['content-disposition']).toContain('.docx"');
    
    const buffer = await response.body();
    expect(buffer.length).toBeGreaterThan(0);
  });

  test('should export HTML via POST /api/export/html', async ({ request }) => {
    const budget = generateFakeBudgetData({
      numero: 'PRES-2026-HTML-E2E',
      titulo: 'E2E Test Budget HTML',
    });

    const response = await request.post(`${BASE_URL}/api/export/html`, {
      data: { budget },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(response.headers()['content-disposition']).toContain('attachment;');
    expect(response.headers()['content-disposition']).toContain('.html"');
    
    const text = await response.text();
    expect(text).toContain('<!DOCTYPE html>');
    expect(text).toContain(budget.titulo);
    expect(text).toContain(budget.cliente.nombre);
    expect(text).toContain('TOTAL');
  });

});
