"use client";

import { useState } from "react";
import SkinGenerator from "./components/SkinGenerator";
import LockChime from "./components/LockChime";

const TABS = [
  { id: "skin", label: "Skin Generator" },
  { id: "lockchime", label: "Lock Chime" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("skin");

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1a] to-black flex flex-col items-center px-4 py-10">

      <div className="text-center mb-10">
        <p className="text-[#e31937] text-xs font-semibold tracking-[6px] uppercase mb-2">
          Tesla Wrap Studio
        </p>
        <h1 className="text-3xl md:text-5xl font-light tracking-widest text-white">
          Personalisation
        </h1>
        <p className="text-zinc-500 text-sm mt-3 max-w-sm">
          Customise ta Tesla — skin visuel et son de verrouillage.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.04] border border-zinc-800 rounded-xl p-1 mb-10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "px-5 py-2 rounded-lg text-xs font-semibold tracking-[2px] uppercase transition-all duration-200",
              activeTab === tab.id
                ? "bg-[#e31937] text-white"
                : "text-zinc-500 hover:text-zinc-300",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "skin" && <SkinGenerator />}
      {activeTab === "lockchime" && <LockChime />}
    </div>
  );
}
