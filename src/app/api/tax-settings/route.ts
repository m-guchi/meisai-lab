import { requireUserId } from "@/lib/auth-user";
import { db } from "@/lib/db";
import { buildEffectiveFrom, findApplicableTaxSetting } from "@/lib/taxSetting";
import { CreateTaxSettingSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (date) {
    const taxSetting = await findApplicableTaxSetting(userId, new Date(date));
    return Response.json(taxSetting);
  }

  const taxSettings = await db.taxSetting.findMany({
    where: { userId },
    orderBy: { effectiveFrom: "desc" },
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

  const { effectiveYear, effectiveMonth, ...rates } = parsed.data;
  const effectiveFrom = buildEffectiveFrom(effectiveYear, effectiveMonth);

  const taxSetting = await db.taxSetting.upsert({
    where: { userId_effectiveFrom: { userId, effectiveFrom } },
    update: rates,
    create: { userId, effectiveFrom, ...rates },
  });
  return Response.json(taxSetting, { status: 201 });
}
