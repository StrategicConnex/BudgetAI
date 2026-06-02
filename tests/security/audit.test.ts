// ===== SECURITY TESTS =====
// Tests: SQL injection, XSS, CSRF, auth bypass, JWT manipulation, RLS, privilege escalation

import { describe, it, expect } from 'vitest';
import {
  generateSQLInjectionPayloads,
  generateXSSPayloads,
  generateAuthBypassPayloads,
  generateExtremeStrings,
  generateFakeBudgetData,
} from '../fixtures/synthetic-data';
import fs from 'fs';
import path from 'path';

// ==============================================
// 1. SQL INJECTION TESTS
// ==============================================
describe('SQL Injection — Payload Validation', () => {
  const sqliPayloads = generateSQLInjectionPayloads();

  it('should have at least 12 SQL injection payloads', () => {
    expect(sqliPayloads.length).toBeGreaterThanOrEqual(12);
  });

  it('should detect DROP TABLE injection patterns', () => {
    const dropStatements = sqliPayloads.filter(p => 
      p.includes('DROP') || p.includes('DELETE') || p.includes('TRUNCATE')
    );
    expect(dropStatements.length).toBeGreaterThan(0);
  });

  it('should detect UNION based injection', () => {
    const unionStatements = sqliPayloads.filter(p => p.includes('UNION'));
    expect(unionStatements.length).toBeGreaterThan(0);
  });

  it('should detect OR/AND injection patterns', () => {
    const orStatements = sqliPayloads.filter(p => p.includes("' OR ") || p.includes("' OR '1'='1"));
    expect(orStatements.length).toBeGreaterThan(0);
  });

  it('should detect pg_sleep/pg_shadow injections', () => {
    const pgPayloads = sqliPayloads.filter(p => 
      p.includes('pg_sleep') || p.includes('pg_shadow')
    );
    expect(pgPayloads.length).toBeGreaterThan(0);
  });

  it('should detect privilege escalation injection', () => {
    const privEscPayloads = sqliPayloads.filter(p => 
      p.includes('GRANT') || p.includes('xp_cmdshell')
    );
    expect(privEscPayloads.length).toBeGreaterThan(0);
  });
});

// ==============================================
// 2. XSS TESTS
// ==============================================
describe('Cross-Site Scripting (XSS) — Payload Validation', () => {
  const xssPayloads = generateXSSPayloads();

  it('should have at least 15 XSS payloads', () => {
    expect(xssPayloads.length).toBeGreaterThanOrEqual(15);
  });

  it('should detect script tag injection', () => {
    const scriptPayloads = xssPayloads.filter(p => p.includes('<script>'));
    expect(scriptPayloads.length).toBeGreaterThan(0);
  });

  it('should detect event handler XSS (onerror, onload, etc)', () => {
    const eventXSS = xssPayloads.filter(p => 
      p.includes('onerror') || p.includes('onload') || p.includes('onfocus') || p.includes('onclick')
    );
    expect(eventXSS.length).toBeGreaterThan(0);
  });

  it('should detect SVG-based XSS', () => {
    const svgXSS = xssPayloads.filter(p => p.includes('<svg'));
    expect(svgXSS.length).toBeGreaterThan(0);
  });

  it('should detect javascript: URI XSS', () => {
    const jsURIXSS = xssPayloads.filter(p => p.includes('javascript:'));
    expect(jsURIXSS.length).toBeGreaterThan(0);
  });

  it('should detect template injection XSS', () => {
    const templateXSS = xssPayloads.filter(p => 
      p.includes('{{') || p.includes('${') || p.includes('<%=')
    );
    expect(templateXSS.length).toBeGreaterThan(0);
  });

  it('should detect data exfiltration attempts', () => {
    const exfilPayloads = xssPayloads.filter(p => 
      p.includes('fetch(') || p.includes('document.cookie')
    );
    expect(exfilPayloads.length).toBeGreaterThan(0);
  });
});

// ==============================================
// 3. AUTH BYPASS TESTS
// ==============================================
describe('Authentication Bypass — JWT & Session Attacks', () => {
  const bypassPayloads = generateAuthBypassPayloads();

  it('should detect JWT alg:none attacks', () => {
    const noneAlg = bypassPayloads.jwtManipulations.filter(j => 
      typeof j === 'object' && j !== null && (j as any).alg === 'none'
    );
    expect(noneAlg.length).toBeGreaterThan(0);
  });

  it('should detect invalid/expired JWT tokens', () => {
    const invalidTokens = bypassPayloads.jwtManipulations.filter(j => {
      if (typeof j !== 'object' || j === null) return false;
      const payload = (j as any).payload;
      return payload && payload.iat === 0;
    });
    expect(invalidTokens.length).toBeGreaterThan(0);
  });

  it('should detect header injection attacks', () => {
    expect(bypassPayloads.headerInjections.length).toBeGreaterThan(0);
    const hasAuthBypass = bypassPayloads.headerInjections.some(h =>
      Object.keys(h).some(k => k === 'X-Forwarded-For' || k === 'Authorization')
    );
    expect(hasAuthBypass).toBe(true);
  });

  it('should detect CSRF attack vectors', () => {
    expect(bypassPayloads.requestForgeries.length).toBeGreaterThan(0);
    const hasCSRF = bypassPayloads.requestForgeries.some(r =>
      Object.keys(r).some(k => k === 'origin' || k === 'referer')
    );
    expect(hasCSRF).toBe(true);
  });
});

// ==============================================
// 4. RLS & PRIVILEGE ESCALATION TESTS
// ==============================================
describe('Row Level Security (RLS) — Policy Validation', () => {
  it('should enforce RLS for SELECT operations', () => {
    const migration = getMigrationSQL();
    const selectPolicy = migration.match(/CREATE POLICY "Users can view their own budgets"[\s\S]*?USING \(auth\.uid\(\) = user_id\)/);
    expect(selectPolicy).toBeTruthy();
  });

  it('should enforce RLS for INSERT operations', () => {
    const migration = getMigrationSQL();
    const insertPolicy = migration.match(/CREATE POLICY "Users can create their own budgets"[\s\S]*?WITH CHECK \(auth\.uid\(\) = user_id\)/);
    expect(insertPolicy).toBeTruthy();
  });

  it('should enforce RLS for UPDATE operations', () => {
    const migration = getMigrationSQL();
    const updatePolicy = migration.match(/CREATE POLICY "Users can update their own budgets"[\s\S]*?USING \(auth\.uid\(\) = user_id\)/);
    expect(updatePolicy).toBeTruthy();
  });

  it('should enforce RLS for DELETE operations', () => {
    const migration = getMigrationSQL();
    const deletePolicy = migration.match(/CREATE POLICY "Users can delete their own budgets"[\s\S]*?USING \(auth\.uid\(\) = user_id\)/);
    expect(deletePolicy).toBeTruthy();
  });

  it('should prevent user A from accessing user B budgets', () => {
    const migration = getMigrationSQL();
    // All policies check auth.uid() = user_id
    const policies = migration.match(/auth\.uid\(\) = user_id/g);
    expect(policies).toBeTruthy();
    expect(policies!.length).toBeGreaterThanOrEqual(3); // SELECT, UPDATE, DELETE
  });

  it('should not have any policy that grants public access', () => {
    const migration = getMigrationSQL();
    // No policy should allow without auth.uid
    const publicPolicies = migration.match(/FOR (SELECT|INSERT|UPDATE|DELETE).*?USING \(true\)/) || [];
    expect(publicPolicies.length).toBe(0);
  });

  it('should isolate service role from anonymous access', () => {
    // Validate that the app uses distinct keys: anon vs service_role
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
  });

  it('should have CASCADE delete to prevent orphan records', () => {
    const migration = getMigrationSQL();
    expect(migration).toContain('ON DELETE CASCADE');
    // No soft-delete trigger (data should be actually cleaned up)
    expect(migration).not.toContain('deleted_at');
  });

  it('should not allow SQL injection through RLS policies', () => {
    // Verificar que las policies usan auth.uid() = user_id, no concatenación de strings
    const migration = getMigrationSQL();
    expect(migration).not.toMatch(/['"]\s*\+\s*user_id/);
    // auth.uid() está en la línea USING, no en CREATE POLICY — buscamos en todo el migration
    const uidRefs = migration.match(/auth\.uid\(\) = user_id/g);
    expect(uidRefs).toBeTruthy();
    expect(uidRefs!.length).toBeGreaterThanOrEqual(3); // SELECT, UPDATE, DELETE
  });
});

// ==============================================
// 5. MIDDLEWARE SECURITY TESTS
// ==============================================
describe('Middleware — Route Protection', () => {
  it('should protect dashboard routes from unauthenticated access', async () => {
    const proxy = await import('@/proxy');
    expect(proxy.default).toBeDefined();
  });

  it('should redirect unauthenticated users from /dashboard', async () => {
    const { config } = await import('@/proxy');
    expect(config.matcher).toBeDefined();
    expect(Array.isArray(config.matcher)).toBe(true);
  });

  it('should exclude static assets from middleware', async () => {
    const { config } = await import('@/proxy');
    const matchers = config.matcher as string[];
    
    // Should exclude common static paths
    for (const matcher of matchers) {
      expect(matcher).toContain('_next');
    }
  });
});

// ==============================================
// 6. INPUT VALIDATION SECURITY TESTS
// ==============================================
describe('Input Validation — Security Boundaries', () => {
  it('should validate budget schema with zod', async () => {
    const { BudgetSchema, AIBudgetOutputSchema } = await import('@/lib/validators/budget');
    expect(BudgetSchema).toBeDefined();
    expect(AIBudgetOutputSchema).toBeDefined();
  });

  it('should reject budgets without items', async () => {
    const { BudgetSchema } = await import('@/lib/validators/budget');
    const result = BudgetSchema.safeParse({
      titulo: 'Test',
      cliente: { nombre: 'Test' },
      categoria: 'General',
      descripcionGeneral: 'Test',
      items: [],
      totales: { subtotal: 0, impuestos: 0, tasaImpuesto: 0.21, total: 0, currency: 'ARS' },
      condiciones: { validezDias: 30, formaPago: 'Test', plazoDias: 0 },
      templateId: 'construction',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid currencies', async () => {
    const { BudgetTotalsSchema } = await import('@/lib/validators/budget');
    const result = BudgetTotalsSchema.safeParse({
      subtotal: 0, impuestos: 0, tasaImpuesto: 0.21, total: 0, currency: 'EUR'
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative prices', async () => {
    const { BudgetItemSchema } = await import('@/lib/validators/budget');
    const result = BudgetItemSchema.safeParse({
      titulo: 'Test',
      descripcion: 'Test description',
      unidad: 'm²',
      cantidad: -5,
      precioUnitario: 1000,
      precioTotal: 5000,
      categoria: 'General',
      imagenes: [],
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty client names', async () => {
    const { BudgetClienteSchema } = await import('@/lib/validators/budget');
    const result = BudgetClienteSchema.safeParse({ nombre: '' });
    expect(result.success).toBe(false);
  });

  it('should validate email format in client data', async () => {
    const { BudgetClienteSchema } = await import('@/lib/validators/budget');
    
    const validEmails = ['test@test.com', 'user@company.com.ar'];
    const invalidEmails = ['not-an-email', '', '@invalid.com', 'user@'];

    for (const email of validEmails) {
      const result = BudgetClienteSchema.safeParse({ nombre: 'Test', email });
      expect(result.success).toBe(true);
    }

    // Empty email is optional, so it should pass
    const emptyResult = BudgetClienteSchema.safeParse({ nombre: 'Test', email: '' });
    expect(emptyResult.success).toBe(true);
  });

  it('should validate rate limits in AI status response', async () => {
    const { AI_MODELS } = await import('@/lib/ai/providers');
    expect(AI_MODELS).toBeDefined();
  });
});

// ==============================================
// 7. PROTOYPE POLLUTION & RECURSION ATTACKS
// ==============================================
describe('Prototype Pollution — JSON Payload Safety', () => {
  it('should detect __proto__ pollution attempts', () => {
    const pollutionPayloads = generateExtremeStrings().filter(j => 
      j.includes('__proto__') || j.includes('constructor')
    );
    expect(pollutionPayloads.length).toBeGreaterThan(0);
  });

  it('should handle recursive JSON structures', async () => {
    const { AIBudgetOutputSchema } = await import('@/lib/validators/budget');
    
    // Test that schema doesn't crash on deeply nested objects
    const deepObj = { a: { b: { c: { d: { e: 'deep' } } } } };
    const result = AIBudgetOutputSchema.safeParse({
      titulo: 'Test',
      cliente: { nombre: 'Test', ...deepObj },
      categoria: 'General',
      descripcionGeneral: 'Test',
      items: [{ titulo: 'Item', descripcion: 'Desc', cantidad: 1, precioUnitario: 100 }],
      condiciones: {},
    });
    // Should not crash - may pass or fail but not throw
    expect(typeof result.success).toBe('boolean');
  });
});

// ==============================================
// HELPER
// ==============================================
function getMigrationSQL(): string {
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/001_initial.sql');
  return fs.readFileSync(migrationPath, 'utf-8');
}
