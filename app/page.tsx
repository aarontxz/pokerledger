"use client";

import { useState, useEffect, useRef } from "react";
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
  const [step, setStep] = useState<1 | 2>(1);
  const [sessionName, setSessionName] = useState("");
  const [buyInInput, setBuyInInput] = useState("100");
  const [passwordInput, setPasswordInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mySessionIds, setMySessionIds] = useState<Set<string>>(new Set());
  const buyInRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("pokerledger_my_sessions");
    if (stored) setMySessionIds(new Set(JSON.parse(stored)));
  }, []);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then(setSessions)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (step === 2) buyInRef.current?.focus();
  }, [step]);

  function goToStep2(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionName.trim()) return;
    setStep(2);
  }

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordInput.trim() || !buyInInput.trim()) return;
    setLoading(true);
    try {
      const defaultBuyIn = parseInt(buyInInput, 10);
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sessionName.trim(),
          defaultBuyIn: isNaN(defaultBuyIn) || defaultBuyIn <= 0 ? undefined : defaultBuyIn,
          ownerPassword: passwordInput.trim(),
        }),
      });
      const data = await res.json();
      localStorage.setItem(`pokerledger_owner_${data.id}`, "true");
      const existing = JSON.parse(localStorage.getItem("pokerledger_my_sessions") ?? "[]");
      localStorage.setItem("pokerledger_my_sessions", JSON.stringify([...existing, data.id]));
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
          <p className="text-slate-400 mt-2">Share a link so players report their own stack — you control the buy-ins</p>
        </div>

        {/* Create session */}
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Start a new session</h2>

          {step === 1 ? (
            <form onSubmit={goToStep2} className="flex gap-3">
              <input
                className="input flex-1"
                placeholder="Session name (e.g. Friday Night)"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                autoFocus
              />
              <button className="btn-primary whitespace-nowrap" disabled={!sessionName.trim()}>
                Next →
              </button>
            </form>
          ) : (
            <form onSubmit={createSession} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  ←
                </button>
                <span className="font-medium text-slate-200">{sessionName}</span>
              </div>

              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider font-medium block mb-2">
                  Default buy-in
                </label>
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-colors">
                  <span className="pl-3 text-slate-400 shrink-0">$</span>
                  <input
                    ref={buyInRef}
                    className="flex-1 bg-transparent py-2 pr-3 pl-1 text-slate-100 placeholder-slate-500 focus:outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    type="number"
                    min="1"
                    placeholder="100"
                    value={buyInInput}
                    onChange={(e) => setBuyInInput(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider font-medium block mb-2">
                  Host password
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="Set a password to manage this session"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                />
                <p className="text-xs text-slate-600 mt-1.5">
                  Share the session link with players — they&apos;ll need this password to access host controls.
                </p>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !buyInInput.trim() || !passwordInput.trim()}
              >
                {loading ? "Creating…" : "Create Session"}
              </button>
            </form>
          )}
        </div>

        {/* How it works — shown only before first session */}
        {mySessionIds.size === 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">How it works</h2>
            <div className="flex flex-col gap-2">
              {[
                { step: "1", title: "Create a session", desc: "Set a name, default buy-in, and a host password." },
                { step: "2", title: "Share the link", desc: "Send it to everyone at the table." },
                { step: "3", title: "Everyone reports their stack", desc: "Players tap their card to enter their chip count. Only the host can add or adjust buy-ins." },
                { step: "4", title: "Every action is logged", desc: "Stack updates, buy-ins, and removals are all timestamped and visible at the bottom of the session." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-slate-800 text-slate-500 text-xs flex items-center justify-center font-semibold mt-0.5">
                    {step}
                  </span>
                  <div>
                    <span className="text-slate-300 text-sm font-medium">{title} </span>
                    <span className="text-slate-500 text-sm">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent sessions */}
        {sessions.filter((s) => mySessionIds.has(s.id)).length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Recent Sessions
            </h2>
            <div className="flex flex-col gap-2">
              {sessions.filter((s) => mySessionIds.has(s.id)).map((s) => {
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
                      <div className={`text-sm font-medium ${diff === 0 ? "text-emerald-400" : "text-red-400"}`}>
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
