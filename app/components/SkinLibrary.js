"use client";

import { useState } from "react";

const SKINS = [
  // Fun
  { id: "rayo-mcqueen",    file: "/skins/rayo-mcqueen.png",    label: "Rayo McQueen",     axis: "fun"    },
  { id: "funfetti",        file: "/skins/funfetti.png",        label: "Funfetti",          axis: "fun"    },
  { id: "stickers-bombing",file: "/skins/stickers-bombing.png",label: "Stickers Bombing",  axis: "fun"    },
  { id: "red-lighting",    file: "/skins/red-lighting.png",    label: "Red Lighting",      axis: "fun"    },
  // Design
  { id: "avengers",        file: "/skins/avengers.png",        label: "Avengers",          axis: "design" },
  { id: "iron-man-gold",   file: "/skins/iron-man-gold.png",   label: "Iron Man Gold",     axis: "design" },
  { id: "keith-haring",    file: "/skins/keith-haring.png",    label: "Keith Haring",      axis: "design" },
  { id: "miami-vice",      file: "/skins/miami-vice.png",      label: "Miami Vice",        axis: "design" },
  { id: "pnl-legende-vibe",file: "/skins/pnl-legende-vibe.png",label: "PNL Légende",      axis: "design" },
  { id: "pnl-deux-freres", file: "/skins/pnl-deux-freres.png", label: "PNL Deux Frères",   axis: "design" },
  { id: "trine",           file: "/skins/trine.png",           label: "Trine",             axis: "design" },
  { id: "trone3",          file: "/skins/trone3.png",          label: "Trone 3",           axis: "design" },
  { id: "ocean",           file: "/skins/ocean.png",           label: "Ocean",             axis: "design" },
  { id: "red",             file: "/skins/red.png",             label: "Red",               axis: "design" },
  // Sport
  { id: "ferrari-f1-team", file: "/skins/ferrari-f1-team.png", label: "Ferrari F1",        axis: "sport"  },
  { id: "mcqueen-m3-2024", file: "/skins/mcqueen-m3-2024.png", label: "McQueen M3 2024",   axis: "sport"  },
  { id: "psg",             file: "/skins/psg.png",             label: "PSG",               axis: "sport"  },
  { id: "red-bull",        file: "/skins/red-bull.png",        label: "Red Bull",          axis: "sport"  },
  { id: "red-bull-f1",     file: "/skins/red-bull-f1.png",     label: "Red Bull F1",       axis: "sport"  },
  { id: "mclaren",         file: "/skins/mclaren.png",         label: "McLaren",           axis: "sport"  },
  { id: "redbull",         file: "/skins/redbull.png",         label: "Red Bull Alt",      axis: "sport"  },
];

const AXIS = {
  fun:    { label: "Fun",    color: "text-amber-400",  border: "border-amber-500/30",  bg: "bg-amber-500/5"  },
  design: { label: "Design", color: "text-violet-400", border: "border-violet-500/30", bg: "bg-violet-500/5" },
  sport:  { label: "Sport",  color: "text-cyan-400",   border: "border-cyan-500/30",   bg: "bg-cyan-500/5"   },
};

const FILTERS = ["all", "fun", "design", "sport"];

export default function SkinLibrary({ onSelect }) {
  const [filter, setFilter] = useState("all");
  const [preview, setPreview] = useState(null);

  const filtered = filter === "all" ? SKINS : SKINS.filter(s => s.axis === filter);

  const download = (skin) => {
    const a = document.createElement("a");
    a.href = skin.file;
    a.download = `studio-w-${skin.id}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-zinc-400 text-[10px] tracking-[4px] uppercase">Bibliothèque — Skins</p>
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[9px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded border transition-all ${
                filter === f
                  ? "border-[#e31937]/50 bg-[#e31937]/10 text-[#e31937]"
                  : "border-zinc-700/60 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f === "all" ? "Tous" : AXIS[f].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {filtered.map((skin) => {
          const ax = AXIS[skin.axis];
          return (
            <div
              key={skin.id}
              className="group relative bg-black rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer"
              onClick={() => setPreview(skin)}
            >
              <img
                src={skin.file}
                alt={skin.label}
                className="w-full aspect-square object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-white text-[10px] font-medium truncate">{skin.label}</p>
                <span className={`text-[8px] font-semibold uppercase tracking-wider ${ax.color}`}>{ax.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-[#0c0c18] border border-zinc-700 rounded-2xl overflow-hidden max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <img src={preview.file} alt={preview.label} className="w-full aspect-square object-cover bg-black" />
            <div className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-zinc-200 text-sm font-medium">{preview.label}</p>
                <span className={`text-[10px] font-semibold uppercase tracking-widest ${AXIS[preview.axis].color}`}>
                  {AXIS[preview.axis].label}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { onSelect(preview.file, preview.label); setPreview(null); }}
                  className="text-[10px] font-semibold tracking-widest uppercase text-zinc-300 hover:text-white border border-zinc-600 hover:border-zinc-400 rounded px-3 py-2 transition-all"
                >
                  Utiliser
                </button>
                <button
                  onClick={() => download(preview)}
                  className="text-[10px] font-semibold tracking-widest uppercase bg-[#e31937] hover:bg-[#c01530] text-white rounded px-3 py-2 transition-all"
                >
                  ↓ PNG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
