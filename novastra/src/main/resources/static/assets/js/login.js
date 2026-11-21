(() => {
  const REMEMBER_EMAIL_KEY = 'novastra_remember_email';
  let activeMode = 'login';
  let infoTimer = null;

  function syncModeUI() {
    const isReg = activeMode === 'register';
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const cardTitle = document.getElementById('lg-card-title');
    const optionsRow = document.getElementById('lg-mobile-options');
    const submitBtn = document.getElementById('auth-submit');
    const footerPrompt = document.getElementById('lg-footer-prompt');
    const switchBtn = document.getElementById('lg-switch-mode');
    const passInput = document.getElementById('auth-password');

    if (cardTitle) cardTitle.textContent = isReg ? 'Daftar Akun Baru' : 'Masuk ke Akun';
    if (optionsRow) optionsRow.classList.toggle('is-register', isReg);
    if (passInput) passInput.setAttribute('autocomplete', isReg ? 'new-password' : 'current-password');

    if (submitBtn) {
      if (isMobile) {
        submitBtn.textContent = isReg ? 'Daftar' : 'Masuk';
      } else {
        submitBtn.textContent = isReg ? 'Daftar & Mulai Belajar' : 'Masuk ke Workspace';
      }
    }

    if (footerPrompt) footerPrompt.textContent = isReg ? 'Sudah punya akun?' : 'Belum punya akun?';
    if (switchBtn) switchBtn.textContent = isReg ? 'Masuk' : 'Daftar sekarang';
  }

  function showInfoToast(message) {
    const el = document.getElementById('lg-info-toast');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
    if (infoTimer) clearTimeout(infoTimer);
    infoTimer = setTimeout(() => {
      el.classList.add('hidden');
    }, 4500);
  }

  function persistRememberedEmail(email, shouldRemember) {
    try {
      if (shouldRemember && email) {
        window.localStorage.setItem(REMEMBER_EMAIL_KEY, email);
      } else {
        window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
    } catch {
      // Ignore storage failures in restricted contexts
    }
  }

  function initRememberEmail() {
    const emailInput = document.getElementById('auth-email');
    const rememberBox = document.getElementById('lg-remember');
    if (!emailInput || !rememberBox) return;

    try {
      const saved = window.localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) {
        emailInput.value = saved;
        rememberBox.checked = true;
      }
    } catch {
      // Ignore storage read failures
    }

    rememberBox.addEventListener('change', () => {
      if (!rememberBox.checked) {
        persistRememberedEmail('', false);
      }
    });

    document.getElementById('auth-form')?.addEventListener('submit', () => {
      const cleanEmail = String(emailInput.value || '').trim();
      persistRememberedEmail(cleanEmail, rememberBox.checked);
    });
  }

  function initPasswordToggle() {
    const passInput = document.getElementById('auth-password');
    const toggleBtn = document.getElementById('lg-toggle-password');
    if (!passInput || !toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
      const showPlain = passInput.type === 'password';
      passInput.type = showPlain ? 'text' : 'password';
      toggleBtn.setAttribute('aria-pressed', String(showPlain));
      toggleBtn.setAttribute('aria-label', showPlain ? 'Sembunyikan password' : 'Tampilkan password');
      toggleBtn.innerHTML = `<i data-lucide="${showPlain ? 'eye-off' : 'eye'}" class="w-[18px] h-[18px]"></i>`;
      if (window.lucide) window.lucide.createIcons();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    initPasswordToggle();
    initRememberEmail();

    document.getElementById('tab-login')?.addEventListener('click', () => {
      activeMode = 'login';
      syncModeUI();
    });

    document.getElementById('tab-register')?.addEventListener('click', () => {
      activeMode = 'register';
      syncModeUI();
    });

    document.getElementById('lg-switch-mode')?.addEventListener('click', () => {
      activeMode = activeMode === 'login' ? 'register' : 'login';
      window.NovastraAuth?.setMode?.(activeMode);
      syncModeUI();
    });

    document.getElementById('lg-forgot-btn')?.addEventListener('click', () => {
      showInfoToast('Reset password via email belum tersedia. Ubah password di Profile Settings setelah masuk.');
    });

    mediaQuery.addEventListener?.('change', syncModeUI);
    syncModeUI();
  });
})();
