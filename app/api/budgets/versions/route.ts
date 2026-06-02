import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { createBudgetVersion, getBudgetVersions } from '@/lib/supabase/queries/budget-versions';
import { createLogger } from '@/lib/logger';
import type { BudgetData } from '@/types/budget';

const log = createLogger('API/budget-versions');

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const budgetId = searchParams.get('budgetId');

    if (!budgetId) {
      return NextResponse.json(
        { error: 'budgetId es requerido' },
        { status: 400 }
      );
    }

    const versions = await getBudgetVersions(budgetId);
    return NextResponse.json(versions);
  } catch (error) {
    log.error('Error obteniendo versiones', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Error obteniendo versiones' },
      { status: 500 }
    );
  }
}, { rateLimit: 'default' });

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const { budgetId, snapshot, changedFields } = await request.json() as {
      budgetId: string;
      snapshot: BudgetData;
      changedFields?: string[];
    };

    if (!budgetId || !snapshot) {
      return NextResponse.json(
        { error: 'budgetId y snapshot son requeridos' },
        { status: 400 }
      );
    }

    await createBudgetVersion(budgetId, snapshot, changedFields);

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Error creando version', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Error creando version' },
      { status: 500 }
    );
  }
}, { rateLimit: 'default' });
