import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const { playerId } = await params;
  const { currentStack } = await req.json();

  if (typeof currentStack !== "number" || currentStack < 0) {
    return NextResponse.json({ error: "Invalid stack value" }, { status: 400 });
  }

  const player = await prisma.player.update({
    where: { id: playerId },
    data: { currentStack },
    include: { buyIns: true },
  });

  return NextResponse.json(player);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const { playerId } = await params;
  await prisma.player.delete({ where: { id: playerId } });
  return NextResponse.json({ ok: true });
}
