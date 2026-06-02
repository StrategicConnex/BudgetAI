// ===== SUPABASE MOCK CLIENT FOR E2E TESTS =====
// This file provides a deterministic mock Supabase client when PLAYWRIGHT_TEST is active.
// It bypasses remote Supabase API calls and returns realistic, synthetic data.

import { generateFakeBudgetData } from '@/tests/fixtures/synthetic-data';

export const mockUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'test@budgetai.com',
  role: 'authenticated',
  aud: 'authenticated',
};

export function createMockSupabaseClient() {
  let queriedId: string | null = null;

  const chain = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    eq: (column: string, value: any) => {
      if (column === 'id') {
        queriedId = value;
      }
      return chain;
    },
    order: () => chain,
    range: () => chain,
    single: async () => {
      // Return 404 for invalid/non-existent budget IDs in E2E tests
      if (queriedId && queriedId !== '00000000-0000-0000-0000-000000000002') {
        return {
          data: null,
          error: { message: 'Not found', code: 'PGRST116' },
        };
      }

      const budget = generateFakeBudgetData({
        id: '00000000-0000-0000-0000-000000000002',
        numero: 'PRES-2026-TEST',
        titulo: 'Presupuesto de Pintura E2E',
      });
      return {
        data: {
          id: '00000000-0000-0000-0000-000000000002',
          user_id: mockUser.id,
          title: 'Presupuesto de Pintura E2E',
          raw_input: 'Test input',
          ai_output: budget,
          template_id: 'minimal-white',
          status: 'ready',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
    },
    // Supports Promise resolution when directly awaiting the chain for arrays
    then: (resolve: any) => {
      if (queriedId && queriedId !== '00000000-0000-0000-0000-000000000002') {
        resolve({ data: [], error: null });
        return;
      }

      const budget = generateFakeBudgetData({
        id: '00000000-0000-0000-0000-000000000002',
        numero: 'PRES-2026-TEST',
        titulo: 'Presupuesto de Pintura E2E',
      });
      const fakeRow = {
        id: '00000000-0000-0000-0000-000000000002',
        user_id: mockUser.id,
        title: 'Presupuesto de Pintura E2E',
        raw_input: 'Test input',
        ai_output: budget,
        template_id: 'minimal-white',
        status: 'ready',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      resolve({
        data: [fakeRow],
        error: null,
      });
    }
  };

  return {
    auth: {
      getUser: async () => ({
        data: { user: mockUser },
        error: null,
      }),
      getSession: async () => ({
        data: { session: { user: mockUser, access_token: 'fake-token' } },
        error: null,
      }),
      signInWithPassword: async ({ email, password }: { email?: string; password?: string } = {}) => {
        if (email === 'invalid@test.com' || password === 'wrongpassword') {
          return {
            data: { user: null, session: null },
            error: new Error('Credenciales inválidas'),
          };
        }
        return {
          data: { user: mockUser, session: { access_token: 'fake-token' } },
          error: null,
        };
      },
      signUp: async () => ({
        data: { user: mockUser, session: { access_token: 'fake-token' } },
        error: null,
      }),
      signOut: async () => ({ error: null }),
    },
    from: () => chain,
  };
}
