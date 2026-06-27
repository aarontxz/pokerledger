type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

export function subscribe(sessionId: string, fn: Listener) {
  if (!listeners.has(sessionId)) listeners.set(sessionId, new Set());
  listeners.get(sessionId)!.add(fn);
  return () => listeners.get(sessionId)?.delete(fn);
}

export function broadcast(sessionId: string) {
  listeners.get(sessionId)?.forEach((fn) => fn());
}
