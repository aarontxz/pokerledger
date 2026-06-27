"use client";

import { useState, useEffect, useRef } from "react";
import type { Player } from "./SessionBoard";
import { ConfirmDialog } from "./ConfirmDialog";

export function PlayerCard({
  player,
  sessionId,
  defaultBuyIn,
  isOwner,
  isActive,
  onUpdate,
}: {
  player: Player;
  sessionId: string;
  defaultBuyIn: number | null;
  isOwner: boolean;
  isActive: boolean;
  onUpdate: () => void;
}) {
  const totalBuyIn = player.buyIns.reduce((s, b) => s + b.amount, 0);
  const net = player.currentStack - totalBuyIn;
  const isUp = net > 0;
  const isEven = net === 0;

  const [stackInput, setStackInput] = useState(String(player.currentStack));
  const [buyInInput, setBuyInInput] = useState(String(defaultBuyIn ?? ""));
  const [savingStack, setSavingStack] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const deviceIdRef = useRef<string>("");

  useEffect(() => {
    let id = localStorage.getItem("pokerledger_device_id");
    if (!id) {
      id = Math.random().toString(36).slice(2, 8).toUpperCase();
      localStorage.setItem("pokerledger_device_id", id);
    }
    deviceIdRef.current = id;
  }, []);

  async function saveStack() {
    const val = parseInt(stackInput, 10);
    if (isNaN(val) || val < 0 || val === player.currentStack) return;
    setSavingStack(true);
    await fetch(`/api/sessions/${sessionId}/players/${player.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentStack: val, deviceId: deviceIdRef.current }),
    });
    setSavingStack(false);
    onUpdate();
  }

  async function addBuyIn() {
    const step = parseInt(buyInInput, 10) || defaultBuyIn;
    if (!step || step <= 0) return;
    setLoading(true);
    await fetch(`/api/sessions/${sessionId}/players/${player.id}/buyin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: step, deviceId: deviceIdRef.current }),
    });
    setLoading(false);
    onUpdate();
  }

  async function removeBuyIn() {
    const step = parseInt(buyInInput, 10) || defaultBuyIn;
    if (!step || step <= 0) return;
    setLoading(true);
    await fetch(`/api/sessions/${sessionId}/players/${player.id}/buyin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: -step, deviceId: deviceIdRef.current }),
    });
    setLoading(false);
    onUpdate();
  }

  async function removePlayer() {
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
        {isOwner && (
          <button
            onClick={() => setRemoveConfirm(true)}
            className="text-slate-700 hover:text-red-400 transition-colors text-xs ml-2 shrink-0"
            title="Remove player"
          >
            ✕
          </button>
        )}
      </div>

      {/* Buy-in history */}
      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1.5">
          Buy-ins <span className="text-slate-300 normal-case font-semibold">${totalBuyIn}</span>
        </div>
        {player.buyIns.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {player.buyIns.map((b) => (
              <span
                key={b.id}
                className={`rounded px-2 py-0.5 text-sm ${b.amount < 0 ? "bg-red-950 text-red-400" : "bg-slate-800 text-slate-300"}`}
              >
                {b.amount < 0 ? `-$${Math.abs(b.amount)}` : `$${b.amount}`}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 text-sm">No buy-ins yet</p>
        )}
      </div>

      {/* Buy-in controls: − [amount] + — owner only */}
      {isOwner && (
        <div className="flex items-center gap-2">
          <button
            onClick={removeBuyIn}
            disabled={loading || (!defaultBuyIn && !buyInInput)}
            className="w-10 h-9 flex items-center justify-center rounded-lg border border-slate-700 hover:border-red-600 text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xl font-bold shrink-0"
            title="Remove last buy-in"
          >
            −
          </button>
          <div className="flex items-center flex-1 bg-slate-800 border border-slate-700 rounded-lg focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-colors">
            <span className="pl-3 text-slate-400 shrink-0">$</span>
            <input
              className="flex-1 bg-transparent py-2 pr-3 pl-1 text-slate-100 placeholder-slate-500 focus:outline-none w-full"
              type="number"
              min={defaultBuyIn ?? 1}
              step={defaultBuyIn ?? 1}
              placeholder="Amount"
              value={buyInInput}
              onChange={(e) => setBuyInInput(e.target.value)}
            />
          </div>
          <button
            onClick={addBuyIn}
            disabled={loading || (!defaultBuyIn && !buyInInput)}
            className="w-10 h-9 flex items-center justify-center rounded-lg border border-slate-700 hover:border-emerald-600 text-slate-400 hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xl font-bold shrink-0"
            title="Add buy-in"
          >
            +
          </button>
        </div>
      )}

      {/* Current stack */}
      <div>
        <label className="text-xs text-slate-500 uppercase tracking-wider font-medium block mb-1">
          Current Stack
          {!isActive && !isOwner && (
            <span className="ml-2 text-slate-600 normal-case font-normal">(locked)</span>
          )}
        </label>
        <div className="flex gap-2">
          <div className={`flex items-center flex-1 bg-slate-800 border rounded-lg transition-colors ${
            !isActive && !isOwner
              ? "border-slate-800 opacity-50"
              : "border-slate-700 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500"
          }`}>
            <span className="pl-3 text-slate-400 shrink-0">$</span>
            <input
              className="flex-1 bg-transparent py-2 pr-3 pl-1 text-slate-100 placeholder-slate-500 focus:outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              type="number"
              min="0"
              value={stackInput}
              readOnly={!isActive && !isOwner}
              onChange={isActive || isOwner ? (e) => setStackInput(e.target.value) : undefined}
              onBlur={isActive || isOwner ? saveStack : undefined}
              onKeyDown={isActive || isOwner ? (e) => e.key === "Enter" && saveStack() : undefined}
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

      {removeConfirm && (
        <ConfirmDialog
          message={`Remove ${player.name} from the session?`}
          confirmLabel="Remove"
          danger
          onConfirm={() => { setRemoveConfirm(false); removePlayer(); }}
          onCancel={() => setRemoveConfirm(false)}
        />
      )}
    </div>
  );
}
