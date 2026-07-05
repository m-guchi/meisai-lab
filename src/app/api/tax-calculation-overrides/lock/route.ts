import { requireUserId } from "@/lib/auth-user";
import { db } from "@/lib/db";
import { LockTaxCalculationSchema } from "@/lib/validators";

// 指定年の計算結果を、その時点の値で全項目まとめて上書き保存する（＝確定・ロック）。
// 以後、計算式（annualTax.ts）が変わってもこの年の表示金額は変わらない。
export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = LockTaxCalculationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { year, values } = parsed.data;
  await db.$transaction(
    Object.entries(values).map(([field, amount]) =>
      db.taxCalculationOverride.upsert({
        where: { userId_year_field: { userId, year, field } },
        update: { amount },
        create: { userId, year, field, amount },
      })
    )
  );

  return new Response(null, { status: 204 });
}
