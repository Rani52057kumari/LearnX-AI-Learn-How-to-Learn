const api = {
  signup: '/api/auth/register',
  login: '/api/auth/login',
  me: '/api/me',
  reflections: '/api/reflections',
  feedback: '/api/feedback'
};

const state = {
  token: localStorage.getItem('learnx_token'),
  user: null,
  reflections: []
};

const el = (id) => document.getElementById(id);

const authSection = el('auth-section');
const dashboard = el('dashboard');
const userName = el('user-name');
const reflectionsList = el('reflections');
const signupForm = el('signup-form');
const loginForm = el('login-form');
const reflectionForm = el('reflection-form');
const feedbackForm = el('feedback-form');
const logoutBtn = el('logout');

const setLoading = (form, isLoading) => {
  const button = form.querySelector('button');
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Working...' : button.dataset.label || button.textContent;
};

const showMessage = (msg, kind = 'info') => {
  const bar = document.createElement('div');
  bar.className = `toast toast-${kind}`;
  bar.textContent = msg;
  document.body.appendChild(bar);
  setTimeout(() => bar.remove(), 3500);
};

const clearFieldError = (fieldId) => {
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (errorEl) errorEl.textContent = '';
};

const showFieldError = (fieldId, message) => {
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (errorEl) {
    errorEl.textContent = message;
    const inputEl = document.getElementById(fieldId);
    if (inputEl) inputEl.focus();
  }
};

const updateUI = () => {
  if (state.token && state.user) {
    authSection.classList.add('hidden');
    dashboard.classList.remove('hidden');
    userName.textContent = `${state.user.name}'s dashboard`;
    loadReflections();
  } else {
    authSection.classList.remove('hidden');
    dashboard.classList.add('hidden');
  }
};

const request = async (url, options = {}) => {
  const headers = options.headers || {};
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const loadProfile = async () => {
  if (!state.token) return;
  try {
    const data = await request(api.me);
    state.user = data.user;
  } catch (err) {
    state.token = null;
    localStorage.removeItem('learnx_token');
  }
};

const loadReflections = async () => {
  try {
    const data = await request(api.reflections);
    state.reflections = data.items || [];
    renderReflections();
  } catch (err) {
    showMessage(err.message, 'error');
  }
};

const renderReflections = () => {
  reflectionsList.innerHTML = '';
  if (!state.reflections.length) {
    reflectionsList.innerHTML = '<p>No reflections yet. Capture today’s lesson.</p>';
    return;
  }
  state.reflections.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'item';
    const date = new Date(item.created_at).toLocaleString();
    div.innerHTML = `<p class="eyebrow">${date}</p><p class="prompt">${item.prompt}</p><p class="subtle">${item.answer}</p>`;
    reflectionsList.appendChild(div);
  });
};

signupForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldError('signup-password');
  setLoading(signupForm, true);
  const formData = new FormData(signupForm);
  try {
    const payload = Object.fromEntries(formData.entries());
    
    if (!payload.name || !payload.email || !payload.password) {
      throw new Error('सभी फ़ील्ड भरना आवश्यक है / All fields are required');
    }
    
    if (payload.password.length < 8) {
      showFieldError('signup-password', 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए / Password must be at least 8 characters');
      throw new Error('Password must be at least 8 characters');
    }
    
    const data = await request(api.signup, { method: 'POST', body: JSON.stringify(payload) });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('learnx_token', state.token);
    showMessage('खाता बन गया। स्वागत है! / Account created. Welcome!');
    updateUI();
  } catch (err) {
    const msg = err.message || 'Registration failed';
    if (msg.includes('already registered') || msg.includes('Email')) {
      showMessage('यह ईमेल पहले से पंजीकृत है / This email is already registered', 'error');
    } else if (!msg.includes('8 characters')) {
      showMessage(msg, 'error');
    }
  } finally {
    setLoading(signupForm, false);
  }
});

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldError('login-email');
  clearFieldError('login-password');
  setLoading(loginForm, true);
  const formData = new FormData(loginForm);
  try {
    const payload = Object.fromEntries(formData.entries());
    
    if (!payload.email) {
      showFieldError('login-email', 'ईमेल दर्ज करें / Enter your email');
      throw new Error('Email is required');
    }
    
    if (!payload.password) {
      showFieldError('login-password', 'पासवर्ड दर्ज करें / Enter your password');
      throw new Error('Password is required');
    }
    
    const data = await request(api.login, { method: 'POST', body: JSON.stringify(payload) });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('learnx_token', state.token);
    showMessage('लॉग इन हो गया / Logged in. Ready to learn.');
    updateUI();
  } catch (err) {
    const msg = err.message || 'Login failed';
    if (msg.includes('Invalid credentials') || msg.includes('credentials')) {
      showMessage('गलत ईमेल या पासवर्ड / Incorrect email or password', 'error');
      showFieldError('login-password', 'कृपया अपना ईमेल और पासवर्ड जांचें');
    } else if (!msg.includes('required')) {
      showMessage(msg, 'error');
    }
  } finally {
    setLoading(loginForm, false);
  }
});

reflectionForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  setLoading(reflectionForm, true);
  const formData = new FormData(reflectionForm);
  try {
    const payload = Object.fromEntries(formData.entries());
    await request(api.reflections, { method: 'POST', body: JSON.stringify(payload) });
    showMessage('Reflection saved');
    reflectionForm.reset();
    await loadReflections();
  } catch (err) {
    showMessage(err.message, 'error');
  } finally {
    setLoading(reflectionForm, false);
  }
});

feedbackForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  setLoading(feedbackForm, true);
  const formData = new FormData(feedbackForm);
  try {
    const payload = Object.fromEntries(formData.entries());
    await request(api.feedback, { method: 'POST', body: JSON.stringify(payload) });
    feedbackForm.reset();
    showMessage('Sent to coach');
  } catch (err) {
    showMessage(err.message, 'error');
  } finally {
    setLoading(feedbackForm, false);
  }
});

logoutBtn?.addEventListener('click', () => {
  state.token = null;
  state.user = null;
  localStorage.removeItem('learnx_token');
  updateUI();
});

el('cta-start')?.addEventListener('click', () => signupForm?.scrollIntoView({ behavior: 'smooth' }));
el('cta-login')?.addEventListener('click', () => loginForm?.scrollIntoView({ behavior: 'smooth' }));

// Password visibility toggle
document.querySelectorAll('.toggle-password').forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (!input) return;
    
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '🙈';
    } else {
      input.type = 'password';
      btn.textContent = '👁️';
    }
  });
});

// Toast styling
const style = document.createElement('style');
style.textContent = `.toast { position: fixed; bottom: 18px; right: 18px; padding: 12px 16px; border-radius: 12px; background: rgba(0,0,0,0.75); color: #f8fafc; box-shadow: 0 10px 30px rgba(0,0,0,0.35); opacity: 0; transform: translateY(10px); animation: toast-in 250ms ease forwards; }
.toast-error { background: #ef4444; }
@keyframes toast-in { to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(style);

(async () => {
  await loadProfile();
  updateUI();
})();
