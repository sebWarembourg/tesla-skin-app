"use client";

import { useState, useRef, useCallback } from "react";
import SoundLibrary from "./SoundLibrary";

const MAX_FILES = 5;
const WARN_DURATION = 5; // Tesla joue les 5 premières secondes

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function sanitizeFileName(name) {
  // Tesla : pas d'espaces, uniquement a-z A-Z 0-9 . - _
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

async function getAudioDuration(arrayBuffer) {
  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  await audioCtx.close();
  return decoded.duration;
}

function ConstraintBar({ items }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ label, value, warn }) => (
        <div key={label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-mono ${warn ? "border-amber-500/30 bg-amber-500/5 text-amber-400" : "border-zinc-700/60 bg-white/[0.02] text-zinc-500"}`}>
          <span className="text-zinc-600 uppercase tracking-widest text-[9px]">{label}</span>
          <span className={warn ? "text-amber-400" : "text-zinc-300"}>{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Boombox() {
  const [files, setFiles] = useState([]); // [{ name, originalName, url, duration, size }]
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const addFiles = useCallback(async (newFiles) => {
    const audioFiles = Array.from(newFiles).filter(f => f.type.startsWith("audio/"));
    if (!audioFiles.length) return;

    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_FILES} fichiers atteint.`);
      return;
    }
    setError(null);
    setProcessing(true);

    const toAdd = audioFiles.slice(0, remaining);
    const results = [];

    for (const file of toAdd) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const duration = await getAudioDuration(arrayBuffer);
        const safeName = sanitizeFileName(file.name);
        const url = URL.createObjectURL(file);
        results.push({ name: safeName, originalName: file.name, url, duration, size: file.size });
      } catch {
        setError(`Impossible de lire "${file.name}"`);
      }
    }

    setFiles(prev => [...prev, ...results]);
    setProcessing(false);
  }, [files.length]);

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addFromUrl = useCallback(async (url, label) => {
    if (files.length >= MAX_FILES) { setError(`Maximum ${MAX_FILES} fichiers atteint.`); return; }
    setError(null);
    setProcessing(true);
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const duration = await getAudioDuration(arrayBuffer);
      const safeName = sanitizeFileName(label + ".mp3");
      const fileUrl = URL.createObjectURL(blob);
      setFiles(prev => [...prev, { name: safeName, originalName: label, url: fileUrl, duration, size: blob.size }]);
    } catch {
      setError(`Impossible de charger ce son.`);
    } finally {
      setProcessing(false);
    }
  }, [files.length]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const downloadZip = async () => {
    // Build ZIP manually (no dependency) using stored Blobs
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    const folder = zip.folder("Boombox");

    for (const f of files) {
      const resp = await fetch(f.url);
      const blob = await resp.blob();
      folder.file(f.name, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(zipBlob);
    a.download = "Boombox.zip";
    a.click();
  };

  const count = files.length;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6">

      {/* Upload zone */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-zinc-400 text-[10px] tracking-[4px] uppercase">01 — Fichiers audio</p>
          <span className={`text-[10px] font-mono tracking-widest ${count >= MAX_FILES ? "text-[#e31937]" : "text-zinc-500"}`}>
            {count}/{MAX_FILES}
          </span>
        </div>

        {count < MAX_FILES && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={[
              "border-2 border-dashed rounded-xl min-h-[120px] flex flex-col items-center justify-center",
              "cursor-pointer transition-all duration-200",
              isDragging
                ? "border-[#e31937] bg-[#e31937]/5"
                : "border-zinc-700 bg-white/[0.02] hover:border-zinc-500",
            ].join(" ")}
          >
            {processing ? (
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-zinc-700 border-t-[#e31937] rounded-full animate-spin mx-auto mb-2" />
                <p className="text-zinc-400 text-xs">Chargement…</p>
              </div>
            ) : (
              <div className="text-center px-8 py-6">
                <div className="text-2xl opacity-30 mb-2">♪</div>
                <p className="text-zinc-300 text-sm">Ajoute jusqu&apos;à {MAX_FILES - count} fichier{MAX_FILES - count > 1 ? "s" : ""}</p>
                <p className="text-zinc-500 text-xs mt-1">MP3, WAV, OGG, AAC, M4A…</p>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <ConstraintBar items={[
          { label: "Formats", value: "MP3 · WAV · OGG · AAC" },
          { label: "Fichiers max", value: "5", warn: count >= MAX_FILES },
          { label: "Durée jouée", value: "5s max", warn: files.some(f => f.duration > WARN_DURATION) },
          { label: "Noms", value: "Sans espaces" },
          { label: "Clé USB", value: "exFAT / FAT32" },
        ]} />
      </div>

      <SoundLibrary onSelect={addFromUrl} />

      {/* File list */}
      {count > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-zinc-400 text-[10px] tracking-[4px] uppercase">02 — Playlist</p>
          <div className="flex flex-col gap-2">
            {files.map((f, i) => (
              <div key={i} className="bg-white/[0.03] border border-zinc-700 rounded-lg px-4 py-3 flex items-center gap-3">
                <span className="text-[#e31937] text-xs font-mono w-4 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-200 text-xs font-mono truncate">{f.name}</p>
                  {f.name !== f.originalName && (
                    <p className="text-zinc-600 text-[10px] truncate">orig: {f.originalName}</p>
                  )}
                </div>
                <span className={`text-xs font-mono shrink-0 ${f.duration > WARN_DURATION ? "text-amber-400" : "text-zinc-500"}`}>
                  {formatDuration(f.duration)}
                </span>
                <audio src={f.url} controls className="h-6 w-24 shrink-0" style={{ colorScheme: "dark" }} />
                <button
                  onClick={() => removeFile(i)}
                  className="text-zinc-600 hover:text-red-400 transition-colors text-sm shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {files.some(f => f.duration > WARN_DURATION) && (
            <p className="text-amber-400 text-xs bg-amber-400/10 rounded-lg px-3 py-2">
              Certains fichiers dépassent 5s — Tesla ne jouera que les 5 premières secondes.
            </p>
          )}

          <div className="text-zinc-600 text-xs font-mono border border-zinc-800 rounded-lg px-4 py-3 flex flex-col gap-1">
            <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-1">Instructions</p>
            <p>1. Extraire le ZIP → dossier <span className="text-zinc-300">Boombox/</span></p>
            <p>2. Copier le dossier à la racine de la clé USB</p>
            <p>3. Brancher sur la Tesla</p>
            <p>4. Toybox → Boombox → sélectionner le son</p>
          </div>

          <button
            onClick={downloadZip}
            className="bg-[#e31937] hover:bg-[#c01530] transition-colors text-white rounded-lg py-3 px-6 text-xs font-semibold tracking-[2px] uppercase cursor-pointer"
          >
            ↓ Télécharger Boombox.zip
          </button>
        </div>
      )}
    </div>
  );
}
