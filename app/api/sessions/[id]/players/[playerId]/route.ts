import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/session-events";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const { id: sessionId, playerId } = await params;
  const { currentStack, deviceId } = await req.json();

  if (typeof currentStack !== "number" || currentStack < 0) {
    return NextResponse.json({ error: "Invalid stack value" }, { status: 400 });
  }

  const existing = await prisma.player.findUnique({ where: { id: playerId }, select: { name: true, currentStack: true } });
  const [player] = await prisma.$transaction([
    prisma.player.update({
      where: { id: playerId },
      data: { currentStack },
      include: { buyIns: true },
    }),
    prisma.activityLog.create({
      data: {
        sessionId,
        playerName: existing?.name ?? "Unknown",
        oldStack: existing?.currentStack ?? null,
        newStack: currentStack,
        deviceId: deviceId ?? null,
      },
    }),
  ]);

  broadcast(sessionId);
  return NextResponse.json(player);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const { id: sessionId, playerId } = await params;
  const player = await prisma.player.findUnique({ where: { id: playerId }, select: { name: true } });
  await prisma.$transaction([
    prisma.activityLog.create({
      data: { sessionId, playerName: player?.name ?? "Unknown", action: "player_removed" },
    }),
    prisma.player.delete({ where: { id: playerId } }),
  ]);
  broadcast(sessionId);
  return NextResponse.json({ ok: true });
}
