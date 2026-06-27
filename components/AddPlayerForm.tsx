"use client";

import { useState } from "react";

export function AddPlayerForm({
  sessionId,
  onAdd,
}: {
  sessionId: string;
  onAdd: () => void;
}) {
  const [namesText, setNamesText] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const names = namesText
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    setLoading(true);
    await fetch(`/api/sessions/${sessionId}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names }),
    });
    setNamesText("");
    setOpen(false);
    setLoading(false);
    onAdd();
  }

  if (!open) {
    return (
      <div className="mt-4">
        <button
          onClick={() => setOpen(true)}
          className="w-full card py-3 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors text-sm font-medium"
        >
          + Add Players
        </button>
      </div>
    );
  }

  return (
    <div className="card p-5 mt-4">
      <h3 className="font-semibold text-slate-200 mb-3">Add Players</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          className="input resize-none h-28 font-mono"
          placeholder={"Enter names separated by commas or new lines:\nAlice\nBob, Charlie\nDave"}
          value={namesText}
          onChange={(e) => setNamesText(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={loading || !namesText.trim()}>
            {loading ? "Adding…" : "Add Players"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => { setOpen(false); setNamesText(""); }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
