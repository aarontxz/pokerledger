import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/session-events";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      players: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: { buyIns: { orderBy: { createdAt: "asc" } } },
      },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { ownerPassword, ...rest } = session;
  return NextResponse.json(rest);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data: { isActive?: boolean; defaultBuyIn?: number | null } = {};
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if ("defaultBuyIn" in body) data.defaultBuyIn = body.defaultBuyIn;
  const session = await prisma.session.update({ where: { id }, data });
  broadcast(id);
  return NextResponse.json(session);
}
