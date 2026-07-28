# Lee-G's Pizza — Full-Stack Ordering Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

A full-stack pizza ordering web app built for **Lee-G's Pizza** (Phalaborwa, South Africa). Includes a customer menu and checkout, AI chat assistant, admin dashboard, and order email notifications.

## Screenshots

| Menu & ordering | AI Pizza Chef | Admin dashboard |
|---|---|---|
| ![Menu page](docs/screenshots/menu.png) | ![AI chat widget](docs/screenshots/ai-chat.png) | ![Admin dashboard](docs/screenshots/admin-dashboard.png) |

## Features

- **Menu & cart** — categorized menu, 3-step pizza customization, sticky cart, checkout
- **AI Pizza Chef** — RAG-backed chatbot with recommendations and cart commands
- **Admin dashboard** — live orders, status updates, filters, printable receipts
- **Email notifications** — order confirmations and status updates via Resend
- **Order tracking** — customer tracking page with order lookup
- **Responsive UI** — dark theme, product imagery, WhatsApp contact integration

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Backend | Next.js API routes, Prisma ORM |
| Database | SQLite |
| AI | OpenAI API, embeddings, intent routing |
| Email | Resend |
| Auth | HMAC session cookie (admin) |

## Quick start

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) · Admin: `/admin`

## Environment variables

See `.env.example` for the full list. Main variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite database path |
| `ADMIN_PASSWORD` | Staff login for `/admin` |
| `OPENAI_API_KEY` | Optional — enables full AI chat |
| `RESEND_API_KEY` | Optional — order confirmation emails |

## Project structure

```
src/
├── app/           # Pages & API routes
├── components/    # UI (menu, cart, chat, admin)
└── lib/ai/        # Chat service, RAG, tools
prisma/            # Schema & menu seed data
public/images/     # Product images
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:setup` | Migrate and seed database |

## License

MIT — see [LICENSE](LICENSE).
