(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const LEVELS = [
    { id: 'Beginner', desc: 'Baru mulai membangun fondasi pemrograman & arsitektur.' },
    { id: 'Intermediate', desc: 'Sudah terbiasa coding, ingin siap ke standar produksi.' },
    { id: 'Career Switcher', desc: 'Pindah jalur ke tech dengan kurikulum terstruktur & cepat.' }
  ];
  const TIMES = ['15 min', '30 min', '1 h+'];

  const state = {
    phase: 'steps', // steps | generating
    step: 0,
    targetRole: null,
    level: 'Intermediate',
    skills: [],
    dailyTime: '30 min'
  };

  function root() {
    return document.getElementById('onboarding-root');
  }

  function renderGenerating() {
    const el = root();
    if (!el) return;
    el.innerHTML = `
      <div class="w-full max-w-md p-8 rounded-3xl bg-white border border-[#E8E2DA] text-center shadow-sm animate-slide-up">
        <div class="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center">
          <span class="absolute inset-0 rounded-full bg-[#D97757]/25 animate-ring-expand"></span>
          <div class="w-12 h-12 rounded-2xl bg-[#FDF0EB] text-[#D97757] flex items-center justify-center">
            <i data-lucide="sparkles" class="w-6 h-6"></i>
          </div>
        </div>
        <h2 class="text-xl font-black text-[#2C2A27]">Generating...</h2>
        <p class="text-sm text-[#6B6560] mt-2">Menyusun AI Curriculum untuk <span class="font-bold text-[#D97757]">${esc(state.targetRole?.title || 'Target Role')}</span> (${esc(state.dailyTime)}/hari).</p>
        <div class="mt-6 h-2 rounded-full bg-[#F5F0EA] overflow-hidden">
          <div id="ob-gen-bar" class="h-full bg-[#8A9A86] rounded-full transition-all duration-150" style="width: 12%"></div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    const started = Date.now();
    const timer = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - started) / 2400) * 100));
      const bar = document.getElementById('ob-gen-bar');
      if (bar) bar.style.width = `${pct}%`;
      if (pct >= 100) {
        clearInterval(timer);
        window.NovastraStore?.completeOnboarding?.({
          targetRole: state.targetRole?.title || 'Backend Java Engineer',
          level: state.level,
          skills: state.skills,
          dailyTime: state.dailyTime
        });
        window.location.href = '/home';
      }
    }, 80);
  }

  function renderStep() {
    const el = root();
    if (!el) return;
    const data = window.NOVASTRA_DATA || {};
    const roles = data.TARGET_ROLES || [];
    const chips = data.SKILL_CHIPS || [];
    const meta = data.FIELD_META || {};
    const courses = data.COURSES || [];
    if (!state.targetRole && roles.length) state.targetRole = roles[0];

    const previewCourses = courses
      .filter((c) => !state.targetRole || c.field === state.targetRole.field)
      .slice(0, 2);

    let stepBody = '';
    if (state.step === 0) {
      stepBody = `
        <h2 class="text-xl md:text-2xl font-black text-[#2C2A27]">Pilih Target Role Anda</h2>
        <p class="text-sm text-[#6B6560] mt-1 mb-5">Langkah 1 dari 4 — pilih 1 dari ${roles.length} jalur karier.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
          ${roles.map((r) => {
            const active = state.targetRole?.id === r.id;
            const fm = meta[r.field] || { label: r.field, color: '#D97757', bg: '#FDF0EB' };
            return `
              <button type="button" data-role-id="${esc(r.id)}" class="text-left p-4 rounded-2xl border transition-all cursor-pointer ${active ? 'bg-[#FDF0EB] border-[#D97757] shadow-sm' : 'bg-[#FAF8F5] border-[#E8E2DA] hover:border-[#D97757]/60'}">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-bold" style="background:${fm.bg};color:${fm.color}">${esc(fm.label)}</span>
                  <span class="text-[11px] font-semibold text-[#A89F98]">${esc(r.salary)}</span>
                </div>
                <p class="text-sm font-extrabold text-[#2C2A27]">${esc(r.title)}</p>
              </button>
            `;
          }).join('')}
        </div>
      `;
    } else if (state.step === 1) {
      stepBody = `
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 class="text-xl md:text-2xl font-black text-[#2C2A27]">Experience Level Anda</h2>
            <p class="text-sm text-[#6B6560] mt-1">Target Role: <span class="font-bold text-[#2C2A27]">${esc(state.targetRole?.title)}</span></p>
          </div>
          <button type="button" id="ob-change-role" class="px-3 py-1.5 rounded-xl border border-[#E8E2DA] bg-[#FAF8F5] hover:border-[#D97757] text-xs font-bold text-[#D97757] cursor-pointer">Change role</button>
        </div>
        <div class="space-y-3">
          ${LEVELS.map((lv) => {
            const active = state.level === lv.id;
            return `
              <button type="button" data-level="${esc(lv.id)}" class="w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${active ? 'bg-[#FDF0EB] border-[#D97757]' : 'bg-[#FAF8F5] border-[#E8E2DA] hover:border-[#D97757]/60'}">
                <p class="text-sm font-extrabold text-[#2C2A27]">${esc(lv.id)}</p>
                <p class="text-xs text-[#6B6560] mt-1">${esc(lv.desc)}</p>
              </button>
            `;
          }).join('')}
        </div>
      `;
    } else if (state.step === 2) {
      stepBody = `
        <div class="flex items-center justify-between gap-2 mb-4">
          <div>
            <h2 class="text-xl md:text-2xl font-black text-[#2C2A27]">Pilih Maksimal 3 Skill Gaps</h2>
            <p class="text-sm text-[#6B6560] mt-1">Fokus pada keahlian yang paling ingin Anda kuasai.</p>
          </div>
          <span class="px-3 py-1 rounded-full bg-[#FDF0EB] text-[#D97757] text-xs font-extrabold">${state.skills.length} / 3</span>
        </div>
        <div class="flex flex-wrap gap-2.5">
          ${chips.map((chip) => {
            const selected = state.skills.includes(chip);
            return `
              <button type="button" data-skill="${esc(chip)}" class="px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${selected ? 'bg-[#D97757] text-white border-[#D97757]' : 'bg-[#FAF8F5] text-[#6B6560] border-[#E8E2DA] hover:border-[#D97757]'}">${esc(chip)}</button>
            `;
          }).join('')}
        </div>
      `;
    } else {
      stepBody = `
        <h2 class="text-xl md:text-2xl font-black text-[#2C2A27]">Komitmen Waktu Harian</h2>
        <p class="text-sm text-[#6B6560] mt-1 mb-4">Langkah 4 dari 4 — sesuaikan ritme belajar Anda.</p>
        <div class="grid grid-cols-3 gap-3 mb-5">
          ${TIMES.map((t) => {
            const active = state.dailyTime === t;
            return `
              <button type="button" data-time="${esc(t)}" class="py-3.5 px-3 rounded-2xl border text-center font-extrabold text-sm transition-all cursor-pointer ${active ? 'bg-[#D97757] text-white border-[#D97757]' : 'bg-[#FAF8F5] text-[#2C2A27] border-[#E8E2DA] hover:border-[#D97757]'}">${esc(t)}</button>
            `;
          }).join('')}
        </div>
        <div class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA]">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-extrabold uppercase tracking-wider text-[#8A9A86]">Preview AI Curriculum</span>
            <span class="text-xs font-bold text-[#6B6560]">${esc(state.level)} · ${esc(state.dailyTime)}/hari</span>
          </div>
          <p class="text-sm font-black text-[#2C2A27] mb-2">${esc(state.targetRole?.title)}</p>
          <div class="space-y-2">
            ${previewCourses.map((c) => `
              <div class="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white border border-[#E8E2DA]">
                <span class="font-bold text-[#2C2A27] truncate">${esc(c.title)}</span>
                <span class="text-[#A89F98] shrink-0 ml-2">${esc(c.duration)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    el.innerHTML = `
      <div class="w-full max-w-2xl bg-white border border-[#E8E2DA] rounded-3xl p-6 md:p-8 shadow-sm animate-fade-slide-in">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-[#D97757] text-white flex items-center justify-center font-black">N</div>
            <div class="flex items-center gap-1.5">
              ${[0, 1, 2, 3].map((i) => `<span class="h-1.5 rounded-full transition-all ${i <= state.step ? 'w-7 bg-[#D97757]' : 'w-3 bg-[#E8E2DA]'}"></span>`).join('')}
            </div>
          </div>
          <button type="button" id="ob-skip" class="text-xs font-bold text-[#6B6560] hover:text-[#D97757] cursor-pointer">Skip →</button>
        </div>

        ${stepBody}

        <div class="mt-7 pt-5 border-t border-[#E8E2DA] flex items-center justify-between gap-3">
          <button type="button" id="ob-prev" class="px-4 py-2.5 rounded-xl border border-[#E8E2DA] text-sm font-bold text-[#6B6560] hover:bg-[#FAF8F5] ${state.step === 0 ? 'invisible' : ''} cursor-pointer">Kembali</button>
          <button type="button" id="ob-next" class="px-6 py-2.5 rounded-xl bg-[#D97757] hover:opacity-95 text-white text-sm font-extrabold cursor-pointer">
            ${state.step === 3 ? 'Generate AI Curriculum' : 'Lanjutkan'}
          </button>
        </div>
      </div>
    `;

    bindStepEvents(roles);
  }

  function bindStepEvents(roles) {
    document.querySelectorAll('[data-role-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.targetRole = roles.find((r) => r.id === btn.dataset.roleId) || state.targetRole;
        renderStep();
      });
    });

    document.getElementById('ob-change-role')?.addEventListener('click', () => {
      state.step = 0;
      renderStep();
    });

    document.querySelectorAll('[data-level]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.level = btn.dataset.level;
        renderStep();
      });
    });

    document.querySelectorAll('[data-skill]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const skill = btn.dataset.skill;
        if (state.skills.includes(skill)) {
          state.skills = state.skills.filter((s) => s !== skill);
        } else if (state.skills.length < 3) {
          state.skills = [...state.skills, skill];
        }
        renderStep();
      });
    });

    document.querySelectorAll('[data-time]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.dailyTime = btn.dataset.time;
        renderStep();
      });
    });

    document.getElementById('ob-skip')?.addEventListener('click', () => {
      window.NovastraStore?.completeOnboarding?.({});
      window.location.href = '/home';
    });

    document.getElementById('ob-prev')?.addEventListener('click', () => {
      state.step = Math.max(0, state.step - 1);
      renderStep();
    });

    document.getElementById('ob-next')?.addEventListener('click', () => {
      if (state.step < 3) {
        state.step += 1;
        renderStep();
      } else {
        state.phase = 'generating';
        renderGenerating();
      }
    });
  }

  function boot() {
    if (!window.NovastraStore?.isLoggedIn?.() && !window.NovastraStore?.isGuest?.()) {
      window.location.replace('/login');
      return;
    }
    renderStep();
  }

  document.addEventListener('DOMContentLoaded', boot);
  window.NovastraOnboarding = { state, boot, renderStep, renderGenerating };
})();
