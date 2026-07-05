import { requireUserId } from "@/lib/auth-user";
import { db } from "@/lib/db";
import { CreateTaxSettingSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");

  if (year) {
    const taxSetting = await db.taxSetting.findUnique({
      where: { userId_year: { userId, year: Number(year) } },
    });
    return Response.json(taxSetting);
  }

  const taxSettings = await db.taxSetting.findMany({
    where: { userId },
    orderBy: { year: "desc" },
  });
  return Response.json(taxSettings);
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = CreateTaxSettingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const taxSetting = await db.taxSetting.upsert({
    where: { userId_year: { userId, year: parsed.data.year } },
    update: parsed.data,
    create: { userId, ...parsed.data },
  });
  return Response.json(taxSetting, { status: 201 });
}
