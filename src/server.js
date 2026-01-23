const bcrypt = require('bcryptjs');
const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const fs = require('fs');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const path = require('path');

const { runAsync, getAsync, allAsync } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminLogPath = path.join(__dirname, '..', 'data', 'admin-log.ndjson');

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const appendAdminLog = (event, payload) => {
  const entry = {
    ts: new Date().toISOString(),
    event,
    admin: ADMIN_EMAIL,
    payload
  };
  fs.appendFile(adminLogPath, `${JSON.stringify(entry)}\n`, (err) => {
    if (err) console.error('Failed to write admin log', err);
  });
};

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  try {
    const existing = await getAsync('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await runAsync(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );
    const user = { id: result.id, name, email };
    appendAdminLog('user_registered', { email, name });
    return res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const user = await getAsync(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [email]
    );
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken(user);
    appendAdminLog('user_login', { email });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const user = await getAsync(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to load profile' });
  }
});

app.post('/api/reflections', authMiddleware, async (req, res) => {
  const { prompt, answer } = req.body || {};
  if (!prompt || !answer) {
    return res.status(400).json({ message: 'Prompt and answer are required' });
  }
  try {
    const result = await runAsync(
      'INSERT INTO reflections (user_id, prompt, answer) VALUES (?, ?, ?)',
      [req.user.id, prompt, answer]
    );
    appendAdminLog('reflection_saved', {
      email: req.user.email,
      prompt: prompt.slice(0, 120),
      answerPreview: answer.slice(0, 160)
    });
    return res.status(201).json({ id: result.id, prompt, answer });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to save reflection' });
  }
});

app.get('/api/reflections', authMiddleware, async (req, res) => {
  try {
    const items = await allAsync(
      'SELECT id, prompt, answer, created_at FROM reflections WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json({ items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to load reflections' });
  }
});

app.post('/api/feedback', async (req, res) => {
  const { message } = req.body || {};
  let userId = null;
  if (!message) return res.status(400).json({ message: 'Message required' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      // ignore invalid token for optional feedback
    }
  }

  try {
    await runAsync('INSERT INTO feedback (user_id, message) VALUES (?, ?)', [userId, message]);
    appendAdminLog('feedback', { message: message.slice(0, 240), userId });
    return res.status(201).json({ message: 'Thanks for the feedback!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to send feedback' });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`LearnX AI server listening on port ${PORT}`);
  });
}

module.exports = app;
