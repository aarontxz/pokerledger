"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type BuyIn = { id: string; amount: number };
type Player = { id: string; name: string; currentStack: number; buyIns: BuyIn[] };
type Session = {
  id: string;
  name: string;
  createdAt: string;
  isActive: boolean;
  players: Player[];
};

function sessionStats(session: Session) {
  const totalBuyIn = session.players.reduce(
    (s, p) => s + p.buyIns.reduce((a, b) => a + b.amount, 0),
    0
  );
  const totalStack = session.players.reduce((s, p) => s + p.currentStack, 0);
  return { totalBuyIn, totalStack, playerCount: session.players.length };
}

export default function Home() {
  const router = useRouter();
  const [sessionName, setSessionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then(setSessions)
      .catch(() => {});
  }, []);

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sessionName.trim() }),
      });
      const data = await res.json();
      router.push(`/session/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">♠️</div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Poker Ledger</h1>
          <p className="text-slate-400 mt-2">Track buy-ins and stacks in real time</p>
        </div>

        {/* Create session */}
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Start a new session</h2>
          <form onSubmit={createSession} className="flex gap-3">
            <input
              className="input flex-1"
              placeholder="Session name (e.g. Friday Night)"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              autoFocus
            />
            <button className="btn-primary whitespace-nowrap" disabled={loading || !sessionName.trim()}>
              {loading ? "Creating…" : "Start"}
            </button>
          </form>
        </div>

        {/* Recent sessions */}
        {sessions.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Recent Sessions
            </h2>
            <div className="flex flex-col gap-2">
              {sessions.map((s) => {
                const { totalBuyIn, totalStack, playerCount } = sessionStats(s);
                const diff = totalStack - totalBuyIn;
                return (
                  <Link
                    key={s.id}
                    href={`/session/${s.id}`}
                    className="card p-4 flex items-center justify-between hover:border-slate-600 transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {s.name}
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5">
                        {playerCount} player{playerCount !== 1 ? "s" : ""} ·{" "}
                        {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-300 font-medium">${totalBuyIn}</div>
                      <div
                        className={`text-sm font-medium ${
                          diff === 0
                            ? "text-emerald-400"
                            : diff > 0
                            ? "text-red-400"
                            : "text-red-400"
                        }`}
                      >
                        {diff === 0 ? "Balanced ✓" : `Off by $${Math.abs(diff)}`}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
