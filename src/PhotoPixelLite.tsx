import { useMemo, useRef, useState } from 'react';

type LiteStage = 'idle' | 'reading' | 'local' | 'seedream' | 'done';

interface LiteResult {
  refUrl: string | null;
  potatoUrl: string | null;
  seedreamUrl: string | null;
  model: string | null;
  warning: string | null;
}

const initialResult: LiteResult = {
  refUrl: null,
  potatoUrl: null,
  seedreamUrl: null,
  model: null,
  warning: null,
};

export function PhotoPixelLite(): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [stage, setStage] = useState<LiteStage>('idle');
  const [result, setResult] = useState<LiteResult>(initialResult);
  const [error, setError] = useState<string | null>(null);

  const busy = stage === 'reading' || stage === 'local' || stage === 'seedream';
  const status = useMemo(() => {
    if (stage === 'idle') return 'READY';
    if (stage === 'reading') return 'READING PHOTO';
    if (stage === 'local') return 'MAKING POTATO';
    if (stage === 'seedream') return 'SEEDREAMING';
    return 'DONE';
  }, [stage]);

  async function handleFile(file: File): Promise<void> {
    setStage('reading');
    setError(null);
    setResult(initialResult);

    try {
      const refUrl = await compressImageToDataUrl(file, 1280, 0.9);
      setResult((current) => ({ ...current, refUrl }));
      setStage('local');

      const potatoUrl = await createAbstractPotato(refUrl);
      setResult((current) => ({ ...current, potatoUrl }));
      setStage('seedream');

      const seedream = await generateSeedream(refUrl);
      setResult((current) => ({
        ...current,
        seedreamUrl: seedream.imageUrl,
        model: seedream.model,
        warning: null,
      }));
      setStage('done');
    } catch (caught) {
      setStage('done');
      setError(caught instanceof Error ? caught.message : '生成失败，请重新拍一张。');
    }
  }

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (file) void handleFile(file);
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>POCKET FRIEND LITE</p>
          <h1 style={styles.title}>拍照生成像素小人</h1>
          <p style={styles.copy}>扫码即可体验：原照片、抽象土豆版、豆包 Seedream 可爱像素小人。</p>
        </div>
        <div style={styles.status}>{status}</div>
      </section>

      <section style={styles.captureCard}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="user"
          disabled={busy}
          onChange={onInputChange}
          style={styles.hiddenInput}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          style={{ ...styles.captureButton, opacity: busy ? 0.58 : 1 }}
        >
          {busy ? '生成中...' : result.refUrl ? '重新拍照' : '打开相机 / 上传照片'}
        </button>
        <p style={styles.helpText}>手机扫码后点按钮，允许相机或从相册选照片即可。</p>
      </section>

      <section style={styles.grid}>
        <ResultPanel title="原照片" label="REF" imageUrl={result.refUrl} empty="等待拍照" />
        <ResultPanel title="抽象土豆版" label="POTATO" imageUrl={result.potatoUrl} empty={stage === 'local' ? '生成中' : '等待照片'} />
        <ResultPanel title="豆包像素小人" label="SEEDREAM" imageUrl={result.seedreamUrl} empty={stage === 'seedream' ? '约 30-60 秒' : '等待生成'} />
      </section>

      {result.model && <p style={styles.modelText}>Seedream model: {result.model}</p>}
      {result.warning && <p style={styles.notice}>{result.warning}</p>}
      {error && <p style={styles.error}>{error}</p>}
    </main>
  );
}

function ResultPanel({
  title,
  label,
  imageUrl,
  empty,
}: {
  title: string;
  label: string;
  imageUrl: string | null;
  empty: string;
}): React.JSX.Element {
  return (
    <article style={styles.panel}>
      <div style={styles.panelHeader}>
        <span style={styles.panelLabel}>{label}</span>
        <span style={styles.panelTitle}>{title}</span>
      </div>
      <div style={styles.imageStage}>
        {imageUrl ? (
          <img src={imageUrl} alt={title} style={styles.image} />
        ) : (
          <span style={styles.empty}>{empty}</span>
        )}
      </div>
    </article>
  );
}

async function generateSeedream(image: string): Promise<{ imageUrl: string; model: string }> {
  const response = await fetch('/api/seedream-lite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  });
  const payload = await response.json().catch(() => null) as {
    imageUrl?: string;
    model?: string;
    error?: string;
  } | null;

  if (!response.ok || !payload?.imageUrl) {
    throw new Error(payload?.error ?? `豆包生成失败：HTTP ${response.status}`);
  }

  return {
    imageUrl: payload.imageUrl,
    model: payload.model ?? 'doubao-seedream',
  };
}

async function compressImageToDataUrl(file: File, maxSide: number, quality: number): Promise<string> {
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
    throw new Error('无法读取照片，请换一张。');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', quality);
}

async function createAbstractPotato(refUrl: string): Promise<string> {
  const image = await loadImage(refUrl);
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 48;
  sampleCanvas.height = 48;
  const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  if (!sampleCtx) throw new Error('无法生成抽象土豆版。');
  sampleCtx.drawImage(image, 0, 0, 48, 48);
  const data = sampleCtx.getImageData(0, 0, 48, 48).data;
  const palette = extractPalette(data);

  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法生成抽象土豆版。');
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 320, 320);
  drawPixelPotato(ctx, palette);
  return canvas.toDataURL('image/png');
}

function drawPixelPotato(ctx: CanvasRenderingContext2D, palette: string[]): void {
  const skin = palette[0] ?? '#e5b98f';
  const shadow = palette[1] ?? '#9b6b4a';
  const hair = palette[2] ?? '#34221f';
  const blush = '#ff7aa8';
  const outline = '#182336';
  const px = 10;
  const fill = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * px, y * px, w * px, h * px);
  };

  fill(11, 4, 10, 2, outline);
  fill(8, 6, 16, 2, outline);
  fill(6, 8, 20, 14, outline);
  fill(8, 22, 16, 3, outline);
  fill(10, 25, 12, 2, outline);

  fill(9, 7, 14, 2, hair);
  fill(7, 9, 18, 4, hair);
  fill(8, 13, 16, 9, skin);
  fill(9, 22, 14, 2, skin);
  fill(11, 24, 10, 1, skin);

  fill(9, 15, 3, 2, '#ffffff');
  fill(20, 15, 3, 2, '#ffffff');
  fill(10, 16, 2, 2, outline);
  fill(21, 16, 2, 2, outline);
  fill(12, 19, 8, 1, outline);
  fill(8, 19, 3, 2, blush);
  fill(21, 19, 3, 2, blush);

  fill(7, 22, 2, 2, shadow);
  fill(23, 14, 2, 7, shadow);
  fill(11, 26, 4, 2, '#45c9ff');
  fill(17, 26, 4, 2, '#45c9ff');
  fill(9, 28, 6, 1, outline);
  fill(17, 28, 6, 1, outline);

  fill(4, 10, 2, 5, '#b7f64a');
  fill(26, 10, 2, 5, '#ff4eaa');
  fill(5, 15, 2, 2, outline);
  fill(25, 15, 2, 2, outline);
}

function extractPalette(data: Uint8ClampedArray): string[] {
  let skin = [0, 0, 0, 0];
  let dark = [0, 0, 0, 0];
  let vivid = [0, 0, 0, 0];

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i] ?? 0;
    const green = data[i + 1] ?? 0;
    const blue = data[i + 2] ?? 0;
    const alpha = data[i + 3] ?? 255;
    if (alpha < 16) continue;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const sat = max - min;
    const light = (max + min) / 2;

    if (red > 120 && green > 70 && blue > 45 && red >= blue && light > 80) {
      skin = addColor(skin, red, green, blue);
    }
    if (light < 95) {
      dark = addColor(dark, red, green, blue);
    }
    if (sat > 45 && light > 55) {
      vivid = addColor(vivid, red, green, blue);
    }
  }

  return [
    toHex(average(skin, [226, 185, 144])),
    toHex(average(dark, [118, 78, 55])),
    toHex(average(vivid[3] > 0 ? vivid : dark, [55, 35, 31])),
  ];
}

function addColor(total: number[], red: number, green: number, blue: number): number[] {
  total[0] = (total[0] ?? 0) + red;
  total[1] = (total[1] ?? 0) + green;
  total[2] = (total[2] ?? 0) + blue;
  total[3] = (total[3] ?? 0) + 1;
  return total;
}

function average(total: number[], fallback: number[]): number[] {
  const count = total[3] ?? 0;
  if (count <= 0) return fallback;
  return [
    Math.round((total[0] ?? 0) / count),
    Math.round((total[1] ?? 0) / count),
    Math.round((total[2] ?? 0) / count),
  ];
}

function toHex(rgb: number[]): string {
  return `#${rgb.map((channel) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, '0')).join('')}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('照片预览加载失败。'));
    image.src = src;
  });
}

const ink = '#182336';
const cyan = '#22c7f2';
const lime = '#a7f018';
const pink = '#f04aa5';
const mint = '#d5f5e8';
const card = '#f8fff7';

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    padding: '18px 14px 28px',
    background: mint,
    color: ink,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    backgroundImage:
      'linear-gradient(rgba(24,35,54,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(24,35,54,.08) 1px, transparent 1px)',
    backgroundSize: '14px 14px',
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
    maxWidth: 980,
    margin: '0 auto 14px',
  },
  kicker: {
    margin: '0 0 8px',
    fontSize: 12,
    fontWeight: 900,
    color: pink,
  },
  title: {
    margin: 0,
    fontSize: 'clamp(28px, 8vw, 56px)',
    lineHeight: 1,
    letterSpacing: 0,
  },
  copy: {
    margin: '10px 0 0',
    maxWidth: 620,
    fontSize: 16,
    lineHeight: 1.55,
  },
  status: {
    minWidth: 96,
    padding: '8px 9px',
    border: `2px solid ${ink}`,
    background: lime,
    boxShadow: `3px 3px 0 ${ink}`,
    fontSize: 12,
    fontWeight: 900,
    textAlign: 'center',
  },
  captureCard: {
    maxWidth: 980,
    margin: '0 auto 14px',
    padding: 12,
    border: `3px solid ${ink}`,
    background: card,
    boxShadow: `5px 5px 0 ${ink}`,
  },
  hiddenInput: {
    display: 'none',
  },
  captureButton: {
    width: '100%',
    minHeight: 56,
    border: `3px solid ${ink}`,
    background: pink,
    color: '#fff',
    boxShadow: `4px 4px 0 ${ink}`,
    font: 'inherit',
    fontSize: 18,
    fontWeight: 900,
  },
  helpText: {
    margin: '10px 0 0',
    fontSize: 14,
    color: 'rgba(24,35,54,.68)',
    textAlign: 'center',
  },
  grid: {
    maxWidth: 980,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: 12,
  },
  panel: {
    minHeight: 310,
    display: 'flex',
    flexDirection: 'column',
    padding: 10,
    border: `3px solid ${ink}`,
    background: card,
    boxShadow: `5px 5px 0 ${ink}`,
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  panelLabel: {
    padding: '4px 6px',
    border: `2px solid ${ink}`,
    background: cyan,
    fontSize: 12,
    fontWeight: 900,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 900,
  },
  imageStage: {
    flex: 1,
    minHeight: 248,
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    border: `2px solid ${ink}`,
    background: '#fff',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    imageRendering: 'pixelated',
  },
  empty: {
    padding: 14,
    color: 'rgba(24,35,54,.48)',
    fontSize: 16,
    textAlign: 'center',
  },
  modelText: {
    maxWidth: 980,
    margin: '14px auto 0',
    fontSize: 13,
    color: 'rgba(24,35,54,.62)',
  },
  notice: {
    maxWidth: 980,
    margin: '12px auto 0',
    padding: 10,
    border: `2px solid ${ink}`,
    background: lime,
  },
  error: {
    maxWidth: 980,
    margin: '12px auto 0',
    padding: 10,
    border: `2px solid ${ink}`,
    background: '#ffe4ef',
    color: '#9f174d',
    fontSize: 15,
    lineHeight: 1.45,
  },
};
