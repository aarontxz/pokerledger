import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { password } = await req.json();

  const session = await prisma.session.findUnique({ where: { id }, select: { ownerPassword: true } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!session.ownerPassword) return NextResponse.json({ isOwner: false });

  return NextResponse.json({ isOwner: password === session.ownerPassword });
}
