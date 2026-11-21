(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function renderProgressRing(pct) {
    const safePct = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
    const r = 38;
    const circ = 2 * Math.PI * r;
    const offset = circ - (safePct / 100) * circ;
    return `
      <svg width="96" height="96" viewBox="0 0 96 96" class="shrink-0">
        <circle cx="48" cy="48" r="${r}" fill="none" stroke="#EFE8DF" stroke-width="8"></circle>
        <circle cx="48" cy="48" r="${r}" fill="none" stroke="#D97757" stroke-width="8"
          stroke-linecap="round" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
          transform="rotate(-90 48 48)"></circle>
        <text x="48" y="53" text-anchor="middle" font-size="18" font-weight="800" fill="#2C2A27">${safePct}%</text>
      </svg>
    `;
  }

  function renderMobileDonut(pct) {
    const safePct = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
    const r = 60;
    const circ = 2 * Math.PI * r;
    const offset = circ - (safePct / 100) * circ;
    return `
      <div class="hm-donut-wrap">
        <svg width="154" height="154" viewBox="0 0 154 154" aria-label="Market readiness ${safePct} persen">
          <circle cx="77" cy="77" r="${r}" fill="none" stroke="#E4DFD8" stroke-width="14"></circle>
          <circle cx="77" cy="77" r="${r}" fill="none" stroke="#7A8273" stroke-width="14"
            stroke-linecap="round" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
            transform="rotate(-90 77 77)"></circle>
          <text x="77" y="74" text-anchor="middle" font-size="30" font-weight="900" fill="#18181B">${safePct}%</text>
          <text x="77" y="96" text-anchor="middle" font-size="12" font-weight="700" fill="#78716C">of goal</text>
        </svg>
      </div>
    `;
  }

  function cleanTitle(raw) {
    return String(raw || '').replace(/^\[(Beginner|Intermediate|Advanced)\]\s*/i, '').trim();
  }

  function buildMobileViewModel({ dashboard, careerData, studyPodData, enrolledCourses, courses, isGuest }) {
    const firstName = String(dashboard.fullName || 'Learner').trim().split(/\s+/)[0] || 'Learner';
    const hour = new Date().getHours();
    const engGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const careerPct = Math.max(0, Math.min(100, Math.round(
      Number(dashboard.careerReadinessPercentage ?? careerData?.overallProgress ?? 0)
    )));
    const roleLabel = dashboard.roleName || careerData?.roleName || 'Career Track';
    const curriculum = Array.isArray(careerData?.curriculum) ? careerData.curriculum : [];
    const remainingModules = curriculum.length
      ? curriculum.reduce((sum, c) => {
          const pct = Math.max(0, Math.min(100, Number(c.progressPercentage ?? 0)));
          return sum + Math.round((3 * (100 - pct)) / 100);
        }, 0)
      : Math.max(0, (Number(dashboard.careerTotalCoursesCount ?? 0) - Number(dashboard.careerCompletedCoursesCount ?? 0)) * 3);

    // Quick Resume Left: Active Micro-Task
    const blindTests = Array.isArray(careerData?.blindTests) ? careerData.blindTests : [];
    const targetTest = blindTests.find((t) => !t.isPassed) || blindTests[0] || null;
    const pendingTask = targetTest?.tasks?.find((t) => !t.isPassed) || targetTest?.tasks?.[0] || null;
    const fallbackCourse = curriculum[0] || enrolledCourses[0] || courses[0] || null;

    let microHref = '/learn';
    let microTitle = 'Mulai Course Pertama Anda';
    let microCourse = roleLabel;
    let microDuration = '15 min';
    let microPct = 0;

    if (targetTest) {
      const cid = targetTest.courseId;
      microHref = `/course-detail?courseId=${encodeURIComponent(cid)}&tab=microtasks`;
      microCourse = cleanTitle(String(targetTest.title || '').replace(/^Blind Test:\s*/i, '')) || roleLabel;
      microTitle = pendingTask?.questionText || pendingTask?.moduleTitle || microCourse;
      const total = Number(targetTest.totalTasksCount ?? 0);
      const done = Number(targetTest.completedTasksCount ?? 0);
      microPct = total > 0 ? Math.round((done / total) * 100) : (targetTest.isPassed ? 100 : 0);
      microDuration = `${Math.max(10, Math.min(25, Number(targetTest.durationMin ?? 15)))} min`;
    } else if (fallbackCourse) {
      const cid = fallbackCourse.courseId ?? fallbackCourse.id;
      microHref = cid ? `/course-detail?courseId=${encodeURIComponent(cid)}&tab=microtasks` : '/learn';
      microTitle = cleanTitle(fallbackCourse.title);
      microCourse = fallbackCourse.typeCourse || roleLabel;
      microPct = Math.round(Number(fallbackCourse.progressPercentage ?? 0));
    }

    // Quick Resume Right: StudyPod Peer Practice (role-tailored, zero AI/Roleplay)
    const roleTopics = Array.isArray(studyPodData?.topics) ? studyPodData.topics : [];
    const studyTopic = roleTopics[0]?.title || 'Cross-Role Technical Collaboration';

    // Market Signals: skill gaps from CareerService
    const topPrioritySet = new Set(Array.isArray(careerData?.topPriorityGaps) ? careerData.topPriorityGaps : []);
    const rawSignals = Array.isArray(careerData?.skillGaps) ? careerData.skillGaps : [];
    const sortedSignals = [...rawSignals]
      .sort((a, b) => Number(b.gap ?? 0) - Number(a.gap ?? 0))
      .slice(0, 6);

    const signals = sortedSignals.length
      ? sortedSignals.map((g) => ({
          name: g.skillName,
          priority: Boolean(g.isPriority) || topPrioritySet.has(g.skillName)
        }))
      : (isGuest
          ? [
              { name: 'System Design', priority: true },
              { name: 'SQL Optimization', priority: true },
              { name: 'API Security', priority: false }
            ]
          : []);

    return {
      firstName,
      engGreeting,
      careerPct,
      roleLabel,
      remainingModules,
      microHref,
      microTitle,
      microCourse,
      microDuration,
      microPct,
      studyTopic,
      signals
    };
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
      careerReadinessPercentage: 0,
      careerCompletedCoursesCount: 0,
      careerTotalCoursesCount: 0,
      enrolledCourses: [],
      isOnboarded: Boolean(session.isOnboarded)
    };
    let careerData = null;
    let studyPodData = null;

    if (!isGuest) {
      const uid = encodeURIComponent(session.userId);
      const [dashRes, careerRes, podRes] = await Promise.allSettled([
        fetch(`/api/dashboard/${uid}`, { credentials: 'include', cache: 'no-store' }),
        fetch(`/api/career/${uid}`, { credentials: 'include', cache: 'no-store' }),
        fetch(`/api/studypod/topics/${uid}`, { credentials: 'include', cache: 'no-store' })
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
        dashboard = await dashRes.value.json();
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
      } else if (dashRes.status === 'fulfilled') {
        apiWarning = `Data dashboard terbaru belum termuat (HTTP ${dashRes.value.status}). Menampilkan sesi aktif Anda.`;
      } else {
        apiWarning = 'Server backend belum merespons. Menampilkan sesi aktif Anda.';
      }

      if (careerRes.status === 'fulfilled' && careerRes.value.ok) {
        careerData = await careerRes.value.json().catch(() => null);
      }
      if (podRes.status === 'fulfilled' && podRes.value.ok) {
        studyPodData = await podRes.value.json().catch(() => null);
      }
    }

    const streak = Number(dashboard.streakCount ?? 0);
    const xp = Number(dashboard.totalXp ?? 0);
    const careerPct = Math.max(0, Math.min(100, Math.round(Number(dashboard.careerReadinessPercentage ?? 0))));
    const careerCompleted = Number(dashboard.careerCompletedCoursesCount ?? 0);
    const careerTotal = Number(dashboard.careerTotalCoursesCount ?? 0);
    const enrolledCourses = Array.isArray(dashboard.enrolledCourses)
      ? dashboard.enrolledCourses
      : (Array.isArray(dashboard.enrollments) ? dashboard.enrollments : []);
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
    const mob = buildMobileViewModel({
      dashboard,
      careerData,
      studyPodData,
      enrolledCourses,
      courses,
      isGuest
    });

    main.innerHTML = `
      <div class="hm-desktop-view space-y-8">
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
            ${renderProgressRing(careerPct)}
            <div>
              <p class="text-xs font-extrabold uppercase tracking-wider text-[#8A9A86]">Career Readiness Dashboard</p>
              <h2 class="text-lg md:text-xl font-black text-[#2C2A27] mt-0.5">${esc(roleLabel)}</h2>
              <p class="text-xs text-[#6B6560] mt-1">${careerCompleted} dari ${careerTotal} kursus karier selesai · ${careerPct}% progres karier</p>
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <a href="/career" id="home-go-career" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#D97757] hover:opacity-95 text-xs font-extrabold text-white shadow-sm transition-opacity">
                  Go to Career →
                </a>
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
      </div>

      <div class="hm-mobile-view">
        ${apiWarning ? `<div class="p-3 rounded-2xl bg-[#FAF3E7] border border-[#C4904B]/40 text-xs font-bold text-[#8B622B]">${esc(apiWarning)}</div>` : ''}
        ${statusNotice ? `<div class="p-3 rounded-2xl bg-[#F0F3EF] border border-[#8A9A86]/50 text-xs font-bold text-[#5E7C6B]">${esc(statusNotice)}</div>` : ''}

        <header>
          <p class="hm-greeting">${mob.engGreeting}, ${esc(mob.firstName)} 👋</p>
          <h1 class="hm-page-title">Career Dashboard</h1>
        </header>

        <section class="hm-hero-card" aria-label="Market Readiness">
          <p class="hm-kicker">MARKET READINESS</p>
          ${renderMobileDonut(mob.careerPct)}
          <h2 class="hm-hero-status">${mob.careerPct}% Ready for ${esc(mob.roleLabel)}</h2>
          <p class="hm-hero-sub">${mob.remainingModules} modules remaining</p>
          <div class="hm-hero-bar-track" aria-hidden="true">
            <div class="hm-hero-bar-fill" style="width:${mob.careerPct}%"></div>
          </div>
          <a href="/career" id="hm-mobile-go-career" class="hm-hero-cta">Go to Career →</a>
        </section>

        <section class="hm-section-block" aria-label="Quick Resume">
          <p class="hm-kicker">QUICK RESUME</p>
          <div class="hm-quick-grid">
            <a href="${mob.microHref}" class="hm-quick-card">
              <div>
                <span class="hm-quick-tag hm-quick-tag--micro">MICRO-TASK</span>
                <p class="hm-quick-type">Micro-Task</p>
                <h3 class="hm-quick-title">${esc(mob.microTitle)}</h3>
                <p class="hm-quick-sub">${esc(mob.microCourse)}</p>
              </div>
              <div>
                <div class="hm-micro-bar-track">
                  <div class="hm-micro-bar-fill" style="width:${mob.microPct}%"></div>
                </div>
                <div class="hm-quick-foot">
                  <span class="hm-quick-dur"><i data-lucide="clock" class="w-3 h-3"></i> ${esc(mob.microDuration)}</span>
                  <span class="hm-quick-pct">${mob.microPct}% done</span>
                </div>
              </div>
            </a>

            <a href="/quiz" class="hm-quick-card">
              <div>
                <span class="hm-quick-tag hm-quick-tag--peer">PEER PRACTICE</span>
                <p class="hm-quick-type">StudyPod</p>
                <h3 class="hm-quick-title">${esc(mob.studyTopic)}</h3>
                <p class="hm-quick-sub">Peer Match</p>
              </div>
              <div class="hm-quick-foot">
                <span class="hm-quick-dur"><i data-lucide="clock" class="w-3 h-3"></i> 10 min</span>
              </div>
            </a>
          </div>
        </section>

        ${mob.signals.length ? `
          <section class="hm-section-block" aria-label="Market Signals">
            <div class="hm-section-head-row">
              <p class="hm-kicker">MARKET SIGNALS</p>
              <i data-lucide="trending-up" class="w-4 h-4 text-[#78716C]"></i>
            </div>
            <div class="hm-signals-list">
              ${mob.signals.map((s) => `
                <span class="hm-signal-pill ${s.priority ? 'is-priority' : ''}">
                  <span aria-hidden="true">${s.priority ? '🔥' : '📝'}</span>
                  <span>${esc(s.name)}</span>
                </span>
              `).join('')}
            </div>
          </section>
        ` : ''}
      </div>
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
