import { useMemo, useState } from 'react';
import { detectFace, generatePixelAvatarFromFeatures } from '../avatar';
import type { FaceFeatures } from '../types';

interface FaceCaptureState {
  avatarUrl: string | null;
  features: FaceFeatures | null;
  loading: boolean;
  error: string | null;
}

export function FaceCapture(): React.JSX.Element {
  const [state, setState] = useState<FaceCaptureState>({
    avatarUrl: null,
    features: null,
    loading: false,
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const bitmap = await createImageBitmap(file);
      const features = await detectFace(bitmap);
      bitmap.close();

      if (!features) {
        throw new Error('未获得头像特征。');
      }

      const canvas = generatePixelAvatarFromFeatures(features, 128);
      setState({
        avatarUrl: canvas.toDataURL('image/png'),
        features,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        avatarUrl: null,
        features: null,
        loading: false,
        error: error instanceof Error ? error.message : '照片处理失败。',
      });
    }
  };

  return (
    <section style={styles.panel}>
      <h2 style={styles.title}>照片像素小人</h2>

      <label style={styles.uploadButton}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={styles.fileInput}
          disabled={state.loading}
        />
        {state.loading ? '提取中...' : '上传照片'}
      </label>

      {state.error && <p style={styles.error}>{state.error}</p>}

      {state.avatarUrl && (
        <div style={styles.result}>
          <img src={state.avatarUrl} alt="像素小人" width={128} height={128} style={styles.avatar} />

          {featureTags.length > 0 && (
            <div style={styles.tags}>
              {featureTags.map((tag) => (
                <span key={tag} style={styles.tag}>{tag}</span>
              ))}
            </div>
          )}

          {state.features?.warnings && state.features.warnings.length > 0 && (
            <div style={styles.warningBox}>
              {state.features.warnings.map((warning) => (
                <p key={`${warning.field}:${warning.message}`} style={styles.warning}>
                  {warning.message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    background: '#FFFDE7',
    border: '4px solid #5D4037',
    boxShadow: '6px 6px 0 #3E2723',
  },
  title: {
    margin: 0,
    fontSize: 12,
    color: '#3E2723',
  },
  uploadButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    padding: '10px 14px',
    border: '3px solid #5D4037',
    background: '#4FC3F7',
    color: '#FFFFFF',
    boxShadow: '3px 3px 0 #3E2723',
    cursor: 'pointer',
    fontSize: 9,
    lineHeight: 1.4,
  },
  fileInput: {
    display: 'none',
  },
  result: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    imageRendering: 'pixelated',
    border: '3px solid #5D4037',
    background: '#B3E5FC',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  tag: {
    fontSize: 7,
    padding: '4px 6px',
    border: '2px solid #42A5F5',
    background: '#E3F2FD',
    color: '#1565C0',
    lineHeight: 1.5,
  },
  warningBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxWidth: 360,
  },
  warning: {
    margin: 0,
    fontSize: 8,
    lineHeight: 1.8,
    color: '#8D5524',
  },
  error: {
    margin: 0,
    fontSize: 8,
    lineHeight: 1.8,
    color: '#C62828',
  },
};
