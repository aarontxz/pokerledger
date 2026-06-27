import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      players: {
        orderBy: { createdAt: "asc" },
        include: { buyIns: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(session);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const session = await prisma.session.update({
    where: { id },
    data: { isActive: body.isActive },
  });
  return NextResponse.json(session);
}
