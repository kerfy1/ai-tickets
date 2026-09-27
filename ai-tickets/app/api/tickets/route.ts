import { NextResponse } from "next/server";
import { z } from "zod";
import { db, type Ticket } from "@/lib/db";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  customer_name: z.string().trim().min(1, "Вкажіть ім'я").max(120),
  message: z.string().trim().min(3, "Текст звернення занадто короткий").max(5000),
});

export async function GET() {
  try {
    const sql = await db();
    const rows = await sql<Ticket[]>`SELECT * FROM tickets ORDER BY created_at DESC, id DESC LIMIT 500`;
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невірні дані" }, { status: 400 });
  }
  try {
    const sql = await db();
    const [row] = await sql<Ticket[]>`
      INSERT INTO tickets (customer_name, message)
      VALUES (${parsed.data.customer_name}, ${parsed.data.message})
      RETURNING *`;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
