import { useEffect, useRef, useState } from 'react';
import { Mic, Square, RotateCcw, Trash2, Upload, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useConfirmModal } from '../../hooks/useConfirmModal';

export interface RecordedAudio {
  blob: Blob;
  /** secondes */
  duration: number;
  url: string;
}

interface AudioRecorderProps {
  value: RecordedAudio | null;
  onChange: (audio: RecordedAudio | null) => void;
  /** Durée maximale d'un enregistrement, en secondes : au-delà, il s'arrête tout seul. */
  maxSeconds?: number;
  /** Prévient la page quand un enregistrement est en cours ou en préparation (l'envoi doit attendre). */
  onBusyChange?: (busy: boolean) => void;
}

// M4A (AAC) d'abord : il se lit partout (iPhone, Android, ordinateur). Le WebM, que les iPhone récents savent
// produire, est mal relu par Safari (lecture qui s'arrête au bout de quelques secondes) : il ne sert qu'à défaut.
const MIME_CANDIDATES = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
const MAX_FILE_BYTES = 50 * 1024 * 1024;
// Extensions listées en plus de « audio/* » : sinon l'iPhone grise certains fichiers audio (un .m4a téléchargé, par exemple)
const ACCEPTED_AUDIO = 'audio/*,.m4a,.mp3,.aac,.wav,.ogg,.opus,.webm,audio/mp4,audio/x-m4a,audio/mpeg,audio/aac,audio/wav,audio/ogg';
/** Avertissement avant l'arrêt automatique, en secondes. */
const WARN_BEFORE_END = 60;

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

type RecorderState = 'idle' | 'starting' | 'recording' | 'processing';

/**
 * Enregistrement d'un message vocal depuis le téléphone (micro), avec réécoute avant l'envoi. À défaut de micro
 * (refusé, navigateur ancien), on peut choisir un fichier audio déjà enregistré (note vocale WhatsApp, dictaphone…).
 *
 * À l'arrêt, le téléphone met un instant (parfois quelques secondes) à finaliser le fichier : on l'annonce
 * (« Préparation… ») puis on confirme clairement « Enregistrement prêt », pour qu'on ne croie pas l'avoir perdu.
 * Un enregistrement oublié s'arrête tout seul au bout de `maxSeconds`, avec un avertissement la dernière minute.
 */
export function AudioRecorder({ value, onChange, maxSeconds = 600, onBusyChange }: AudioRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [autoStopped, setAutoStopped] = useState(false);
  const { confirm, confirmModalProps } = useConfirmModal();
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval>>();
  const fileInput = useRef<HTMLInputElement>(null);
  const canRecord = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
  const maxMinutes = Math.round(maxSeconds / 60);

  useEffect(() => {
    onBusyChange?.(state !== 'idle');
  }, [state, onBusyChange]);

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

  const stop = (automatic = false) => {
    if (!recorder.current || recorder.current.state === 'inactive') return;
    clearInterval(timer.current);
    setAutoStopped(automatic);
    setState('processing');
    recorder.current.stop();
  };

  const start = async () => {
    setError(null);
    setAutoStopped(false);
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
        const duration = Math.min(maxSeconds, Math.round((Date.now() - startedAt.current) / 1000));
        releaseMic();
        const blob = new Blob(chunks.current, { type: rec.mimeType || mimeType || 'audio/webm' });
        setState('idle');
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
        if (seconds >= maxSeconds) stop(true);
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
    setAutoStopped(false);
    if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|aac|wav|ogg|opus|webm|amr|3gp)$/i.test(file.name)) {
      setError('Ce fichier n’est pas un fichier audio.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Le fichier audio ne doit pas dépasser 50 Mo.');
      return;
    }
    setState('processing');
    const url = URL.createObjectURL(file);
    const duration = Math.round(await readDuration(url));
    setState('idle');
    onChange({ blob: file, duration, url });
  };

  const redo = async () => {
    const ok = await confirm('Ton enregistrement actuel sera effacé et remplacé par un nouveau.', {
      title: 'Recommencer l’enregistrement ?',
      confirmLabel: 'Recommencer',
      variant: 'warning',
    });
    if (!ok) return;
    onChange(null);
    if (canRecord) void start();
  };

  const remove = async () => {
    const ok = await confirm('Ton enregistrement sera effacé. Tu pourras en faire un autre, ou écrire ton témoignage.', {
      title: 'Supprimer l’enregistrement ?',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (ok) {
      setAutoStopped(false);
      onChange(null);
    }
  };

  const remaining = maxSeconds - elapsed;

  return (
    <>
      <ConfirmModal {...confirmModalProps} />
      {value ? (
        <div className="space-y-2.5" data-testid="audio-recorded">
          <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5" role="status">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold text-green-800">Enregistrement prêt{value.duration ? ` — ${clock(value.duration)}` : ''}</p>
              <p className="text-xs text-green-700">
                {autoStopped ? `Il s'est arrêté tout seul après ${maxMinutes} minutes (durée maximale). ` : ''}
                Il sera envoyé avec ton témoignage. Tu peux l'écouter avant.
              </p>
            </div>
          </div>
          <audio controls src={value.url} className="w-full" preload="metadata" />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={redo}
              className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" /> Recommencer
            </button>
            <button
              type="button"
              onClick={remove}
              className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border-2 border-red-100 text-sm font-medium text-red-600 hover:border-red-200"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" /> Supprimer
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {state === 'recording' ? (
            <button
              type="button"
              onClick={() => stop(false)}
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
          ) : state === 'processing' ? (
            <div
              className="w-full flex items-center justify-center gap-2 min-h-[56px] rounded-xl bg-gray-100 text-gray-700 font-semibold"
              role="status"
              data-testid="audio-processing"
            >
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              Préparation de l'enregistrement…
            </div>
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

          {state === 'idle' && canRecord && (
            <p className="text-xs text-gray-400 text-center">{maxMinutes} minutes au maximum : l'enregistrement s'arrête tout seul ensuite.</p>
          )}
          {state === 'recording' &&
            (remaining <= WARN_BEFORE_END ? (
              <p className="text-xs font-semibold text-red-600 text-center" role="alert" data-testid="audio-ending-soon">
                Il reste {Math.max(0, Math.ceil(remaining))} s : l'enregistrement va s'arrêter tout seul.
              </p>
            ) : (
              <p className="text-xs text-gray-500 text-center">
                Parle près du téléphone, puis appuie sur « Arrêter ». Arrêt automatique dans {clock(remaining)}.
              </p>
            ))}
          {state === 'processing' && (
            <p className="text-xs text-gray-500 text-center">Un instant : ton téléphone termine l'enregistrement, ne quitte pas la page.</p>
          )}

          {error && (
            <p className="flex items-start gap-1.5 text-xs text-red-600" role="alert">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          {state === 'idle' && (
            <>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="w-full flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-600 hover:border-[#00665C]/40 hover:text-[#00665C]"
              >
                <Upload className="w-4 h-4" aria-hidden="true" /> Ou choisir un fichier audio
              </button>
              <p className="text-[11px] text-gray-400 text-center">MP3 ou M4A conseillés (lisibles partout) · 50 Mo maximum</p>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPTED_AUDIO}
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
      )}
    </>
  );
}
