(() => {
  const SESSION_KEY = 'novastra_session';
  let mode = 'login';

  function getSession() {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  function saveSession(userData = {}) {
    if (!userData || typeof userData !== 'object') return null;
    const existing = getSession();
    const sameUser = existing && (!userData.userId || userData.userId === existing.userId);
    const base = sameUser ? existing : {};

    const roleId = userData.roleId !== undefined ? userData.roleId : (base.roleId ?? null);
    const isGuest = userData.isGuest !== undefined ? Boolean(userData.isGuest) : Boolean(base.isGuest);
    const isOnboarded = userData.isOnboarded !== undefined
      ? Boolean(userData.isOnboarded)
      : (isGuest || (base.isOnboarded !== undefined && userData.roleId === undefined
          ? Boolean(base.isOnboarded)
          : Boolean(roleId)));

    const session = {
      userId: userData.userId ?? base.userId ?? null,
      fullName: userData.fullName ?? userData.name ?? base.fullName ?? 'Learner Novastra',
      email: userData.email ?? base.email ?? '',
      roleId,
      roleName: userData.roleName ?? userData.targetRole ?? base.roleName ?? '',
      isOnboarded,
      isGuest,
      totalXp: Number(userData.totalXp ?? base.totalXp ?? 0),
      streakCount: Number(userData.streakCount ?? base.streakCount ?? 0),
      dailyTimeLimit: Number(userData.dailyTimeLimit ?? base.dailyTimeLimit ?? 0)
    };

    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // Ignore quota/storage errors in restricted contexts
    }
    return session;
  }

  function requireAuth(options = {}) {
    const requireOnboarded = options.requireOnboarded !== false;
    const session = getSession();
    if (!session || (!session.userId && !session.isGuest)) {
      window.location.replace('/login');
      return null;
    }
    if (requireOnboarded && !session.isGuest && session.isOnboarded === false) {
      window.location.replace('/onboarding');
      return null;
    }
    return session;
  }

  function loginAsGuest() {
    return saveSession({
      userId: 'GUEST',
      fullName: 'Guest',
      email: '',
      roleId: null,
      roleName: 'Explorer',
      isOnboarded: true,
      isGuest: true,
      totalXp: 0,
      streakCount: 0,
      dailyTimeLimit: 0
    });
  }

  function logout() {
    try {
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem('novastra_user_id');
      window.localStorage.removeItem('novastra_user');
    } catch {
      // Ignore storage errors
    }
    window.location.replace('/login');
  }

  function setMode(next) {
    mode = next;
    const isReg = mode === 'register';
    document.getElementById('register-name-wrap')?.classList.toggle('hidden', !isReg);
    const loginBtn = document.getElementById('tab-login');
    const regBtn = document.getElementById('tab-register');
    if (loginBtn && regBtn) {
      loginBtn.className = `py-2 rounded-xl text-xs font-extrabold cursor-pointer ${!isReg ? 'bg-white text-[#2C2A27] shadow-sm' : 'text-[#6B6560]'}`;
      regBtn.className = `py-2 rounded-xl text-xs font-extrabold cursor-pointer ${isReg ? 'bg-white text-[#2C2A27] shadow-sm' : 'text-[#6B6560]'}`;
    }
    const submit = document.getElementById('auth-submit');
    if (submit) submit.textContent = isReg ? 'Daftar & Mulai Belajar' : 'Masuk ke Workspace';
    showError('');
  }

  function showError(msg) {
    const el = document.getElementById('auth-error');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('hidden', !msg);
  }

  function validate(name, email, password) {
    if (mode === 'register' && name.trim().length < 2) return 'Nama lengkap minimal 2 karakter.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Format email tidak valid.';
    if (password.length < 6) return 'Password minimal 6 karakter.';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('auth-name')?.value || '';
    const email = (document.getElementById('auth-email')?.value || '').trim();
    const password = document.getElementById('auth-password')?.value || '';

    const err = validate(name, email, password);
    if (err) return showError(err);

    showError('');
    const btn = document.getElementById('auth-submit');
    if (btn) btn.disabled = true;

    const payload = mode === 'register' ? { fullName: name.trim(), email, password } : { email, password };
    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.user) {
        if (btn) btn.disabled = false;
        return showError(data?.message || 'Autentikasi gagal. Periksa kembali data Anda.');
      }

      const onboarded = Boolean(data.isOnboarded ?? Boolean(data.user.roleId));
      saveSession({
        ...data.user,
        isOnboarded: onboarded,
        isGuest: false
      });

      window.location.href = (mode === 'register' || !onboarded) ? '/onboarding' : '/home';
    } catch {
      if (btn) btn.disabled = false;
      showError('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
    }
  }

  function handleGuest() {
    loginAsGuest();
    window.location.href = '/home';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('auth-form');
    if (!form) return;
    document.getElementById('tab-login')?.addEventListener('click', () => setMode('login'));
    document.getElementById('tab-register')?.addEventListener('click', () => setMode('register'));
    form.addEventListener('submit', handleSubmit);
    document.getElementById('auth-guest-btn')?.addEventListener('click', handleGuest);
    if (window.lucide) window.lucide.createIcons();
  });

  window.saveSession = saveSession;
  window.getSession = getSession;
  window.requireAuth = requireAuth;
  window.loginAsGuest = loginAsGuest;
  window.logout = logout;
  window.NovastraAuth = {
    SESSION_KEY,
    saveSession,
    getSession,
    requireAuth,
    loginAsGuest,
    logout,
    setMode,
    validate,
    handleGuest
  };
})();
