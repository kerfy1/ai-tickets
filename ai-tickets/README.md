# AI-обробка звернень

Міні-інструмент служби підтримки: форма звернення → список (Postgres) → кнопка «Аналізувати (AI)», що через OpenRouter повертає структурований результат (пріоритет, категорія, підсумок, чернетка відповіді) і зберігає його на картці.

**Стек:** Next.js 15 (App Router) · Postgres (Neon) · OpenRouter (`openai/gpt-4o-mini`, structured outputs / JSON Schema) · zod-валідація відповіді моделі.

## Деплой на Vercel (~5 хв)

1. Залийте цю папку в новий GitHub-репозиторій.
2. vercel.com → **Add New → Project** → імпортуйте репозиторій → **Deploy** (перший деплой відкриється з помилкою БД — це нормально).
3. У проєкті: **Storage → Create Database → Neon (Postgres)** → Connect до проєкту. Vercel сам додасть `DATABASE_URL`.
4. **Settings → Environment Variables:** додайте `OPENROUTER_API_KEY` (ключ з https://openrouter.ai/settings/keys). За бажання — `OPENROUTER_MODEL`.
5. **Deployments → … → Redeploy.** Таблиця створюється автоматично при першому запиті.
6. Переконайтесь, що **Settings → Deployment Protection → Vercel Authentication** вимкнено для Production, інакше посилання вимагатиме логін Vercel.

## Локально

```bash
cp .env.example .env.local   # заповнити DATABASE_URL і OPENROUTER_API_KEY
npm install
npm run dev
```

## API

| Метод | Шлях | Опис |
|---|---|---|
| GET | `/api/tickets` | список звернень |
| POST | `/api/tickets` | `{ customer_name, message }` → нове звернення |
| POST | `/api/tickets/:id/analyze` | виклик LLM, збереження і повернення результату |

## Змінні середовища

| Змінна | Обов'язкова | Опис |
|---|---|---|
| `DATABASE_URL` (або `POSTGRES_URL`) | так | рядок підключення Postgres |
| `OPENROUTER_API_KEY` | так | ключ OpenRouter |
| `OPENROUTER_MODEL` | ні | за замовчуванням `openai/gpt-4o-mini`; будь-яка модель з підтримкою structured outputs (напр. `google/gemini-2.5-flash`) |

Примітка: інструмент не має авторизації — будь-хто з посиланням може додавати звернення й запускати аналіз (витрачає кредити OpenRouter). Для тестового інструменту це прийнятно; для реального використання варто додати пароль або ліміт на ключі в OpenRouter.
