import { useMemo, useState } from 'react';
import { detectFace } from '../avatar';
import { generateSeedreamPixelAvatar } from '../api';
import type { FaceFeatures } from '../types';

type GenerationStage = 'idle' | 'extracting' | 'generating' | 'done';

interface FaceCaptureState {
  referenceUrl: string | null;
  seedreamUrl: string | null;
  features: FaceFeatures | null;
  stage: GenerationStage;
  error: string | null;
}

export function FaceCapture(): React.JSX.Element {
  const [state, setState] = useState<FaceCaptureState>({
    referenceUrl: null,
    seedreamUrl: null,
    features: null,
    stage: 'idle',
    error: null,
  });

  const featureTags = useMemo(() => {
    if (!state.features) return [];
    return [
      `hair:${state.features.hairColor ?? 'brown'}`,
      `skin:${state.features.skinTone}`,
      `face:${state.features.shape}`,
      `eyes:${state.features.eyeSize}`,
      state.features.hasGlasses ? 'glasses' : null,
      state.features.hasBeard ? 'beard' : null,
      state.features.hasMakeup ? 'makeup' : null,
    ].filter((tag): tag is string => Boolean(tag));
  }, [state.features]);

  const busy = state.stage === 'extracting' || state.stage === 'generating';
  const buttonText = state.stage === 'extracting'
    ? 'READING PHOTO'
    : state.stage === 'generating'
      ? 'SEEDREAMING'
      : 'UPLOAD PHOTO';

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    const referenceUrl = URL.createObjectURL(file);
    setState({
      referenceUrl,
      seedreamUrl: null,
      features: null,
      stage: 'extracting',
      error: null,
    });

    try {
      const bitmap = await createImageBitmap(file);
      const features = await detectFace(bitmap);
      bitmap.close();

      if (!features) {
        throw new Error('Feature extraction returned empty result.');
      }

      setState((prev) => ({
        ...prev,
        features,
        stage: 'generating',
      }));

      const result = await generateSeedreamPixelAvatar(file);
      setState((prev) => ({
        ...prev,
        seedreamUrl: result.imageUrl,
        stage: 'done',
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        stage: 'done',
        error: error instanceof Error ? error.message : 'Seedream generation failed.',
      }));
    }
  };

  return (
    <section style={styles.shell}>
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>POCKET FRIEND</p>
          <h2 style={styles.title}>Avatar Forge</h2>
        </div>
        <span style={styles.status}>{state.stage === 'idle' ? 'READY' : state.stage.toUpperCase()}</span>
      </div>

      <label style={{ ...styles.uploadButton, opacity: busy ? 0.58 : 1 }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={styles.fileInput}
          disabled={busy}
        />
        {buttonText}
      </label>

      <div style={styles.previewGrid}>
        <PreviewSlot title="REF" imageUrl={state.referenceUrl} />
        <PreviewSlot title="SEEDREAM" imageUrl={state.seedreamUrl} loading={state.stage === 'generating'} />
      </div>

      {featureTags.length > 0 && (
        <div style={styles.tags}>
          {featureTags.map((tag) => (
            <span key={tag} style={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      {state.features?.warnings && state.features.warnings.length > 0 && (
        <div style={styles.notice}>
          {state.features.warnings.map((warning) => (
            <p key={`${warning.field}:${warning.message}`} style={styles.noticeText}>
              {warning.message}
            </p>
          ))}
        </div>
      )}

      {state.error && <p style={styles.error}>{state.error}</p>}
    </section>
  );
}

function PreviewSlot({
  title,
  imageUrl,
  loading = false,
}: {
  title: string;
  imageUrl: string | null;
  loading?: boolean;
}): React.JSX.Element {
  return (
    <div style={styles.previewSlot}>
      <span style={styles.slotTitle}>{title}</span>
      <div style={styles.imageStage}>
        {imageUrl ? (
          <img src={imageUrl} alt={title} style={styles.resultImage} />
        ) : (
          <span style={styles.emptyText}>{loading ? '...' : '--'}</span>
        )}
      </div>
    </div>
  );
}

const ink = '#182336';
const cyan = '#22C7F2';
const lime = '#A7F018';
const pink = '#F04AA5';
const mint = '#D5F5E8';
const card = '#F8FFF7';

const styles: Record<string, React.CSSProperties> = {
  shell: {
    width: 'min(100%, 760px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    padding: 16,
    border: `3px solid ${ink}`,
    background: card,
    boxShadow: `6px 6px 0 ${ink}`,
    color: ink,
    fontFamily: 'VT323, ui-monospace, monospace',
    backgroundImage:
      'linear-gradient(rgba(24,35,54,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(24,35,54,.06) 1px, transparent 1px)',
    backgroundSize: '12px 12px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: {
    margin: '0 0 4px',
    fontFamily: '"Press Start 2P", ui-monospace, monospace',
    fontSize: 7,
    color: pink,
    lineHeight: 1.6,
  },
  title: {
    margin: 0,
    fontFamily: '"Press Start 2P", ui-monospace, monospace',
    fontSize: 14,
    lineHeight: 1.45,
    color: cyan,
    textShadow: `2px 0 0 ${ink}, -2px 0 0 ${ink}, 0 2px 0 ${ink}, 0 -2px 0 ${ink}, 3px 3px 0 ${lime}`,
  },
  status: {
    minWidth: 76,
    padding: '6px 8px',
    border: `2px solid ${ink}`,
    background: lime,
    boxShadow: `2px 2px 0 ${ink}`,
    fontFamily: '"Press Start 2P", ui-monospace, monospace',
    fontSize: 7,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  uploadButton: {
    minHeight: 44,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 14px',
    border: `2px solid ${ink}`,
    background: pink,
    color: '#FFFFFF',
    boxShadow: `3px 3px 0 ${ink}`,
    cursor: 'pointer',
    fontFamily: '"Press Start 2P", ui-monospace, monospace',
    fontSize: 8,
    lineHeight: 1.5,
  },
  fileInput: {
    display: 'none',
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 10,
    alignItems: 'stretch',
  },
  previewSlot: {
    minHeight: 230,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 8,
    border: `2px solid ${ink}`,
    background: mint,
    boxShadow: `3px 3px 0 ${ink}`,
  },
  slotTitle: {
    minHeight: 20,
    fontFamily: '"Press Start 2P", ui-monospace, monospace',
    fontSize: 7,
    lineHeight: 1.6,
  },
  imageStage: {
    flex: 1,
    minHeight: 0,
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    border: `2px solid ${ink}`,
    background: '#FFFFFF',
  },
  resultImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    imageRendering: 'pixelated',
  },
  emptyText: {
    fontFamily: '"Press Start 2P", ui-monospace, monospace',
    fontSize: 12,
    color: 'rgba(24,35,54,.45)',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    minHeight: 28,
    padding: '4px 7px',
    display: 'inline-flex',
    alignItems: 'center',
    border: `2px solid ${ink}`,
    background: '#FFFFFF',
    boxShadow: `2px 2px 0 ${ink}`,
    color: ink,
    fontSize: 15,
    lineHeight: 1.2,
  },
  notice: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: 8,
    border: `2px solid ${ink}`,
    background: '#FFF7D6',
  },
  noticeText: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.3,
  },
  error: {
    margin: 0,
    padding: 8,
    border: `2px solid ${ink}`,
    background: '#FFE4EF',
    color: '#9F174D',
    fontSize: 16,
    lineHeight: 1.3,
  },
};
