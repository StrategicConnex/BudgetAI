import { createClient } from '@/lib/supabase/server';

export interface AuditEntry {
  id: string;
  user_id: string;
  budget_id: string;
  action: 'created' | 'updated' | 'exported' | 'duplicated' | 'deleted';
  details?: Record<string, unknown>;
  created_at: string;
}

/**
 * S7: Audit log — registra acciones sobre presupuestos.
 */
export async function logAuditEntry(
  budgetId: string,
  action: AuditEntry['action'],
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('audit_log').insert({
      user_id: user.id,
      budget_id: budgetId,
      action,
      details: details || null,
    });
  } catch {
    // Audit log should never break the app
  }
}

/**
 * S7: Obtener historial de auditoría de un presupuesto.
 */
export async function getAuditHistory(budgetId: string): Promise<AuditEntry[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('budget_id', budgetId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}
