"use client";

import { useState, useEffect, useCallback } from "react";
import { PlayerCard } from "./PlayerCard";
import { AddPlayerForm } from "./AddPlayerForm";
import { ChipSummary } from "./ChipSummary";
import { SessionLog } from "./SessionLog";

export type BuyIn = { id: string; amount: number; deviceId: string | null; createdAt: string };
export type Player = {
  id: string;
  name: string;
  currentStack: number;
  buyIns: BuyIn[];
  createdAt: string;
};
export type ActivityLog = {
  id: string;
  playerName: string;
  action: string;
  newStack: number | null;
  deviceId: string | null;
  createdAt: string;
};
export type Session = {
  id: string;
  name: string;
  isActive: boolean;
  defaultBuyIn: number | null;
  createdAt: string;
  players: Player[];
  activityLogs: ActivityLog[];
};

export function SessionBoard({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLedger, setCopiedLedger] = useState(false);

  const [isOwner, setIsOwner] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [buyInInput, setBuyInInput] = useState("");
  const [editingBuyIn, setEditingBuyIn] = useState(false);

  const storageKey = `pokerledger_owner_${sessionId}`;

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (res.status === 404) { setNotFound(true); return; }
    const data = await res.json();
    setSession(data);
  }, [sessionId]);

  useEffect(() => {
    refresh();
    const es = new EventSource(`/api/sessions/${sessionId}/stream`);
    es.onmessage = refresh;
    return () => es.close();
  }, [refresh, sessionId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOwner(localStorage.getItem(storageKey) === "true");
    }
  }, [storageKey]);

  useEffect(() => {
    if (session && !editingBuyIn) {
      setBuyInInput(session.defaultBuyIn != null ? String(session.defaultBuyIn) : "");
    }
  }, [session, editingBuyIn]);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setPasswordError(false);
    const res = await fetch(`/api/sessions/${sessionId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passwordInput }),
    });
    const { isOwner: ok } = await res.json();
    setVerifying(false);
    if (ok) {
      localStorage.setItem(storageKey, "true");
      setIsOwner(true);
      setShowPasswordPrompt(false);
      setPasswordInput("");
    } else {
      setPasswordError(true);
    }
  }

  function logout() {
    localStorage.removeItem(storageKey);
    setIsOwner(false);
  }

  async function saveDefaultBuyIn() {
    setEditingBuyIn(false);
    const val = buyInInput.trim() === "" ? null : parseInt(buyInInput, 10);
    if (val !== null && (isNaN(val) || val <= 0)) return;
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultBuyIn: val }),
    });
    refresh();
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/session/${sessionId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyLedger() {
    if (!session) return;
    const lines = [...session.players]
      .map((p) => {
        const totalBuyIn = p.buyIns.reduce((s, b) => s + b.amount, 0);
        const net = p.currentStack - totalBuyIn;
        return { name: p.name, net };
      })
      .sort((a, b) => b.net - a.net)
      .map(({ name, net }) => `${name}: ${net >= 0 ? "+" : ""}${net}`)
      .join("\n");
    navigator.clipboard.writeText(lines);
    setCopiedLedger(true);
    setTimeout(() => setCopiedLedger(false), 2000);
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🃏</div>
          <h1 className="text-2xl font-bold text-slate-200">Session not found</h1>
          <a href="/" className="text-emerald-400 hover:underline mt-4 inline-block">← Back to home</a>
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
      <div className="mb-4">
        {/* Title row */}
        <div className="flex items-center gap-3 min-w-0 mb-3">
          <a href="/" className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 text-lg">←</a>
          <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{session.name}</h1>
          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
            session.isActive ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"
          }`}>
            {session.isActive ? "LIVE" : "ENDED"}
          </span>
        </div>
        {/* Action row — wraps on mobile */}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={copyLedger} className="btn-ghost text-sm">
            {copiedLedger ? "Copied! ✓" : "Copy Ledger"}
          </button>
          <button onClick={copyLink} className="btn-ghost text-sm">
            {copied ? "Copied! ✓" : "Share Link"}
          </button>
          {isOwner && (
            <button
              onClick={async () => {
                await fetch(`/api/sessions/${sessionId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ isActive: !session.isActive }),
                });
                refresh();
              }}
              className={`text-xs font-medium px-3 py-2 rounded-lg bg-slate-800 transition-colors ${
                session.isActive ? "text-red-400 hover:text-red-300" : "text-emerald-400 hover:text-emerald-300"
              }`}
            >
              {session.isActive ? "Close session" : "Reopen session"}
            </button>
          )}
          {isOwner ? (
            <button onClick={logout} className="text-xs text-slate-500 hover:text-slate-300 px-3 py-2 rounded-lg bg-slate-800 transition-colors">
              Leave host
            </button>
          ) : (
            <button
              onClick={() => { setShowPasswordPrompt((v) => !v); setPasswordError(false); setPasswordInput(""); }}
              className="text-xs text-slate-500 hover:text-slate-300 px-3 py-2 rounded-lg bg-slate-800 transition-colors"
            >
              Host login
            </button>
          )}
        </div>
      </div>

      {/* Password prompt */}
      {showPasswordPrompt && (
        <form onSubmit={submitPassword} className="card p-4 mb-4 flex flex-col gap-3">
          <p className="text-sm text-slate-400">Enter the host password to manage this session</p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              type="text"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
              autoFocus
            />
            <button type="submit" className="btn-primary text-sm" disabled={verifying || !passwordInput}>
              {verifying ? "…" : "Enter"}
            </button>
            <button type="button" className="btn-ghost text-sm" onClick={() => setShowPasswordPrompt(false)}>
              ✕
            </button>
          </div>
          {passwordError && <p className="text-sm text-red-400">Incorrect password</p>}
        </form>
      )}

      {/* Default buy-in setting — owner only */}
      {isOwner && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-slate-500">Default buy-in:</span>
          <div className="flex items-center bg-slate-800 border border-slate-700 focus-within:border-emerald-500 rounded-md transition-colors">
            <span className="pl-2 text-slate-400 text-sm shrink-0">$</span>
            <input
              className="w-20 bg-transparent py-1 pr-2 pl-1 text-sm text-white placeholder-slate-500 focus:outline-none"
              type="number"
              min="1"
              placeholder="—"
              value={buyInInput}
              onChange={(e) => { setEditingBuyIn(true); setBuyInInput(e.target.value); }}
              onBlur={saveDefaultBuyIn}
              onKeyDown={(e) => e.key === "Enter" && saveDefaultBuyIn()}
            />
          </div>
        </div>
      )}

      {/* Chip summary */}
      <ChipSummary players={session.players} />

      {/* Players grid */}
      {session.players.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <div className="text-4xl mb-3">♣</div>
          <p>No players yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {session.players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              sessionId={sessionId}
              defaultBuyIn={session.defaultBuyIn}
              isOwner={isOwner}
              isActive={session.isActive}
              onUpdate={refresh}
            />
          ))}
        </div>
      )}

      {isOwner && <AddPlayerForm sessionId={sessionId} onAdd={refresh} />}

      <SessionLog session={session} />
    </main>
  );
}
