import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/ai/stages/vision';
import { createClient } from '@/lib/supabase/server';
import type { ImageInput } from '@/types/budget';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const image = body.image as ImageInput;

    if (!image?.base64 || !image?.mimeType) {
      return NextResponse.json({ error: 'Imagen inválida' }, { status: 400 });
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
    console.error('[API/ocr]', error);
    return NextResponse.json(
      { error: 'Error analizando imagen' },
      { status: 500 }
    );
  }
}
