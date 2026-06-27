import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { players: { include: { buyIns: true } } },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const { name, defaultBuyIn, ownerPassword } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Session name required" }, { status: 400 });
  }
  const data: { name: string; defaultBuyIn?: number; ownerPassword?: string } = { name: name.trim() };
  if (typeof defaultBuyIn === "number" && defaultBuyIn > 0) data.defaultBuyIn = defaultBuyIn;
  if (ownerPassword?.trim()) data.ownerPassword = ownerPassword.trim();
  const session = await prisma.session.create({ data });
  return NextResponse.json({ id: session.id }, { status: 201 });
}
