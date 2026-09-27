"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Ticket } from "@/lib/db";

const PRIORITY_CLASS: Record<string, string> = {
  високий: "p-high",
  середній: "p-mid",
  низький: "p-low",
};

function fmtDate(s: string) {
  return new Date(s).toLocaleString("uk-UA", { dateStyle: "medium", timeStyle: "short" });
}

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState<Record<number, boolean>>({});
  const [cardErrors, setCardErrors] = useState<Record<number, string>>({});
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/tickets", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Помилка завантаження");
        setTickets(d);
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_name: name, message }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Не вдалося зберегти");
      setTickets((t) => [d, ...t]);
      setName("");
      setMessage("");
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function analyze(id: number) {
    setAnalyzing((a) => ({ ...a, [id]: true }));
    setCardErrors((c) => {
      const { [id]: _, ...rest } = c;
      return rest;
    });
    try {
      const r = await fetch(`/api/tickets/${id}/analyze`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Помилка аналізу");
      setTickets((t) => t.map((x) => (x.id === id ? d : x)));
    } catch (err) {
      setCardErrors((c) => ({ ...c, [id]: (err as Error).message }));
    } finally {
      setAnalyzing((a) => ({ ...a, [id]: false }));
    }
  }

  async function copyReply(t: Ticket) {
    if (!t.draft_reply) return;
    try {
      await navigator.clipboard.writeText(t.draft_reply);
      setCopied(t.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  }

  const analyzedCount = tickets.filter((t) => t.analyzed_at).length;

  return (
    <main className="wrap">
      <header className="head">
        <h1>AI-обробка звернень</h1>
        <p className="muted">Внутрішній інструмент служби підтримки</p>
      </header>

      <section className="panel">
        <h2>Нове звернення</h2>
        <form onSubmit={onSubmit} className="form">
          <label>
            <span>Ім’я клієнта</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Олена Коваль" required />
          </label>
          <label>
            <span>Текст звернення</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              rows={5}
              placeholder="Опишіть проблему клієнта…"
              required
            />
          </label>
          {formError && <p className="error">{formError}</p>}
          <button type="submit" className="btn primary" disabled={submitting || !name.trim() || !message.trim()}>
            {submitting ? "Збереження…" : "Додати звернення"}
          </button>
        </form>
      </section>

      <section>
        <div className="list-head">
          <h2>Звернення</h2>
          {!loading && !loadError && (
            <span className="muted">
              {tickets.length} всього · {analyzedCount} проаналізовано
            </span>
          )}
        </div>

        {loading && <p className="muted">Завантаження…</p>}
        {loadError && <p className="error">Не вдалося завантажити: {loadError}</p>}
        {!loading && !loadError && tickets.length === 0 && <p className="empty">Поки що звернень немає. Додайте перше вище.</p>}

        <ul className="cards">
          {tickets.map((t) => (
            <li key={t.id} className="card">
              <div className="card-top">
                <div>
                  <strong className="name">{t.customer_name}</strong>
                  <span className="muted small"> · #{t.id} · {fmtDate(t.created_at)}</span>
                </div>
                <button className="btn" onClick={() => analyze(t.id)} disabled={!!analyzing[t.id]}>
                  {analyzing[t.id] ? "Аналіз…" : t.analyzed_at ? "Переаналізувати" : "Аналізувати (AI)"}
                </button>
              </div>

              <p className="msg">{t.message}</p>

              {cardErrors[t.id] && <p className="error">{cardErrors[t.id]}</p>}

              {t.analyzed_at && (
                <div className="analysis">
                  <dl className="fields">
                    <div>
                      <dt>Пріоритет</dt>
                      <dd>
                        <span className={`badge ${PRIORITY_CLASS[t.priority ?? ""] ?? ""}`}>{t.priority}</span>
                      </dd>
                    </div>
                    <div>
                      <dt>Категорія</dt>
                      <dd>
                        <span className="badge cat">{t.category}</span>
                      </dd>
                    </div>
                    <div className="wide">
                      <dt>Підсумок</dt>
                      <dd>{t.summary}</dd>
                    </div>
                  </dl>
                  <div className="reply">
                    <div className="reply-head">
                      <dt>Чернетка відповіді</dt>
                      <button className="link" onClick={() => copyReply(t)}>
                        {copied === t.id ? "Скопійовано ✓" : "Копіювати"}
                      </button>
                    </div>
                    <p>{t.draft_reply}</p>
                  </div>
                  <p className="muted small">
                    {t.ai_model} · {fmtDate(t.analyzed_at)}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
