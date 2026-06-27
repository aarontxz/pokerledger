import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// In-memory store: key = "ip:sessionId", value = { count, resetAt }
const attempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `${ip}:${id}`;
  const { allowed } = getRateLimit(key);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  const { password } = await req.json();
  const session = await prisma.session.findUnique({ where: { id }, select: { ownerPassword: true } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!session.ownerPassword) return NextResponse.json({ isOwner: false });

  return NextResponse.json({ isOwner: password === session.ownerPassword });
}
