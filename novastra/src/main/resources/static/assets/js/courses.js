(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PAGE_SIZE = 6;

  const state = {
    field: 'all',
    sort: 'popular',
    page: 1,
    bootcampOpen: false,
    courses: []
  };

  function getFiltered() {
    let list = state.courses.filter((c) => state.field === 'all' || c.field === state.field);
    if (state.sort === 'popular') list = [...list].sort((a, b) => b.students - a.students);
    else if (state.sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    else if (state.sort === 'newest') list = [...list].reverse();
    return list;
  }

  function render() {
    const main = document.getElementById('main-content');
    if (!main) return;
    const D = window.NOVASTRA_DATA || {};
    const fieldMeta = D.FIELD_META || {};
    const bootcamps = D.BOOTCAMPS || [];

    const filtered = getFiltered();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);
    const slice = filtered.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    main.innerHTML = `
      <section class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-black text-[#2C2A27]">Learning Hub</h1>
          <p class="text-sm text-[#6B6560] mt-1">Eksplorasi ${state.courses.length} kursus terkurasi lintas 7 bidang keahlian.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2.5">
          <button type="button" id="btn-open-bootcamp" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E8E2DA] hover:border-[#D97757] text-xs font-extrabold text-[#2C2A27] cursor-pointer">
            <i data-lucide="calendar" class="w-4 h-4 text-[#D97757]"></i> Bootcamp Cohort
          </button>
          <a href="/quiz?tab=roleplay" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D97757] hover:opacity-95 text-xs font-extrabold text-white">
            <i data-lucide="bot" class="w-4 h-4"></i> AI Roleplay
          </a>
        </div>
      </section>

      <section class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button type="button" data-cat="all" class="px-4 py-2 rounded-full text-xs font-extrabold shrink-0 border transition-colors cursor-pointer ${state.field === 'all' ? 'bg-[#D97757] text-white border-[#D97757]' : 'bg-white text-[#6B6560] border-[#E8E2DA] hover:border-[#D97757]'}">All Fields</button>
          ${Object.entries(fieldMeta).map(([k, fm]) => `
            <button type="button" data-cat="${esc(k)}" class="px-4 py-2 rounded-full text-xs font-extrabold shrink-0 border transition-colors cursor-pointer ${state.field === k ? 'bg-[#D97757] text-white border-[#D97757]' : 'bg-white text-[#6B6560] border-[#E8E2DA] hover:border-[#D97757]'}">${esc(fm.label)}</button>
          `).join('')}
        </div>

        <select id="courses-sort" aria-label="Urutkan kursus" class="px-3.5 py-2 rounded-xl bg-white border border-[#E8E2DA] text-xs font-bold text-[#2C2A27] focus:outline-none focus:border-[#D97757] shrink-0">
          <option value="popular" ${state.sort === 'popular' ? 'selected' : ''}>Sort: Popular</option>
          <option value="rating" ${state.sort === 'rating' ? 'selected' : ''}>Sort: Highest Rated</option>
          <option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Sort: Newest</option>
        </select>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${slice.map((c) => {
          const fm = fieldMeta[c.field] || { label: c.field, color: '#D97757', bg: '#FDF0EB' };
          return `
            <a href="/course-detail?id=${encodeURIComponent(c.id)}" class="p-5 rounded-2xl bg-white border border-[#E8E2DA] hover:border-[#D97757] transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-center justify-between gap-2 mb-3">
                  <span class="px-2.5 py-1 rounded-full text-[11px] font-bold" style="background:${fm.bg};color:${fm.color}">${esc(fm.label)}</span>
                  ${c.powVerified ? `<span class="px-2 py-0.5 rounded-full bg-[#F0F3EF] text-[#5E7C6B] text-[10px] font-extrabold">PoW Verified</span>` : ''}
                </div>
                <h3 class="text-base font-extrabold text-[#2C2A27] group-hover:text-[#D97757] leading-snug">${esc(c.title)}</h3>
                <p class="text-xs text-[#6B6560] mt-2 line-clamp-2">${esc(c.desc)}</p>
              </div>
              <div class="mt-4 pt-3 border-t border-[#E8E2DA] flex items-center justify-between text-xs text-[#6B6560]">
                <span class="font-bold">${esc(c.level)} · ${esc(c.duration)}</span>
                <span class="font-extrabold text-[#C4904B]">★ ${c.rating} (${c.students.toLocaleString('id-ID')})</span>
              </div>
            </a>
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
                    <a href="/course-detail?id=c-be-1" class="px-3.5 py-2 rounded-xl bg-[#D97757] text-white text-xs font-extrabold shrink-0 text-center">Sisa ${b.seatsLeft} Kursi</a>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      ` : ''}
    `;

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
    const params = new URLSearchParams(window.location.search);
    const qField = params.get('field');
    const D = window.NOVASTRA_DATA || {};
    if (qField && D.FIELD_META?.[qField]) state.field = qField;
    state.courses = await (window.apiFetch ? window.apiFetch('/api/courses', D.COURSES || []) : Promise.resolve(D.COURSES || []));
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
