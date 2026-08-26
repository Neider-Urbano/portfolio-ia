"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BAR_COUNT = 5;
const SILENT_LEVELS = Array(BAR_COUNT).fill(0);
const MAX_RECORDING_MS = 20_000;

const CANDIDATE_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return CANDIDATE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

/**
 * Graba audio del micrófono y lo transcribe vía /api/transcribe (Gemini en
 * el servidor), en vez de depender del SpeechRecognition nativo del
 * navegador — ese servicio es poco fiable fuera de EE. UU. y suele fallar
 * con error "network". También expone el nivel de volumen en vivo (misma
 * pista de audio) para el indicador visual de "te estoy escuchando".
 */
export function useVoiceRecorder(onTranscript: (text: string) => void) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [levels, setLevels] = useState<number[]>(SILENT_LEVELS);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const maxDurationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  // Candado síncrono: getUserMedia es async, así que sin esto un doble clic
  // (o un clic mientras el navegador aún muestra el diálogo de permiso)
  // podía arrancar dos grabaciones en paralelo, cada una transcribiendo y
  // enviando la pregunta por separado — el síntoma era la pregunta
  // respondida dos veces.
  const pendingRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    setSupported(
      typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined"
    );
  }, []);

  const cleanupStream = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (maxDurationRef.current !== null) clearTimeout(maxDurationRef.current);
    maxDurationRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setLevels(SILENT_LEVELS);
  }, []);

  const start = useCallback(async () => {
    if (!supported || recorderRef.current || pendingRef.current) return;
    pendingRef.current = true;
    cancelledRef.current = false;
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (cancelledRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        pendingRef.current = false;
        return;
      }
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const bucketSize = Math.max(1, Math.floor(data.length / BAR_COUNT));
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const next: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0;
          for (let j = 0; j < bucketSize; j++) sum += data[i * bucketSize + j] ?? 0;
          next.push(sum / bucketSize / 255);
        }
        setLevels(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        cleanupStream();
        recorderRef.current = null;
        setRecording(false);

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        if (blob.size === 0) return;

        setTranscribing(true);
        try {
          const body = new FormData();
          body.append("audio", blob, "voice.webm");
          const res = await fetch("/api/transcribe", { method: "POST", body });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || "No se pudo transcribir el audio");

          const text = typeof data.text === "string" ? data.text.trim() : "";
          if (text) onTranscriptRef.current(text);
          else setError("No entendí el audio, intenta de nuevo.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se pudo transcribir el audio.");
        } finally {
          setTranscribing(false);
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      maxDurationRef.current = setTimeout(() => recorder.stop(), MAX_RECORDING_MS);
    } catch {
      setError("Permiso de micrófono denegado o no disponible.");
      cleanupStream();
    } finally {
      pendingRef.current = false;
    }
  }, [supported, cleanupStream]);

  const stop = useCallback(() => {
    if (recorderRef.current) recorderRef.current.stop();
    else cancelledRef.current = true; // start() sigue esperando el permiso: aborta al resolver
  }, []);

  useEffect(
    () => () => {
      recorderRef.current?.stop();
      cleanupStream();
    },
    [cleanupStream]
  );

  return { recording, transcribing, levels, error, supported, start, stop };
}
