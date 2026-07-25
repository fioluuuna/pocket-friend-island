import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const DOUBAO_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const DEFAULT_DOUBAO_MODEL = "doubao-seedream-5-0-260128";
const SEEDREAM_TIMEOUT_MS = 90000;
const SEEDREAM_MAPLESTORY_PROMPT =
  "A cute MapleStory-style 2D pixel art game character sprite, 2.0-2.3 head-to-body ratio, 35-45 degree quarter view, big wide-set eyes with large pupils and highlight, no nose, very small mouth, soft blush, oversized hairstyle with highlight on top, no neck, head connects directly to torso, very small torso with short cylindrical arms and legs, 32-64px retro game sprite scaled up, chunky visible pixels, clean 1px outline, flat cel-shaded colors, solid color pixel blocks, minimal shading, no dithering, no smooth gradients, no airbrush, no anti-aliasing, pure white background, single character only, full body, centered, 1080x1080 canvas. Character should look exactly like a real MapleStory player character sprite, not regular pixel art. Preserve hair color, skin tone, and facial features from the reference photo.";

export default defineConfig(({ mode }) => {
  const env = {
    ...loadEnv(mode, process.cwd(), ["DOUBAO_", "VITE_DOUBAO_"]),
    ...process.env,
  };

  return {
    plugins: [react(), seedreamLiteProxyPlugin(env)],
    server: {
      port: 5173,
      open: true,
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
    test: {
      globals: true,
      environment: "node",
    },
  };
});

function seedreamLiteProxyPlugin(env: Record<string, string | undefined>) {
  return {
    name: "seedream-lite-proxy",
    configureServer(server: { middlewares: { use: (path: string, handler: (request: NodeRequest, response: NodeResponse) => void) => void } }) {
      server.middlewares.use("/api/seedream-lite", async (request, response) => {
        if (request.method === "OPTIONS") {
          writeJson(response, 204, {});
          return;
        }
        if (request.method !== "POST") {
          writeJson(response, 405, { error: "Method not allowed." });
          return;
        }

        try {
          const input = JSON.parse(await readBody(request)) as { image?: unknown };
          const image = typeof input.image === "string" ? input.image : "";
          if (!image.startsWith("data:image/")) {
            writeJson(response, 400, { error: "Missing compressed image data URL." });
            return;
          }

          const apiKey = env.DOUBAO_API_KEY ?? env.VITE_DOUBAO_API_KEY;
          if (!apiKey) {
            writeJson(response, 500, { error: "Missing DOUBAO_API_KEY on the server." });
            return;
          }

          const model = env.DOUBAO_MODEL ?? env.VITE_DOUBAO_MODEL ?? DEFAULT_DOUBAO_MODEL;
          const result = await callSeedream({ apiKey, model, image });
          writeJson(response, 200, result);
        } catch (error) {
          writeJson(response, 500, { error: error instanceof Error ? error.message : "Seedream proxy failed." });
        }
      });
    },
  };
}

async function callSeedream({
  apiKey,
  model,
  image,
}: {
  apiKey: string;
  model: string;
  image: string;
}): Promise<{ imageUrl: string; model: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEEDREAM_TIMEOUT_MS);
  try {
    const response = await fetch(DOUBAO_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt: SEEDREAM_MAPLESTORY_PROMPT,
        image,
        sequential_image_generation: "disabled",
        size: "2K",
        response_format: "url",
        stream: false,
        watermark: false,
      }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null) as {
      data?: Array<{ url?: string; b64_json?: string }>;
      error?: { code?: string; message?: string };
    } | null;

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? `Seedream failed: HTTP ${response.status}`);
    }

    const rawImageUrl = payload?.data?.[0]?.url ?? payload?.data?.[0]?.b64_json;
    if (!rawImageUrl) throw new Error("Seedream returned no image.");
    return {
      imageUrl: rawImageUrl.startsWith("http") ? rawImageUrl : `data:image/png;base64,${rawImageUrl}`,
      model,
    };
  } finally {
    clearTimeout(timer);
  }
}

function readBody(request: NodeRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function writeJson(response: NodeResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(status === 204 ? undefined : JSON.stringify(body));
}

interface NodeRequest {
  method?: string;
  on(event: "data", listener: (chunk: Buffer | string) => void): void;
  on(event: "end", listener: () => void): void;
  on(event: "error", listener: (error: Error) => void): void;
}

interface NodeResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}
