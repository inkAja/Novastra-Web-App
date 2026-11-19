(() => {
  const NAV_ITEMS = [
    { key: 'home', href: '/home', label: 'Home', icon: 'layout-dashboard' },
    { key: 'courses', href: '/courses', label: 'Courses', icon: 'book-open' },
    { key: 'quiz', href: '/quiz', label: 'Blind Test', icon: 'shield-check' },
    { key: 'career', href: '/career', label: 'Career', icon: 'compass' },
    { key: 'profile', href: '/profile', label: 'Profile', icon: 'user' }
  ];

  const PAGE_LABELS = {
    home: 'Home',
    courses: 'Courses',
    'course-detail': 'Course Detail',
    quiz: 'Blind Test',
    career: 'Career & Peers',
    profile: 'Profile'
  };

  const NOTIFICATIONS = [
    { id: 'n1', title: 'Blind Test Backend Siap', desc: 'Raih badge Verified Backend Builder dengan skor >= 75%.', time: '10 mnt lalu', unread: true },
    { id: 'n2', title: 'Streak Belajar 12 Hari', desc: 'Selesaikan 1 lesson hari ini untuk menjaga streak.', time: '2 jam lalu', unread: true },
    { id: 'n3', title: 'Peer Match Tersedia', desc: '18 peers aktif di topik System Design & Arsitektur API.', time: 'Kemarin', unread: false }
  ];

  const esc = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  function parseMinutes(durationStr) {
    const h = /(\d+)\s*j/i.exec(durationStr || '');
    const m = /(\d+)\s*m/i.exec(durationStr || '');
    return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
  }

  function injectStyles() {
    if (document.getElementById('nv-shell-styles')) return;
    const style = document.createElement('style');
    style.id = 'nv-shell-styles';
    style.textContent = `
      .nv-sidebar, .nv-topbar { display: none; }
      .nv-mobile-header { display: flex; position: sticky; top: 0; height: 60px; z-index: 30; background: #FAF8F5; border-bottom: 1px solid #EAE4DC; }
      .nv-bottom-nav { display: grid; grid-template-columns: repeat(5, 1fr); position: fixed; left: 0; right: 0; bottom: 0; height: 64px; z-index: 30; background: #FAF8F5; border-top: 1px solid #EAE4DC; }
      .nv-main-shell { margin-left: 0; padding-bottom: 84px; }
      @media (min-width: 900px) {
        .nv-sidebar { display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; width: 260px; background: #FAF8F5; border-right: 1px solid #EAE4DC; z-index: 30; }
        .nv-topbar { display: flex; align-items: center; justify-content: space-between; margin-left: 260px; height: 72px; padding: 0 28px; position: sticky; top: 0; z-index: 25; background: rgba(253, 251, 247, 0.92); backdrop-filter: blur(8px); border-bottom: 1px solid #EAE4DC; }
        .nv-mobile-header, .nv-bottom-nav { display: none !important; }
        .nv-main-shell { margin-left: 260px; padding-bottom: 32px; }
      }
    `;
    document.head.appendChild(style);
  }

  function buildBreadcrumb(pageKey, options = {}) {
    const activeSection = PAGE_LABELS[pageKey] || 'Home';
    const parts = [{ label: 'Novastra', href: '/home' }];
    if (pageKey === 'course-detail') {
      parts.push({ label: 'Courses', href: '/courses' });
      const id = options.courseId || new URLSearchParams(window.location.search).get('id');
      const course = (window.NOVASTRA_DATA?.COURSES || []).find((c) => c.id === id);
      parts.push({ label: options.breadcrumb || course?.title || 'Course Detail' });
    } else {
      parts.push({ label: options.breadcrumb || activeSection });
    }
    return parts.map((p, idx) => {
      const isLast = idx === parts.length - 1;
      const item = p.href && !isLast
        ? `<a href="${p.href}" class="text-[#6B6560] hover:text-[#D97757] transition-colors">${esc(p.label)}</a>`
        : `<span class="${isLast ? 'font-bold text-[#2C2A27] truncate max-w-[260px]' : 'text-[#6B6560]'}">${esc(p.label)}</span>`;
      return idx > 0 ? `<i data-lucide="chevron-right" class="w-4 h-4 text-[#A89F98] shrink-0"></i>${item}` : item;
    }).join('');
  }

  function renderNotificationsMarkup() {
    return NOTIFICATIONS.map((n) => `
      <div class="p-3 rounded-xl border ${n.unread ? 'bg-[#FDF0EB]/55 border-[#F2A68D]/60' : 'bg-[#FAF8F5] border-[#E8E2DA]'}">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold text-[#2C2A27]">${esc(n.title)}</p>
          <span class="text-[11px] text-[#A89F98]">${esc(n.time)}</span>
        </div>
        <p class="text-xs text-[#6B6560] mt-1 leading-relaxed">${esc(n.desc)}</p>
      </div>
    `).join('');
  }

  function renderSearchModal() {
    const fieldMeta = window.NOVASTRA_DATA?.FIELD_META || {};
    const fieldOptions = Object.entries(fieldMeta)
      .map(([k, v]) => `<option value="${esc(k)}">${esc(v.label)}</option>`)
      .join('');

    return `
      <div id="nv-search-modal" class="fixed inset-0 z-50 hidden bg-[#2C2A27]/45 backdrop-blur-sm p-4 md:p-8 flex items-start justify-center overflow-y-auto" role="dialog" aria-modal="true" aria-label="Cari Kursus Novastra">
        <div class="w-full max-w-3xl bg-[#FDFBF7] border border-[#E8E2DA] rounded-2xl shadow-2xl overflow-hidden animate-slide-up mt-4 md:mt-10">
          <div class="p-4 md:p-5 border-b border-[#E8E2DA] bg-[#FFFFFF] flex items-center gap-3">
            <i data-lucide="search" class="w-5 h-5 text-[#D97757] shrink-0"></i>
            <input id="nv-search-input" type="text" placeholder="Cari kursus, instruktur, atau tag skill..." class="w-full bg-transparent text-sm md:text-base text-[#2C2A27] placeholder-[#A89F98] focus:outline-none" />
            <button type="button" data-nv-close-search class="p-1.5 rounded-lg text-[#6B6560] hover:bg-[#F5F0EA] transition-colors" aria-label="Tutup pencarian">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <div class="px-4 md:px-5 py-3 bg-[#FAF8F5] border-b border-[#E8E2DA] grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <select id="nv-filter-field" aria-label="Filter Field" class="px-3 py-2 rounded-xl border border-[#E8E2DA] bg-white text-xs font-semibold text-[#2C2A27] focus:outline-none focus:border-[#D97757]">
              <option value="all">Semua Field</option>
              ${fieldOptions}
            </select>
            <select id="nv-filter-level" aria-label="Filter Level" class="px-3 py-2 rounded-xl border border-[#E8E2DA] bg-white text-xs font-semibold text-[#2C2A27] focus:outline-none focus:border-[#D97757]">
              <option value="all">Semua Level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <select id="nv-filter-duration" aria-label="Filter Duration" class="px-3 py-2 rounded-xl border border-[#E8E2DA] bg-white text-xs font-semibold text-[#2C2A27] focus:outline-none focus:border-[#D97757]">
              <option value="all">Semua Durasi</option>
              <option value="short">Singkat (&lt; 5 jam)</option>
              <option value="medium">Sedang (5–6 jam)</option>
              <option value="long">Mendalam (&gt; 6 jam)</option>
            </select>
          </div>
          <div id="nv-search-results" class="p-4 md:p-5 max-h-[60vh] overflow-y-auto space-y-2.5"></div>
        </div>
      </div>
    `;
  }

  function updateSearchResults() {
    const container = document.getElementById('nv-search-results');
    if (!container) return;
    const courses = window.NOVASTRA_DATA?.COURSES || [];
    const fieldMeta = window.NOVASTRA_DATA?.FIELD_META || {};
    const q = (document.getElementById('nv-search-input')?.value || '').trim().toLowerCase();
    const field = document.getElementById('nv-filter-field')?.value || 'all';
    const level = document.getElementById('nv-filter-level')?.value || 'all';
    const dur = document.getElementById('nv-filter-duration')?.value || 'all';

    const matches = courses.filter((c) => {
      if (field !== 'all' && c.field !== field) return false;
      if (level !== 'all' && c.level !== level) return false;
      if (dur !== 'all') {
        const mins = parseMinutes(c.duration);
        if (dur === 'short' && mins >= 300) return false;
        if (dur === 'medium' && (mins < 300 || mins > 360)) return false;
        if (dur === 'long' && mins <= 360) return false;
      }
      if (!q) return true;
      const hay = `${c.title} ${c.instructor} ${c.desc} ${(c.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });

    if (!matches.length) {
      container.innerHTML = `<div class="py-10 text-center text-sm text-[#6B6560]">Tidak ada kursus yang cocok dengan filter saat ini.</div>`;
      return;
    }

    container.innerHTML = matches.map((c) => {
      const meta = fieldMeta[c.field] || { label: c.field, color: '#D97757', bg: '#FDF0EB' };
      return `
        <a href="/course-detail?id=${encodeURIComponent(c.id)}" class="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-white border border-[#E8E2DA] hover:border-[#D97757] transition-all group">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span class="px-2 py-0.5 rounded-full text-[11px] font-bold" style="background:${meta.bg};color:${meta.color}">${esc(meta.label)}</span>
              <span class="text-[11px] font-semibold text-[#6B6560]">${esc(c.level)} · ${esc(c.duration)}</span>
            </div>
            <p class="text-sm font-bold text-[#2C2A27] group-hover:text-[#D97757] truncate">${esc(c.title)}</p>
            <p class="text-xs text-[#A89F98] truncate">${esc(c.instructor)} · ${c.lessons} lessons</p>
          </div>
          <i data-lucide="arrow-up-right" class="w-4 h-4 text-[#A89F98] group-hover:text-[#D97757] shrink-0"></i>
        </a>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  function openSearchModal() {
    const modal = document.getElementById('nv-search-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    updateSearchResults();
    document.getElementById('nv-search-input')?.focus();
  }

  function closeSearchModal() {
    document.getElementById('nv-search-modal')?.classList.add('hidden');
  }

  function bindEvents() {
    document.querySelectorAll('[data-nv-open-search]').forEach((btn) => {
      btn.addEventListener('click', openSearchModal);
    });
    document.querySelectorAll('[data-nv-close-search]').forEach((btn) => {
      btn.addEventListener('click', closeSearchModal);
    });

    const modal = document.getElementById('nv-search-modal');
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeSearchModal();
    });

    ['nv-search-input', 'nv-filter-field', 'nv-filter-level', 'nv-filter-duration'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(id === 'nv-search-input' ? 'input' : 'change', updateSearchResults);
    });

    const bellBtn = document.getElementById('nv-notif-btn');
    const popover = document.getElementById('nv-notif-popover');
    bellBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      popover?.classList.toggle('hidden');
    });

    if (!window.__nvShellKeyBound) {
      window.__nvShellKeyBound = true;
      document.addEventListener('click', (e) => {
        const pop = document.getElementById('nv-notif-popover');
        const btn = document.getElementById('nv-notif-btn');
        if (pop && !pop.classList.contains('hidden') && !pop.contains(e.target) && !btn?.contains(e.target)) {
          pop.classList.add('hidden');
        }
      });
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          openSearchModal();
        } else if (e.key === 'Escape') {
          closeSearchModal();
          document.getElementById('nv-notif-popover')?.classList.add('hidden');
        }
      });
    }
  }

  function renderShell(pageKey = 'home', options = {}) {
    const session = window.requireAuth ? window.requireAuth({ requireOnboarded: true }) : window.NovastraAuth?.requireAuth?.({ requireOnboarded: true });
    if (!session) return;
    injectStyles();
    ['nv-sidebar', 'nv-topbar', 'nv-mobile-header', 'nv-bottom-nav', 'nv-search-modal'].forEach((id) => {
      document.getElementById(id)?.remove();
    });

    const activeKey = pageKey === 'course-detail' ? 'courses' : pageKey;
    const streakCount = session.streakCount ?? window.NovastraStore?.getStreak?.()?.count ?? 0;
    const initials = String(session.fullName || 'NA').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || 'NA';

    const sidebarHtml = `
      <aside id="nv-sidebar" class="nv-sidebar p-5 justify-between">
        <div>
          <a href="/home" class="flex items-center gap-3 px-2 py-1.5 mb-7">
            <div class="w-9 h-9 rounded-xl bg-[#D97757] text-white flex items-center justify-center font-black text-lg shadow-sm">N</div>
            <div>
              <p class="text-base font-extrabold tracking-tight text-[#2C2A27] leading-none">Novastra</p>
              <p class="text-[11px] font-semibold text-[#A89F98] mt-1">EdTech Workspace</p>
            </div>
          </a>
          <nav class="space-y-1.5" aria-label="Navigasi Utama">
            ${NAV_ITEMS.map((item) => {
              const active = activeKey === item.key;
              return `
                <a href="${item.href}" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${active ? 'bg-[#FDF0EB] text-[#D97757] border border-[#F2A68D]/60' : 'text-[#6B6560] hover:bg-[#F5F0EA] hover:text-[#2C2A27]'}">
                  <i data-lucide="${item.icon}" class="w-4 h-4 shrink-0"></i>
                  <span>${item.label}</span>
                </a>
              `;
            }).join('')}
          </nav>
        </div>
        <div class="p-4 rounded-2xl bg-white border border-[#E8E2DA] shadow-sm">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-[#FAF3E7] text-[#C4904B] flex items-center justify-center">
                <i data-lucide="flame" class="w-4 h-4"></i>
              </div>
              <div>
                <p class="text-[11px] font-bold uppercase tracking-wider text-[#A89F98]">Streak</p>
                <p class="text-base font-black text-[#2C2A27] leading-tight" data-nv-streak>${streakCount}d</p>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-[#F0F3EF] text-[#5E7C6B] text-[11px] font-bold">Aktif</span>
          </div>
          <div class="grid grid-cols-7 gap-1 mt-3">
            ${Array.from({ length: 7 }, (_, i) => `<span class="h-1.5 rounded-full ${i < 6 ? 'bg-[#D97757]' : 'bg-[#F2A68D]/55'}"></span>`).join('')}
          </div>
        </div>
      </aside>
    `;

    const topbarHtml = `
      <header id="nv-topbar" class="nv-topbar">
        <div class="flex items-center gap-2 text-sm min-w-0">
          ${buildBreadcrumb(pageKey, options)}
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <button type="button" data-nv-open-search style="width: 360px;" class="max-w-[360px] h-10 px-4 rounded-full bg-white border border-[#E8E2DA] hover:border-[#D97757] flex items-center justify-between text-xs text-[#A89F98] transition-colors cursor-pointer">
            <span class="flex items-center gap-2 truncate">
              <i data-lucide="search" class="w-4 h-4 text-[#6B6560] shrink-0"></i>
              <span class="truncate">Cari kursus, skill, atau topik...</span>
            </span>
            <kbd class="px-2 py-0.5 rounded-md bg-[#F5F0EA] text-[#6B6560] font-mono text-[10px]">Ctrl K</kbd>
          </button>
          <div class="relative">
            <button id="nv-notif-btn" type="button" class="relative w-10 h-10 rounded-full bg-white border border-[#E8E2DA] hover:border-[#D97757] flex items-center justify-center text-[#6B6560] transition-colors cursor-pointer" aria-label="Notifikasi">
              <i data-lucide="bell" class="w-4 h-4"></i>
              <span class="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#D97757] animate-dot-pulse"></span>
            </button>
            <div id="nv-notif-popover" class="hidden absolute right-0 mt-2 w-80 p-3 rounded-2xl bg-white border border-[#E8E2DA] shadow-xl z-40 space-y-2">
              <div class="flex items-center justify-between px-1 pb-1 border-b border-[#E8E2DA]">
                <span class="text-xs font-extrabold text-[#2C2A27]">Notifikasi</span>
                <span class="text-[11px] font-bold text-[#D97757]">2 Baru</span>
              </div>
              ${renderNotificationsMarkup()}
            </div>
          </div>
          <a href="/profile" class="w-10 h-10 rounded-full bg-[#D97757] text-white font-extrabold text-xs flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity" aria-label="Profil">${esc(initials)}</a>
        </div>
      </header>
    `;

    const mobileHeaderHtml = `
      <header id="nv-mobile-header" class="nv-mobile-header px-4 items-center justify-between gap-3">
        <a href="/home" class="flex items-center gap-2.5 shrink-0">
          <div class="w-8 h-8 rounded-lg bg-[#D97757] text-white flex items-center justify-center font-black text-sm">N</div>
          <span class="text-sm font-extrabold text-[#2C2A27]">Novastra</span>
        </a>
        <div class="flex items-center gap-2">
          <button type="button" data-nv-open-search class="h-9 px-3 rounded-full bg-white border border-[#E8E2DA] flex items-center gap-2 text-xs text-[#6B6560]" aria-label="Cari kursus">
            <i data-lucide="search" class="w-4 h-4 text-[#D97757]"></i>
            <span>Cari</span>
          </button>
          <a href="/profile" class="w-9 h-9 rounded-full bg-[#D97757] text-white font-extrabold text-xs flex items-center justify-center">${esc(initials)}</a>
        </div>
      </header>
    `;

    const bottomNavHtml = `
      <nav id="nv-bottom-nav" class="nv-bottom-nav" aria-label="Navigasi Mobile">
        ${NAV_ITEMS.map((item) => {
          const active = activeKey === item.key;
          return `
            <a href="${item.href}" class="flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${active ? 'text-[#D97757]' : 'text-[#6B6560]'}">
              <i data-lucide="${item.icon}" class="w-4 h-4"></i>
              <span>${item.label}</span>
            </a>
          `;
        }).join('')}
      </nav>
    `;

    const mainEl = options.main || document.querySelector('#app-shell, main, #main-content');
    document.body.insertAdjacentHTML('afterbegin', sidebarHtml + topbarHtml + mobileHeaderHtml);
    if (mainEl) mainEl.classList.add('nv-main-shell');
    document.body.insertAdjacentHTML('beforeend', bottomNavHtml + renderSearchModal());

    bindEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const pageKey = document.body?.dataset?.page;
    if (pageKey && PAGE_LABELS[pageKey]) renderShell(pageKey);
  });

  window.NovastraComponents = { renderShell, openSearchModal, closeSearchModal };
  window.initNovastraShell = renderShell;
})();
