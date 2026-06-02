import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { analyzeImage } from '@/lib/ai/stages/vision';
import { createLogger } from '@/lib/logger';
import type { ImageInput } from '@/types/budget';

const log = createLogger('API/ocr');

export const maxDuration = 30;

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const image = body.image as ImageInput;

    if (!image?.base64 || !image?.mimeType) {
      return NextResponse.json({ error: 'Imagen inválida' }, { status: 400 });
    }

    // V-06: Validar tamaño del payload server-side
    if (image.base64.length > 14 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Imagen demasiado grande. El tamaño máximo es 10MB.' },
        { status: 400 }
      );
    }

    // Validar que sea una imagen soportada
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!supportedTypes.includes(image.mimeType)) {
      return NextResponse.json(
        { error: `Tipo de imagen no soportado: ${image.mimeType}` },
        { status: 400 }
      );
    }

    const analysis = await analyzeImage(image);

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    log.error('Error analizando imagen', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Error analizando imagen' },
      { status: 500 }
    );
  }
}, { rateLimit: 'ocr' });
