import { requireUserId } from "@/lib/auth-user";
import { db } from "@/lib/db";
import { CreateDeductionSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  if (!year) return Response.json({ error: "year is required" }, { status: 400 });

  const deductions = await db.deduction.findMany({
    where: { userId, year: Number(year) },
  });
  return Response.json(deductions);
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = CreateDeductionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const deduction = await db.deduction.upsert({
    where: {
      userId_year_deductionType: {
        userId,
        year: parsed.data.year,
        deductionType: parsed.data.deductionType,
      },
    },
    update: parsed.data,
    create: { userId, ...parsed.data },
  });
  return Response.json(deduction, { status: 201 });
}
