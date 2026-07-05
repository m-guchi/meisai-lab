import { requireUserId } from "@/lib/auth-user";
import { db } from "@/lib/db";
import { UpdateItemSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = UpdateItemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.item.findFirst({ where: { id, userId } });
  if (!existing) return Response.json({ error: "Not Found" }, { status: 404 });

  const item = await db.item.update({ where: { id }, data: parsed.data });
  return Response.json(item);
}

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.item.findFirst({ where: { id, userId } });
  if (!existing) return Response.json({ error: "Not Found" }, { status: 404 });

  await db.item.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
