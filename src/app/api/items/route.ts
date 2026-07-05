import { requireUserId } from "@/lib/auth-user";
import { db } from "@/lib/db";
import { CreateItemSchema } from "@/lib/validators";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db.item.findMany({
    where: { userId },
    orderBy: { displayOrder: "asc" },
  });
  return Response.json(items);
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = CreateItemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const maxOrder = await db.item.aggregate({
    where: { userId },
    _max: { displayOrder: true },
  });

  const item = await db.item.create({
    data: {
      userId,
      ...parsed.data,
      displayOrder: parsed.data.displayOrder ?? (maxOrder._max.displayOrder ?? -1) + 1,
    },
  });
  return Response.json(item, { status: 201 });
}
