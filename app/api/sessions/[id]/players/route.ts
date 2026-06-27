import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const { names } = await req.json();

  if (!Array.isArray(names) || names.length === 0) {
    return NextResponse.json({ error: "Names array required" }, { status: 400 });
  }

  const players = await prisma.$transaction(
    names
      .map((n: string) => n.trim())
      .filter(Boolean)
      .map((name: string) =>
        prisma.player.create({ data: { sessionId, name }, include: { buyIns: true } })
      )
  );

  return NextResponse.json(players, { status: 201 });
}
