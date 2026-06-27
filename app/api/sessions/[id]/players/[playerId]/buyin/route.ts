import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const { playerId } = await params;
  const { amount } = await req.json();

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
  }

  const buyIn = await prisma.buyIn.create({
    data: { playerId, amount },
  });

  return NextResponse.json(buyIn, { status: 201 });
}
