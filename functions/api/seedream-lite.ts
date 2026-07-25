const DOUBAO_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
const DEFAULT_DOUBAO_MODEL = 'doubao-seedream-5-0-260128';
const SEEDREAM_TIMEOUT_MS = 90000;
const SEEDREAM_MAPLESTORY_PROMPT =
  'A cute MapleStory-style 2D pixel art game character sprite, 2.0-2.3 head-to-body ratio, 35-45 degree quarter view, big wide-set eyes with large pupils and highlight, no nose, very small mouth, soft blush, oversized hairstyle with highlight on top, no neck, head connects directly to torso, very small torso with short cylindrical arms and legs, 32-64px retro game sprite scaled up, chunky visible pixels, clean 1px outline, flat cel-shaded colors, solid color pixel blocks, minimal shading, no dithering, no smooth gradients, no airbrush, no anti-aliasing, pure white background, single character only, full body, centered, 1080x1080 canvas. Character should look exactly like a real MapleStory player character sprite, not regular pixel art. Preserve hair color, skin tone, and facial features from the reference photo.';

export const onRequestOptions: PagesFunction = async () => json({}, 204);

export const onRequestPost: PagesFunction<{
  DOUBAO_API_KEY?: string;
  VITE_DOUBAO_API_KEY?: string;
  DOUBAO_MODEL?: string;
  VITE_DOUBAO_MODEL?: string;
}> = async ({ request, env }) => {
  try {
    const input = await request.json() as { image?: unknown };
    const image = typeof input.image === 'string' ? input.image : '';
    if (!image.startsWith('data:image/')) {
      return json({ error: 'Missing compressed image data URL.' }, 400);
    }

    const apiKey = env.DOUBAO_API_KEY ?? env.VITE_DOUBAO_API_KEY;
    if (!apiKey) {
      return json({ error: 'Missing DOUBAO_API_KEY in Cloudflare Pages environment variables.' }, 500);
    }

    const model = env.DOUBAO_MODEL ?? env.VITE_DOUBAO_MODEL ?? DEFAULT_DOUBAO_MODEL;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEEDREAM_TIMEOUT_MS);
    try {
      const response = await fetch(DOUBAO_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt: SEEDREAM_MAPLESTORY_PROMPT,
          image,
          sequential_image_generation: 'disabled',
          size: '2K',
          response_format: 'url',
          stream: false,
          watermark: false,
        }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null) as {
        data?: Array<{ url?: string; b64_json?: string }>;
        error?: { message?: string };
      } | null;
      if (!response.ok) {
        return json({ error: payload?.error?.message ?? `Seedream failed: HTTP ${response.status}` }, response.status);
      }

      const rawImageUrl = payload?.data?.[0]?.url ?? payload?.data?.[0]?.b64_json;
      if (!rawImageUrl) return json({ error: 'Seedream returned no image.' }, 502);
      return json({
        imageUrl: rawImageUrl.startsWith('http') ? rawImageUrl : `data:image/png;base64,${rawImageUrl}`,
        model,
      }, 200);
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Seedream proxy failed.' }, 500);
  }
};

export const onRequest: PagesFunction = async () => json({ error: 'Method not allowed.' }, 405);

function json(body: unknown, status: number): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
