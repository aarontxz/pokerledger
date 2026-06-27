import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/session-events";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; playerId: string; buyInId: string }> }
) {
  const { id: sessionId, buyInId } = await params;
  await prisma.buyIn.delete({ where: { id: buyInId } });
  broadcast(sessionId);
  return NextResponse.json({ ok: true });
}
