import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distRoot = path.resolve(root, "dist");
const port = Number.parseInt(process.env.PORT ?? "5173", 10);
const DOUBAO_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const DEFAULT_DOUBAO_MODEL = "doubao-seedream-5-0-260128";
const SEEDREAM_TIMEOUT_MS = 90000;
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const SEEDREAM_MAPLESTORY_PROMPT =
  "A cute MapleStory-style 2D pixel art game character sprite, 2.0-2.3 head-to-body ratio, 35-45 degree quarter view, big wide-set eyes with large pupils and highlight, no nose, very small mouth, soft blush, oversized hairstyle with highlight on top, no neck, head connects directly to torso, very small torso with short cylindrical arms and legs, 32-64px retro game sprite scaled up, chunky visible pixels, clean 1px outline, flat cel-shaded colors, solid color pixel blocks, minimal shading, no dithering, no smooth gradients, no airbrush, no anti-aliasing, pure white background, single character only, full body, centered, 1080x1080 canvas. Character should look exactly like a real MapleStory player character sprite, not regular pixel art. Preserve hair color, skin tone, and facial features from the reference photo.";

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

    if (url.pathname === "/health") {
      writeJson(response, 200, { status: "ok", service: "photo-pixel-lite" });
      return;
    }

    if (url.pathname === "/api/seedream-lite") {
      await handleSeedream(request, response);
      return;
    }

    await serveStatic(url.pathname, response);
  } catch (error) {
    writeJson(response, 500, { error: error instanceof Error ? error.message : "Server failed." });
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`Photo Pixel Lite listening on http://0.0.0.0:${port}`);
});

async function handleSeedream(request, response) {
  if (request.method === "OPTIONS") {
    writeJson(response, 204, {});
    return;
  }
  if (request.method !== "POST") {
    writeJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const input = JSON.parse(await readBody(request));
  const image = typeof input.image === "string" ? input.image : "";
  if (!image.startsWith("data:image/")) {
    writeJson(response, 400, { error: "Missing compressed image data URL." });
    return;
  }

  const apiKey = process.env.DOUBAO_API_KEY ?? process.env.VITE_DOUBAO_API_KEY;
  if (!apiKey) {
    writeJson(response, 500, { error: "Missing DOUBAO_API_KEY on the server." });
    return;
  }

  const model = process.env.DOUBAO_MODEL ?? process.env.VITE_DOUBAO_MODEL ?? DEFAULT_DOUBAO_MODEL;
  writeJson(response, 200, await callSeedream({ apiKey, model, image }));
}

async function callSeedream({ apiKey, model, image }) {
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
    const payload = await response.json().catch(() => null);
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

function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large."));
        request.destroy();
        return;
      }
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

async function serveStatic(pathname, response) {
  const normalized = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(decodeURIComponent(normalized)).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(distRoot, safePath);
  if (!filePath.startsWith(distRoot)) {
    writeJson(response, 403, { error: "Forbidden." });
    return;
  }

  if (!existsSync(filePath)) {
    filePath = path.join(distRoot, "index.html");
  }
  if (!existsSync(filePath)) {
    writeJson(response, 404, { error: "Run npm run build first." });
    return;
  }

  response.statusCode = 200;
  response.setHeader("Content-Type", contentType(filePath));
  response.setHeader("Cache-Control", filePath.endsWith("index.html") ? "no-store" : "public, max-age=31536000, immutable");
  createReadStream(filePath).pipe(response);
}

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  }[extension] ?? "application/octet-stream";
}

function writeJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Access-Control-Allow-Origin", process.env.PF_ALLOWED_ORIGIN ?? "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.end(status === 204 ? undefined : JSON.stringify(body));
}
