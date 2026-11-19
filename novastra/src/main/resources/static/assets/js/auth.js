(() => {
  let mode = 'login';

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

    const payload = mode === 'register' ? { name: name.trim(), email, password } : { email, password };
    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    let userProfile = { name: name.trim() || email.split('@')[0], email };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.user) userProfile = data.user;
      } else if (res.status === 401 || res.status === 400) {
        const data = await res.json().catch(() => null);
        if (data?.message) {
          if (btn) btn.disabled = false;
          return showError(data.message);
        }
      }
    } catch {
      // Offline / static prototype fallback when Spring Boot auth API is not wired yet
    }

    window.NovastraStore?.login?.(userProfile);
    window.location.href = window.NovastraStore?.isOnboarded?.() ? '/home' : '/onboarding';
  }

  function handleGuest() {
    window.NovastraStore?.loginAsGuest?.();
    window.location.href = '/home';
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('tab-login')?.addEventListener('click', () => setMode('login'));
    document.getElementById('tab-register')?.addEventListener('click', () => setMode('register'));
    document.getElementById('auth-form')?.addEventListener('submit', handleSubmit);
    document.getElementById('auth-guest-btn')?.addEventListener('click', handleGuest);
    if (window.lucide) window.lucide.createIcons();
  });

  window.NovastraAuth = { setMode, validate, handleGuest };
})();
