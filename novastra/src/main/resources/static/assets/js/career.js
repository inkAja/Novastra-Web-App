(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const state = {
    loading: true,
    error: '',
    career: null,
    activeTest: null,
    testAnswers: {},
    testResult: null,
    auditOpen: false,
    auditPhase: 'input', // input | scanning | result
    auditText: ''
  };

  function buildRadarSvg(axes) {
    if (!axes.length) {
      return '<p class="text-xs text-[#6B6560] text-center py-8">Belum ada data skill gap untuk role ini.</p>';
    }
    const cx = 130, cy = 115, maxR = 76;
    const n = axes.length;
    const pt = (idx, pct) => {
      const angle = (-Math.PI / 2) + (idx * 2 * Math.PI) / n;
      const r = (Math.max(0, Math.min(100, pct)) / 100) * maxR;
      return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
    };
    const rings = [33, 66, 100].map((lvl) =>
      `<polygon points="${axes.map((_, i) => pt(i, lvl)).join(' ')}" fill="none" stroke="#E8E2DA" stroke-width="1"></polygon>`
    ).join('');
    const spokes = axes.map((_, i) => {
      const [x, y] = pt(i, 100).split(',');
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#E8E2DA" stroke-width="1"></line>`;
    }).join('');
    const targetPoly = `<polygon points="${axes.map((a, i) => pt(i, a.targetLevel ?? 80)).join(' ')}" fill="rgba(138,154,134,0.18)" stroke="#8A9A86" stroke-width="2" stroke-dasharray="4 3"></polygon>`;
    const currentPoly = `<polygon points="${axes.map((a, i) => pt(i, a.currentLevel ?? 0)).join(' ')}" fill="rgba(217,119,87,0.24)" stroke="#D97757" stroke-width="2.5"></polygon>`;
    const labels = axes.map((a, i) => {
      const [x, y] = pt(i, 122).split(',');
      const label = String(a.skillName || '').split(' ')[0];
      return `<text x="${x}" y="${Number(y) + 4}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#6B6560">${esc(label)}</text>`;
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

    if (state.loading) {
      main.innerHTML = `<div class="p-8 rounded-3xl bg-white border border-[#E8E2DA] text-center text-sm font-bold text-[#6B6560]">Memuat roadmap karier dari database...</div>`;
      return;
    }

    if (state.error || !state.career) {
      main.innerHTML = `
        <div class="p-8 rounded-3xl bg-white border border-[#E8E2DA] text-center space-y-3">
          <p class="text-sm font-bold text-[#A65D57]">${esc(state.error || 'Data karier tidak tersedia.')}</p>
          <button type="button" id="cr-retry" class="px-4 py-2 rounded-xl bg-[#D97757] text-white text-xs font-extrabold cursor-pointer">Muat Ulang</button>
        </div>
      `;
      document.getElementById('cr-retry')?.addEventListener('click', loadCareer);
      return;
    }

    const cData = state.career;
    const curriculumList = Array.isArray(cData.curriculum) ? cData.curriculum : [];
    const skillGaps = Array.isArray(cData.skillGaps) ? cData.skillGaps : [];
    const powTests = Array.isArray(cData.blindTests) ? cData.blindTests : [];
    const topPriorityGaps = Array.isArray(cData.topPriorityGaps) ? cData.topPriorityGaps : [];
    const roadmap = Array.isArray(cData.roadmap) ? cData.roadmap : [];
    const projects = Array.isArray(cData.portfolioProjects) ? cData.portfolioProjects : [];
    const avgPct = Number(cData.averageProgress ?? 0);

    main.innerHTML = `
      <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-black text-[#2C2A27]">Career Roadmap &amp; PoW Arena</h1>
          <p class="text-sm text-[#6B6560] mt-1">Target Role: <span class="font-bold text-[#D97757]">${esc(cData.roleName || 'Belum dipilih')}</span></p>
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
                <p class="text-xs text-[#6B6560]">Kurikulum terstruktur khusus jalur ${esc(cData.roleName)}</p>
              </div>
              <span class="text-sm font-black text-[#D97757] font-mono">${avgPct}%</span>
            </div>
            <div class="h-2.5 rounded-full bg-[#F5F0EA] overflow-hidden">
              <div class="h-full rounded-full bg-[#D97757]" style="width:${avgPct}%"></div>
            </div>

            <div class="space-y-3 pt-2">
              ${curriculumList.length ? curriculumList.map((c) => `
                <a href="/course-detail?id=${encodeURIComponent(c.courseId)}" class="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA] hover:border-[#D97757] transition-all group">
                  <div class="flex items-center gap-3.5 min-w-0">
                    <div class="w-2 h-11 rounded-full shrink-0 bg-[#D97757]"></div>
                    <div class="min-w-0">
                      <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#D97757]">${esc(c.typeCourse)}</span>
                      <p class="text-sm font-extrabold text-[#2C2A27] group-hover:text-[#D97757] truncate">${esc(c.title)}</p>
                      <p class="text-[11px] text-[#6B6560]">${esc(c.instructorName)} · ${esc(c.duration)} mnt${c.portfolioTitle ? ` · Project: ${esc(c.portfolioTitle)}` : ''}</p>
                    </div>
                  </div>
                  <span class="px-2.5 py-1 rounded-full bg-white border border-[#E8E2DA] text-xs font-extrabold text-[#2C2A27] shrink-0">${c.progress ?? 0}%</span>
                </a>
              `).join('') : '<p class="text-xs text-[#6B6560]">Belum ada course untuk role ini.</p>'}
            </div>
          </section>

          <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-black text-[#2C2A27]">PoW Arena — Blind Tests</h2>
                <p class="text-xs text-[#6B6560]">Uji kompetensi terverifikasi langsung dari modul jalur ${esc(cData.roleName)}</p>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-[#F0F3EF] text-[#5E7C6B] text-[11px] font-extrabold">${powTests.length} Tantangan</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              ${powTests.length ? powTests.map((t) => `
                <button type="button" data-start-test="${esc(t.testId)}" class="text-left p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA] hover:border-[#D97757] hover:-translate-y-0.5 hover:shadow-sm transition-all flex flex-col justify-between gap-3 cursor-pointer">
                  <div>
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FDF0EB] text-[#D97757]">${esc(t.typeCourse)}</span>
                    <h3 class="text-sm font-extrabold text-[#2C2A27] mt-2">${esc(t.title)}</h3>
                    <p class="text-[11px] text-[#6B6560] mt-1">${(t.tasks || []).length} tantangan · ${t.durationMin} mnt · Min ${t.passingScore}%</p>
                  </div>
                  <span class="inline-flex items-center gap-1 text-xs font-extrabold text-[#D97757]">Mulai Blind Test →</span>
                </button>
              `).join('') : '<p class="text-xs text-[#6B6560]">Belum ada tantangan Blind Test untuk role ini.</p>'}
            </div>
          </section>

          ${projects.length ? `
            <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-3">
              <h2 class="text-lg font-black text-[#2C2A27]">Target Portfolio Projects</h2>
              <div class="space-y-2.5">
                ${projects.map((p) => `
                  <div class="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA]">
                    <p class="text-xs font-extrabold text-[#2C2A27]">${esc(p.title)}</p>
                    <p class="text-[11px] text-[#6B6560] mt-1">${esc(p.expectedOutput)}</p>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}
        </div>

        <aside class="space-y-6">
          <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-4">
            <h2 class="text-lg font-black text-[#2C2A27]">Skill Gap Analysis</h2>
            ${buildRadarSvg(skillGaps)}
            <div class="flex items-center justify-center gap-5 text-xs font-bold pt-1">
              <span class="flex items-center gap-1.5 text-[#2C2A27]"><span class="w-3 h-3 rounded-sm bg-[#D97757]"></span> Saat Ini</span>
              <span class="flex items-center gap-1.5 text-[#6B6560]"><span class="w-3 h-3 rounded-sm bg-[#8A9A86]"></span> Target Role</span>
            </div>
            <div class="space-y-1.5 pt-2 border-t border-[#E8E2DA]">
              ${skillGaps.map((g) => `
                <div class="flex items-center justify-between text-[11px]">
                  <span class="font-bold text-[#2C2A27]">${esc(g.skillName)}</span>
                  <span class="font-mono text-[#6B6560]">${g.currentLevel}% / ${g.targetLevel}%</span>
                </div>
              `).join('')}
            </div>
            <div class="pt-3 border-t border-[#E8E2DA]">
              <p class="text-[11px] font-extrabold uppercase tracking-wider text-[#A89F98] mb-2">Top Priority Gaps</p>
              <div class="flex flex-wrap gap-2">
                ${topPriorityGaps.map((g) => `
                  <span class="px-3 py-1 rounded-full bg-[#FDF0EB] border border-[#F2A68D]/60 text-xs font-extrabold text-[#D97757]">${esc(g)}</span>
                `).join('')}
              </div>
            </div>
          </section>

          <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-4">
            <h2 class="text-lg font-black text-[#2C2A27]">Reverse-Engineered Roadmap</h2>
            <div class="space-y-3">
              ${roadmap.map((step, idx) => `
                <div class="flex gap-3 items-start p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA]">
                  <span class="w-6 h-6 rounded-full bg-[#D97757] text-white text-xs font-black flex items-center justify-center shrink-0">${idx + 1}</span>
                  <div>
                    <p class="text-[11px] font-extrabold text-[#8A9A86]">${esc(step.phase)}</p>
                    <p class="text-xs font-bold text-[#2C2A27] mt-0.5">${esc(step.description)}</p>
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
      ${state.auditOpen ? renderAuditOverlay(curriculumList) : ''}
    `;

    bindEvents(powTests);
    if (window.lucide) window.lucide.createIcons();
  }

  function renderBlindTestModal() {
    const t = state.activeTest;
    const tasks = t.tasks || [];
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
              <p class="text-xs font-extrabold uppercase text-[#8A9A86]">Hasil Evaluasi Blind Test</p>
              <p class="text-4xl font-black ${state.testResult.passed ? 'text-[#5E7C6B]' : 'text-[#D97757]'}">${state.testResult.score}%</p>
              <p class="text-xs font-bold text-[#2C2A27]">${state.testResult.passed ? 'Lulus! Jawaban memenuhi standar Proof-of-Work.' : `Belum mencapai target ${t.passingScore}%. Lengkapi analisis Anda.`}</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${tasks.map((task, idx) => `
                <div class="p-4 rounded-2xl bg-white border border-[#E8E2DA] space-y-2">
                  <p class="text-[11px] font-bold text-[#8A9A86]">${esc(task.moduleTitle)}</p>
                  <p class="text-xs font-extrabold text-[#2C2A27]">${idx + 1}. ${esc(task.questionText)}</p>
                  <textarea data-bt-answer="${esc(task.taskId)}" rows="3" placeholder="Tulis jawaban teknis / solusi Anda..." class="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2DA] text-xs focus:outline-none focus:border-[#D97757]">${esc(state.testAnswers[task.taskId] || '')}</textarea>
                </div>
              `).join('')}
            </div>
            <button type="button" id="bt-submit" class="w-full py-3 rounded-xl bg-[#D97757] text-white text-xs font-extrabold cursor-pointer">Kirim Jawaban Blind Test</button>
          `}
        </div>
      </div>
    `;
  }

  function renderAuditOverlay(recCourses) {
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
              <p class="text-xs text-[#6B6560]">Mengevaluasi kejelasan metrik dampak, arsitektur, dan kelengkapan bukti.</p>
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
              <div class="space-y-2">
                <p class="text-xs font-extrabold text-[#2C2A27]">Rekomendasi Kursus Lanjutan:</p>
                ${recCourses.slice(0, 2).map((c) => `
                  <a href="/course-detail?id=${encodeURIComponent(c.courseId)}" class="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E8E2DA] hover:border-[#D97757] text-xs font-bold text-[#2C2A27]">
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
        state.activeTest = powTests.find((t) => t.testId === btn.dataset.startTest) || null;
        state.testAnswers = {};
        state.testResult = null;
        render();
      });
    });

    document.getElementById('bt-close')?.addEventListener('click', () => { state.activeTest = null; render(); });
    document.querySelectorAll('[data-bt-answer]').forEach((area) => {
      area.addEventListener('input', (e) => {
        state.testAnswers[e.target.dataset.btAnswer] = e.target.value;
      });
    });
    document.getElementById('bt-submit')?.addEventListener('click', () => {
      const t = state.activeTest;
      if (!t) return;
      const tasks = t.tasks || [];
      const answered = tasks.filter((task) => (state.testAnswers[task.taskId] || '').trim().length >= 12).length;
      const score = tasks.length ? Math.round((answered / tasks.length) * 100) : 0;
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
      }, 1500);
    });
    document.getElementById('au-retry')?.addEventListener('click', () => { state.auditPhase = 'input'; render(); });
  }

  async function loadCareer() {
    const session = window.requireAuth?.({ requireOnboarded: true });
    if (!session) return;
    if (session.isGuest) {
      state.loading = false;
      state.error = 'Silakan masuk dengan akun Anda untuk melihat Career Roadmap & Skill Gap personal.';
      return render();
    }

    state.loading = true;
    state.error = '';
    render();

    try {
      const res = await fetch(`/api/career/${encodeURIComponent(session.userId)}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Gagal memuat data karier (HTTP ${res.status}).`);
      if (data.isOnboarded === false) {
        window.saveSession?.({ ...session, isOnboarded: false });
        window.location.replace('/onboarding');
        return;
      }
      state.career = data;
      state.auditText = state.auditText || `Portfolio project untuk jalur ${data.roleName}`;
      state.loading = false;
    } catch (err) {
      state.loading = false;
      state.error = err.message || 'Gagal memuat data karier dari server.';
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', loadCareer);
})();
