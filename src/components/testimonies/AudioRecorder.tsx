import { useEffect, useRef, useState } from 'react';
import { Mic, Square, RotateCcw, Trash2, Upload, AlertTriangle } from 'lucide-react';

export interface RecordedAudio {
  blob: Blob;
  /** secondes */
  duration: number;
  url: string;
}

interface AudioRecorderProps {
  value: RecordedAudio | null;
  onChange: (audio: RecordedAudio | null) => void;
  /** Durée maximale d'un enregistrement, en secondes. */
  maxSeconds?: number;
}

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/aac'];
const MAX_FILE_BYTES = 50 * 1024 * 1024;

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return undefined;
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

/** Durée d'un fichier audio choisi sur le téléphone (lue par le navigateur). */
function readDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
    audio.onerror = () => resolve(0);
    audio.src = url;
  });
}

/**
 * Enregistrement d'un message vocal depuis le téléphone (micro), avec réécoute avant l'envoi. À défaut de micro
 * (refusé, navigateur ancien), on peut choisir un fichier audio déjà enregistré (note vocale WhatsApp, dictaphone…).
 */
export function AudioRecorder({ value, onChange, maxSeconds = 600 }: AudioRecorderProps) {
  const [state, setState] = useState<'idle' | 'starting' | 'recording'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval>>();
  const fileInput = useRef<HTMLInputElement>(null);
  const canRecord = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

  const releaseMic = () => {
    clearInterval(timer.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  };

  // On libère le micro en quittant la page
  useEffect(() => () => {
    if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop();
    releaseMic();
  }, []);

  // L'adresse temporaire de l'ancien enregistrement est libérée quand il est remplacé
  useEffect(() => () => {
    if (value?.url) URL.revokeObjectURL(value.url);
  }, [value?.url]);

  const stop = () => {
    if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop();
  };

  const start = async () => {
    setError(null);
    setState('starting');
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const mimeType = pickMimeType();
      const rec = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
      chunks.current = [];
      rec.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.current.push(event.data);
      };
      rec.onstop = () => {
        const duration = Math.round((Date.now() - startedAt.current) / 1000);
        releaseMic();
        setState('idle');
        const blob = new Blob(chunks.current, { type: rec.mimeType || mimeType || 'audio/webm' });
        if (blob.size === 0) {
          setError("Rien n'a été enregistré. Vérifie le micro et réessaie.");
          return;
        }
        onChange({ blob, duration, url: URL.createObjectURL(blob) });
      };
      recorder.current = rec;
      startedAt.current = Date.now();
      setElapsed(0);
      rec.start(1000);
      setState('recording');
      timer.current = setInterval(() => {
        const seconds = (Date.now() - startedAt.current) / 1000;
        setElapsed(seconds);
        if (seconds >= maxSeconds) stop();
      }, 250);
    } catch (e: any) {
      releaseMic();
      setState('idle');
      setError(
        e?.name === 'NotAllowedError' || e?.name === 'SecurityError'
          ? "L'accès au micro a été refusé. Autorise le micro pour ce site dans les réglages du navigateur, ou choisis un fichier audio."
          : "Le micro n'est pas disponible sur cet appareil. Tu peux choisir un fichier audio à la place."
      );
    }
  };

  const pickFile = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|aac|wav|ogg|opus|webm|amr|3gp)$/i.test(file.name)) {
      setError('Ce fichier n’est pas un fichier audio.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Le fichier audio ne doit pas dépasser 50 Mo.');
      return;
    }
    const url = URL.createObjectURL(file);
    const duration = Math.round(await readDuration(url));
    onChange({ blob: file, duration, url });
  };

  if (value) {
    return (
      <div className="space-y-2.5" data-testid="audio-recorded">
        <audio controls src={value.url} className="w-full" preload="metadata" />
        <p className="text-xs text-gray-500">Écoute ton enregistrement avant de l’envoyer{value.duration ? ` (${clock(value.duration)})` : ''}.</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (canRecord) void start();
            }}
            className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> Recommencer
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border-2 border-red-100 text-sm font-medium text-red-600 hover:border-red-200"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" /> Supprimer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {state === 'recording' ? (
        <button
          type="button"
          onClick={stop}
          className="w-full flex items-center justify-center gap-3 min-h-[56px] rounded-xl bg-red-600 text-white font-semibold active:scale-[0.98]"
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          <span aria-live="polite">{clock(elapsed)}</span>
          <Square className="w-4 h-4" aria-hidden="true" />
          Arrêter
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={!canRecord || state === 'starting'}
          className="w-full flex items-center justify-center gap-2 min-h-[56px] rounded-xl bg-[#00665C] text-white font-semibold active:scale-[0.98] disabled:opacity-40"
        >
          <Mic className="w-5 h-5" aria-hidden="true" />
          {state === 'starting' ? 'Ouverture du micro…' : 'Enregistrer mon témoignage'}
        </button>
      )}
      {state === 'recording' && (
        <p className="text-xs text-gray-500 text-center">Parle près du téléphone. {Math.round(maxSeconds / 60)} minutes au maximum.</p>
      )}

      {error && (
        <p className="flex items-start gap-1.5 text-xs text-red-600" role="alert">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {state !== 'recording' && (
        <>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-600 hover:border-[#00665C]/40 hover:text-[#00665C]"
          >
            <Upload className="w-4 h-4" aria-hidden="true" /> Ou choisir un fichier audio
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="audio/*"
            className="hidden"
            data-testid="audio-file-input"
            onChange={(e) => {
              void pickFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </>
      )}
    </div>
  );
}
