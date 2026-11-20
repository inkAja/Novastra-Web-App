(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const HC = ['#F0ECE4', '#D7DFD4', '#B7C5B3', '#8A9A86', '#5F715B'];

  const state = {
    loading: true,
    error: '',
    profile: null,
    settingsOpen: false,
    savingSettings: false,
    deletingAccount: false,
    settingsError: '',
    settingsForm: { fullName: '', email: '', newPassword: '' },
    activeCert: null,
    copied: false,
    toast: '',
    toastTimer: null
  };

  function getInitials(name) {
    return String(name || 'NA').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || 'NA';
  }

  function formatDateIndo(isoDate) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || '').trim());
    if (!m) return String(isoDate || '');
    const day = Number(m[3]);
    const month = MONTHS_ID[Number(m[2]) - 1] || m[2];
    return `${day} ${month} ${m[1]}`;
  }

  function formatHeatmapTooltip(cell) {
    const count = Number(cell?.count ?? 0);
    const label = formatDateIndo(cell?.date);
    return label ? `${label}: ${count} aktivitas` : `${count} aktivitas`;
  }

  function formatScore(score) {
    const n = Number(score ?? 0);
    if (!Number.isFinite(n)) return '0';
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }

  function safeHttpUrl(url) {
    const trimmed = String(url || '').trim();
    return /^https?:\/\/.+/i.test(trimmed) ? trimmed : '';
  }

  function render() {
    const main = document.getElementById('main-content');
    if (!main) return;

    if (state.loading) {
      main.innerHTML = `<div class="p-8 rounded-3xl bg-white border border-[#E8E2DA] text-center text-sm font-bold text-[#6B6560]">Memuat profil &amp; aktivitas dari database...</div>`;
      return;
    }

    if (state.error || !state.profile) {
      main.innerHTML = `
        <div class="p-8 rounded-3xl bg-white border border-[#E8E2DA] text-center space-y-3">
          <p class="text-sm font-bold text-[#A65D57]">${esc(state.error || 'Data profil tidak tersedia.')}</p>
          <button type="button" id="pr-retry" class="px-4 py-2 rounded-xl bg-[#D97757] text-white text-xs font-extrabold cursor-pointer">Muat Ulang</button>
        </div>
      `;
      document.getElementById('pr-retry')?.addEventListener('click', loadProfileData);
      return;
    }

    const p = state.profile;
    const user = {
      name: p.fullName || 'Learner Novastra',
      email: p.email || '',
      targetRole: p.roleName || 'Belum dipilih'
    };
    const streak = Number(p.streakCount ?? 0);
    const avgAiScore = Math.round(Number(p.avgAiScore ?? 0));
    const certs = Array.isArray(p.certificates) ? p.certificates : [];
    const verified = Array.isArray(p.verifiedProofOfWork) ? p.verifiedProofOfWork : [];
    const days = Array.isArray(p.dailyConsistency) ? p.dailyConsistency : [];
    const totalActivities = days.reduce((sum, d) => sum + Number(d?.count ?? 0), 0);
    const weekCols = Math.max(1, Math.ceil(days.length / 7));
    const weeks = Array.from({ length: weekCols }, (_, w) => days.slice(w * 7, w * 7 + 7));

    main.innerHTML = `
      <section class="bg-white border border-[#E8E2DA] rounded-3xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6" style="padding: 24px 32px;">
        <div class="flex flex-col sm:flex-row sm:items-center gap-5">
          <div class="w-[72px] h-[72px] rounded-full bg-[#D97757] text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-sm">${esc(getInitials(user.name))}</div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-xl md:text-2xl font-black text-[#2C2A27]">${esc(user.name)}</h1>
              ${user.email ? `<span class="px-2.5 py-0.5 rounded-full bg-[#FDF0EB] text-[#D97757] text-[11px] font-extrabold">${esc(user.email)}</span>` : ''}
            </div>
            <p class="text-sm font-semibold text-[#6B6560] mt-0.5">${esc(user.targetRole)}</p>
            <div class="flex flex-wrap items-center gap-3 mt-2.5">
              <button type="button" id="pr-settings-btn" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2DA] hover:border-[#D97757] text-xs font-extrabold text-[#2C2A27] transition-colors cursor-pointer">
                <i data-lucide="settings" class="w-3.5 h-3.5 text-[#D97757]"></i> Profile Settings
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 shrink-0">
          ${[
            ['Streak', `${streak}d`, 'flame', '#C4904B'],
            ['Certificates', `${certs.length}`, 'award', '#8A9A86'],
            ['Avg AI Score', `${avgAiScore}%`, 'sparkles', '#D97757']
          ].map(([label, val, icon, color]) => `
            <div class="px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA] text-center">
              <div class="flex items-center justify-center gap-1 text-[11px] font-bold text-[#6B6560]">
                <i data-lucide="${icon}" class="w-3.5 h-3.5" style="color:${color}"></i>
                <span>${label}</span>
              </div>
              <p class="text-lg font-black text-[#2C2A27] mt-0.5">${val}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <div class="grid grid-cols-1 min-[900px]:grid-cols-[42fr_58fr] gap-6 items-start">
        <div class="space-y-6">
          <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-4">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h2 class="text-base font-black text-[#2C2A27]">Daily Consistency</h2>
                <p class="text-xs text-[#6B6560]">Aktivitas 20 minggu terakhir · ${totalActivities} aktivitas tercatat</p>
              </div>
              <div class="flex items-center gap-1" title="Intensitas 0 sampai >= 5 aktivitas">
                ${HC.map((hex) => `<span class="w-2.5 h-2.5 rounded-sm" style="background:${hex}"></span>`).join('')}
              </div>
            </div>

            ${days.length ? `
              <div class="grid gap-1" style="grid-template-columns: repeat(${weekCols}, minmax(0, 1fr));">
                ${weeks.map((week) => `
                  <div class="grid grid-rows-7 gap-1">
                    ${week.map((cell) => {
                      const lvl = Math.max(0, Math.min(4, Number(cell?.level ?? 0)));
                      return `<span class="aspect-square w-full rounded-[3px] transition-transform hover:scale-110" style="background:${HC[lvl] || HC[0]}" title="${esc(formatHeatmapTooltip(cell))}"></span>`;
                    }).join('')}
                  </div>
                `).join('')}
              </div>
            ` : `<p class="text-xs text-[#6B6560]">Belum ada riwayat aktivitas harian.</p>`}
          </section>

          <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-black text-[#2C2A27]">Certificates (${certs.length} earned)</h2>
              <span class="text-xs font-bold text-[#8A9A86]">Verified PoW</span>
            </div>
            ${certs.length ? `
              <div class="space-y-2.5">
                ${certs.map((cert) => `
                  <button type="button" data-cert-id="${esc(cert.certificateId)}" class="w-full text-left p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA] hover:border-[#8A9A86] transition-all flex items-center justify-between gap-3 cursor-pointer">
                    <div class="min-w-0">
                      <p class="text-sm font-extrabold text-[#2C2A27] truncate">${esc(cert.courseTitle || cert.courseId)}</p>
                      <p class="text-[11px] text-[#6B6560] font-mono mt-0.5">${esc(cert.certificateId)} · ${esc(formatDateIndo(cert.issueDate))}</p>
                    </div>
                    <span class="px-2.5 py-1 rounded-full bg-[#F0F3EF] text-[#5E7C6B] text-xs font-extrabold shrink-0">Verified</span>
                  </button>
                `).join('')}
              </div>
            ` : `
              <div class="p-5 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#E8E2DA] text-center space-y-1">
                <p class="text-xs font-bold text-[#6B6560]">Belum ada sertifikat yang diperoleh</p>
                <p class="text-[11px] text-[#A89F98]">Selesaikan kursus dan proyek jalur karier Anda untuk memperoleh sertifikat terverifikasi.</p>
              </div>
            `}
          </section>
        </div>

        <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-black text-[#2C2A27]">Verified Proof of Work</h2>
              <p class="text-xs text-[#6B6560]">Proyek produksi yang telah diaudit skor AI</p>
            </div>
            <a href="/career" class="text-xs font-bold text-[#D97757] hover:underline">Run New Audit →</a>
          </div>

          ${verified.length ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              ${verified.map((item) => {
                const href = safeHttpUrl(item.externalUrl);
                return `
                  <article class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA] flex flex-col justify-between gap-3">
                    <div>
                      <div class="flex items-center justify-between gap-2 mb-2">
                        <span class="px-2.5 py-0.5 rounded-full bg-[#F0F3EF] text-[#5E7C6B] text-[11px] font-extrabold">AI Score ${esc(formatScore(item.score))}</span>
                        <i data-lucide="shield-check" class="w-4 h-4 text-[#8A9A86]"></i>
                      </div>
                      <h3 class="text-sm font-black text-[#2C2A27]">${esc(item.title)}</h3>
                      <p class="text-xs text-[#6B6560] mt-1.5 leading-relaxed">${esc(item.feedbackNotes || item.status)}</p>
                    </div>
                    <div class="flex items-center justify-between gap-2 pt-2 border-t border-[#E8E2DA]">
                      <p class="text-[11px] font-mono font-bold text-[#A89F98] truncate">${esc(item.courseTitle || item.typeCourse || item.projectId)}</p>
                      ${href ? `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" class="text-[11px] font-extrabold text-[#D97757] hover:underline shrink-0">Lihat Proyek →</a>` : ''}
                    </div>
                  </article>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="p-8 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#E8E2DA] text-center space-y-2">
              <p class="text-sm font-bold text-[#6B6560]">Belum ada portofolio yang diaudit</p>
              <p class="text-xs text-[#A89F98]">Kumpulkan tautan proyek akhir Anda pada menu Career setelah kurikulum &amp; Blind Test selesai.</p>
              <a href="/career" class="inline-block mt-1 px-4 py-2 rounded-xl bg-[#D97757] text-white text-xs font-extrabold">Buka Career Roadmap →</a>
            </div>
          `}
        </section>
      </div>

      ${state.settingsOpen ? renderSettingsModal() : ''}
      ${state.activeCert ? renderCertModal(user) : ''}
      ${state.toast ? `
        <div class="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#2C2A27] text-white text-xs font-bold shadow-lg flex items-center gap-2 animate-slide-up">
          <span class="w-2 h-2 rounded-full bg-[#8A9A86]"></span>
          <span>${esc(state.toast)}</span>
        </div>
      ` : ''}
    `;

    bindEvents(certs);
    if (window.lucide) window.lucide.createIcons();
  }

  function showToast(msg) {
    state.toast = msg;
    if (state.toastTimer) clearTimeout(state.toastTimer);
    render();
    state.toastTimer = setTimeout(() => {
      state.toast = '';
      render();
    }, 4000);
  }

  function openSettingsModal() {
    state.settingsForm = {
      fullName: state.profile?.fullName || '',
      email: state.profile?.email || '',
      newPassword: ''
    };
    state.settingsError = '';
    state.settingsOpen = true;
    render();
  }

  function renderSettingsModal() {
    const f = state.settingsForm;
    const busy = state.savingSettings || state.deletingAccount;
    return `
      <div id="pr-settings-backdrop" class="fixed inset-0 z-50 bg-[#2C2A27]/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div class="w-full max-w-md bg-[#FDFBF7] border border-[#E8E2DA] rounded-3xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-[#E8E2DA]">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-[#FDF0EB] text-[#D97757] flex items-center justify-center">
                <i data-lucide="settings" class="w-4 h-4"></i>
              </div>
              <h3 class="text-lg font-black text-[#2C2A27]">Profile Settings</h3>
            </div>
            <button type="button" id="pr-settings-close" ${busy ? 'disabled' : ''} class="p-1.5 rounded-lg text-[#6B6560] hover:bg-[#F5F0EA] cursor-pointer disabled:opacity-50"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <form id="pr-settings-form" class="space-y-3.5">
            <p class="text-[11px] font-extrabold uppercase tracking-wider text-[#8A9A86]">Pengaturan Akun</p>
            <div>
              <label for="pr-name-in" class="block text-xs font-bold text-[#6B6560] mb-1">Nama Lengkap</label>
              <input id="pr-name-in" type="text" maxlength="60" value="${esc(f.fullName)}" ${busy ? 'disabled' : ''} class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2DA] text-sm focus:outline-none focus:border-[#D97757]" />
            </div>
            <div>
              <label for="pr-email-in" class="block text-xs font-bold text-[#6B6560] mb-1">Email</label>
              <input id="pr-email-in" type="email" maxlength="255" value="${esc(f.email)}" ${busy ? 'disabled' : ''} class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2DA] text-sm focus:outline-none focus:border-[#D97757]" />
            </div>
            <div>
              <label for="pr-password-in" class="block text-xs font-bold text-[#6B6560] mb-1">Password Baru</label>
              <input id="pr-password-in" type="password" autocomplete="new-password" value="${esc(f.newPassword)}" placeholder="Kosongkan jika tidak ingin mengubah password" ${busy ? 'disabled' : ''} class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2DA] text-sm focus:outline-none focus:border-[#D97757]" />
            </div>

            ${state.settingsError ? `<div class="p-3 rounded-xl bg-[#FDF0EB] border border-[#F2A68D] text-xs font-bold text-[#A64B2A]">${esc(state.settingsError)}</div>` : ''}

            <button type="submit" id="pr-save-btn" ${busy ? 'disabled' : ''} class="w-full py-2.5 rounded-xl bg-[#D97757] hover:opacity-95 text-white text-xs font-extrabold cursor-pointer disabled:opacity-60">
              ${state.savingSettings ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>

          <div class="p-4 rounded-2xl bg-[#FBF3F2] border border-[#E8C5C2] space-y-3">
            <div>
              <p class="text-[11px] font-extrabold uppercase tracking-wider text-[#A65D57]">Sesi &amp; Zona Berbahaya</p>
              <p class="text-[11px] text-[#6B6560] mt-0.5">Keluar dari sesi saat ini atau hapus permanen akun beserta seluruh data progres.</p>
            </div>
            <div class="grid grid-cols-2 gap-2.5">
              <button type="button" id="pr-modal-logout-btn" ${busy ? 'disabled' : ''} class="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white border border-[#E8E2DA] hover:border-[#2C2A27] text-xs font-extrabold text-[#2C2A27] cursor-pointer disabled:opacity-60">
                <i data-lucide="log-out" class="w-3.5 h-3.5"></i> Log Out
              </button>
              <button type="button" id="pr-delete-btn" ${busy ? 'disabled' : ''} class="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#B4433C] hover:bg-[#99352F] text-white text-xs font-extrabold cursor-pointer disabled:opacity-60">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> ${state.deletingAccount ? 'Menghapus...' : 'Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function saveProfileSettings() {
    if (state.savingSettings || state.deletingAccount) return;
    const session = window.getSession?.();
    if (!session?.userId || session.isGuest) return;

    const fullName = String(state.settingsForm.fullName || '').trim();
    const email = String(state.settingsForm.email || '').trim().toLowerCase();
    const newPassword = String(state.settingsForm.newPassword || '');

    if (fullName.length < 2 || fullName.length > 60) {
      state.settingsError = 'Nama lengkap wajib diisi (2-60 karakter).';
      return render();
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      state.settingsError = 'Format email tidak valid.';
      return render();
    }
    if (newPassword && (!newPassword.trim() || newPassword.length < 6 || newPassword.length > 255)) {
      state.settingsError = 'Password baru minimal 6 karakter dan maksimal 255 karakter.';
      return render();
    }

    state.savingSettings = true;
    state.settingsError = '';
    render();

    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(session.userId)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, newPassword })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      state.profile = data;
      state.settingsForm = { fullName: data.fullName || '', email: data.email || '', newPassword: '' };
      state.settingsOpen = false;
      state.settingsError = '';

      window.saveSession?.({
        userId: data.userId,
        fullName: data.fullName,
        email: data.email,
        roleId: data.roleId || session.roleId,
        roleName: data.roleName || session.roleName,
        streakCount: data.streakCount,
        isOnboarded: session.isOnboarded
      });
      const initials = getInitials(data.fullName);
      document.querySelectorAll('#nv-topbar a[href="/profile"], #nv-mobile-header a[href="/profile"]').forEach((el) => {
        el.textContent = initials;
      });
      showToast('Pengaturan profil berhasil disimpan.');
    } catch (err) {
      state.settingsError = err.message || 'Gagal menyimpan pengaturan profil.';
      render();
    } finally {
      state.savingSettings = false;
    }
  }

  async function deleteAccount() {
    if (state.savingSettings || state.deletingAccount) return;
    const session = window.getSession?.();
    if (!session?.userId || session.isGuest) return;

    const confirmed = window.confirm(
      'Apakah Anda yakin ingin menghapus akun secara permanen? Semua progres, kursus, dan sertifikat akan hilang dan tidak bisa dikembalikan.'
    );
    if (!confirmed) return;

    state.deletingAccount = true;
    state.settingsError = '';
    render();

    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(session.userId)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      window.NovastraStore?.reset?.();
      window.logout?.();
    } catch (err) {
      state.deletingAccount = false;
      state.settingsError = `Gagal menghapus akun: ${err.message}`;
      render();
    }
  }

  function renderCertModal(user) {
    const c = state.activeCert;
    return `
      <div class="fixed inset-0 z-50 bg-[#2C2A27]/45 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-lg bg-[#FDFBF7] border border-[#E8E2DA] rounded-3xl p-6 shadow-xl animate-slide-up space-y-4">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-full bg-[#F0F3EF] text-[#5E7C6B] text-[11px] font-extrabold">Verified Certificate</span>
            <button type="button" id="cert-close" class="p-1 text-[#6B6560] cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <div class="p-6 rounded-2xl bg-white border-2 border-[#E8E2DA] text-center space-y-2">
            <p class="text-[11px] font-extrabold uppercase tracking-widest text-[#D97757]">Novastra Proof-of-Work</p>
            <h3 class="text-lg font-black text-[#2C2A27]">${esc(c.courseTitle || c.courseId)}</h3>
            <p class="text-xs text-[#6B6560]">Diberikan kepada <span class="font-extrabold text-[#2C2A27]">${esc(user.name)}</span></p>
            <p class="text-xs font-mono text-[#A89F98] pt-2">${esc(c.certificateId)} · Diterbitkan ${esc(formatDateIndo(c.issueDate))}</p>
          </div>

          <div class="flex gap-2.5">
            <button type="button" id="cert-copy" class="flex-1 py-2.5 rounded-xl border border-[#E8E2DA] bg-white hover:border-[#D97757] text-xs font-extrabold text-[#2C2A27] cursor-pointer">
              ${state.copied ? 'Link Tersalin!' : 'Copy Link'}
            </button>
            <button type="button" id="cert-download" class="flex-1 py-2.5 rounded-xl bg-[#D97757] text-white text-xs font-extrabold cursor-pointer">
              Download
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function bindEvents(certs) {
    document.getElementById('pr-settings-btn')?.addEventListener('click', openSettingsModal);
    const closeSettingsModal = () => {
      if (state.savingSettings || state.deletingAccount) return;
      state.settingsOpen = false;
      state.settingsError = '';
      render();
    };
    document.getElementById('pr-settings-close')?.addEventListener('click', closeSettingsModal);
    document.getElementById('pr-settings-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'pr-settings-backdrop') closeSettingsModal();
    });
    document.getElementById('pr-name-in')?.addEventListener('input', (e) => {
      state.settingsForm.fullName = e.target.value;
    });
    document.getElementById('pr-email-in')?.addEventListener('input', (e) => {
      state.settingsForm.email = e.target.value;
    });
    document.getElementById('pr-password-in')?.addEventListener('input', (e) => {
      state.settingsForm.newPassword = e.target.value;
    });
    document.getElementById('pr-settings-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      saveProfileSettings();
    });
    document.getElementById('pr-modal-logout-btn')?.addEventListener('click', () => {
      window.NovastraStore?.reset?.();
      window.logout?.();
    });
    document.getElementById('pr-delete-btn')?.addEventListener('click', deleteAccount);

    document.querySelectorAll('[data-cert-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeCert = certs.find((c) => c.certificateId === btn.dataset.certId) || null;
        state.copied = false;
        render();
      });
    });
    document.getElementById('cert-close')?.addEventListener('click', () => { state.activeCert = null; render(); });
    document.getElementById('cert-copy')?.addEventListener('click', async () => {
      const c = state.activeCert;
      const url = safeHttpUrl(c?.credentialUrl) || `${window.location.origin}/profile?cert=${encodeURIComponent(c?.certificateId || '')}`;
      try { await navigator.clipboard?.writeText(url); } catch { /* clipboard optional in headless/insecure context */ }
      state.copied = true;
      render();
    });
    document.getElementById('cert-download')?.addEventListener('click', () => {
      const c = state.activeCert;
      if (!c) return;
      const holder = state.profile?.fullName || '';
      const content = `NOVASTRA VERIFIED CERTIFICATE\nCourse: ${c.courseTitle || c.courseId}\nHolder: ${holder}\nCode: ${c.certificateId}\nCredential URL: ${c.credentialUrl || ''}\nIssued: ${c.issueDate}\n`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${c.certificateId}.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  async function loadProfileData() {
    const session = window.requireAuth?.({ requireOnboarded: true });
    if (!session) return;
    if (session.isGuest || !session.userId) {
      state.loading = false;
      state.error = 'Silakan masuk dengan akun Anda untuk melihat statistik profil dan portofolio personal.';
      return render();
    }

    state.loading = true;
    state.error = '';
    render();

    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(session.userId)}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Gagal memuat profil (HTTP ${res.status}).`);
      state.profile = data;
      window.saveSession?.({
        userId: data.userId,
        fullName: data.fullName,
        email: data.email,
        roleId: data.roleId || session.roleId,
        roleName: data.roleName || session.roleName,
        streakCount: data.streakCount,
        isOnboarded: session.isOnboarded
      });
      state.loading = false;
    } catch (err) {
      state.loading = false;
      state.error = err.message || 'Gagal memuat data profil dari server.';
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', loadProfileData);
})();
