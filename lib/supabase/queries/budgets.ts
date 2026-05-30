import { createClient } from '@/lib/supabase/server';
import type { BudgetData, BudgetStatus, TemplateId } from '@/types/budget';

export interface CreateBudgetInput {
  title: string;
  rawInput: string;
  aiOutput?: BudgetData;
  templateId: TemplateId;
  status: BudgetStatus;
}

export async function createBudget(input: CreateBudgetInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('budgets')
    .insert({
      user_id: user.id,
      title: input.title,
      raw_input: input.rawInput,
      ai_output: input.aiOutput || null,
      template_id: input.templateId,
      status: input.status,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBudget(id: string, updates: Partial<{
  title: string;
  aiOutput: BudgetData;
  status: BudgetStatus;
}>) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('budgets')
    .update({
      ...(updates.title && { title: updates.title }),
      ...(updates.aiOutput && { ai_output: updates.aiOutput }),
      ...(updates.status && { status: updates.status }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getBudget(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function listBudgets(limit = 50, offset = 0) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
