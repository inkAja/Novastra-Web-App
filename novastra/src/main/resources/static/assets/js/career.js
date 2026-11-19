(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const state = {
    loading: true,
    error: '',
    actionError: '',
    enrollingCourseId: null,
    career: null,
    activeTest: null,
    testAnswers: {},
    testResult: null,
    testError: '',
    submittingTest: false,
    careerDirty: false,
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
      document.getElementById('cr-retry')?.addEventListener('click', loadCareerData);
      return;
    }

    const cData = state.career;
    const curriculumList = Array.isArray(cData.curriculum) ? cData.curriculum : [];
    const skillGaps = Array.isArray(cData.skillGapAnalysis)
      ? cData.skillGapAnalysis
      : (Array.isArray(cData.skillGaps) ? cData.skillGaps : []);
    const powTests = Array.isArray(cData.blindTests) ? cData.blindTests : [];
    const topPriorityGaps = Array.isArray(cData.topPriorityGaps) ? cData.topPriorityGaps : [];
    const roadmap = Array.isArray(cData.roadmapPhases)
      ? cData.roadmapPhases
      : (Array.isArray(cData.roadmap) ? cData.roadmap : []);
    const projects = Array.isArray(cData.portfolioProjects) ? cData.portfolioProjects : [];
    const avgPct = Math.round(Number(cData.overallProgress ?? cData.averageProgress ?? 0));
    const isCurriculumCompleted = Boolean(cData.isCurriculumCompleted);
    const isAllPowPassed = Boolean(cData.isAllPowPassed);
    const canRunAiAudit = Boolean(cData.canRunAiAudit);
    const auditHint = canRunAiAudit
      ? '✓ Syarat terpenuhi! Siap menjalankan AI Audit Portofolio.'
      : isCurriculumCompleted
        ? '🔒 Kurikulum selesai! Luluskan seluruh Blind Test di PoW Arena untuk membuka AI Audit.'
        : isAllPowPassed
          ? '🔒 Semua Blind Test lulus! Selesaikan sisa modul kurikulum hingga 100% untuk membuka AI Audit.'
          : '🔒 Selesaikan 100% Kurikulum & seluruh Blind Test PoW untuk membuka AI Audit.';

    main.innerHTML = `
      ${state.actionError ? `<div class="p-4 rounded-2xl bg-[#FDF0EB] border border-[#F2A68D] text-xs font-bold text-[#A64B2A]">${esc(state.actionError)}</div>` : ''}

      <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-black text-[#2C2A27]">Career Roadmap &amp; PoW Arena</h1>
          <p class="text-sm text-[#6B6560] mt-1">Target Role: <span class="font-bold text-[#D97757]">${esc(cData.roleName || 'Belum dipilih')}</span></p>
        </div>
        <button type="button" id="cr-open-audit" ${canRunAiAudit ? '' : 'disabled'} title="${esc(auditHint)}" class="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold transition-colors ${canRunAiAudit ? 'bg-[#D97757] hover:opacity-95 text-white shadow-sm cursor-pointer' : 'bg-[#E8E2DA] text-[#9A948D] cursor-not-allowed'}">
          <i data-lucide="scan-line" class="w-4 h-4"></i> ${canRunAiAudit ? 'Run AI Audit' : '🔒 Run AI Audit'}
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
              ${curriculumList.length ? curriculumList.map((c) => {
                const pct = Math.round(Number(c.progressPercentage ?? c.progress ?? 0));
                const isEnrolled = Boolean(c.isEnrolled) || pct > 0;
                const busy = state.enrollingCourseId === c.courseId;
                return `
                  <button type="button" data-curriculum-course="${esc(c.courseId)}" data-enrolled="${isEnrolled}" ${state.enrollingCourseId ? 'disabled' : ''} class="w-full text-left flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA] hover:border-[#D97757] transition-all group cursor-pointer disabled:opacity-60">
                    <div class="flex items-center gap-3.5 min-w-0">
                      <div class="w-2 h-11 rounded-full shrink-0 ${isEnrolled ? 'bg-[#8A9A86]' : 'bg-[#D97757]'}"></div>
                      <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-1.5">
                          <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#D97757]">${esc(c.typeCourse)}</span>
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isEnrolled ? 'bg-[#F0F3EF] text-[#5E7C6B]' : 'bg-[#FDF0EB] text-[#D97757]'}">${isEnrolled ? (pct >= 100 ? 'Selesai' : 'Terdaftar') : 'Belum Terdaftar'}</span>
                        </div>
                        <p class="text-sm font-extrabold text-[#2C2A27] group-hover:text-[#D97757] truncate mt-0.5">${esc(c.title)}</p>
                        <p class="text-[11px] text-[#6B6560]">${esc(c.instructorName)} · ${esc(c.duration)} mnt${c.portfolioTitle ? ` · Project: ${esc(c.portfolioTitle)}` : ''}</p>
                      </div>
                    </div>
                    <div class="text-right shrink-0 space-y-1">
                      <span class="inline-block px-2.5 py-1 rounded-full bg-white border border-[#E8E2DA] text-xs font-extrabold text-[#2C2A27]">${pct}%</span>
                      <p class="text-[11px] font-extrabold text-[#D97757]">${busy ? 'Mendaftarkan...' : isEnrolled ? 'Lanjut Belajar →' : 'Daftar & Mulai →'}</p>
                    </div>
                  </button>
                `;
              }).join('') : '<p class="text-xs text-[#6B6560]">Belum ada course untuk role ini.</p>'}
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
              ${powTests.length ? powTests.map((t) => {
                const isPassed = Boolean(t.isPassed);
                const bestScore = Math.round(Number(t.bestScore ?? 0));
                const totalTasks = Number(t.totalTasksCount ?? (t.tasks || []).length);
                const completedTasks = Number(t.completedTasksCount ?? 0);
                return `
                  <button type="button" data-start-test="${esc(t.testId)}" class="text-left p-4 rounded-2xl border hover:-translate-y-0.5 hover:shadow-sm transition-all flex flex-col justify-between gap-3 cursor-pointer ${isPassed ? 'bg-[#F4F8F4] border-[#8A9A86] hover:border-[#5E7C6B]' : 'bg-[#FAF8F5] border-[#E8E2DA] hover:border-[#D97757]'}">
                    <div>
                      <div class="flex flex-wrap items-center justify-between gap-1.5">
                        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FDF0EB] text-[#D97757]">${esc(t.typeCourse)}</span>
                        ${isPassed ? `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#8A9A86] text-white">✓ Lulus (Skor: ${bestScore}%)</span>` : ''}
                      </div>
                      <h3 class="text-sm font-extrabold text-[#2C2A27] mt-2">${esc(t.title)}</h3>
                      <p class="text-[11px] text-[#6B6560] mt-1">${completedTasks > 0 || isPassed ? `${completedTasks}/${totalTasks} selesai` : `${totalTasks} tantangan`} · ${t.durationMin} mnt · Min ${t.passingScore}%</p>
                    </div>
                    <span class="inline-flex items-center gap-1 text-xs font-extrabold ${isPassed ? 'text-[#5E7C6B]' : 'text-[#D97757]'}">${isPassed ? '✓ Selesai (Ulangi Tes)' : 'Mulai Blind Test →'}</span>
                  </button>
                `;
              }).join('') : '<p class="text-xs text-[#6B6560]">Belum ada tantangan Blind Test untuk role ini.</p>'}
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
            <button type="button" id="cr-open-audit-card" ${canRunAiAudit ? '' : 'disabled'} title="${esc(auditHint)}" class="w-full py-3 rounded-2xl text-xs font-extrabold transition-colors ${canRunAiAudit ? 'bg-[#2C2A27] hover:bg-[#D97757] text-white cursor-pointer' : 'bg-[#E8E2DA] text-[#9A948D] cursor-not-allowed'}">
              ${canRunAiAudit ? 'Run AI Audit Portofolio' : '🔒 Run AI Audit Portofolio'}
            </button>
            <p class="text-[11px] font-bold ${canRunAiAudit ? 'text-[#5A6D56]' : 'text-[#6B6560]'} text-center leading-relaxed">${esc(auditHint)}</p>
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

          ${state.testError ? `<div class="p-3 rounded-xl bg-[#FDF0EB] border border-[#F2A68D] text-xs font-bold text-[#A64B2A]">${esc(state.testError)}</div>` : ''}

          ${state.testResult ? `
            <div class="p-5 rounded-2xl bg-white border border-[#E8E2DA] text-center space-y-3">
              <p class="text-xs font-extrabold uppercase text-[#8A9A86]">Hasil Evaluasi Blind Test</p>
              <p class="text-4xl font-black ${state.testResult.passed ? 'text-[#5E7C6B]' : 'text-[#D97757]'}">${state.testResult.score}%</p>
              <p class="text-xs font-bold text-[#2C2A27]">${state.testResult.passed ? 'Lulus! Jawaban tersimpan & memenuhi standar Proof-of-Work.' : `Belum mencapai target ${t.passingScore}%. Lengkapi analisis Anda.`}</p>
              <button type="button" id="bt-done" class="mt-2 px-5 py-2.5 rounded-xl bg-[#D97757] text-white text-xs font-extrabold cursor-pointer">Tutup &amp; Perbarui Status</button>
            </div>
          ` : `
            <div class="space-y-4">
              ${tasks.map((task, idx) => `
                <div class="p-4 rounded-2xl bg-white border ${task.isPassed ? 'border-[#8A9A86]' : 'border-[#E8E2DA]'} space-y-2">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <p class="text-[11px] font-bold text-[#8A9A86]">${esc(task.moduleTitle)}</p>
                    ${task.isPassed ? '<span class="px-2 py-0.5 rounded-full bg-[#F0F3EF] text-[#5E7C6B] text-[10px] font-extrabold">✓ Sudah dijawab benar sebelumnya</span>' : ''}
                  </div>
                  <p class="text-xs font-extrabold text-[#2C2A27]">${idx + 1}. ${esc(task.questionText)}</p>
                  <textarea data-bt-answer="${esc(task.taskId)}" rows="3" placeholder="Tulis jawaban teknis / solusi Anda..." class="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2DA] text-xs focus:outline-none focus:border-[#D97757]">${esc(state.testAnswers[task.taskId] || '')}</textarea>
                </div>
              `).join('')}
            </div>
            <button type="button" id="bt-submit" ${state.submittingTest ? 'disabled' : ''} class="w-full py-3 rounded-xl bg-[#D97757] text-white text-xs font-extrabold cursor-pointer disabled:opacity-60">${state.submittingTest ? 'Mengirim Jawaban...' : 'Kirim Jawaban Blind Test'}</button>
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
                  <a href="/course-detail.html?courseId=${encodeURIComponent(c.courseId)}" class="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E8E2DA] hover:border-[#D97757] text-xs font-bold text-[#2C2A27]">
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

  async function openCurriculumCourse(courseId, isEnrolled) {
    if (!courseId || state.enrollingCourseId) return;
    const session = window.getSession?.();
    state.actionError = '';

    if (!isEnrolled && session?.userId && !session.isGuest) {
      state.enrollingCourseId = courseId;
      render();
      try {
        const res = await fetch('/api/enrollments', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.userId, courseId })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      } catch (err) {
        state.enrollingCourseId = null;
        state.actionError = `Gagal mendaftarkan course: ${err.message}`;
        render();
        return;
      }
      state.enrollingCourseId = null;
    }

    window.location.href = `/course-detail.html?courseId=${encodeURIComponent(courseId)}`;
  }

  async function closeBlindTestModal() {
    const dirty = state.careerDirty;
    state.activeTest = null;
    state.testResult = null;
    state.testError = '';
    state.careerDirty = false;
    if (dirty) {
      await loadCareerData();
      return;
    }
    render();
  }

  async function submitBlindTest() {
    const t = state.activeTest;
    if (!t || state.submittingTest) return;
    const tasks = t.tasks || [];
    const filled = tasks.filter((task) => (state.testAnswers[task.taskId] || '').trim().length > 0);
    if (!filled.length) {
      state.testError = 'Isi minimal satu jawaban sebelum mengirim Blind Test.';
      render();
      return;
    }

    const session = window.getSession?.();
    if (session?.userId && !session.isGuest) {
      state.submittingTest = true;
      state.testError = '';
      render();
      try {
        const res = await fetch('/api/blind-tests/submit', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.userId,
            answers: tasks.map((task) => ({
              taskId: task.taskId,
              answer: (state.testAnswers[task.taskId] || '').trim()
            }))
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

        state.testResult = {
          score: Number(data.score ?? 0),
          passed: Boolean(data.passed)
        };
        state.careerDirty = true;
        const freshRes = await fetch(`/api/career/${encodeURIComponent(session.userId)}`, {
          credentials: 'include',
          cache: 'no-store'
        });
        if (freshRes.ok) {
          state.career = await freshRes.json();
        }
      } catch (err) {
        state.testError = `Gagal menyimpan jawaban Blind Test: ${err.message}`;
      } finally {
        state.submittingTest = false;
      }
      render();
      return;
    }

    const qualified = tasks.filter((task) => (state.testAnswers[task.taskId] || '').trim().length >= 12).length;
    const score = tasks.length ? Math.round((qualified / tasks.length) * 100) : 0;
    state.testResult = { score, passed: score >= t.passingScore };
    render();
  }

  function bindEvents(powTests) {
    document.querySelectorAll('[data-curriculum-course]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openCurriculumCourse(btn.dataset.curriculumCourse, btn.dataset.enrolled === 'true');
      });
    });

    document.querySelectorAll('[data-start-test]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeTest = powTests.find((t) => t.testId === btn.dataset.startTest) || null;
        state.testAnswers = {};
        state.testResult = null;
        state.testError = '';
        state.careerDirty = false;
        render();
      });
    });

    document.getElementById('bt-close')?.addEventListener('click', closeBlindTestModal);
    document.getElementById('bt-done')?.addEventListener('click', closeBlindTestModal);
    document.querySelectorAll('[data-bt-answer]').forEach((area) => {
      area.addEventListener('input', (e) => {
        state.testAnswers[e.target.dataset.btAnswer] = e.target.value;
      });
    });
    document.getElementById('bt-submit')?.addEventListener('click', submitBlindTest);

    const openAudit = () => {
      if (!Boolean(state.career?.canRunAiAudit)) return;
      state.auditOpen = true;
      state.auditPhase = 'input';
      render();
    };
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

  async function loadCareerData() {
    const session = window.requireAuth?.({ requireOnboarded: true });
    if (!session) return;
    if (session.isGuest || !session.userId) {
      state.loading = false;
      state.error = 'Silakan masuk dengan akun Anda untuk melihat Career Roadmap & Skill Gap personal.';
      return render();
    }

    state.loading = true;
    state.error = '';
    state.actionError = '';
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

  document.addEventListener('DOMContentLoaded', loadCareerData);
})();
