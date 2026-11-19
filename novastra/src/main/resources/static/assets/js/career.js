(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const RADAR_AXES = [
    { label: 'Backend', current: 82, target: 92 },
    { label: 'System Design', current: 64, target: 88 },
    { label: 'AI / RAG', current: 70, target: 85 },
    { label: 'Security', current: 56, target: 84 },
    { label: 'Cloud', current: 62, target: 80 },
    { label: 'SQL Tuning', current: 74, target: 88 }
  ];

  const state = {
    activeTest: null,
    testAnswers: {},
    testResult: null,
    auditOpen: false,
    auditPhase: 'input', // input | scanning | result
    auditText: 'Built a Spring Boot 3 REST API with JWT, Flyway migrations, and p95 latency reduced by 42% using Redis caching.'
  };

  function buildHexRadarSvg() {
    const cx = 130, cy = 115, maxR = 78;
    const pt = (idx, pct) => {
      const angle = (-Math.PI / 2) + (idx * 2 * Math.PI) / 6;
      const r = (pct / 100) * maxR;
      return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
    };
    const rings = [33, 66, 100].map((lvl) =>
      `<polygon points="${RADAR_AXES.map((_, i) => pt(i, lvl)).join(' ')}" fill="none" stroke="#E8E2DA" stroke-width="1"></polygon>`
    ).join('');
    const spokes = RADAR_AXES.map((_, i) => {
      const [x, y] = pt(i, 100).split(',');
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#E8E2DA" stroke-width="1"></line>`;
    }).join('');
    const targetPoly = `<polygon points="${RADAR_AXES.map((a, i) => pt(i, a.target)).join(' ')}" fill="rgba(138,154,134,0.18)" stroke="#8A9A86" stroke-width="2" stroke-dasharray="4 3"></polygon>`;
    const currentPoly = `<polygon points="${RADAR_AXES.map((a, i) => pt(i, a.current)).join(' ')}" fill="rgba(217,119,87,0.24)" stroke="#D97757" stroke-width="2.5"></polygon>`;
    const labels = RADAR_AXES.map((a, i) => {
      const [x, y] = pt(i, 122).split(',');
      return `<text x="${x}" y="${Number(y) + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#6B6560">${esc(a.label)}</text>`;
    }).join('');

    return `
      <svg viewBox="0 0 260 235" class="w-full max-w-[260px] mx-auto">
        ${rings}${spokes}${targetPoly}${currentPoly}${labels}
      </svg>
    `;
  }

  function render() {
    const main = document.getElementById('main-content');
    if (!main) return;
    const D = window.NOVASTRA_DATA || {};
    const store = window.NovastraStore;
    const user = store?.getUser?.() || { targetRole: 'Backend Java Engineer' };
    const enrolled = store?.getEnrolled?.() || [];
    const courses = (D.COURSES || []).filter((c) => enrolled.includes(c.id));
    const curriculumList = courses.length ? courses : (D.COURSES || []).slice(0, 3);
    const avgPct = Math.round(curriculumList.reduce((a, c) => a + (c.progress || 0), 0) / Math.max(1, curriculumList.length));
    const fieldMeta = D.FIELD_META || {};
    const powTests = D.POW_TESTS || [];

    main.innerHTML = `
      <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-black text-[#2C2A27]">Career Roadmap &amp; PoW Arena</h1>
          <p class="text-sm text-[#6B6560] mt-1">Target Role: <span class="font-bold text-[#D97757]">${esc(user.targetRole)}</span></p>
        </div>
        <button type="button" id="cr-open-audit" class="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#D97757] hover:opacity-95 text-white text-xs font-extrabold shadow-sm cursor-pointer">
          <i data-lucide="scan-line" class="w-4 h-4"></i> Run AI Audit
        </button>
      </section>

      <div class="grid grid-cols-1 min-[900px]:grid-cols-[62fr_38fr] gap-6 items-start">
        <div class="space-y-6">
          <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-black text-[#2C2A27]">Your Curriculum</h2>
                <p class="text-xs text-[#6B6560]">Progres keseluruhan jalur karier aktif Anda</p>
              </div>
              <span class="text-sm font-black text-[#D97757] font-mono">${avgPct}%</span>
            </div>
            <div class="h-2.5 rounded-full bg-[#F5F0EA] overflow-hidden">
              <div class="h-full rounded-full bg-[#D97757]" style="width:${avgPct}%"></div>
            </div>

            <div class="space-y-3 pt-2">
              ${curriculumList.map((c) => {
                const fm = fieldMeta[c.field] || { label: c.field, color: '#D97757', bg: '#FDF0EB' };
                return `
                  <a href="/course-detail?id=${encodeURIComponent(c.id)}" class="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA] hover:border-[#D97757] transition-all group">
                    <div class="flex items-center gap-3.5 min-w-0">
                      <div class="w-2 h-11 rounded-full shrink-0" style="background:${fm.color}"></div>
                      <div class="min-w-0">
                        <span class="text-[10px] font-extrabold uppercase tracking-wider" style="color:${fm.color}">${esc(fm.label)}</span>
                        <p class="text-sm font-extrabold text-[#2C2A27] group-hover:text-[#D97757] truncate">${esc(c.title)}</p>
                        <p class="text-[11px] text-[#6B6560]">${esc(c.level)} · ${esc(c.duration)}</p>
                      </div>
                    </div>
                    <span class="px-2.5 py-1 rounded-full bg-white border border-[#E8E2DA] text-xs font-extrabold text-[#2C2A27] shrink-0">${c.progress}%</span>
                  </a>
                `;
              }).join('')}
            </div>
          </section>

          <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-black text-[#2C2A27]">PoW Arena — Blind Tests</h2>
                <p class="text-xs text-[#6B6560]">Uji kompetensi terverifikasi tanpa bantuan hint</p>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-[#F0F3EF] text-[#5E7C6B] text-[11px] font-extrabold">${powTests.length} Tantangan</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              ${powTests.map((t) => {
                const fm = fieldMeta[t.field] || { label: t.field, color: '#D97757', bg: '#FDF0EB' };
                return `
                  <button type="button" data-start-test="${esc(t.id)}" class="text-left p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA] hover:border-[#D97757] hover:-translate-y-0.5 hover:shadow-sm transition-all flex flex-col justify-between gap-3 cursor-pointer">
                    <div>
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold" style="background:${fm.bg};color:${fm.color}">${esc(fm.label)}</span>
                      <h3 class="text-sm font-extrabold text-[#2C2A27] mt-2">${esc(t.title)}</h3>
                      <p class="text-[11px] text-[#6B6560] mt-1">${t.questions.length} soal · ${t.durationMin} mnt · Min ${t.passingScore}%</p>
                    </div>
                    <span class="inline-flex items-center gap-1 text-xs font-extrabold text-[#D97757]">Mulai Blind Test →</span>
                  </button>
                `;
              }).join('')}
            </div>
          </section>
        </div>

        <aside class="space-y-6">
          <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-4">
            <h2 class="text-lg font-black text-[#2C2A27]">Skill Gap Analysis</h2>
            ${buildHexRadarSvg()}
            <div class="flex items-center justify-center gap-5 text-xs font-bold pt-1">
              <span class="flex items-center gap-1.5 text-[#2C2A27]"><span class="w-3 h-3 rounded-sm bg-[#D97757]"></span> Saat Ini</span>
              <span class="flex items-center gap-1.5 text-[#6B6560]"><span class="w-3 h-3 rounded-sm bg-[#8A9A86]"></span> Target Role</span>
            </div>
            <div class="pt-3 border-t border-[#E8E2DA]">
              <p class="text-[11px] font-extrabold uppercase tracking-wider text-[#A89F98] mb-2">Top Priority Gaps</p>
              <div class="flex flex-wrap gap-2">
                ${['Security (OWASP)', 'System Design', 'Cloud K8s'].map((g) => `
                  <span class="px-3 py-1 rounded-full bg-[#FDF0EB] border border-[#F2A68D]/60 text-xs font-extrabold text-[#D97757]">${g}</span>
                `).join('')}
              </div>
            </div>
          </section>

          <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-4">
            <h2 class="text-lg font-black text-[#2C2A27]">Reverse-Engineered Roadmap</h2>
            <div class="space-y-3">
              ${[
                ['Phase 1 · Minggu 1–2', 'Tutup gap OWASP Security & Boundary Validation'],
                ['Phase 2 · Minggu 3–4', 'Bangun proyek REST + Caching & lolos Blind Test'],
                ['Phase 3 · Minggu 5–6', 'Run AI Audit portofolio sebelum melamar role target']
              ].map(([step, desc], idx) => `
                <div class="flex gap-3 items-start p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA]">
                  <span class="w-6 h-6 rounded-full bg-[#D97757] text-white text-xs font-black flex items-center justify-center shrink-0">${idx + 1}</span>
                  <div>
                    <p class="text-[11px] font-extrabold text-[#8A9A86]">${step}</p>
                    <p class="text-xs font-bold text-[#2C2A27] mt-0.5">${desc}</p>
                  </div>
                </div>
              `).join('')}
            </div>
            <button type="button" id="cr-open-audit-card" class="w-full py-3 rounded-2xl bg-[#2C2A27] hover:bg-[#D97757] text-white text-xs font-extrabold transition-colors cursor-pointer">
              Run AI Audit Portofolio
            </button>
          </section>
        </aside>
      </div>

      ${state.activeTest ? renderBlindTestModal() : ''}
      ${state.auditOpen ? renderAuditOverlay() : ''}
    `;

    bindEvents(powTests);
    if (window.lucide) window.lucide.createIcons();
  }

  function renderBlindTestModal() {
    const t = state.activeTest;
    return `
      <div class="fixed inset-0 z-50 bg-[#2C2A27]/45 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-xl bg-[#FDFBF7] border border-[#E8E2DA] rounded-3xl p-6 shadow-xl animate-slide-up max-h-[88vh] overflow-y-auto space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#E8E2DA]">
            <div>
              <span class="text-[11px] font-extrabold uppercase text-[#D97757]">Proof-of-Work Blind Test</span>
              <h3 class="text-lg font-black text-[#2C2A27]">${esc(t.title)}</h3>
            </div>
            <button type="button" id="bt-close" class="p-1.5 rounded-lg text-[#6B6560] hover:bg-[#F5F0EA] cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          ${state.testResult ? `
            <div class="p-5 rounded-2xl bg-white border border-[#E8E2DA] text-center space-y-2">
              <p class="text-xs font-extrabold uppercase text-[#8A9A86]">Hasil Uji</p>
              <p class="text-4xl font-black ${state.testResult.passed ? 'text-[#5E7C6B]' : 'text-[#D97757]'}">${state.testResult.score}%</p>
              <p class="text-xs font-bold text-[#2C2A27]">${state.testResult.passed ? `Lulus! Badge "${esc(t.badge)}" terbuka.` : `Belum mencapai target ${t.passingScore}%. Ulangi kembali.`}</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${t.questions.map((item, qi) => `
                <div class="p-4 rounded-2xl bg-white border border-[#E8E2DA] space-y-2">
                  <p class="text-xs font-extrabold text-[#2C2A27]">${qi + 1}. ${esc(item.q)}</p>
                  <div class="space-y-1.5">
                    ${item.opts.map((opt, oi) => `
                      <label class="flex items-center gap-2.5 p-2 rounded-xl bg-[#FAF8F5] text-xs cursor-pointer hover:bg-[#FDF0EB]">
                        <input type="radio" name="bt-q-${qi}" value="${oi}" ${state.testAnswers[qi] === oi ? 'checked' : ''} class="accent-[#D97757]" />
                        <span>${esc(opt)}</span>
                      </label>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
            <button type="button" id="bt-submit" class="w-full py-3 rounded-xl bg-[#D97757] text-white text-xs font-extrabold cursor-pointer">Kirim Jawaban Blind Test</button>
          `}
        </div>
      </div>
    `;
  }

  function renderAuditOverlay() {
    const D = window.NOVASTRA_DATA || {};
    const recCourses = (D.COURSES || []).filter((c) => ['c-sc-1', 'c-be-1'].includes(c.id));

    return `
      <div class="fixed inset-0 z-50 bg-[#2C2A27]/55 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div class="w-full max-w-2xl bg-[#FDFBF7] border border-[#E8E2DA] rounded-3xl p-6 md:p-8 shadow-2xl animate-slide-up space-y-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-[#FDF0EB] text-[#D97757] flex items-center justify-center"><i data-lucide="scan-line" class="w-5 h-5"></i></div>
              <div>
                <h2 class="text-lg font-black text-[#2C2A27]">AI Portfolio &amp; Skill Audit</h2>
                <p class="text-xs text-[#6B6560]">Analisis bukti karya nyata terhadap standar industri</p>
              </div>
            </div>
            <button type="button" id="au-close" class="p-1.5 rounded-lg text-[#6B6560] hover:bg-[#F5F0EA] cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          ${state.auditPhase === 'input' ? `
            <div class="space-y-4">
              <textarea id="au-text" rows="5" class="w-full p-4 rounded-2xl bg-white border border-[#E8E2DA] text-xs font-mono focus:outline-none focus:border-[#D97757]" placeholder="Tempel ringkasan proyek, README, atau tautan repositori...">${esc(state.auditText)}</textarea>
              <label class="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-[#E8E2DA] bg-[#FAF8F5] text-xs font-bold text-[#6B6560] hover:border-[#D97757] cursor-pointer">
                <i data-lucide="upload" class="w-4 h-4 text-[#D97757]"></i>
                <span>Atau pilih file sampel (.md / .txt / .java)</span>
                <input id="au-file" type="file" accept=".md,.txt,.java,.js" class="hidden" />
              </label>
              <button type="button" id="au-scan" class="w-full py-3 rounded-2xl bg-[#D97757] text-white text-sm font-extrabold cursor-pointer">Mulai AI Scan</button>
            </div>
          ` : state.auditPhase === 'scanning' ? `
            <div class="relative overflow-hidden p-8 rounded-2xl bg-white border border-[#E8E2DA] text-center space-y-3">
              <div class="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-[#D97757]/25 to-transparent animate-scan-cycle pointer-events-none"></div>
              <p class="text-sm font-black text-[#2C2A27]">Memindai Bukti Teknis...</p>
              <p class="text-xs text-[#6B6560]">Mengevaluasi kejelasan metrik dampak, arsitektur, dan celah keamanan.</p>
            </div>
          ` : `
            <div class="space-y-4">
              <div class="p-5 rounded-2xl bg-white border border-[#E8E2DA] flex items-center justify-between">
                <div>
                  <p class="text-xs font-extrabold uppercase text-[#8A9A86]">Persuasion Score</p>
                  <p class="text-3xl font-black text-[#D97757]">89 / 100</p>
                </div>
                <span class="px-3 py-1 rounded-full bg-[#F0F3EF] text-[#5E7C6B] text-xs font-extrabold">Siap Recruiter Review</span>
              </div>
              <div class="grid grid-cols-3 gap-3">
                ${[
                  ['Impact Metrics', '92%'],
                  ['Architecture', '88%'],
                  ['Security Proof', '74%']
                ].map(([k, v]) => `
                  <div class="p-3 rounded-2xl bg-white border border-[#E8E2DA]">
                    <p class="text-[11px] font-bold text-[#6B6560]">${k}</p>
                    <p class="text-lg font-black text-[#2C2A27]">${v}</p>
                  </div>
                `).join('')}
              </div>
              <div class="space-y-2">
                <p class="text-xs font-extrabold text-[#2C2A27]">Rekomendasi Kursus Lanjutan:</p>
                ${recCourses.map((c) => `
                  <a href="/course-detail?id=${encodeURIComponent(c.id)}" class="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E8E2DA] hover:border-[#D97757] text-xs font-bold text-[#2C2A27]">
                    <span>${esc(c.title)}</span>
                    <span class="text-[#D97757]">Buka →</span>
                  </a>
                `).join('')}
              </div>
              <button type="button" id="au-retry" class="w-full py-2.5 rounded-xl border border-[#E8E2DA] bg-white text-xs font-extrabold text-[#2C2A27] cursor-pointer">Audit Sampel Lain</button>
            </div>
          `}
        </div>
      </div>
    `;
  }

  function bindEvents(powTests) {
    document.querySelectorAll('[data-start-test]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeTest = powTests.find((t) => t.id === btn.dataset.startTest) || null;
        state.testAnswers = {};
        state.testResult = null;
        render();
      });
    });

    document.getElementById('bt-close')?.addEventListener('click', () => { state.activeTest = null; render(); });
    document.querySelectorAll('input[name^="bt-q-"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const idx = Number(e.target.name.replace('bt-q-', ''));
        state.testAnswers[idx] = Number(e.target.value);
      });
    });
    document.getElementById('bt-submit')?.addEventListener('click', () => {
      const t = state.activeTest;
      if (!t) return;
      const correct = t.questions.filter((q, i) => state.testAnswers[i] === q.ans).length;
      const score = Math.round((correct / t.questions.length) * 100);
      state.testResult = { score, passed: score >= t.passingScore };
      render();
    });

    const openAudit = () => { state.auditOpen = true; state.auditPhase = 'input'; render(); };
    document.getElementById('cr-open-audit')?.addEventListener('click', openAudit);
    document.getElementById('cr-open-audit-card')?.addEventListener('click', openAudit);
    document.getElementById('au-close')?.addEventListener('click', () => { state.auditOpen = false; render(); });
    document.getElementById('au-file')?.addEventListener('change', (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        state.auditText = String(reader.result || '').slice(0, 1200);
        render();
      };
      reader.readAsText(f);
    });
    document.getElementById('au-scan')?.addEventListener('click', () => {
      const val = document.getElementById('au-text')?.value;
      if (val !== undefined) state.auditText = val;
      state.auditPhase = 'scanning';
      render();
      setTimeout(() => {
        if (state.auditOpen && state.auditPhase === 'scanning') {
          state.auditPhase = 'result';
          render();
        }
      }, 1800);
    });
    document.getElementById('au-retry')?.addEventListener('click', () => { state.auditPhase = 'input'; render(); });
  }

  document.addEventListener('DOMContentLoaded', render);
})();
