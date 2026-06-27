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
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Session name required" }, { status: 400 });
  }
  const session = await prisma.session.create({ data: { name: name.trim() } });
  return NextResponse.json(session, { status: 201 });
}
