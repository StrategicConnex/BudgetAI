import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('API/budgets-delete');

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { id } = await request.json() as { id: string };

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('budgets')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      log.error('Error al eliminar presupuesto', error);
      return NextResponse.json({ error: 'Error al eliminar el presupuesto' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Error en API delete', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}, { rateLimit: 'default' });
