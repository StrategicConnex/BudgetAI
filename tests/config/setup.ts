// ===== Global Test Setup =====
// Sets up environment variables, mocks, and global test utilities

import { vi } from 'vitest';

// ===== Environment Variables for Testing =====
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
process.env.XIAOMI_API_KEY = 'test-xiaomi-key';
// process.env.NODE_ENV is read-only in some environments
// process.env.NODE_ENV = 'test';

// ===== Global Mocks =====

// Mock crypto.randomUUID for deterministic IDs
const mockUUID = '00000000-0000-4000-8000-000000000001';
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => {
    uuidCounter++;
    return `00000000-0000-4000-8000-${String(uuidCounter).padStart(12, '0')}`;
  },
  subtle: {} as SubtleCrypto,
});

// Mock console to filter expected noise
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = (...args: any[]) => {
  const msg = args.join(' ');
  if (msg.includes('[Orchestrator]') || msg.includes('[AI]') || msg.includes('Usando mock')) {
    return; // Suppress expected mock warnings
  }
  originalConsoleWarn.apply(console, args);
};

console.error = (...args: any[]) => {
  const msg = args.join(' ');
  if (msg.includes('[Orchestrator]') || msg.includes('[AI]')) {
    return; // Suppress expected mock errors
  }
  originalConsoleError.apply(console, args);
};

// ===== Global Test Helpers =====

export function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

// `expect` is globally available because vitest is configured with `globals: true`
// No need to import it in helper functions

export { vi };
