# LearnX AI

A lightweight learning coach that helps users practice reflection, debug smarter, and build independent problem-solving habits. Frontend uses vanilla HTML/CSS/JS; backend uses Node.js, Express, and SQLite.

## Features
- Auth: sign up, login, JWT-protected APIs.
- Reflections: save prompts and answers, view history.
- Feedback: submit daily intents; optional user association.
- Admin log: all key events are appended to `data/admin-log.ndjson` for review.
- Security: Helmet, CORS, password hashing.

## Setup
1. Copy env file: `cp .env.example .env` and update values.
2. Install dependencies (current dir): `npm install .`
3. Start dev server: `npm run dev` (defaults to http://localhost:3000).
4. Production start: `npm start`.
5. Lint and test: `npm test`.

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
- SQLite database stored at `data/learnx.db`; created automatically.
- Static frontend served from `public/`.
- Jest tests live in `tests/`.
