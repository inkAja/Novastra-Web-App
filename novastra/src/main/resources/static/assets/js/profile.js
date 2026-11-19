(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const POW_PROJECTS = [
    { id: 'pw-1', title: 'Spring Boot Clean REST Gateway', stack: 'Java 21 · Spring Boot · Redis', aiScore: 95, summary: 'Latency p95 turun 41% dengan DTO boundary ketat & caching idempotent.' },
    { id: 'pw-2', title: 'Hybrid RAG Legal Search Engine', stack: 'Python · BM25 · pgvector', aiScore: 91, summary: 'Recall @5 mencapai 94% dengan semantic chunking dan source citation guardrails.' },
    { id: 'pw-3', title: 'Novastra Warm Design System UI', stack: 'Vanilla JS · Tailwind · A11y', aiScore: 93, summary: 'Zero-framework modular dashboard dengan fokus kontras WCAG AA & performa cepat.' },
    { id: 'pw-4', title: 'OWASP API Security Hardening Lab', stack: 'OAuth2 · JWT · Rate Limiter', aiScore: 89, summary: 'Menutup kerentanan BOLA/IDOR & menerapkan prepared statement di seluruh query.' }
  ];

  const state = {
    editOpen: false,
    activeCert: null,
    copied: false
  };

  function getInitials(name) {
    return String(name || 'NA').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || 'NA';
  }

  function render() {
    const main = document.getElementById('main-content');
    if (!main) return;

    const D = window.NOVASTRA_DATA || {};
    const store = window.NovastraStore;
    const user = store?.getUser?.() || { name: 'Hanif Mishbah', targetRole: 'Backend Java Engineer' };
    const streak = store?.getStreak?.()?.count ?? 12;
    const certs = D.CERTIFICATES || [];
    const { HM = [], HC = ['#F0ECE4', '#D7DFD4', '#B7C5B3', '#8A9A86', '#5F715B'] } = D.HEATMAP_DATA || {};

    main.innerHTML = `
      <section class="bg-white border border-[#E8E2DA] rounded-3xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6" style="padding: 24px 32px;">
        <div class="flex flex-col sm:flex-row sm:items-center gap-5">
          <div class="w-[72px] h-[72px] rounded-full bg-[#D97757] text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-sm">${esc(getInitials(user.name))}</div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-xl md:text-2xl font-black text-[#2C2A27]">${esc(user.name)}</h1>
              <span class="px-2.5 py-0.5 rounded-full bg-[#FDF0EB] text-[#D97757] text-[11px] font-extrabold">Cohort #12</span>
            </div>
            <p class="text-sm font-semibold text-[#6B6560] mt-0.5">${esc(user.targetRole)}</p>
            <div class="flex flex-wrap items-center gap-3 mt-2.5">
              <a href="https://github.com" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 text-xs font-bold text-[#6B6560] hover:text-[#D97757]"><i data-lucide="github" class="w-3.5 h-3.5"></i> GitHub</a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 text-xs font-bold text-[#6B6560] hover:text-[#D97757]"><i data-lucide="linkedin" class="w-3.5 h-3.5"></i> LinkedIn</a>
              <button type="button" id="pr-edit-btn" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAF8F5] border border-[#E8E2DA] hover:border-[#D97757] text-xs font-extrabold text-[#2C2A27] cursor-pointer">
                <i data-lucide="pencil" class="w-3 h-3 text-[#D97757]"></i> Edit Profile
              </button>
              <button type="button" id="pr-logout-btn" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F8ECEB] border border-[#A65D57]/30 hover:bg-[#A65D57] hover:text-white text-xs font-extrabold text-[#A65D57] transition-colors cursor-pointer">
                <i data-lucide="log-out" class="w-3 h-3"></i> Log Out
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 shrink-0">
          ${[
            ['Streak', `${streak}d`, 'flame', '#C4904B'],
            ['Certificates', `${certs.length}`, 'award', '#8A9A86'],
            ['Avg AI Score', '92%', 'sparkles', '#D97757']
          ].map(([label, val, icon, color]) => `
            <div class="px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA] text-center">
              <div class="flex items-center justify-center gap-1 text-[11px] font-bold text-[#6B6560]">
                <i data-lucide="${icon}" class="w-3.5 h-3.5" style="color:${color}"></i>
                <span>${label}</span>
              </div>
              <p class="text-lg font-black text-[#2C2A27] mt-0.5">${val}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <div class="grid grid-cols-1 min-[900px]:grid-cols-[42fr_58fr] gap-6 items-start">
        <div class="space-y-6">
          <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-base font-black text-[#2C2A27]">Daily Consistency</h2>
                <p class="text-xs text-[#6B6560]">Aktivitas 20 minggu terakhir</p>
              </div>
              <div class="flex items-center gap-1">
                ${HC.map((hex) => `<span class="w-2.5 h-2.5 rounded-sm" style="background:${hex}"></span>`).join('')}
              </div>
            </div>

            <div class="grid gap-1" style="grid-template-columns: repeat(20, minmax(0, 1fr));">
              ${HM.map((week) => `
                <div class="grid grid-rows-7 gap-1">
                  ${week.map((lvl) => `<span class="aspect-square w-full rounded-[3px]" style="background:${HC[lvl] || HC[0]}" title="Level ${lvl}"></span>`).join('')}
                </div>
              `).join('')}
            </div>
          </section>

          <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-black text-[#2C2A27]">Certificates (${certs.length} earned)</h2>
              <span class="text-xs font-bold text-[#8A9A86]">Verified PoW</span>
            </div>
            <div class="space-y-2.5">
              ${certs.map((cert) => `
                <button type="button" data-cert-id="${esc(cert.id)}" class="w-full text-left p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA] hover:border-[#8A9A86] transition-all flex items-center justify-between gap-3 cursor-pointer">
                  <div class="min-w-0">
                    <p class="text-sm font-extrabold text-[#2C2A27] truncate">${esc(cert.title)}</p>
                    <p class="text-[11px] text-[#6B6560] font-mono mt-0.5">${esc(cert.code)} · ${esc(cert.issuedAt)}</p>
                  </div>
                  <span class="px-2.5 py-1 rounded-full bg-[#F0F3EF] text-[#5E7C6B] text-xs font-extrabold shrink-0">${cert.score}%</span>
                </button>
              `).join('')}
            </div>
          </section>
        </div>

        <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-black text-[#2C2A27]">Verified Proof of Work</h2>
              <p class="text-xs text-[#6B6560]">Proyek produksi yang telah diaudit skor AI</p>
            </div>
            <a href="/career" class="text-xs font-bold text-[#D97757] hover:underline">Run New Audit →</a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            ${POW_PROJECTS.map((p) => `
              <article class="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA] flex flex-col justify-between gap-3">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <span class="px-2.5 py-0.5 rounded-full bg-[#F0F3EF] text-[#5E7C6B] text-[11px] font-extrabold">AI Score ${p.aiScore}</span>
                    <i data-lucide="shield-check" class="w-4 h-4 text-[#8A9A86]"></i>
                  </div>
                  <h3 class="text-sm font-black text-[#2C2A27]">${esc(p.title)}</h3>
                  <p class="text-xs text-[#6B6560] mt-1.5 leading-relaxed">${esc(p.summary)}</p>
                </div>
                <p class="text-[11px] font-mono font-bold text-[#A89F98] pt-2 border-t border-[#E8E2DA]">${esc(p.stack)}</p>
              </article>
            `).join('')}
          </div>
        </section>
      </div>

      ${state.editOpen ? renderEditModal(user) : ''}
      ${state.activeCert ? renderCertModal(user) : ''}
    `;

    bindEvents(certs);
    if (window.lucide) window.lucide.createIcons();
  }

  function renderEditModal(user) {
    return `
      <div class="fixed inset-0 z-50 bg-[#2C2A27]/45 backdrop-blur-sm flex items-center justify-center p-4">
        <form id="pr-edit-form" class="w-full max-w-md bg-[#FDFBF7] border border-[#E8E2DA] rounded-3xl p-6 shadow-xl animate-slide-up space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-black text-[#2C2A27]">Edit Profile</h3>
            <button type="button" id="pr-edit-close" class="p-1 text-[#6B6560] cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>
          <div>
            <label class="block text-xs font-bold text-[#6B6560] mb-1">Nama Lengkap</label>
            <input id="pr-name-in" type="text" value="${esc(user.name)}" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2DA] text-sm focus:outline-none focus:border-[#D97757]" />
          </div>
          <div>
            <label class="block text-xs font-bold text-[#6B6560] mb-1">Target Role</label>
            <input id="pr-role-in" type="text" value="${esc(user.targetRole)}" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2DA] text-sm focus:outline-none focus:border-[#D97757]" />
          </div>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-[#D97757] text-white text-xs font-extrabold cursor-pointer">Simpan Perubahan</button>
        </form>
      </div>
    `;
  }

  function renderCertModal(user) {
    const c = state.activeCert;
    return `
      <div class="fixed inset-0 z-50 bg-[#2C2A27]/45 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-lg bg-[#FDFBF7] border border-[#E8E2DA] rounded-3xl p-6 shadow-xl animate-slide-up space-y-4">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-full bg-[#F0F3EF] text-[#5E7C6B] text-[11px] font-extrabold">Verified Certificate</span>
            <button type="button" id="cert-close" class="p-1 text-[#6B6560] cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <div class="p-6 rounded-2xl bg-white border-2 border-[#E8E2DA] text-center space-y-2">
            <p class="text-[11px] font-extrabold uppercase tracking-widest text-[#D97757]">Novastra Proof-of-Work</p>
            <h3 class="text-lg font-black text-[#2C2A27]">${esc(c.title)}</h3>
            <p class="text-xs text-[#6B6560]">Diberikan kepada <span class="font-extrabold text-[#2C2A27]">${esc(c.holder || user.name)}</span></p>
            <p class="text-xs font-mono text-[#A89F98] pt-2">${esc(c.code)} · Skor ${c.score}% · ${esc(c.issuedAt)}</p>
          </div>

          <div class="flex gap-2.5">
            <button type="button" id="cert-copy" class="flex-1 py-2.5 rounded-xl border border-[#E8E2DA] bg-white hover:border-[#D97757] text-xs font-extrabold text-[#2C2A27] cursor-pointer">
              ${state.copied ? 'Link Tersalin!' : 'Copy Link'}
            </button>
            <button type="button" id="cert-download" class="flex-1 py-2.5 rounded-xl bg-[#D97757] text-white text-xs font-extrabold cursor-pointer">
              Download
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function bindEvents(certs) {
    document.getElementById('pr-edit-btn')?.addEventListener('click', () => { state.editOpen = true; render(); });
    document.getElementById('pr-logout-btn')?.addEventListener('click', () => {
      window.NovastraStore?.logout?.();
      window.location.replace('/login');
    });
    document.getElementById('pr-edit-close')?.addEventListener('click', () => { state.editOpen = false; render(); });
    document.getElementById('pr-edit-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('pr-name-in')?.value?.trim();
      const targetRole = document.getElementById('pr-role-in')?.value?.trim();
      if (name || targetRole) {
        window.NovastraStore?.login?.({ ...(name ? { name } : {}), ...(targetRole ? { targetRole } : {}) });
      }
      state.editOpen = false;
      render();
    });

    document.querySelectorAll('[data-cert-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeCert = certs.find((c) => c.id === btn.dataset.certId) || null;
        state.copied = false;
        render();
      });
    });
    document.getElementById('cert-close')?.addEventListener('click', () => { state.activeCert = null; render(); });
    document.getElementById('cert-copy')?.addEventListener('click', async () => {
      const url = `${window.location.origin}/profile?cert=${encodeURIComponent(state.activeCert?.code || '')}`;
      try { await navigator.clipboard?.writeText(url); } catch { /* clipboard optional in headless/insecure context */ }
      state.copied = true;
      render();
    });
    document.getElementById('cert-download')?.addEventListener('click', () => {
      const c = state.activeCert;
      if (!c) return;
      const content = `NOVASTRA VERIFIED CERTIFICATE\nTitle: ${c.title}\nHolder: ${c.holder}\nCode: ${c.code}\nScore: ${c.score}%\nIssued: ${c.issuedAt}\n`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${c.code}.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  document.addEventListener('DOMContentLoaded', render);
})();
