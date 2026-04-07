"use client";

import { useState, useRef } from "react";

const SOUNDS = [
  { id: "fun-ahooga-short",  file: "/sounds/fun-ahooga-short.mp3",  label: "Ahooga",            desc: "Klaxon vintage court",          axis: "fun"  },
  { id: "fun-ahooga-double", file: "/sounds/fun-ahooga-double.mp3", label: "Ahooga Double",      desc: "Double coup rétro",             axis: "fun"  },
  { id: "fun-horn-toy",      file: "/sounds/fun-horn-toy.mp3",      label: "Horn Toy",           desc: "Klaxon jouet décalé",           axis: "fun"  },
  { id: "elec-tesla-plaid",  file: "/sounds/elec-tesla-plaid.mp3",  label: "Plaid Acceleration", desc: "Accélération Model S Plaid",    axis: "elec" },
  { id: "elec-zap",          file: "/sounds/elec-zap.mp3",          label: "Electric Zap",       desc: "Buzz électrique synthétique",   axis: "elec" },
  { id: "tech-blip",         file: "/sounds/tech-blip.mp3",         label: "Positive Blip",      desc: "UI électronique soigné",        axis: "tech" },
];

const AXIS = {
  fun:  { label: "Fun",        color: "text-amber-400",  border: "border-amber-500/30",  bg: "bg-amber-500/5"  },
  elec: { label: "Électrique", color: "text-cyan-400",   border: "border-cyan-500/30",   bg: "bg-cyan-500/5"   },
  tech: { label: "Tech",       color: "text-violet-400", border: "border-violet-500/30", bg: "bg-violet-500/5" },
};

export default function SoundLibrary({ onSelect }) {
  const [playing, setPlaying] = useState(null);
  const audioRef = useRef(null);

  const togglePlay = (sound) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playing === sound.id) { setPlaying(null); return; }
    const audio = new Audio(sound.file);
    audioRef.current = audio;
    audio.play();
    setPlaying(sound.id);
    audio.onended = () => setPlaying(null);
  };

  const handleSelect = (sound) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlaying(null);
    onSelect(sound.file, sound.label);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-zinc-400 text-[10px] tracking-[4px] uppercase">Bibliothèque — Sons CC0</p>
      <div className="flex flex-col gap-2">
        {SOUNDS.map((sound) => {
          const ax = AXIS[sound.axis];
          const isPlaying = playing === sound.id;
          return (
            <div key={sound.id} className="bg-white/[0.02] border border-zinc-700/60 rounded-lg px-4 py-3 flex items-center gap-3">
              <span className={`text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded border shrink-0 ${ax.color} ${ax.border} ${ax.bg}`}>
                {ax.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-200 text-xs font-medium">{sound.label}</p>
                <p className="text-zinc-600 text-[10px]">{sound.desc}</p>
              </div>
              <button
                onClick={() => togglePlay(sound)}
                className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 transition-all text-xs ${
                  isPlaying ? "border-[#e31937] bg-[#e31937]/10 text-[#e31937]" : "border-zinc-600 text-zinc-400 hover:border-zinc-400 hover:text-white"
                }`}
              >
                {isPlaying ? "■" : "▶"}
              </button>
              <button
                onClick={() => handleSelect(sound)}
                className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500 hover:text-white border border-zinc-700 hover:border-zinc-400 rounded px-2.5 py-1 transition-all shrink-0"
              >
                Utiliser
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-zinc-700 text-[10px]">CC0 — domaine public, aucune attribution requise.</p>
    </div>
  );
}
