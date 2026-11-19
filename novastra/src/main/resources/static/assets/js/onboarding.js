(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const LEVELS = [
    { id: 0, label: 'Beginner', desc: 'Baru mulai membangun fondasi pemrograman & arsitektur.' },
    { id: 1, label: 'Intermediate', desc: 'Sudah terbiasa coding, ingin siap ke standar produksi.' },
    { id: 2, label: 'Advanced', desc: 'Siap mendalami arsitektur sistem & studi kasus kompleks.' }
  ];
  const TIMES = [
    { minutes: 15, label: '15 min' },
    { minutes: 30, label: '30 min' },
    { minutes: 60, label: '1 h+' }
  ];

  const state = {
    step: 0,
    roles: [],
    skills: [],
    selectedRoleId: null,
    selectedSkillIds: [],
    dailyTimeLimit: 30,
    experienceLevel: 1,
    loading: true,
    submitting: false,
    error: ''
  };

  const root = () => document.getElementById('onboarding-root');

  function renderStatus(message, showRetry = false) {
    const el = root();
    if (!el) return;
    el.innerHTML = `
      <div class="w-full max-w-md p-8 rounded-3xl bg-white border border-[#E8E2DA] text-center shadow-sm animate-fade-slide-in">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-[#FDF0EB] text-[#D97757] flex items-center justify-center font-black text-xl mb-4">N</div>
        <p class="text-sm font-bold text-[#2C2A27]">${esc(message)}</p>
        ${showRetry ? `<button type="button" id="ob-retry" class="mt-4 px-5 py-2.5 rounded-xl bg-[#D97757] text-white text-xs font-extrabold cursor-pointer">Coba Lagi</button>` : ''}
      </div>
    `;
    document.getElementById('ob-retry')?.addEventListener('click', loadOnboardingOptions);
  }

  function renderStep() {
    const el = root();
    if (!el) return;
    if (state.loading) return renderStatus('Memuat opsi kuesioner dari database...');
    if (!state.roles.length) return renderStatus(state.error || 'Opsi onboarding belum tersedia.', true);

    const selectedRole = state.roles.find((r) => r.roleId === state.selectedRoleId) || state.roles[0];
    state.selectedRoleId = selectedRole.roleId;

    let stepBody = '';
    if (state.step === 0) {
      stepBody = `
        <h2 class="text-xl md:text-2xl font-black text-[#2C2A27]">Pilih Target Career Role</h2>
        <p class="text-sm text-[#6B6560] mt-1 mb-5">Langkah 1 dari 3 — pilih jalur karier utama Anda.</p>
        <div class="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          ${state.roles.map((r) => {
            const active = state.selectedRoleId === r.roleId;
            return `
              <button type="button" data-role-id="${esc(r.roleId)}" class="w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${active ? 'bg-[#FDF0EB] border-[#D97757] shadow-sm' : 'bg-[#FAF8F5] border-[#E8E2DA] hover:border-[#D97757]/60'}">
                <p class="text-sm font-extrabold text-[#2C2A27]">${esc(r.roleName)}</p>
                <p class="text-xs text-[#6B6560] mt-1">${esc(r.description || '')}</p>
              </button>
            `;
          }).join('')}
        </div>
      `;
    } else if (state.step === 1) {
      const roleSkills = state.skills.filter((s) => s.category === selectedRole.roleName);
      const visibleSkills = roleSkills.length ? roleSkills : state.skills;
      stepBody = `
        <div class="flex items-center justify-between gap-2 mb-4">
          <div>
            <h2 class="text-xl md:text-2xl font-black text-[#2C2A27]">Pilih Skill Gap Prioritas</h2>
            <p class="text-sm text-[#6B6560] mt-1">Langkah 2 dari 3 — fokus skill untuk jalur ${esc(selectedRole.roleName)}.</p>
          </div>
          <span class="px-3 py-1 rounded-full bg-[#FDF0EB] text-[#D97757] text-xs font-extrabold">${state.selectedSkillIds.length} dipilih</span>
        </div>
        <div class="flex flex-wrap gap-2.5">
          ${visibleSkills.map((s) => {
            const selected = state.selectedSkillIds.includes(s.skillId);
            return `
              <button type="button" data-skill-id="${esc(s.skillId)}" class="px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${selected ? 'bg-[#D97757] text-white border-[#D97757]' : 'bg-[#FAF8F5] text-[#6B6560] border-[#E8E2DA] hover:border-[#D97757]'}">
                ${esc(s.skillName)} <span class="opacity-75">(${esc(s.category)})</span>
              </button>
            `;
          }).join('')}
        </div>
      `;
    } else {
      stepBody = `
        <h2 class="text-xl md:text-2xl font-black text-[#2C2A27]">Komitmen Waktu &amp; Level</h2>
        <p class="text-sm text-[#6B6560] mt-1 mb-4">Langkah 3 dari 3 — tentukan target waktu belajar harian Anda.</p>
        <p class="text-xs font-extrabold uppercase tracking-wider text-[#8A9A86] mb-2">Daily Time Limit</p>
        <div class="grid grid-cols-3 gap-3 mb-5">
          ${TIMES.map((t) => {
            const active = state.dailyTimeLimit === t.minutes;
            return `
              <button type="button" data-time="${t.minutes}" class="py-3.5 px-3 rounded-2xl border text-center font-extrabold text-sm transition-all cursor-pointer ${active ? 'bg-[#D97757] text-white border-[#D97757]' : 'bg-[#FAF8F5] text-[#2C2A27] border-[#E8E2DA] hover:border-[#D97757]'}">${esc(t.label)}</button>
            `;
          }).join('')}
        </div>
        <p class="text-xs font-extrabold uppercase tracking-wider text-[#8A9A86] mb-2">Experience Level</p>
        <div class="space-y-2.5">
          ${LEVELS.map((lv) => {
            const active = state.experienceLevel === lv.id;
            return `
              <button type="button" data-level="${lv.id}" class="w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${active ? 'bg-[#FDF0EB] border-[#D97757]' : 'bg-[#FAF8F5] border-[#E8E2DA] hover:border-[#D97757]/60'}">
                <p class="text-sm font-extrabold text-[#2C2A27]">${esc(lv.label)}</p>
                <p class="text-xs text-[#6B6560] mt-0.5">${esc(lv.desc)}</p>
              </button>
            `;
          }).join('')}
        </div>
      `;
    }

    el.innerHTML = `
      <div class="w-full max-w-2xl bg-white border border-[#E8E2DA] rounded-3xl p-6 md:p-8 shadow-sm animate-fade-slide-in">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-[#D97757] text-white flex items-center justify-center font-black">N</div>
            <div class="flex items-center gap-1.5">
              ${[0, 1, 2].map((i) => `<span class="h-1.5 rounded-full transition-all ${i <= state.step ? 'w-8 bg-[#D97757]' : 'w-3 bg-[#E8E2DA]'}"></span>`).join('')}
            </div>
          </div>
          <span class="text-xs font-bold text-[#A89F98]">Onboarding Wajib</span>
        </div>

        ${stepBody}

        ${state.error ? `<p class="mt-4 text-xs font-bold text-[#A65D57] bg-[#F8ECEB] border border-[#A65D57]/30 px-3 py-2 rounded-xl">${esc(state.error)}</p>` : ''}

        <div class="mt-7 pt-5 border-t border-[#E8E2DA] flex items-center justify-between gap-3">
          <button type="button" id="ob-prev" class="px-4 py-2.5 rounded-xl border border-[#E8E2DA] text-sm font-bold text-[#6B6560] hover:bg-[#FAF8F5] ${state.step === 0 ? 'invisible' : ''} cursor-pointer">Kembali</button>
          <button type="button" id="ob-next" ${state.submitting ? 'disabled' : ''} class="px-6 py-2.5 rounded-xl bg-[#D97757] hover:opacity-95 disabled:opacity-60 text-white text-sm font-extrabold cursor-pointer">
            ${state.submitting ? 'Menyimpan...' : state.step === 2 ? 'Simpan & Masuk Dashboard' : 'Lanjutkan'}
          </button>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    document.querySelectorAll('[data-role-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (state.selectedRoleId !== btn.dataset.roleId) {
          state.selectedSkillIds = [];
        }
        state.selectedRoleId = btn.dataset.roleId;
        state.error = '';
        renderStep();
      });
    });

    document.querySelectorAll('[data-skill-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sid = btn.dataset.skillId;
        if (state.selectedSkillIds.includes(sid)) {
          state.selectedSkillIds = state.selectedSkillIds.filter((id) => id !== sid);
        } else {
          state.selectedSkillIds = [...state.selectedSkillIds, sid];
        }
        state.error = '';
        renderStep();
      });
    });

    document.querySelectorAll('[data-time]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.dailyTimeLimit = Number(btn.dataset.time);
        renderStep();
      });
    });

    document.querySelectorAll('[data-level]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.experienceLevel = Number(btn.dataset.level);
        renderStep();
      });
    });

    document.getElementById('ob-prev')?.addEventListener('click', () => {
      state.step = Math.max(0, state.step - 1);
      state.error = '';
      renderStep();
    });

    document.getElementById('ob-next')?.addEventListener('click', async () => {
      if (state.step === 1 && state.selectedSkillIds.length === 0) {
        state.error = 'Pilih minimal 1 skill gap yang ingin dipelajari.';
        return renderStep();
      }
      if (state.step < 2) {
        state.step += 1;
        state.error = '';
        return renderStep();
      }
      await submitOnboarding();
    });
  }

  async function submitOnboarding() {
    const session = window.requireAuth?.({ requireOnboarded: false });
    if (!session) return;

    state.submitting = true;
    state.error = '';
    renderStep();

    try {
      const res = await fetch(`/api/onboarding/${encodeURIComponent(session.userId)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: state.selectedRoleId,
          dailyTimeLimit: state.dailyTimeLimit,
          experienceLevel: state.experienceLevel,
          skillIds: state.selectedSkillIds
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        state.submitting = false;
        state.error = data?.message || 'Gagal menyimpan data onboarding.';
        return renderStep();
      }

      window.saveSession?.({
        ...(data.user || {}),
        roleId: data.user?.roleId || state.selectedRoleId,
        roleName: data.roleName || '',
        isOnboarded: true,
        isGuest: false
      });
      window.location.href = '/home';
    } catch {
      state.submitting = false;
      state.error = 'Koneksi ke server gagal. Coba lagi.';
      renderStep();
    }
  }

  async function loadOnboardingOptions() {
    state.loading = true;
    state.error = '';
    renderStep();
    try {
      const res = await fetch('/api/onboarding/options', { credentials: 'include', cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || `Gagal memuat opsi onboarding (HTTP ${res.status}). Pastikan backend Spring Boot sudah di-restart.`);
      }
      state.roles = Array.isArray(data.roles) ? data.roles : [];
      state.skills = Array.isArray(data.skills) ? data.skills : [];
      if (state.roles.length && !state.selectedRoleId) {
        state.selectedRoleId = state.roles[0].roleId;
      }
      state.loading = false;
    } catch (err) {
      state.loading = false;
      state.error = err.message || 'Tidak dapat memuat opsi dari database.';
    }
    renderStep();
  }

  function boot() {
    const session = window.requireAuth?.({ requireOnboarded: false });
    if (!session) return;
    if (session.isGuest || session.isOnboarded) {
      window.location.replace('/home');
      return;
    }
    loadOnboardingOptions();
  }

  document.addEventListener('DOMContentLoaded', boot);
  window.NovastraOnboarding = {
    state,
    boot,
    loadOnboardingOptions,
    loadOptions: loadOnboardingOptions,
    renderStep
  };
})();
