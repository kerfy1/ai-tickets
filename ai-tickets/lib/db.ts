import postgres from "postgres";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __schemaReady: Promise<void> | undefined;
}

function client() {
  if (!url) throw new Error("DATABASE_URL не налаштовано");
  if (!global.__sql) {
    const local = /localhost|127\.0\.0\.1/.test(url);
    global.__sql = postgres(url, {
      max: 1,
      ssl: local ? false : "require",
      prepare: false, // сумісно з pooled-з'єднаннями (Neon / pgbouncer)
      idle_timeout: 20,
    });
  }
  return global.__sql;
}

export async function db() {
  const sql = client();
  if (!global.__schemaReady) {
    global.__schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS tickets (
          id            SERIAL PRIMARY KEY,
          customer_name TEXT NOT NULL,
          message       TEXT NOT NULL,
          created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
          priority      TEXT,
          category      TEXT,
          summary       TEXT,
          draft_reply   TEXT,
          ai_model      TEXT,
          analyzed_at   TIMESTAMPTZ
        )`;
    })().catch((e) => {
      global.__schemaReady = undefined;
      throw e;
    });
  }
  await global.__schemaReady;
  return sql;
}

export type Ticket = {
  id: number;
  customer_name: string;
  message: string;
  created_at: string;
  priority: "низький" | "середній" | "високий" | null;
  category: string | null;
  summary: string | null;
  draft_reply: string | null;
  ai_model: string | null;
  analyzed_at: string | null;
};
