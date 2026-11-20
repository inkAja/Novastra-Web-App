(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PAGE_SIZE = 6;

  const state = {
    field: 'all',
    sort: 'popular',
    page: 1,
    bootcampOpen: false,
    courses: [],
    enrollments: new Map(),
    notice: ''
  };

  function getCourseId(c) {
    return c.id ?? c.courseId;
  }

  function getCourseCategory(c) {
    return c.typeCourse || c.field || '';
  }

  function getFiltered() {
    let list = state.courses.filter((c) => state.field === 'all' || getCourseCategory(c) === state.field || c.field === state.field);
    if (state.sort === 'popular') list = [...list].sort((a, b) => (b.students ?? 0) - (a.students ?? 0));
    else if (state.sort === 'rating') list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (state.sort === 'newest') list = [...list].reverse();
    return list;
  }

  function render() {
    const main = document.getElementById('main-content');
    if (!main) return;
    const D = window.NOVASTRA_DATA || {};
    const fieldMeta = D.FIELD_META || {};
    const bootcamps = D.BOOTCAMPS || [];
    const session = window.getSession?.();

    const categories = Array.from(new Set(state.courses.map(getCourseCategory).filter(Boolean)));
    const filtered = getFiltered();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);
    const slice = filtered.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    main.innerHTML = `
      ${state.notice ? `<div class="p-3.5 rounded-2xl bg-[#F0F3EF] border border-[#8A9A86]/50 text-xs font-bold text-[#5E7C6B]">${esc(state.notice)}</div>` : ''}

      <section class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-black text-[#2C2A27]">Learning Hub</h1>
          <p class="text-sm text-[#6B6560] mt-1">Eksplorasi ${state.courses.length} kursus terkurasi lintas jalur karier.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2.5">
          <button type="button" id="btn-open-bootcamp" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E8E2DA] hover:border-[#D97757] text-xs font-extrabold text-[#2C2A27] cursor-pointer">
            <i data-lucide="calendar" class="w-4 h-4 text-[#D97757]"></i> Bootcamp Cohort
          </button>
          <a href="/quiz" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D97757] hover:opacity-95 text-xs font-extrabold text-white">
            <i data-lucide="users" class="w-4 h-4"></i> Peer Practice
          </a>
        </div>
      </section>

      <section class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button type="button" data-cat="all" class="px-4 py-2 rounded-full text-xs font-extrabold shrink-0 border transition-colors cursor-pointer ${state.field === 'all' ? 'bg-[#D97757] text-white border-[#D97757]' : 'bg-white text-[#6B6560] border-[#E8E2DA] hover:border-[#D97757]'}">All Fields</button>
          ${categories.map((cat) => {
            const label = fieldMeta[cat]?.label || cat;
            return `
              <button type="button" data-cat="${esc(cat)}" class="px-4 py-2 rounded-full text-xs font-extrabold shrink-0 border transition-colors cursor-pointer ${state.field === cat ? 'bg-[#D97757] text-white border-[#D97757]' : 'bg-white text-[#6B6560] border-[#E8E2DA] hover:border-[#D97757]'}">${esc(label)}</button>
            `;
          }).join('')}
        </div>

        <select id="courses-sort" aria-label="Urutkan kursus" class="px-3.5 py-2 rounded-xl bg-white border border-[#E8E2DA] text-xs font-bold text-[#2C2A27] focus:outline-none focus:border-[#D97757] shrink-0">
          <option value="popular" ${state.sort === 'popular' ? 'selected' : ''}>Sort: Popular</option>
          <option value="rating" ${state.sort === 'rating' ? 'selected' : ''}>Sort: Highest Rated</option>
          <option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Sort: Newest</option>
        </select>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${slice.map((c) => {
          const cid = getCourseId(c);
          const fm = fieldMeta[c.field] || { label: c.typeCourse || c.field || 'Course', color: '#D97757', bg: '#FDF0EB' };
          const isEnrolled = state.enrollments.has(cid);
          const pct = Math.round(state.enrollments.get(cid) ?? 0);
          return `
            <div data-catalog-card="${esc(cid)}" data-enrolled="${isEnrolled}" class="p-5 rounded-2xl bg-white border border-[#E8E2DA] hover:border-[#D97757] transition-all flex flex-col justify-between group cursor-pointer">
              <div>
                <div class="flex items-center justify-between gap-2 mb-3">
                  <span class="px-2.5 py-1 rounded-full text-[11px] font-bold" style="background:${fm.bg};color:${fm.color}">${esc(fm.label)}</span>
                  ${isEnrolled
                    ? `<span class="px-2 py-0.5 rounded-full bg-[#F0F3EF] text-[#5E7C6B] text-[10px] font-extrabold">Terdaftar · ${pct}%</span>`
                    : (c.powVerified ? `<span class="px-2 py-0.5 rounded-full bg-[#F0F3EF] text-[#5E7C6B] text-[10px] font-extrabold">PoW Verified</span>` : '')}
                </div>
                <h3 class="text-base font-extrabold text-[#2C2A27] group-hover:text-[#D97757] leading-snug">${esc(c.title)}</h3>
                <p class="text-xs text-[#6B6560] mt-2 line-clamp-2">${esc(c.desc || c.instructorName || '')}</p>
              </div>
              <div class="mt-4 pt-3 border-t border-[#E8E2DA] space-y-2.5">
                <div class="flex items-center justify-between text-xs text-[#6B6560]">
                  <span class="font-bold">${esc(c.level || c.typeCourse || '')} · ${esc(c.duration ?? '')} mnt</span>
                  <span class="font-extrabold text-[#C4904B]">★ ${c.rating ?? 5.0}</span>
                </div>
                ${isEnrolled ? `
                  <div class="h-1.5 rounded-full bg-[#F5F0EA] overflow-hidden">
                    <div class="h-full rounded-full bg-[#D97757]" style="width:${pct}%"></div>
                  </div>
                  <a href="/course-detail?courseId=${encodeURIComponent(cid)}" class="block w-full text-center py-2 rounded-xl bg-[#F0F3EF] text-[#5E7C6B] text-xs font-extrabold">Lanjut Belajar →</a>
                ` : `
                  <button type="button" data-enroll-btn="${esc(cid)}" class="w-full py-2 rounded-xl bg-[#D97757] hover:opacity-95 text-white text-xs font-extrabold cursor-pointer">Ikuti Kursus</button>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </section>

      <section class="flex items-center justify-between pt-2">
        <button type="button" id="pg-prev" ${state.page <= 1 ? 'disabled' : ''} class="px-4 py-2 rounded-xl bg-white border border-[#E8E2DA] text-xs font-extrabold disabled:opacity-45 hover:border-[#D97757] cursor-pointer">← Prev</button>
        <span class="text-xs font-extrabold text-[#6B6560] font-mono">${state.page} / ${totalPages}</span>
        <button type="button" id="pg-next" ${state.page >= totalPages ? 'disabled' : ''} class="px-4 py-2 rounded-xl bg-white border border-[#E8E2DA] text-xs font-extrabold disabled:opacity-45 hover:border-[#D97757] cursor-pointer">Next →</button>
      </section>

      ${state.bootcampOpen ? `
        <div id="bootcamp-modal" class="fixed inset-0 z-50 bg-[#2C2A27]/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="w-full max-w-2xl bg-[#FDFBF7] border border-[#E8E2DA] rounded-3xl p-6 shadow-xl animate-slide-up">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-black text-[#2C2A27]">Bootcamp Cohort Aktif</h2>
              <button type="button" id="btn-close-bootcamp" class="p-1.5 rounded-lg text-[#6B6560] hover:bg-[#F5F0EA] cursor-pointer">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
            <div class="space-y-3 max-h-[60vh] overflow-y-auto">
              ${bootcamps.map((b) => {
                const fm = fieldMeta[b.field] || { label: b.field, color: '#D97757', bg: '#FDF0EB' };
                return `
                  <div class="p-4 rounded-2xl bg-white border border-[#E8E2DA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span class="px-2 py-0.5 rounded-full text-[11px] font-bold" style="background:${fm.bg};color:${fm.color}">${esc(fm.label)}</span>
                      <p class="text-sm font-extrabold text-[#2C2A27] mt-1">${esc(b.title)}</p>
                      <p class="text-xs text-[#6B6560]">Mulai ${esc(b.startDate)} · ${esc(b.duration)} · Mentor ${esc(b.mentor)}</p>
                    </div>
                    <a href="/course-detail?courseId=CRS14" class="px-3.5 py-2 rounded-xl bg-[#D97757] text-white text-xs font-extrabold shrink-0 text-center">Sisa ${b.seatsLeft} Kursi</a>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      ` : ''}
    `;

    const enrollFromCatalog = async (courseId, btn) => {
      if (!session || session.isGuest) {
        window.location.href = `/course-detail?courseId=${encodeURIComponent(courseId)}`;
        return;
      }
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Mendaftarkan...';
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
        state.enrollments.set(courseId, Number(data.progressPercentage ?? 0));
        state.notice = `Course "${data.title || courseId}" berhasil ditambahkan ke Kursus Saya.`;
      } catch (err) {
        state.notice = `Gagal mengikuti course: ${err.message}`;
      }
      render();
    };

    main.querySelectorAll('[data-catalog-card]').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) return;
        const cid = card.dataset.catalogCard;
        if (card.dataset.enrolled === 'true') {
          window.location.href = `/course-detail?courseId=${encodeURIComponent(cid)}`;
        } else {
          enrollFromCatalog(cid, card.querySelector('[data-enroll-btn]'));
        }
      });
    });

    main.querySelectorAll('[data-enroll-btn]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        enrollFromCatalog(btn.dataset.enrollBtn, btn);
      });
    });

    document.querySelectorAll('[data-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.field = btn.dataset.cat;
        state.page = 1;
        render();
      });
    });

    document.getElementById('courses-sort')?.addEventListener('change', (e) => {
      state.sort = e.target.value;
      state.page = 1;
      render();
    });

    document.getElementById('pg-prev')?.addEventListener('click', () => {
      if (state.page > 1) { state.page -= 1; render(); }
    });
    document.getElementById('pg-next')?.addEventListener('click', () => {
      if (state.page < totalPages) { state.page += 1; render(); }
    });

    document.getElementById('btn-open-bootcamp')?.addEventListener('click', () => {
      state.bootcampOpen = true;
      render();
    });
    document.getElementById('btn-close-bootcamp')?.addEventListener('click', () => {
      state.bootcampOpen = false;
      render();
    });

    if (window.lucide) window.lucide.createIcons();
  }

  async function init() {
    const session = window.requireAuth?.({ requireOnboarded: true });
    if (!session) return;
    const params = new URLSearchParams(window.location.search);
    const qField = params.get('field');
    const D = window.NOVASTRA_DATA || {};
    if (qField) state.field = qField;
    state.courses = await (window.apiFetch ? window.apiFetch('/api/courses', D.COURSES || []) : Promise.resolve(D.COURSES || []));

    if (!session.isGuest && session.userId) {
      const enrolled = await (window.apiFetch ? window.apiFetch(`/api/enrollments/user/${encodeURIComponent(session.userId)}`, []) : Promise.resolve([]));
      if (Array.isArray(enrolled)) {
        state.enrollments = new Map(enrolled.map((e) => [e.courseId, Number(e.progressPercentage ?? 0)]));
      }
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
