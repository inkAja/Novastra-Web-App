(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function renderProgressRing(pct) {
    const r = 38;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return `
      <svg width="96" height="96" viewBox="0 0 96 96" class="shrink-0">
        <circle cx="48" cy="48" r="${r}" fill="none" stroke="#EFE8DF" stroke-width="8"></circle>
        <circle cx="48" cy="48" r="${r}" fill="none" stroke="#D97757" stroke-width="8"
          stroke-linecap="round" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
          transform="rotate(-90 48 48)"></circle>
        <text x="48" y="53" text-anchor="middle" font-size="18" font-weight="800" fill="#2C2A27">${pct}%</text>
      </svg>
    `;
  }

  async function init() {
    const main = document.getElementById('main-content');
    if (!main) return;

    const D = window.NOVASTRA_DATA || {};
    const store = window.NovastraStore;
    const user = store?.getUser?.() || { name: 'Learner Novastra', targetRole: 'Backend Java Engineer' };
    const streak = store?.getStreak?.()?.count ?? 12;
    const completedObj = store?.getCompletedLessons?.() || {};
    const completedCount = Object.values(completedObj).reduce((acc, arr) => acc + arr.length, 0);
    const xp = 1200 + completedCount * 50;

    const courses = await (window.apiFetch ? window.apiFetch('/api/courses', D.COURSES || []) : Promise.resolve(D.COURSES || []));
    const fieldMeta = D.FIELD_META || {};
    const enrolled = store?.getEnrolled?.() || [];
    const forYou = courses.filter((c) => enrolled.includes(c.id)).concat(courses.filter((c) => !enrolled.includes(c.id))).slice(0, 6);
    const avgProgress = Math.min(100, Math.round(forYou.slice(0, 3).reduce((a, c) => a + (c.progress || 0), 0) / 3) || 68);

    const hour = new Date().getHours();
    const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam';

    main.innerHTML = `
      <section class="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-slide-in">
        <div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF0EB] text-[#D97757] text-xs font-extrabold mb-2">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Jalur Karier: ${esc(user.targetRole)}
          </span>
          <h1 class="text-2xl md:text-3xl font-black tracking-tight text-[#2C2A27]">${greeting}, ${esc(user.name)}</h1>
          <p class="text-sm text-[#6B6560] mt-1">Lanjutkan progres harian Anda untuk siap menghadapi Proof-of-Work Blind Test.</p>
        </div>
        <div class="flex items-center gap-2.5">
          <a href="/courses" class="px-4 py-2.5 rounded-xl bg-white border border-[#E8E2DA] hover:border-[#D97757] text-xs font-extrabold text-[#2C2A27]">Jelajahi Kursus</a>
          <a href="/career" class="px-4 py-2.5 rounded-xl bg-[#D97757] hover:opacity-95 text-xs font-extrabold text-white">Cek Skill Gap</a>
        </div>
      </section>

      <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6 items-center animate-fade-slide-in">
        <div class="flex items-center gap-5 lg:col-span-2">
          ${renderProgressRing(avgProgress)}
          <div>
            <p class="text-xs font-extrabold uppercase tracking-wider text-[#8A9A86]">Career Readiness Dashboard</p>
            <h2 class="text-lg md:text-xl font-black text-[#2C2A27] mt-0.5">${esc(user.targetRole)}</h2>
            <p class="text-xs text-[#6B6560] mt-1">${enrolled.length} kursus aktif · ${completedCount} lesson selesai · siap uji Blind Test</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <a href="/quiz" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F0EA] hover:bg-[#FDF0EB] text-xs font-bold text-[#2C2A27]">
                <i data-lucide="users" class="w-3.5 h-3.5 text-[#D97757]"></i> Latihan Peer
              </a>
              <a href="/career" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F0EA] hover:bg-[#FDF0EB] text-xs font-bold text-[#2C2A27]">
                <i data-lucide="award" class="w-3.5 h-3.5 text-[#8A9A86]"></i> PoW Arena
              </a>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA]">
            <div class="flex items-center gap-2 text-[#C4904B] mb-1">
              <i data-lucide="flame" class="w-4 h-4"></i>
              <span class="text-xs font-bold uppercase">Streak</span>
            </div>
            <p class="text-2xl font-black text-[#2C2A27]">${streak}d</p>
            <p class="text-[11px] text-[#A89F98] mt-0.5">Konsisten 2 minggu</p>
          </div>
          <div class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA]">
            <div class="flex items-center gap-2 text-[#D97757] mb-1">
              <i data-lucide="zap" class="w-4 h-4"></i>
              <span class="text-xs font-bold uppercase">Total XP</span>
            </div>
            <p class="text-2xl font-black text-[#2C2A27]">${xp.toLocaleString('id-ID')}</p>
            <p class="text-[11px] text-[#A89F98] mt-0.5">Top 12% Cohort</p>
          </div>
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-black text-[#2C2A27]">Trending Fields</h2>
          <a href="/courses" class="text-xs font-bold text-[#D97757] hover:underline">Lihat semua</a>
        </div>
        <div class="flex flex-wrap gap-2.5">
          ${Object.entries(fieldMeta).map(([key, fm]) => `
            <a href="/courses?field=${encodeURIComponent(key)}" class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8E2DA] hover:border-[#D97757] text-xs font-bold text-[#2C2A27] transition-colors">
              <span class="w-2.5 h-2.5 rounded-full" style="background:${fm.color}"></span>
              <span>${esc(fm.label)}</span>
            </a>
          `).join('')}
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-black text-[#2C2A27]">For You Courses</h2>
            <p class="text-xs text-[#6B6560]">Rekomendasi terpersonalisasi untuk jalur ${esc(user.targetRole)}</p>
          </div>
          <a href="/courses" class="text-xs font-bold text-[#D97757] hover:underline">Katalog lengkap →</a>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${forYou.map((c) => {
            const fm = fieldMeta[c.field] || { label: c.field, color: '#D97757', bg: '#FDF0EB' };
            return `
              <a href="/course-detail?id=${encodeURIComponent(c.id)}" class="p-5 rounded-2xl bg-white border border-[#E8E2DA] hover:border-[#D97757] transition-all flex flex-col justify-between group">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-3">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold" style="background:${fm.bg};color:${fm.color}">${esc(fm.label)}</span>
                    <span class="text-xs font-bold text-[#C4904B]">★ ${c.rating}</span>
                  </div>
                  <h3 class="text-base font-extrabold text-[#2C2A27] group-hover:text-[#D97757] leading-snug">${esc(c.title)}</h3>
                  <p class="text-xs text-[#6B6560] mt-2 line-clamp-2">${esc(c.desc)}</p>
                </div>
                <div class="mt-4 pt-3 border-t border-[#E8E2DA]">
                  <div class="flex items-center justify-between text-[11px] font-bold text-[#6B6560] mb-1.5">
                    <span>${esc(c.level)} · ${esc(c.duration)}</span>
                    <span>${c.progress}%</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-[#F5F0EA] overflow-hidden">
                    <div class="h-full rounded-full bg-[#D97757]" style="width:${c.progress}%"></div>
                  </div>
                </div>
              </a>
            `;
          }).join('')}
        </div>
      </section>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
