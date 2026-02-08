# LearnX AI

A lightweight learning coach that helps users practice reflection, debug smarter, and build independent problem-solving habits. Frontend uses vanilla HTML/CSS/JS; backend uses Node.js, Express, and SQLite.

## Features
- Auth: sign up, login, JWT-protected APIs.
- Reflections: save prompts and answers, view history.
- Feedback: submit daily intents; optional user association.
- Admin log: all key events are appended to `data/admin-log.ndjson` for review.
- Security: Helmet, CORS, password hashing.

## Setup

### Local Development
1. Copy env file: `cp .env.example .env` and update values.
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev` (defaults to http://localhost:3000).
4. The app will automatically use SQLite database for local development.

### Vercel Deployment
1. Push code to GitHub
2. Import project in Vercel
3. Create a Vercel Postgres database in your project
4. Add environment variables: `JWT_SECRET`, `ADMIN_EMAIL`
5. Deploy! 🚀

See [VERCEL_SETUP.md](VERCEL_SETUP.md) for detailed deployment instructions.

### Production (Non-Vercel)
1. Set `POSTGRES_URL` environment variable for PostgreSQL connection
2. Run: `npm start`

## API (brief)
- `POST /api/auth/register` `{ name, email, password }`
- `POST /api/auth/login` `{ email, password }`
- `GET /api/me` (Bearer token)
- `POST /api/reflections` `{ prompt, answer }` (Bearer)
- `GET /api/reflections` (Bearer)
- `POST /api/feedback` `{ message }` (optional Bearer)

## Data visibility
- User activity (registration, login, reflections, feedback) is logged to `data/admin-log.ndjson` with timestamps to let you review learner submissions.

## Notes
- **Database**: App uses SQLite for local development and PostgreSQL for production (Vercel)
- SQLite database stored at `data/learnx.db`; created automatically.
- Static frontend served from `public/`.
- Jest tests live in `tests/`.
