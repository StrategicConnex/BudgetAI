import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/api-middleware';
import { createLogger } from '@/lib/logger';

const log = createLogger('API/ocr-pdf');

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const { base64, filename } = await req.json() as { base64: string; filename: string };

    if (!base64) {
      return NextResponse.json({ error: 'Se requiere base64 del PDF' }, { status: 400 });
    }

    // V-06: Validar tamaño del payload server-side
    if (base64.length > 14 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'PDF demasiado grande. El tamaño máximo es 10MB.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(base64, 'base64');

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse, VerbosityLevel } = require('pdf-parse') as any;

    const parser = new PDFParse({ data: buffer, verbosity: VerbosityLevel.ERRORS });
    const data = await parser.getText();
    await parser.destroy();

    const text = data.text?.trim() || '';
    const pageCount = data.pages?.length || 1;

    return NextResponse.json({
      success: true,
      text,
      pageCount,
      filename,
      charCount: text.length,
    });
  } catch (err) {
    log.error('No se pudo extraer texto del PDF', err instanceof Error ? err : undefined);
    return NextResponse.json(
      { error: 'No se pudo extraer texto del PDF', details: String(err) },
      { status: 500 }
    );
  }
}, { limit: 'ocr' });
