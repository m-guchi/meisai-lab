import { requireUserId } from "@/lib/auth-user";
import { db } from "@/lib/db";
import { CreateTaxCalculationOverrideSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  if (!year) return Response.json({ error: "year is required" }, { status: 400 });

  const overrides = await db.taxCalculationOverride.findMany({
    where: { userId, year: Number(year) },
  });
  return Response.json(overrides);
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = CreateTaxCalculationOverrideSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const override = await db.taxCalculationOverride.upsert({
    where: {
      userId_year_field: {
        userId,
        year: parsed.data.year,
        field: parsed.data.field,
      },
    },
    update: parsed.data,
    create: { userId, ...parsed.data },
  });
  return Response.json(override, { status: 201 });
}

export async function DELETE(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  if (!year) return Response.json({ error: "year is required" }, { status: 400 });

  await db.taxCalculationOverride.deleteMany({ where: { userId, year: Number(year) } });
  return new Response(null, { status: 204 });
}
