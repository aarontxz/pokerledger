import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/session-events";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const { id: sessionId, playerId } = await params;
  const { amount, deviceId } = await req.json();

  if (typeof amount !== "number" || amount === 0) {
    return NextResponse.json({ error: "Amount must be non-zero" }, { status: 400 });
  }

  const buyIn = await prisma.buyIn.create({
    data: { playerId, amount, deviceId: deviceId ?? null },
  });

  broadcast(sessionId);
  return NextResponse.json(buyIn, { status: 201 });
}
