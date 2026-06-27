"use client";

import { useState } from "react";
import type { Player } from "./SessionBoard";

export function PlayerCard({
  player,
  sessionId,
  onUpdate,
}: {
  player: Player;
  sessionId: string;
  onUpdate: () => void;
}) {
  const totalBuyIn = player.buyIns.reduce((s, b) => s + b.amount, 0);
  const net = player.currentStack - totalBuyIn;
  const isUp = net > 0;
  const isEven = net === 0;

  const [stackInput, setStackInput] = useState(String(player.currentStack));
  const [buyInAmount, setBuyInAmount] = useState("");
  const [showBuyIn, setShowBuyIn] = useState(false);
  const [savingStack, setSavingStack] = useState(false);
  const [savingBuyIn, setSavingBuyIn] = useState(false);

  async function saveStack() {
    const val = parseInt(stackInput, 10);
    if (isNaN(val) || val < 0 || val === player.currentStack) return;
    setSavingStack(true);
    await fetch(`/api/sessions/${sessionId}/players/${player.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentStack: val }),
    });
    setSavingStack(false);
    onUpdate();
  }

  async function addBuyIn(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseInt(buyInAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    setSavingBuyIn(true);
    await fetch(`/api/sessions/${sessionId}/players/${player.id}/buyin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    setBuyInAmount("");
    setShowBuyIn(false);
    setSavingBuyIn(false);
    onUpdate();
  }

  async function removePlayer() {
    if (!confirm(`Remove ${player.name}?`)) return;
    await fetch(`/api/sessions/${sessionId}/players/${player.id}`, { method: "DELETE" });
    onUpdate();
  }

  return (
    <div
      className={`card p-4 flex flex-col gap-3 border ${
        isEven
          ? "border-slate-800"
          : isUp
          ? "border-emerald-900"
          : "border-red-900/60"
      }`}
    >
      {/* Name row */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-white truncate">{player.name}</h3>
        <button
          onClick={removePlayer}
          className="text-slate-700 hover:text-red-400 transition-colors text-xs ml-2 shrink-0"
          title="Remove player"
        >
          ✕
        </button>
      </div>

      {/* Buy-in history */}
      <div className="text-sm text-slate-400">
        <span className="text-slate-500">Buy-in: </span>
        <span className="font-semibold text-slate-200">${totalBuyIn}</span>
        {player.buyIns.length > 1 && (
          <span className="text-slate-600 ml-1 text-xs">
            ({player.buyIns.map((b) => `$${b.amount}`).join(" + ")})
          </span>
        )}
      </div>

      {/* Current stack */}
      <div>
        <label className="text-xs text-slate-500 uppercase tracking-wider font-medium block mb-1">
          Current Stack
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              className="input pl-7"
              type="number"
              min="0"
              value={stackInput}
              onChange={(e) => setStackInput(e.target.value)}
              onBlur={saveStack}
              onKeyDown={(e) => e.key === "Enter" && saveStack()}
            />
          </div>
          {savingStack && (
            <span className="text-slate-600 text-xs self-center">saving…</span>
          )}
        </div>
      </div>

      {/* Net P&L */}
      <div
        className={`text-sm font-semibold ${
          isEven ? "text-slate-500" : isUp ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {isEven ? "Break even" : isUp ? `+$${net} profit` : `-$${Math.abs(net)} loss`}
      </div>

      {/* Buy-in button / form */}
      {showBuyIn ? (
        <form onSubmit={addBuyIn} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              className="input pl-7"
              type="number"
              min="1"
              placeholder="Amount"
              value={buyInAmount}
              onChange={(e) => setBuyInAmount(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary text-sm" disabled={savingBuyIn}>
            {savingBuyIn ? "…" : "Add"}
          </button>
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => { setShowBuyIn(false); setBuyInAmount(""); }}
          >
            ✕
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowBuyIn(true)}
          className="w-full text-sm border border-dashed border-slate-700 hover:border-emerald-600 text-slate-500 hover:text-emerald-400 rounded-lg py-2 transition-colors"
        >
          + Buy In
        </button>
      )}
    </div>
  );
}
