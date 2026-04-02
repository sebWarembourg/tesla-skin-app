"use client";

import { useState } from "react";
import SkinGenerator from "./components/SkinGenerator";
import LockChime from "./components/LockChime";
import Boombox from "./components/Boombox";

const TABS = [
  { id: "skin", label: "Skin Generator" },
  { id: "lockchime", label: "Lock Chime" },
  { id: "boombox", label: "Boombox" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("skin");

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#080810] via-[#0c0c18] to-[#080810] flex flex-col items-center px-4 py-12 overflow-hidden">

      {/* Tech dot grid */}
      <div className="dot-grid" />

      {/* Header */}
      <div className="relative text-center mb-10 z-10">
        <div className="glow-red" />
        <p className="text-[#e31937] text-[10px] font-semibold tracking-[8px] uppercase mb-3">
          Tesla Personalisation
        </p>
        <h1 className="text-4xl md:text-6xl font-extralight tracking-[0.2em] text-white">
          STUDIO <span className="text-[#e31937]">W</span>
        </h1>
        <div className="mt-4 mx-auto w-16 h-px bg-gradient-to-r from-transparent via-[#e31937]/60 to-transparent" />
        <p className="text-zinc-400 text-sm mt-4 tracking-wide text-center">
          Customise ta Tesla — skin visuel, son de verrouillage et boombox.
        </p>
      </div>

      {/* Tabs */}
      <div className="relative z-10 flex border border-zinc-700/50 rounded-lg overflow-hidden mb-10 bg-black/30 backdrop-blur-sm">
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "px-6 py-2.5 text-[10px] font-semibold tracking-[3px] uppercase transition-all duration-200 relative",
              i < TABS.length - 1 ? "border-r border-zinc-700/50" : "",
              activeTab === tab.id
                ? "bg-[#e31937] text-white"
                : "text-zinc-400 hover:text-white hover:bg-white/5",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative z-10 w-full flex justify-center">
        {activeTab === "skin" && <SkinGenerator />}
        {activeTab === "lockchime" && <LockChime />}
        {activeTab === "boombox" && <Boombox />}
      </div>
    </div>
  );
}
