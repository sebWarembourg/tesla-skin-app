"use client";

import { useState, useRef, useCallback } from "react";

const TARGET_SAMPLE_RATE = 44100;
const MAX_BYTES = 1_000_000; // 1 MB
const WARN_DURATION = 5; // seconds

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatSize(bytes) {
  return bytes < 1000 ? `${bytes} B` : `${(bytes / 1000).toFixed(1)} KB`;
}

// Encode Float32 mono samples → WAV ArrayBuffer (PCM 16-bit)
function encodeWAV(samples, sampleRate) {
  const dataLen = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataLen);
  const v = new DataView(buffer);
  const str = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };

  str(0, "RIFF");
  v.setUint32(4, 36 + dataLen, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);       // chunk size
  v.setUint16(20, 1, true);        // PCM
  v.setUint16(22, 1, true);        // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true); // byte rate
  v.setUint16(32, 2, true);        // block align
  v.setUint16(34, 16, true);       // bits per sample
  str(36, "data");
  v.setUint32(40, dataLen, true);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return buffer;
}

async function convertToLockChime(arrayBuffer) {
  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);
  await audioCtx.close();

  const duration = decoded.duration;
  const frameCount = Math.ceil(duration * TARGET_SAMPLE_RATE);

  // Resample + mix down to mono via OfflineAudioContext
  const offline = new OfflineAudioContext(1, frameCount, TARGET_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start(0);

  const rendered = await offline.startRendering();
  const samples = rendered.getChannelData(0);
  const wavBuffer = encodeWAV(samples, TARGET_SAMPLE_RATE);

  return { wavBuffer, duration };
}

export default function LockChime() {
  const [fileName, setFileName] = useState(null);
  const [duration, setDuration] = useState(null);
  const [wavUrl, setWavUrl] = useState(null);
  const [wavSize, setWavSize] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("audio/")) {
      setError("Fichier non supporté. Utilise un fichier audio (MP3, WAV, OGG…)");
      return;
    }
    setError(null);
    setWavUrl(null);
    setWavSize(null);
    setDuration(null);
    setFileName(file.name);
    setProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const { wavBuffer, duration } = await convertToLockChime(arrayBuffer);
      const blob = new Blob([wavBuffer], { type: "audio/wav" });
      setWavUrl(URL.createObjectURL(blob));
      setWavSize(blob.size);
      setDuration(duration);
    } catch (e) {
      setError("Impossible de décoder ce fichier audio.");
      console.error(e);
    } finally {
      setProcessing(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const download = () => {
    const a = document.createElement("a");
    a.href = wavUrl;
    a.download = "LockChime.wav";
    a.click();
  };

  const tooLarge = wavSize > MAX_BYTES;
  const tooLong = duration > WARN_DURATION;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6">

      {/* Upload */}
      <div className="flex flex-col gap-3">
        <p className="text-zinc-400 text-[10px] tracking-[4px] uppercase">01 — Fichier audio source</p>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={[
            "border-2 border-dashed rounded-xl min-h-[180px] flex flex-col items-center justify-center",
            "cursor-pointer transition-all duration-200",
            isDragging
              ? "border-[#e31937] bg-[#e31937]/5"
              : "border-zinc-700 bg-white/[0.02] hover:border-zinc-500",
          ].join(" ")}
        >
          {fileName && !processing ? (
            <div className="text-center px-8 py-6">
              <p className="text-zinc-300 text-sm font-mono truncate max-w-xs">{fileName}</p>
              {duration !== null && (
                <p className="text-zinc-500 text-xs mt-1">{formatDuration(duration)}</p>
              )}
              <p className="text-zinc-500 text-xs mt-3">Clique pour changer</p>
            </div>
          ) : processing ? (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-zinc-700 border-t-[#e31937] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-zinc-400 text-xs">Conversion…</p>
            </div>
          ) : (
            <div className="text-center px-8 py-10">
              <div className="text-4xl opacity-30 mb-3">♪</div>
              <p className="text-zinc-300 text-sm">Clique ou glisse un fichier audio</p>
              <p className="text-zinc-500 text-xs mt-1">MP3, WAV, OGG, AAC, M4A…</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>

      {/* Result */}
      {wavUrl && !processing && (
        <div className="flex flex-col gap-3">
          <p className="text-zinc-400 text-[10px] tracking-[4px] uppercase">02 — Résultat</p>

          <div className="bg-white/[0.03] border border-zinc-700 rounded-xl p-5 flex flex-col gap-4">

            {/* Infos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Durée</p>
                <p className={`text-sm font-mono ${tooLong ? "text-amber-400" : "text-zinc-200"}`}>
                  {formatDuration(duration)}
                </p>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Taille</p>
                <p className={`text-sm font-mono ${tooLarge ? "text-red-400" : "text-zinc-200"}`}>
                  {formatSize(wavSize)}
                </p>
              </div>
            </div>

            {/* Warnings */}
            {tooLong && (
              <p className="text-amber-400 text-xs bg-amber-400/10 rounded-lg px-3 py-2">
                Durée &gt; 5s — Tesla joue uniquement les premières secondes. Réduis le fichier si nécessaire.
              </p>
            )}
            {tooLarge && (
              <p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">
                Fichier trop lourd (&gt; 1 MB) — Tesla refusera ce fichier. Utilise un son plus court.
              </p>
            )}

            {/* Audio preview */}
            <div>
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Aperçu</p>
              <audio controls src={wavUrl} className="w-full h-9" style={{ colorScheme: "dark" }} />
            </div>

            {/* Specs */}
            <div className="text-zinc-500 text-xs font-mono border-t border-zinc-700 pt-3 flex gap-4">
              <span>WAV PCM</span>
              <span>44 100 Hz</span>
              <span>16-bit</span>
              <span>Mono</span>
            </div>
          </div>

          <button
            onClick={download}
            disabled={tooLarge}
            className={[
              "rounded-lg py-3 px-6 text-xs font-semibold tracking-[2px] uppercase transition-colors",
              tooLarge
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-[#e31937] hover:bg-[#c01530] text-white cursor-pointer",
            ].join(" ")}
          >
            ↓ Télécharger LockChime.wav
          </button>

          <p className="text-zinc-700 text-xs leading-relaxed">
            Copie ce fichier à la racine de ta clé USB (pas dans un dossier) et branche-la sur ta Tesla.
            Puis : Toybox &rarr; Boombox &rarr; Lock Sound &rarr; USB.
          </p>
        </div>
      )}
    </div>
  );
}
