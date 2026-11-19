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

    const session = window.requireAuth?.({ requireOnboarded: true });
    if (!session) return;

    const D = window.NOVASTRA_DATA || {};
    const isGuest = Boolean(session.isGuest);
    let apiWarning = '';
    let dashboard = {
      fullName: isGuest ? 'Guest' : (session.fullName || 'Learner Novastra'),
      roleName: isGuest ? 'Explorer' : (session.roleName || ''),
      totalXp: Number(session.totalXp ?? 0),
      streakCount: Number(session.streakCount ?? 0),
      averageProgress: 0,
      enrolledCount: 0,
      enrollments: [],
      isOnboarded: Boolean(session.isOnboarded)
    };

    if (!isGuest) {
      try {
        const res = await fetch(`/api/dashboard/${encodeURIComponent(session.userId)}`, {
          credentials: 'include',
          cache: 'no-store'
        });
        if (res.ok) {
          dashboard = await res.json();
          if (dashboard.isOnboarded === false) {
            window.saveSession?.({ ...dashboard, isOnboarded: false, isGuest: false });
            window.location.replace('/onboarding');
            return;
          }
          window.saveSession?.({
            userId: dashboard.userId,
            fullName: dashboard.fullName,
            email: dashboard.email,
            roleId: dashboard.roleId,
            roleName: dashboard.roleName || '',
            dailyTimeLimit: dashboard.dailyTimeLimit ?? 0,
            totalXp: dashboard.totalXp ?? 0,
            streakCount: dashboard.streakCount ?? 0,
            isOnboarded: true,
            isGuest: false
          });
        } else {
          apiWarning = `Data dashboard terbaru belum termuat (HTTP ${res.status}). Menampilkan sesi aktif Anda.`;
        }
      } catch {
        apiWarning = 'Server backend belum merespons. Menampilkan sesi aktif Anda.';
      }
    }

    const streak = Number(dashboard.streakCount ?? 0);
    const xp = Number(dashboard.totalXp ?? 0);
    const avgProgress = Number(dashboard.averageProgress ?? 0);
    const enrollments = Array.isArray(dashboard.enrollments) ? dashboard.enrollments : [];
    const roleLabel = dashboard.roleName || 'Belum dipilih';

    document.querySelectorAll('[data-nv-streak]').forEach((el) => {
      el.textContent = `${streak}d`;
    });

    const courses = await (window.apiFetch ? window.apiFetch('/api/courses', D.COURSES || []) : Promise.resolve(D.COURSES || []));
    const fieldMeta = D.FIELD_META || {};
    const enrollmentMap = new Map(enrollments.map((e) => [e.courseId, Number(e.progressPercentage ?? 0)]));
    const forYou = courses.slice(0, 6);

    const hour = new Date().getHours();
    const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam';

    main.innerHTML = `
      ${apiWarning ? `<div class="p-3.5 rounded-2xl bg-[#FAF3E7] border border-[#C4904B]/40 text-xs font-bold text-[#8B622B]">${esc(apiWarning)}</div>` : ''}

      <section class="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-slide-in">
        <div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF0EB] text-[#D97757] text-xs font-extrabold mb-2">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Jalur Karier: ${esc(roleLabel)}
          </span>
          <h1 class="text-2xl md:text-3xl font-black tracking-tight text-[#2C2A27]">${greeting}, ${esc(dashboard.fullName)}</h1>
          <p class="text-sm text-[#6B6560] mt-1">${enrollments.length ? 'Lanjutkan progres harian Anda untuk siap menghadapi Proof-of-Work Blind Test.' : 'Mulai pilih course pertama Anda untuk membangun progres belajar.'}</p>
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
            <h2 class="text-lg md:text-xl font-black text-[#2C2A27] mt-0.5">${esc(roleLabel)}</h2>
            <p class="text-xs text-[#6B6560] mt-1">${enrollments.length} kursus aktif · ${avgProgress}% rata-rata progres</p>
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
            <p class="text-[11px] text-[#A89F98] mt-0.5">${streak > 0 ? 'Konsisten belajar' : 'Mulai hari ini'}</p>
          </div>
          <div class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA]">
            <div class="flex items-center gap-2 text-[#D97757] mb-1">
              <i data-lucide="zap" class="w-4 h-4"></i>
              <span class="text-xs font-bold uppercase">Total XP</span>
            </div>
            <p class="text-2xl font-black text-[#2C2A27]">${xp.toLocaleString('id-ID')}</p>
            <p class="text-[11px] text-[#A89F98] mt-0.5">${xp > 0 ? 'XP terkumpul' : 'Belum ada XP'}</p>
          </div>
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-black text-[#2C2A27]">Kursus Saya</h2>
          <a href="/courses" class="text-xs font-bold text-[#D97757] hover:underline">Cari kursus →</a>
        </div>
        ${enrollments.length ? `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${enrollments.map((e) => {
              const pct = Math.round(Number(e.progressPercentage ?? 0));
              return `
                <a href="/course-detail?id=${encodeURIComponent(e.courseId)}" class="p-5 rounded-2xl bg-white border border-[#E8E2DA] hover:border-[#D97757] transition-all flex flex-col justify-between group">
                  <div>
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FDF0EB] text-[#D97757]">${esc(e.typeCourse || 'Course')}</span>
                    <h3 class="text-base font-extrabold text-[#2C2A27] group-hover:text-[#D97757] leading-snug mt-3">${esc(e.title)}</h3>
                    <p class="text-xs text-[#6B6560] mt-1">${esc(e.instructorName || '')}</p>
                  </div>
                  <div class="mt-4 pt-3 border-t border-[#E8E2DA]">
                    <div class="flex items-center justify-between text-[11px] font-bold text-[#6B6560] mb-1.5">
                      <span>Progres</span>
                      <span>${pct}%</span>
                    </div>
                    <div class="h-1.5 rounded-full bg-[#F5F0EA] overflow-hidden">
                      <div class="h-full rounded-full bg-[#D97757]" style="width:${pct}%"></div>
                    </div>
                  </div>
                </a>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="p-6 rounded-2xl bg-white border border-dashed border-[#E8E2DA] text-center space-y-2">
            <p class="text-sm font-extrabold text-[#2C2A27]">Belum ada course yang diikuti</p>
            <p class="text-xs text-[#6B6560]">Pilih course dari katalog di bawah untuk mulai belajar dan mengumpulkan XP.</p>
            <a href="/courses" class="inline-block mt-2 px-4 py-2 rounded-xl bg-[#D97757] text-white text-xs font-extrabold">Jelajahi Katalog Course</a>
          </div>
        `}
      </section>

      <section>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-black text-[#2C2A27]">For You Courses</h2>
            <p class="text-xs text-[#6B6560]">Rekomendasi kursus untuk jalur ${esc(roleLabel)}</p>
          </div>
          <a href="/courses" class="text-xs font-bold text-[#D97757] hover:underline">Katalog lengkap →</a>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${forYou.map((c) => {
            const cid = c.id ?? c.courseId;
            const fm = fieldMeta[c.field] || { label: c.field || 'Course', color: '#D97757', bg: '#FDF0EB' };
            const progress = Math.round(enrollmentMap.get(cid) ?? 0);
            return `
              <a href="/course-detail?id=${encodeURIComponent(cid)}" class="p-5 rounded-2xl bg-white border border-[#E8E2DA] hover:border-[#D97757] transition-all flex flex-col justify-between group">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-3">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold" style="background:${fm.bg};color:${fm.color}">${esc(fm.label)}</span>
                    <span class="text-xs font-bold text-[#C4904B]">★ ${c.rating ?? 5.0}</span>
                  </div>
                  <h3 class="text-base font-extrabold text-[#2C2A27] group-hover:text-[#D97757] leading-snug">${esc(c.title)}</h3>
                  <p class="text-xs text-[#6B6560] mt-2 line-clamp-2">${esc(c.desc || c.instructorName || '')}</p>
                </div>
                <div class="mt-4 pt-3 border-t border-[#E8E2DA]">
                  <div class="flex items-center justify-between text-[11px] font-bold text-[#6B6560] mb-1.5">
                    <span>${esc(c.level || c.typeCourse || '')} · ${esc(c.duration ?? '')}</span>
                    <span>${progress}%</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-[#F5F0EA] overflow-hidden">
                    <div class="h-full rounded-full bg-[#D97757]" style="width:${progress}%"></div>
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
