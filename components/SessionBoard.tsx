"use client";

import { useState, useEffect, useCallback } from "react";
import { PlayerCard } from "./PlayerCard";
import { AddPlayerForm } from "./AddPlayerForm";
import { ChipSummary } from "./ChipSummary";

export type BuyIn = { id: string; amount: number; createdAt: string };
export type Player = {
  id: string;
  name: string;
  currentStack: number;
  buyIns: BuyIn[];
  createdAt: string;
};
export type Session = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  players: Player[];
};

export function SessionBoard({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (res.status === 404) { setNotFound(true); return; }
    const data = await res.json();
    setSession(data);
  }, [sessionId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🃏</div>
          <h1 className="text-2xl font-bold text-slate-200">Session not found</h1>
          <a href="/" className="text-emerald-400 hover:underline mt-4 inline-block">
            ← Back to home
          </a>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500 animate-pulse">Loading session…</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <a href="/" className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 text-lg">
            ←
          </a>
          <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{session.name}</h1>
          <span
            className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
              session.isActive
                ? "bg-emerald-900 text-emerald-300"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {session.isActive ? "LIVE" : "ENDED"}
          </span>
        </div>
        <button onClick={copyLink} className="btn-ghost text-sm shrink-0">
          {copied ? "Copied! ✓" : "Share Link"}
        </button>
      </div>

      {/* Chip summary */}
      <ChipSummary players={session.players} />

      {/* Players grid */}
      {session.players.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <div className="text-4xl mb-3">♣</div>
          <p>No players yet. Add some below.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {session.players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              sessionId={sessionId}
              onUpdate={refresh}
            />
          ))}
        </div>
      )}

      {/* Add players */}
      <AddPlayerForm sessionId={sessionId} onAdd={refresh} />
    </main>
  );
}
