import { NextResponse } from "next/server";
import { db, type Ticket } from "@/lib/db";
import { analyzeTicket } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Невірний id" }, { status: 400 });
  }
  try {
    const sql = await db();
    const [ticket] = await sql<Ticket[]>`SELECT * FROM tickets WHERE id = ${id}`;
    if (!ticket) return NextResponse.json({ error: "Звернення не знайдено" }, { status: 404 });

    const { analysis, model } = await analyzeTicket(ticket.customer_name, ticket.message);

    const [row] = await sql<Ticket[]>`
      UPDATE tickets SET
        priority = ${analysis.priority},
        category = ${analysis.category},
        summary = ${analysis.summary},
        draft_reply = ${analysis.draft_reply},
        ai_model = ${model},
        analyzed_at = now()
      WHERE id = ${id}
      RETURNING *`;
    return NextResponse.json(row);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
