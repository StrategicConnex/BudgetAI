import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { createBudgetVersion } from '@/lib/supabase/queries/budget-versions';
import { createLogger } from '@/lib/logger';
import type { BudgetData } from '@/types/budget';

const log = createLogger('API/budget-versions');

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
