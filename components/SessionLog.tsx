"use client";

import type { Session } from "./SessionBoard";

type LogEntry = {
  key: string;
  ts: Date;
  playerName: string;
  kind: "buyin" | "stack" | "removed";
  amount?: number;
  newStack?: number;
  deviceId: string | null;
};

function buildLog(session: Session): LogEntry[] {
  const entries: LogEntry[] = [];

  for (const player of session.players) {
    for (const b of player.buyIns) {
      entries.push({
        key: `buyin-${b.id}`,
        ts: new Date(b.createdAt),
        playerName: player.name,
        kind: "buyin",
        amount: b.amount,
        deviceId: b.deviceId,
      });
    }
  }

  for (const log of session.activityLogs) {
    entries.push({
      key: `log-${log.id}`,
      ts: new Date(log.createdAt),
      playerName: log.playerName,
      kind: log.action === "player_removed" ? "removed" : "stack",
      newStack: log.newStack ?? undefined,
      deviceId: log.deviceId,
    });
  }

  return entries.sort((a, b) => b.ts.getTime() - a.ts.getTime());
}

function formatTime(ts: Date): string {
  const now = new Date();
  const isToday =
    ts.getFullYear() === now.getFullYear() &&
    ts.getMonth() === now.getMonth() &&
    ts.getDate() === now.getDate();

  const time = ts.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (isToday) return time;

  const date = ts.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${date} ${time}`;
}

export function SessionLog({ session }: { session: Session }) {
  const entries = buildLog(session);

  if (entries.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">
        Activity Log
      </h2>
      <div className="flex flex-col border border-slate-800 rounded-lg overflow-hidden">
        {entries.map((e, i) => (
          <div
            key={e.key}
            className={`flex items-start gap-2 px-3 py-2.5 text-sm ${
              i % 2 === 0 ? "bg-slate-900" : "bg-slate-900/50"
            }`}
          >
            <span className="text-slate-600 tabular-nums shrink-0 text-xs pt-0.5 w-16 sm:w-20 text-right">
              {formatTime(e.ts)}
            </span>
            <span className="w-px self-stretch bg-slate-800 shrink-0" />
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
              <span className="text-slate-300 font-medium shrink-0">{e.playerName}</span>

              {e.kind === "buyin" ? (
                <>
                  <span className="text-slate-500 text-xs">{(e.amount ?? 0) < 0 ? "bought out" : "bought in"}</span>
                  <span className={`font-semibold ${(e.amount ?? 0) < 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {(e.amount ?? 0) < 0 ? `-$${Math.abs(e.amount ?? 0)}` : `+$${e.amount}`}
                  </span>
                </>
              ) : e.kind === "removed" ? (
                <span className="text-slate-500 text-xs">was removed</span>
              ) : (
                <>
                  <span className="text-slate-500 text-xs">stack →</span>
                  <span className="text-sky-400 font-semibold">${e.newStack}</span>
                </>
              )}

              {e.deviceId && (
                <span className="hidden sm:inline text-xs font-mono text-slate-600">[{e.deviceId}]</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
