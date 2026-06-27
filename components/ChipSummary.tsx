"use client";

import type { Player } from "./SessionBoard";

export function ChipSummary({ players }: { players: Player[] }) {
  const totalBuyIn = players.reduce(
    (s, p) => s + p.buyIns.reduce((a, b) => a + b.amount, 0),
    0
  );
  const totalStack = players.reduce((s, p) => s + p.currentStack, 0);
  const diff = totalStack - totalBuyIn;
  const isBalanced = diff === 0;

  return (
    <div className="card p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
      <div className="flex flex-wrap gap-6">
        <Stat label="Total Pot" value={`$${totalBuyIn}`} />
        <Stat label="Chips in Play" value={`$${totalStack}`} />
        <Stat
          label="Net"
          value={
            isBalanced
              ? "Balanced ✓"
              : diff > 0
              ? `+$${diff} over`
              : `-$${Math.abs(diff)} short`
          }
          color={isBalanced ? "text-emerald-400" : "text-red-400"}
        />
      </div>
      <div className="text-slate-600 text-sm">
        {players.length} player{players.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</div>
      <div className={`text-xl font-bold mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}
