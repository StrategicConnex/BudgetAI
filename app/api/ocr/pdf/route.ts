import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { base64, filename } = await req.json() as { base64: string; filename: string };

    if (!base64) {
      return NextResponse.json({ error: 'Se requiere base64 del PDF' }, { status: 400 });
    }

    const buffer = Buffer.from(base64, 'base64');

    // pdf-parse v4: PDFParse recibe { data: Buffer, verbosity: number }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse, VerbosityLevel } = require('pdf-parse') as {
      VerbosityLevel: { ERRORS: number };
      PDFParse: new (opts: { data: Buffer; verbosity: number }) => {
        promise: Promise<{ text: string; numpages: number }>;
      };
    };

    const parser = new PDFParse({ data: buffer, verbosity: VerbosityLevel.ERRORS });
    const data = await parser.promise;

    const text = data.text?.trim() || '';
    const pageCount = data.numpages || 1;

    return NextResponse.json({
      success: true,
      text,
      pageCount,
      filename,
      charCount: text.length,
    });
  } catch (err) {
    console.error('[PDF OCR]', err);
    return NextResponse.json(
      { error: 'No se pudo extraer texto del PDF', details: String(err) },
      { status: 500 }
    );
  }
}
