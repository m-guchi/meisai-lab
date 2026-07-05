import { requireUserId } from "@/lib/auth-user";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.deduction.findFirst({ where: { id, userId } });
  if (!existing) return Response.json({ error: "Not Found" }, { status: 404 });

  await db.deduction.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
