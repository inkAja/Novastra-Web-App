(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const DEFAULT_CATEGORIES = ['Web Programming', 'Data & AI', 'UI/UX', 'Marketing', 'Business', 'Soft Skills'];

  const CATEGORY_STYLE = {
    'Web Programming': { theme: 'web', icon: 'code' },
    'Data & AI': { theme: 'data', icon: 'cpu' },
    'UI/UX': { theme: 'uiux', icon: 'palette' },
    'Marketing': { theme: 'marketing', icon: 'megaphone' },
    'Business': { theme: 'business', icon: 'briefcase' },
    'Soft Skills': { theme: 'soft', icon: 'sparkles' }
  };

  const state = {
    loading: true,
    activeCategory: 'All',
    sortBy: 'recommended',
    searchQuery: '',
    roleName: null,
    activeSkillGapsCount: 0,
    totalModules: 0,
    totalAssessments: 0,
    studyPodTopicsCount: 5,
    courses: []
  };

  function normalizeCategory(course) {
    const text = `${course.typeCourse || ''} ${course.field || ''} ${course.title || ''}`.toLowerCase();
    if (/ui\/ux|\bux\b|designer|figma|usability/.test(text)) return 'UI/UX';
    if (/data|analyst|scientist|\bai\b|machine learning|neural|rag|pandas|sql analytics/.test(text)) return 'Data & AI';
    if (/full-stack|backend|frontend|web|software|\bjava\b|typescript|pwa/.test(text)) return 'Web Programming';
    if (/marketing|seo|funnel|ads|growth/.test(text)) return 'Marketing';
    if (/business|product|strategy/.test(text)) return 'Business';
    if (/soft|communication|pitch|leadership/.test(text)) return 'Soft Skills';
    return course.typeCourse || 'Web Programming';
  }

  function parseCourseLevel(rawTitle) {
    const title = String(rawTitle || '').trim();
    const match = /^\[(Beginner|Intermediate|Advanced)\]\s*(.+)$/i.exec(title);
    if (match) {
      const level = match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
      return {
        displayTitle: match[2].trim(),
        level,
        rank: level === 'Beginner' ? 1 : (level === 'Intermediate' ? 2 : 3)
      };
    }
    const lower = title.toLowerCase();
    if (/advanced|distributed|production|scaling|optimization/.test(lower)) {
      return { displayTitle: title, level: 'Advanced', rank: 3 };
    }
    if (/intermediate|spring boot|neural|performance|research/.test(lower)) {
      return { displayTitle: title, level: 'Intermediate', rank: 2 };
    }
    return { displayTitle: title, level: 'Beginner', rank: 1 };
  }

  function formatDuration(minutes) {
    const mins = Number(minutes || 0);
    if (mins >= 60) {
      const hrs = Math.round((mins / 60) * 10) / 10;
      return `${hrs}j`;
    }
    return `${mins}m`;
  }

  function buildThumbArt(theme) {
    if (theme === 'marketing') {
      return `<svg class="ln-thumb-art" viewBox="0 0 320 150" preserveAspectRatio="none"><circle cx="265" cy="34" r="56" fill="#fff"/><circle cx="70" cy="130" r="70" fill="#fff"/><path d="M24 38h130M24 58h96" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>`;
    }
    if (theme === 'data') {
      return `<svg class="ln-thumb-art" viewBox="0 0 320 150" preserveAspectRatio="none"><rect x="34" y="88" width="22" height="44" rx="4" fill="#fff"/><rect x="70" y="64" width="22" height="68" rx="4" fill="#fff"/><rect x="106" y="42" width="22" height="90" rx="4" fill="#fff"/><circle cx="240" cy="48" r="46" stroke="#fff" stroke-width="5" fill="none"/></svg>`;
    }
    if (theme === 'uiux') {
      return `<svg class="ln-thumb-art" viewBox="0 0 320 150" preserveAspectRatio="none"><rect x="200" y="22" width="90" height="72" rx="14" stroke="#fff" stroke-width="5" fill="none"/><circle cx="90" cy="54" r="34" fill="#fff"/></svg>`;
    }
    return `<svg class="ln-thumb-art" viewBox="0 0 320 150" preserveAspectRatio="none"><path d="M40 46l-22 24 22 24M110 46l22 24-22 24M84 40l-18 60" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="255" cy="110" r="64" fill="#fff"/></svg>`;
  }

  function enrichCourse(raw) {
    const category = normalizeCategory(raw);
    const { displayTitle, level, rank } = parseCourseLevel(raw.title);
    const catStyle = CATEGORY_STYLE[category] || CATEGORY_STYLE['Web Programming'];
    const recommendedByRole = Boolean(
      raw.isRecommended
      || (state.roleName && String(raw.typeCourse || '').toLowerCase() === state.roleName.toLowerCase())
    );
    return {
      courseId: raw.courseId || raw.id,
      rawTitle: raw.title || displayTitle,
      displayTitle,
      category,
      theme: catStyle.theme,
      icon: catStyle.icon,
      typeCourse: raw.typeCourse || raw.field || category,
      instructorName: raw.instructorName || raw.instructor || 'Mentor Novastra',
      duration: Number(raw.duration || 300),
      moduleCount: Number(raw.moduleCount ?? raw.lessons ?? 3),
      level,
      levelRank: rank,
      isRecommended: recommendedByRole,
      isEnrolled: Boolean(raw.isEnrolled),
      progressPercentage: Number(raw.progressPercentage || 0)
    };
  }

  function getVisibleCourses() {
    const q = state.searchQuery.trim().toLowerCase();
    const enriched = state.courses.map(enrichCourse);
    const filtered = enriched.filter((c) => {
      if (state.activeCategory !== 'All' && c.category !== state.activeCategory) return false;
      if (!q) return true;
      const hay = `${c.rawTitle} ${c.displayTitle} ${c.category} ${c.typeCourse} ${c.instructorName} ${c.level}`.toLowerCase();
      return hay.includes(q);
    });

    const sorted = [...filtered];
    if (state.sortBy === 'level-asc') {
      sorted.sort((a, b) => a.levelRank - b.levelRank || a.displayTitle.localeCompare(b.displayTitle));
    } else if (state.sortBy === 'level-desc') {
      sorted.sort((a, b) => b.levelRank - a.levelRank || a.displayTitle.localeCompare(b.displayTitle));
    } else if (state.sortBy === 'title-asc') {
      sorted.sort((a, b) => a.displayTitle.localeCompare(b.displayTitle));
    } else {
      sorted.sort((a, b) =>
        Number(b.isRecommended) - Number(a.isRecommended)
        || Number(b.isEnrolled) - Number(a.isEnrolled)
        || a.levelRank - b.levelRank
        || String(a.courseId).localeCompare(String(b.courseId))
      );
    }
    return sorted;
  }

  function getCategoryPills() {
    const present = Array.from(new Set(state.courses.map((c) => normalizeCategory(c))));
    const ordered = DEFAULT_CATEGORIES.filter((cat) => DEFAULT_CATEGORIES.includes(cat) || present.includes(cat));
    present.forEach((cat) => {
      if (!ordered.includes(cat)) ordered.push(cat);
    });
    return ['All', ...ordered];
  }

  function syncTopbarSearch() {
    const topInput = document.getElementById('nv-learn-search');
    if (topInput && topInput.value !== state.searchQuery) {
      topInput.value = state.searchQuery;
    }
  }

  function renderWorkspaceBody() {
    const host = document.getElementById('ln-workspace-body');
    if (!host) return;

    const visibleCourses = getVisibleCourses();
    const pills = getCategoryPills();
    const gapText = state.activeSkillGapsCount === 1
      ? '1 active skill gap to close'
      : `${state.activeSkillGapsCount} active skill gaps to close`;

    const subtitleEl = document.getElementById('ln-subtitle');
    if (subtitleEl) {
      subtitleEl.textContent = state.roleName ? `${gapText} · ${state.roleName}` : gapText;
    }

    host.innerHTML = `
      <div class="ln-pills-row" role="tablist" aria-label="Filter kategori course">
        ${pills.map((cat) => {
          const active = state.activeCategory === cat;
          return `<button type="button" data-ln-cat="${esc(cat)}" class="ln-pill ${active ? 'is-active' : ''}">${esc(cat)}</button>`;
        }).join('')}
      </div>

      <div class="ln-sort-bar">
        <div class="ln-sort-box">
          <i data-lucide="arrow-up-down" class="w-3.5 h-3.5 text-[#78716C]"></i>
          <select id="ln-sort" aria-label="Urutkan course">
            <option value="recommended" ${state.sortBy === 'recommended' ? 'selected' : ''}>Sort: Recommended</option>
            <option value="level-asc" ${state.sortBy === 'level-asc' ? 'selected' : ''}>Sort: Beginner ke Advanced</option>
            <option value="level-desc" ${state.sortBy === 'level-desc' ? 'selected' : ''}>Sort: Advanced ke Beginner</option>
            <option value="title-asc" ${state.sortBy === 'title-asc' ? 'selected' : ''}>Sort: Judul A–Z</option>
          </select>
        </div>
      </div>

      <section class="ln-quick-grid" aria-label="Pintasan cepat belajar">
        <button type="button" id="ln-quick-videos" class="ln-quick-card">
          <div class="ln-quick-left">
            <span class="ln-quick-icon"><i data-lucide="video" class="w-5 h-5"></i></span>
            <div class="min-w-0">
              <p class="ln-quick-title">Video Library</p>
              <p class="ln-quick-sub">${state.totalModules} modules</p>
            </div>
          </div>
          <i data-lucide="chevron-right" class="w-4 h-4 text-[#A89F98] shrink-0"></i>
        </button>

        <a href="/career#pow-arena" class="ln-quick-card">
          <div class="ln-quick-left">
            <span class="ln-quick-icon"><i data-lucide="check-circle-2" class="w-5 h-5"></i></span>
            <div class="min-w-0">
              <p class="ln-quick-title">Assessments</p>
              <p class="ln-quick-sub">${state.totalAssessments} tasks</p>
            </div>
          </div>
          <i data-lucide="chevron-right" class="w-4 h-4 text-[#A89F98] shrink-0"></i>
        </a>

        <a href="/quiz" class="ln-quick-card">
          <div class="ln-quick-left">
            <span class="ln-quick-icon"><i data-lucide="users" class="w-5 h-5"></i></span>
            <div class="min-w-0">
              <p class="ln-quick-title">StudyPod</p>
              <p class="ln-quick-sub">Live Peer Practice · ${state.studyPodTopicsCount} topik</p>
            </div>
          </div>
          <i data-lucide="chevron-right" class="w-4 h-4 text-[#A89F98] shrink-0"></i>
        </a>
      </section>

      <section id="ln-catalog-section" class="space-y-4 scroll-mt-24">
        <div class="ln-catalog-head">
          <h2 class="ln-catalog-label">ALL COURSES (${visibleCourses.length})</h2>
        </div>

        ${state.loading ? `
          <div class="p-8 rounded-2xl bg-white border border-[#EAE3DD] text-center text-sm font-bold text-[#78716C]">
            Memuat katalog course...
          </div>
        ` : visibleCourses.length ? `
          <div class="ln-courses-grid">
            ${visibleCourses.map((c) => {
              const badgeHtml = c.isEnrolled
                ? `<span class="ln-status-badge ln-status-badge--active">${c.progressPercentage >= 100 ? 'SELESAI' : `${c.progressPercentage}% AKTIF`}</span>`
                : (c.isRecommended
                  ? `<span class="ln-status-badge ln-status-badge--top">TOP</span>`
                  : `<span class="ln-status-badge ln-status-badge--new">NEW</span>`);
              const lvlClass = c.level === 'Advanced'
                ? 'ln-lvl--advanced'
                : (c.level === 'Intermediate' ? 'ln-lvl--intermediate' : 'ln-lvl--beginner');
              return `
                <a href="/course-detail?courseId=${encodeURIComponent(c.courseId)}" class="ln-card">
                  <div class="ln-thumb ln-thumb--${esc(c.theme)}">
                    ${buildThumbArt(c.theme)}
                    <div class="ln-thumb-top">${badgeHtml}</div>
                    <div class="ln-thumb-bottom">
                      <span class="ln-cat-pill">
                        <i data-lucide="${esc(c.icon)}" class="w-3.5 h-3.5"></i>
                        <span>${esc(c.category)}</span>
                      </span>
                    </div>
                  </div>
                  <div class="ln-card-body">
                    <div>
                      <h3 class="ln-card-title">${esc(c.displayTitle)}</h3>
                      <p class="ln-card-sub">${esc(c.typeCourse)} · ${esc(c.instructorName)}</p>
                    </div>
                    <div class="ln-card-foot">
                      <span class="ln-meta">
                        <i data-lucide="clock" class="w-3.5 h-3.5 text-[#A89F98]"></i>
                        <span>${esc(formatDuration(c.duration))} · ${c.moduleCount} modul</span>
                      </span>
                      <span class="ln-lvl ${lvlClass}">${esc(c.level)}</span>
                    </div>
                  </div>
                </a>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="ln-empty">
            <i data-lucide="search-x" class="w-8 h-8 text-[#D96B43]"></i>
            <p class="text-sm font-extrabold text-[#2C2A27]">Tidak ada course yang cocok dengan filter atau pencarian saat ini.</p>
            <button type="button" id="ln-reset-filter" class="ln-reset-btn">Reset Filter</button>
          </div>
        `}
      </section>
    `;

    host.querySelectorAll('[data-ln-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeCategory = btn.dataset.lnCat;
        renderWorkspaceBody();
      });
    });

    document.getElementById('ln-sort')?.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderWorkspaceBody();
    });

    document.getElementById('ln-quick-videos')?.addEventListener('click', () => {
      document.getElementById('ln-catalog-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('ln-reset-filter')?.addEventListener('click', () => {
      state.activeCategory = 'All';
      state.searchQuery = '';
      state.sortBy = 'recommended';
      const mobileInput = document.getElementById('ln-mobile-search-input');
      if (mobileInput) mobileInput.value = '';
      syncTopbarSearch();
      renderWorkspaceBody();
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function mountShell() {
    const main = document.getElementById('main-content');
    if (!main) return;
    main.innerHTML = `
      <div class="ln-wrap">
        <section class="ln-header">
          <div>
            <h1 class="ln-title">Learn</h1>
            <p id="ln-subtitle" class="ln-subtitle">Memuat skill gap aktif...</p>
          </div>
          <label class="ln-mobile-search">
            <i data-lucide="search" class="w-4 h-4 text-[#A89F98] shrink-0"></i>
            <input id="ln-mobile-search-input" type="search" placeholder="Search courses, skills..." autocomplete="off" />
          </label>
        </section>
        <div id="ln-workspace-body" class="space-y-6"></div>
      </div>
    `;

    document.getElementById('ln-mobile-search-input')?.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      syncTopbarSearch();
      renderWorkspaceBody();
    });

    window.addEventListener('nv:learn-search', (e) => {
      state.searchQuery = e.detail?.query ?? '';
      const mobileInput = document.getElementById('ln-mobile-search-input');
      if (mobileInput && mobileInput.value !== state.searchQuery) {
        mobileInput.value = state.searchQuery;
      }
      renderWorkspaceBody();
    });

    renderWorkspaceBody();
  }

  async function init() {
    const session = window.requireAuth?.({ requireOnboarded: true });
    if (!session) return;

    const params = new URLSearchParams(window.location.search);
    const qField = params.get('field');
    if (qField) {
      state.activeCategory = normalizeCategory({ typeCourse: qField, field: qField });
    }

    mountShell();

    const D = window.NOVASTRA_DATA || {};
    const uidParam = !session.isGuest && session.userId ? `?userId=${encodeURIComponent(session.userId)}` : '';
    try {
      const res = await fetch(`/api/courses/workspace${uidParam}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ws = await res.json();
      state.roleName = ws.roleName || session.roleName || null;
      state.activeSkillGapsCount = Number(ws.activeSkillGapsCount ?? 0);
      state.totalModules = Number(ws.totalModules ?? 0);
      state.totalAssessments = Number(ws.totalAssessments ?? 0);
      state.studyPodTopicsCount = Number(ws.studyPodTopicsCount ?? 5);
      state.courses = Array.isArray(ws.courses) ? ws.courses : (D.COURSES || []);
    } catch {
      const rawCourses = await (window.apiFetch ? window.apiFetch('/api/courses', D.COURSES || []) : Promise.resolve(D.COURSES || []));
      state.roleName = session.roleName || null;
      state.courses = Array.isArray(rawCourses) ? rawCourses : (D.COURSES || []);
      state.totalModules = state.courses.length * 3;
      state.totalAssessments = state.courses.length * 2;
    } finally {
      state.loading = false;
      renderWorkspaceBody();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
