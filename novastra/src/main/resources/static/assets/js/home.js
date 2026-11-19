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

  async function loadAndRender(statusNotice = '') {
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
      activeCoursesCount: 0,
      enrolledCourses: [],
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
    const enrolledCourses = Array.isArray(dashboard.enrolledCourses)
      ? dashboard.enrolledCourses
      : (Array.isArray(dashboard.enrollments) ? dashboard.enrollments : []);
    const activeCount = Number(dashboard.activeCoursesCount ?? enrolledCourses.length);
    const roleLabel = dashboard.roleName || 'Belum dipilih';

    document.querySelectorAll('[data-nv-streak]').forEach((el) => {
      el.textContent = `${streak}d`;
    });

    const courses = await (window.apiFetch ? window.apiFetch('/api/courses', D.COURSES || []) : Promise.resolve(D.COURSES || []));
    const fieldMeta = D.FIELD_META || {};
    const enrollmentMap = new Map(enrolledCourses.map((e) => [e.courseId, Number(e.progressPercentage ?? 0)]));

    const sortedCourses = [...courses].sort((a, b) => {
      const aMatch = (a.typeCourse || a.field) === dashboard.roleName ? 0 : 1;
      const bMatch = (b.typeCourse || b.field) === dashboard.roleName ? 0 : 1;
      return aMatch - bMatch;
    });
    const forYou = sortedCourses.slice(0, 6);

    const hour = new Date().getHours();
    const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam';

    main.innerHTML = `
      ${apiWarning ? `<div class="p-3.5 rounded-2xl bg-[#FAF3E7] border border-[#C4904B]/40 text-xs font-bold text-[#8B622B]">${esc(apiWarning)}</div>` : ''}
      ${statusNotice ? `<div class="p-3.5 rounded-2xl bg-[#F0F3EF] border border-[#8A9A86]/50 text-xs font-bold text-[#5E7C6B]">${esc(statusNotice)}</div>` : ''}

      <section class="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-slide-in">
        <div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF0EB] text-[#D97757] text-xs font-extrabold mb-2">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Jalur Karier: ${esc(roleLabel)}
          </span>
          <h1 class="text-2xl md:text-3xl font-black tracking-tight text-[#2C2A27]">${greeting}, ${esc(dashboard.fullName)}</h1>
          <p class="text-sm text-[#6B6560] mt-1">${enrolledCourses.length ? 'Lanjutkan progres harian Anda untuk siap menghadapi Proof-of-Work Blind Test.' : 'Klik salah satu course di bawah untuk mendaftar dan mulai membangun progres belajar.'}</p>
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
            <p class="text-xs text-[#6B6560] mt-1">${activeCount} kursus aktif · ${avgProgress}% rata-rata progres</p>
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

      <section id="my-courses-section">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-black text-[#2C2A27]">Kursus Saya</h2>
          <a href="/courses" class="text-xs font-bold text-[#D97757] hover:underline">Cari kursus →</a>
        </div>
        ${enrolledCourses.length ? `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${enrolledCourses.map((e) => {
              const pct = Math.round(Number(e.progressPercentage ?? 0));
              return `
                <a href="/course-detail?courseId=${encodeURIComponent(e.courseId)}" class="p-5 rounded-2xl bg-white border border-[#E8E2DA] hover:border-[#D97757] transition-all flex flex-col justify-between group">
                  <div>
                    <div class="flex items-center justify-between gap-2 mb-3">
                      <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FDF0EB] text-[#D97757]">${esc(e.typeCourse || 'Course')}</span>
                      <span class="text-xs font-extrabold text-[#5E7C6B]">${pct >= 100 ? 'Selesai' : 'Aktif'}</span>
                    </div>
                    <h3 class="text-base font-extrabold text-[#2C2A27] group-hover:text-[#D97757] leading-snug">${esc(e.title)}</h3>
                    <p class="text-xs text-[#6B6560] mt-1">${esc(e.instructorName || '')}${e.duration ? ` · ${esc(e.duration)} mnt` : ''}</p>
                  </div>
                  <div class="mt-4 pt-3 border-t border-[#E8E2DA] space-y-2.5">
                    <div class="flex items-center justify-between text-[11px] font-bold text-[#6B6560]">
                      <span>Progres</span>
                      <span>${pct}%</span>
                    </div>
                    <div class="h-2 rounded-full bg-[#F5F0EA] overflow-hidden">
                      <div class="h-full rounded-full bg-[#D97757] transition-all" style="width:${pct}%"></div>
                    </div>
                    <span class="inline-flex items-center gap-1 text-xs font-extrabold text-[#D97757]">Lanjut Belajar →</span>
                  </div>
                </a>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="p-6 rounded-2xl bg-white border border-dashed border-[#E8E2DA] text-center space-y-2">
            <p class="text-sm font-extrabold text-[#2C2A27]">Belum ada course yang diikuti</p>
            <p class="text-xs text-[#6B6560]">Klik salah satu course pada bagian For You Courses di bawah untuk langsung mendaftar.</p>
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
            const fm = fieldMeta[c.field] || { label: c.typeCourse || c.field || 'Course', color: '#D97757', bg: '#FDF0EB' };
            const isEnrolled = enrollmentMap.has(cid);
            const progress = Math.round(enrollmentMap.get(cid) ?? 0);
            return `
              <div data-course-card="${esc(cid)}" data-enrolled="${isEnrolled}" class="p-5 rounded-2xl bg-white border border-[#E8E2DA] hover:border-[#D97757] transition-all flex flex-col justify-between group cursor-pointer">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-3">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold" style="background:${fm.bg};color:${fm.color}">${esc(fm.label)}</span>
                    <span class="text-xs font-bold text-[#C4904B]">★ ${c.rating ?? 5.0}</span>
                  </div>
                  <h3 class="text-base font-extrabold text-[#2C2A27] group-hover:text-[#D97757] leading-snug">${esc(c.title)}</h3>
                  <p class="text-xs text-[#6B6560] mt-2 line-clamp-2">${esc(c.desc || c.instructorName || '')}</p>
                </div>
                <div class="mt-4 pt-3 border-t border-[#E8E2DA] space-y-2.5">
                  <div class="flex items-center justify-between text-[11px] font-bold text-[#6B6560]">
                    <span>${esc(c.level || c.typeCourse || '')} · ${esc(c.duration ?? '')} mnt</span>
                    <span>${progress}%</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-[#F5F0EA] overflow-hidden">
                    <div class="h-full rounded-full bg-[#D97757]" style="width:${progress}%"></div>
                  </div>
                  ${isEnrolled ? `
                    <a href="/course-detail?courseId=${encodeURIComponent(cid)}" class="block w-full text-center py-2 rounded-xl bg-[#F0F3EF] text-[#5E7C6B] text-xs font-extrabold">Lanjut Belajar →</a>
                  ` : `
                    <button type="button" data-enroll-course="${esc(cid)}" class="w-full py-2 rounded-xl bg-[#D97757] hover:opacity-95 text-white text-xs font-extrabold cursor-pointer">Ikuti Kursus</button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;

    const handleEnroll = async (courseId, triggerEl) => {
      if (isGuest) {
        window.location.href = `/course-detail?courseId=${encodeURIComponent(courseId)}`;
        return;
      }
      if (triggerEl) {
        triggerEl.disabled = true;
        triggerEl.textContent = 'Mendaftarkan...';
      }
      try {
        const res = await fetch('/api/enrollments', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.userId, courseId })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        await loadAndRender(`Berhasil mengikuti "${data.title || courseId}". Course ditambahkan ke Kursus Saya.`);
        document.getElementById('my-courses-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (err) {
        if (triggerEl) {
          triggerEl.disabled = false;
          triggerEl.textContent = 'Ikuti Kursus';
        }
        await loadAndRender(`Gagal mendaftar course: ${err.message}`);
      }
    };

    main.querySelectorAll('[data-course-card]').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) return;
        const cid = card.dataset.courseCard;
        if (card.dataset.enrolled === 'true') {
          window.location.href = `/course-detail?courseId=${encodeURIComponent(cid)}`;
        } else {
          const btn = card.querySelector('[data-enroll-course]');
          handleEnroll(cid, btn);
        }
      });
    });

    main.querySelectorAll('[data-enroll-course]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleEnroll(btn.dataset.enrollCourse, btn);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  document.addEventListener('DOMContentLoaded', () => loadAndRender());
})();
