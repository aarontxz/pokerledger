"use client";

export function HelpSheet({ isOwner, onClose }: { isOwner: boolean; onClose: () => void }) {
  const tips = isOwner
    ? [
        { icon: "♟", text: "Add players with the button at the bottom. They each get an automatic first buy-in." },
        { icon: "＋／－", text: "Use the − and + buttons on each player card to add or remove a buy-in." },
        { icon: "✕", text: "Tap the × on a player card to remove them. Their history stays in the log." },
        { icon: "●", text: "Tap the LIVE badge to close the session when the game ends." },
        { icon: "⎘", text: "Copy Ledger copies everyone's net result — paste it straight into your group chat." },
      ]
    : [
        { icon: "$", text: "Tap your Current Stack and enter your chip count — it updates live for everyone." },
        { icon: "↻", text: "The page refreshes automatically, so you always see the latest numbers." },
        { icon: "🔑", text: "Tap Host login in the top bar if you're running the game and need to manage buy-ins." },
        { icon: "⎘", text: "Use Copy Ledger to share the final results with the group." },
      ];

  return (
    <div className="card p-4 mb-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">How to use</h3>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors text-sm">
          ✕
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {tips.map((t) => (
          <li key={t.text} className="flex items-start gap-3 text-sm">
            <span className="text-slate-500 shrink-0 w-6 text-center leading-5">{t.icon}</span>
            <span className="text-slate-400">{t.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
