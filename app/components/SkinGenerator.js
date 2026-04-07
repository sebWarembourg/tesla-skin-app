"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import SkinLibrary from "./SkinLibrary";

const OUTPUT_SIZE = 512;

function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-zinc-400 text-xs uppercase tracking-widest">{label}</span>
        <span className="text-zinc-300 text-xs font-mono">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#e31937] cursor-pointer"
      />
    </div>
  );
}

export default function SkinGenerator() {
  const [imageSrc, setImageSrc] = useState(null);
  const [resultSrc, setResultSrc] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const fileInputRef = useRef(null);
  const maskRef = useRef(null);
  const sourceImgRef = useRef(null);

  useEffect(() => {
    const mask = new Image();
    mask.src = "/template.png";
    mask.onload = () => { maskRef.current = mask; };
  }, []);

  const processImage = useCallback((sourceImg, opts) => {
    setProcessing(true);
    setTimeout(() => {
      const mask = maskRef.current;
      if (!mask) return;

      const { rotation, zoom, offsetX, offsetY } = opts;
      const size = OUTPUT_SIZE;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      ctx.save();
      ctx.translate(size / 2 + offsetX * size / 100, size / 2 + offsetY * size / 100);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);
      ctx.drawImage(sourceImg, -size / 2, -size / 2, size, size);
      ctx.restore();

      const texData = ctx.getImageData(0, 0, size, size);
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(mask, 0, 0, size, size);
      const maskData = ctx.getImageData(0, 0, size, size);

      const outData = ctx.createImageData(size, size);
      for (let i = 0; i < size * size; i++) {
        const idx = i * 4;
        const r = maskData.data[idx];
        const g = maskData.data[idx + 1];
        const b = maskData.data[idx + 2];
        const isWhite = r > 180 && g > 180 && b > 180;

        outData.data[idx]     = isWhite ? texData.data[idx]     : 0;
        outData.data[idx + 1] = isWhite ? texData.data[idx + 1] : 0;
        outData.data[idx + 2] = isWhite ? texData.data[idx + 2] : 0;
        outData.data[idx + 3] = 255;
      }

      ctx.putImageData(outData, 0, 0);
      canvas.toBlob((blob) => {
        setResultSrc(URL.createObjectURL(blob));
        setProcessing(false);
      }, "image/png");
    }, 50);
  }, []);

  useEffect(() => {
    if (!sourceImgRef.current) return;
    processImage(sourceImgRef.current, { rotation, zoom, offsetX, offsetY });
  }, [rotation, zoom, offsetX, offsetY, processImage]);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        sourceImgRef.current = img;
        processImage(img, { rotation: 0, zoom: 1, offsetX: 0, offsetY: 0 });
        setRotation(0);
        setZoom(1);
        setOffsetX(0);
        setOffsetY(0);
      };
    };
    reader.readAsDataURL(file);
  }, [processImage]);

  const handleUrl = useCallback((url) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setImageSrc(url);
      sourceImgRef.current = img;
      setRotation(0); setZoom(1); setOffsetX(0); setOffsetY(0);
      processImage(img, { rotation: 0, zoom: 1, offsetX: 0, offsetY: 0 });
    };
  }, [processImage]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const downloadResult = () => {
    const a = document.createElement("a");
    a.href = resultSrc;
    a.download = "tesla_skin.png";
    a.click();
  };

  const resetAll = () => {
    setImageSrc(null);
    setResultSrc(null);
    setRotation(0);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setSaved(false);
    sourceImgRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveToGallery = async () => {
    const resp = await fetch(resultSrc);
    const blob = await resp.blob();
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      const existing = JSON.parse(localStorage.getItem("custom_skins") || "[]");
      const id = `custom-${Date.now()}`;
      const label = `Custom ${existing.length + 1}`;
      existing.push({ id, label, data: base64, createdAt: Date.now() });
      localStorage.setItem("custom_skins", JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent("customSkinsUpdated"));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    };
    reader.readAsDataURL(blob);
  };

  return (
    <div className="flex flex-col items-center gap-10 w-full">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">

      <div className="flex flex-col gap-3">
        <p className="text-zinc-400 text-[10px] tracking-[4px] uppercase">01 — Texture source</p>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={[
            "border-2 border-dashed rounded-xl min-h-[280px] flex flex-col items-center justify-center",
            "cursor-pointer transition-all duration-200 overflow-hidden",
            isDragging
              ? "border-[#e31937] bg-[#e31937]/5"
              : "border-zinc-700 bg-white/[0.02] hover:border-zinc-500",
          ].join(" ")}
        >
          {imageSrc ? (
            <img src={imageSrc} alt="source" className="w-full h-[280px] object-cover" />
          ) : (
            <div className="text-center px-8 py-10">
              <div className="text-4xl opacity-30 mb-3">↑</div>
              <p className="text-zinc-300 text-sm">Clique ou glisse une image</p>
              <p className="text-zinc-500 text-xs mt-1">PNG, JPG, WebP…</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {imageSrc && (
          <div className="bg-white/[0.03] border border-zinc-700 rounded-xl p-4 flex flex-col gap-4">
            <Slider
              label="Rotation"
              value={rotation}
              min={-180} max={180} step={1}
              onChange={setRotation}
              format={(v) => `${v}°`}
            />
            <Slider
              label="Zoom"
              value={zoom}
              min={0.3} max={3} step={0.05}
              onChange={setZoom}
              format={(v) => `${v.toFixed(2)}x`}
            />
            {zoom !== 1 && (
              <>
                <Slider
                  label="Décalage X"
                  value={offsetX}
                  min={-50} max={50} step={1}
                  onChange={setOffsetX}
                  format={(v) => `${v > 0 ? "+" : ""}${v}%`}
                />
                <Slider
                  label="Décalage Y"
                  value={offsetY}
                  min={-50} max={50} step={1}
                  onChange={setOffsetY}
                  format={(v) => `${v > 0 ? "+" : ""}${v}%`}
                />
              </>
            )}
            {(rotation !== 0 || zoom !== 1 || offsetX !== 0 || offsetY !== 0) && (
              <button
                onClick={() => { setRotation(0); setZoom(1); setOffsetX(0); setOffsetY(0); }}
                className="text-zinc-600 hover:text-zinc-400 text-xs text-left transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-zinc-400 text-[10px] tracking-[4px] uppercase">02 — Skin généré</p>
        <div className="border-2 border-zinc-700 rounded-xl min-h-[280px] flex flex-col items-center justify-center bg-white/[0.02] overflow-hidden">
          {processing && (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-zinc-700 border-t-[#e31937] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-zinc-400 text-xs">Génération…</p>
            </div>
          )}
          {!processing && resultSrc && (
            <img src={resultSrc} alt="skin" className="w-full h-[280px] object-contain bg-zinc-900" />
          )}
          {!processing && !resultSrc && (
            <div className="text-center px-8 py-10">
              <div className="text-4xl opacity-20 mb-3">🚗</div>
              <p className="text-zinc-500 text-sm">En attente d&apos;une texture…</p>
            </div>
          )}
        </div>
        {resultSrc && (
          <div className="flex flex-col gap-2">
            <button
              onClick={downloadResult}
              className="bg-[#e31937] hover:bg-[#c01530] transition-colors text-white rounded-lg py-3 px-6 text-xs font-semibold tracking-[2px] uppercase cursor-pointer"
            >
              ↓ Télécharger le skin
            </button>
            <button
              onClick={saveToGallery}
              className={`border rounded-lg py-2.5 px-6 text-xs font-semibold tracking-[2px] uppercase cursor-pointer transition-all ${
                saved
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-zinc-700 bg-white/[0.02] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              {saved ? "✓ Enregistré dans la galerie" : "Enregistrer dans la galerie"}
            </button>
            <button
              onClick={resetAll}
              className="text-zinc-600 hover:text-zinc-400 text-xs text-center transition-colors pt-1"
            >
              Recommencer
            </button>
          </div>
        )}
      </div>
    </div>
    <div className="w-full max-w-3xl mt-8">
      <SkinLibrary onSelect={handleUrl} />
    </div>
    </div>
  );
}
