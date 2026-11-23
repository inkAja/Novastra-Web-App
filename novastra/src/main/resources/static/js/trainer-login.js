(() => {
  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function showError(msg) {
    const errEl = document.getElementById('tl-error');
    if (!errEl) return;
    errEl.textContent = msg || '';
    errEl.classList.toggle('is-hidden', !msg);
  }

  document.addEventListener('DOMContentLoaded', () => {
    refreshIcons();

    const form = document.getElementById('tl-form');
    const emailInput = document.getElementById('tl-email');
    const pwInput = document.getElementById('tl-password');
    const togglePwBtn = document.getElementById('tl-toggle-pw');
    const submitBtn = document.getElementById('tl-submit');
    const submitLabel = document.getElementById('tl-submit-label');

    togglePwBtn?.addEventListener('click', () => {
      if (!pwInput) return;
      const show = pwInput.type === 'password';
      pwInput.type = show ? 'text' : 'password';
      togglePwBtn.setAttribute('aria-pressed', String(show));
      togglePwBtn.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
      togglePwBtn.innerHTML = `<i data-lucide="${show ? 'eye-off' : 'eye'}" class="tl-icon-sm"></i>`;
      refreshIcons();
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      showError('');

      const email = emailInput?.value?.trim() || '';
      const password = pwInput?.value || '';
      if (!email || !password) {
        showError('Email dan password Trainer wajib diisi.');
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Memverifikasi...';

      try {
        const res = await fetch('/api/trainer/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || 'Email atau password Trainer tidak valid.');
        }
        window.location.href = '/trainer/submissions';
      } catch (err) {
        showError(err.message || 'Gagal menghubungi server autentikasi.');
        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Masuk ke Admin Portal';
      }
    });
  });
})();
