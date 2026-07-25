const DEFAULT_DOUBAO_MODEL = 'doubao-seedream-5-0-260128';

export const SEEDREAM_MAPLESTORY_PROMPT =
  'A MapleStory-style 2D pixel art game character sprite, 2.0-2.3 head-to-body ratio, 35-45 degree quarter view, big wide-set eyes with large pupils and highlight, no nose, very small mouth, soft blush, oversized hairstyle with highlight on top, no neck, head connects directly to torso, very small torso with short cylindrical arms and legs, 32-64px retro game sprite scaled up, chunky visible pixels, clean 1px outline, flat cel-shaded colors, solid color pixel blocks, minimal shading, no dithering, no smooth gradients, no airbrush, no anti-aliasing, pure white background, single character only, full body, centered, 1080x1080 canvas. Character should look exactly like a real MapleStory player character sprite, not regular pixel art. Preserve hair color, skin tone, and facial features from the reference photo.';

interface SeedreamGenerationResponse {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  error?: {
    message?: string;
    code?: string;
  };
}

export interface SeedreamGenerationResult {
  imageUrl: string;
  compressedReferenceDataUrl: string;
  model: string;
}

export async function generateSeedreamPixelAvatar(file: File): Promise<SeedreamGenerationResult> {
  const compressedReferenceDataUrl = await compressImageToDataUrl(file, 1024);
  const response = await fetch('/api/seedream-lite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: compressedReferenceDataUrl,
    }),
  });

  const payload = await response.json().catch(() => null) as SeedreamGenerationResponse | null;

  if (!response.ok) {
    if (payload?.error?.code === 'ModelNotOpen') {
      throw new Error(
        `API Key is valid, but model is not activated for this account. Activate the model or set DOUBAO_MODEL on the server.`,
      );
    }

    if (payload?.error?.code === 'InvalidEndpointOrModel.NotFound') {
      throw new Error(
        `Ark cannot find model/endpoint. Set DOUBAO_MODEL to the exact model ID or endpoint ID shown in the Ark console.`,
      );
    }

    throw new Error(payload?.error?.message ?? `Seedream generation failed: HTTP ${response.status}`);
  }

  const imageUrl = payload?.data?.[0]?.url ?? payload?.data?.[0]?.b64_json ?? (payload as { imageUrl?: string } | null)?.imageUrl;
  if (!imageUrl) {
    throw new Error('Seedream returned no image URL.');
  }

  return {
    imageUrl: imageUrl.startsWith('http') ? imageUrl : `data:image/png;base64,${imageUrl}`,
    compressedReferenceDataUrl,
    model: (payload as { model?: string } | null)?.model ?? DEFAULT_DOUBAO_MODEL,
  };
}

export async function compressImageToDataUrl(file: File, maxSide: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Failed to create image compression canvas.');
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', 0.9);
}
