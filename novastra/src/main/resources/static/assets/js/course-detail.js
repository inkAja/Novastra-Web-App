(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const state = {
    course: null,
    modules: [],
    activeLesson: null,
    playing: false,
    progressPct: 18,
    speed: 1,
    volume: 80,
    ccOn: true,
    overviewOpen: true,
    rightTab: 'upnext', // upnext | discussion | microtasks
    activeMicroTask: null,
    classroomOpen: false,
    handRaised: false,
    playTimer: null,
    discussions: [
      {
        id: 'd-1',
        author: 'Nadia Kusuma',
        time: '15 mnt lalu',
        text: 'Apakah DTO validation lebih baik diletakkan di controller atau service layer?',
        upvotes: 12,
        replies: [
          { author: 'Bima Santoso (Mentor)', time: '10 mnt lalu', text: 'Validasi format input (@Valid) di boundary controller, business invariant di service.' }
        ]
      },
      {
        id: 'd-2',
        author: 'Bagas Permana',
        time: '1 jam lalu',
        text: 'Tips agar query list tetap cepat tanpa eager fetch di semua relasi?',
        upvotes: 8,
        replies: []
      }
    ],
    microTasks: [
      { id: 'mt-1', title: 'Buat DTO Request & Response', desc: 'Pisahkan Java Record DTO dari Entity JPA untuk endpoint utama.', est: '10 mnt', done: false },
      { id: 'mt-2', title: 'Tambahkan Global Exception Handler', desc: 'Tangani MethodArgumentNotValidException menjadi RFC 7807 ProblemDetail.', est: '15 mnt', done: false },
      { id: 'mt-3', title: 'Tulis Unit Test Boundary', desc: 'Verifikasi status HTTP 400 saat payload tidak memenuhi constraint.', est: '12 mnt', done: false }
    ],
    liveMessages: [
      { author: 'Mentor Bima', text: 'Selamat datang di Live Classroom Cohort #12! Siapkan repo Spring Boot Anda.' },
      { author: 'Rizky M.', text: 'Sudah ready Mas, tadi sempat coba @EntityGraph dan query turun ke 1x select.' }
    ],
    liveTasks: [
      { id: 'lt-1', label: 'Fork starter repository cohort', done: true },
      { id: 'lt-2', label: 'Jalankan endpoint GET /api/courses', done: false }
    ]
  };

  function syncPlayInterval() {
    if (state.playTimer) {
      clearInterval(state.playTimer);
      state.playTimer = null;
    }
    if (!state.playing) return;
    state.playTimer = setInterval(() => {
      state.progressPct = Math.min(100, +(state.progressPct + 0.8 * state.speed).toFixed(1));
      const bar = document.getElementById('cd-video-bar');
      const pctText = document.getElementById('cd-video-pct');
      if (bar) bar.style.width = `${state.progressPct}%`;
      if (pctText) pctText.textContent = `${Math.round(state.progressPct)}%`;
      if (state.progressPct >= 100) {
        state.playing = false;
        syncPlayInterval();
        render();
      }
    }, 300);
  }

  function render() {
    const main = document.getElementById('main-content');
    if (!main || !state.course) return;

    const D = window.NOVASTRA_DATA || {};
    const store = window.NovastraStore;
    const fm = (D.FIELD_META || {})[state.course.field] || { label: state.course.field, color: '#D97757', bg: '#FDF0EB' };
    const lessonId = state.activeLesson?.id || 'l-def-1';
    const isCompleted = store?.isLessonCompleted?.(state.course.id, lessonId) || false;
    const allLessons = state.modules.flatMap((m) => m.items || []);

    main.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span class="px-2.5 py-1 rounded-full text-[11px] font-bold" style="background:${fm.bg};color:${fm.color}">${esc(fm.label)}</span>
          <h1 class="text-xl md:text-2xl font-black text-[#2C2A27] mt-2">${esc(state.course.title)}</h1>
          <p class="text-xs text-[#6B6560] mt-0.5">Instruktur: ${esc(state.course.instructor)} · ${esc(state.course.level)} · ${esc(state.course.duration)}</p>
        </div>
        <button type="button" id="cd-open-classroom" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FDF0EB] border border-[#F2A68D] text-[#D97757] text-xs font-extrabold hover:bg-[#D97757] hover:text-white transition-colors shrink-0 cursor-pointer">
          <i data-lucide="video" class="w-4 h-4"></i> Bootcamp Cohort &amp; Live Classroom
        </button>
      </div>

      <div class="grid grid-cols-1 min-[900px]:grid-cols-[64fr_36fr] gap-6 items-start">
        <div class="space-y-4">
          <div class="rounded-3xl overflow-hidden bg-[#2C2A27] border border-[#E8E2DA] shadow-sm">
            <div class="relative aspect-video bg-gradient-to-br from-[#2C2A27] via-[#3A3530] to-[#1F1D1B] flex flex-col items-center justify-center p-6 text-white">
              <div class="text-center max-w-md">
                <span class="px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-bold text-[#F2A68D]">${esc(state.activeLesson?.duration || '20 mnt')}</span>
                <h2 class="text-lg md:text-xl font-extrabold mt-2">${esc(state.activeLesson?.title || state.course.title)}</h2>
                <p class="text-xs text-white/70 mt-1">${state.playing ? `Memutar pada kecepatan ${state.speed}x` : 'Klik Play untuk memulai simulasi materi'}</p>
              </div>
              <button type="button" id="cd-play-center" class="mt-4 w-14 h-14 rounded-full bg-[#D97757] hover:scale-105 text-white flex items-center justify-center shadow-lg transition-transform cursor-pointer" aria-label="Play atau Pause">
                <i data-lucide="${state.playing ? 'pause' : 'play'}" class="w-6 h-6"></i>
              </button>
              ${state.ccOn ? `
                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-lg bg-black/75 text-xs text-white/95 max-w-[90%] text-center">
                  [CC] "Pastikan validasi boundary dilakukan sebelum data masuk ke domain service."
                </div>
              ` : ''}
            </div>

            <div class="p-4 bg-[#FAF8F5] border-t border-[#E8E2DA] space-y-3">
              <div class="flex items-center gap-3">
                <button type="button" id="cd-play-btn" class="px-3 py-1.5 rounded-lg bg-[#D97757] text-white text-xs font-extrabold cursor-pointer">${state.playing ? 'Pause' : 'Play'}</button>
                <div class="flex-1 h-2 rounded-full bg-[#E8E2DA] overflow-hidden cursor-pointer" id="cd-progress-track">
                  <div id="cd-video-bar" class="h-full bg-[#D97757] transition-all duration-150" style="width:${state.progressPct}%"></div>
                </div>
                <span id="cd-video-pct" class="text-xs font-mono font-bold text-[#6B6560] w-10 text-right">${Math.round(state.progressPct)}%</span>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex flex-wrap items-center gap-2">
                  <div class="flex items-center gap-1 bg-white border border-[#E8E2DA] rounded-lg p-1">
                    ${[1, 1.25, 1.5].map((sp) => `
                      <button type="button" data-speed="${sp}" class="px-2 py-1 rounded text-[11px] font-extrabold cursor-pointer ${state.speed === sp ? 'bg-[#D97757] text-white' : 'text-[#6B6560]'}">${sp}x</button>
                    `).join('')}
                  </div>

                  <label class="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-[#E8E2DA] text-xs text-[#6B6560]">
                    <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
                    <input id="cd-volume" type="range" min="0" max="100" value="${state.volume}" class="w-16 accent-[#D97757]" aria-label="Volume" />
                  </label>

                  <button type="button" id="cd-cc-btn" class="px-2.5 py-1.5 rounded-lg border text-xs font-extrabold cursor-pointer ${state.ccOn ? 'bg-[#8A9A86] text-white border-[#8A9A86]' : 'bg-white text-[#6B6560] border-[#E8E2DA]'}">
                    CC: ${state.ccOn ? 'ON' : 'OFF'}
                  </button>
                </div>

                <button type="button" id="cd-mark-complete" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${isCompleted ? 'bg-[#8A9A86] text-white border-[#8A9A86]' : 'bg-white text-[#2C2A27] border-[#E8E2DA] hover:border-[#D97757]'}">
                  <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                  <span>${isCompleted ? 'Completed' : 'Mark Completed'}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="rounded-2xl bg-white border border-[#E8E2DA] overflow-hidden">
            <button type="button" id="cd-toggle-overview" class="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition-colors cursor-pointer">
              <div>
                <p class="text-xs font-extrabold uppercase tracking-wider text-[#8A9A86]">Module Summary</p>
                <p class="text-sm font-black text-[#2C2A27] mt-0.5">${esc(state.activeLesson?.title || state.course.title)}</p>
              </div>
              <i data-lucide="${state.overviewOpen ? 'chevron-up' : 'chevron-down'}" class="w-5 h-5 text-[#6B6560]"></i>
            </button>
            ${state.overviewOpen ? `
              <div class="px-5 pb-5 pt-1 border-t border-[#E8E2DA] text-xs text-[#6B6560] space-y-2 leading-relaxed">
                <p>${esc(state.course.desc)}</p>
                <div class="flex flex-wrap gap-1.5 pt-1">
                  ${(state.course.tags || []).map((t) => `<span class="px-2.5 py-0.5 rounded-full bg-[#F5F0EA] text-[#2C2A27] font-bold">${esc(t)}</span>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <aside class="rounded-3xl bg-white border border-[#E8E2DA] overflow-hidden">
          <div class="grid grid-cols-3 border-b border-[#E8E2DA] bg-[#FAF8F5]">
            ${[
              ['upnext', 'Up Next'],
              ['discussion', 'Discussion'],
              ['microtasks', 'Micro-Tasks']
            ].map(([key, label]) => `
              <button type="button" data-right-tab="${key}" class="py-3.5 text-xs font-extrabold border-b-2 transition-colors cursor-pointer ${state.rightTab === key ? 'border-[#D97757] text-[#D97757] bg-white' : 'border-transparent text-[#6B6560]'}">${label}</button>
            `).join('')}
          </div>

          <div class="p-4 max-h-[640px] overflow-y-auto">
            ${state.rightTab === 'upnext' ? renderUpNext(allLessons) : state.rightTab === 'discussion' ? renderDiscussion() : renderMicroTasks()}
          </div>
        </aside>
      </div>

      ${state.activeMicroTask ? renderMicroTaskModal() : ''}
      ${state.classroomOpen ? renderClassroomModal() : ''}
    `;

    bindEvents(allLessons);
    if (window.lucide) window.lucide.createIcons();
  }

  function renderUpNext() {
    const store = window.NovastraStore;
    return state.modules.map((mod) => `
      <div class="mb-4 last:mb-0">
        <p class="text-[11px] font-extrabold uppercase tracking-wider text-[#A89F98] mb-2">${esc(mod.module)}</p>
        <div class="space-y-2">
          ${(mod.items || []).map((item) => {
            const active = state.activeLesson?.id === item.id;
            const done = store?.isLessonCompleted?.(state.course.id, item.id);
            return `
              <button type="button" data-lesson-id="${esc(item.id)}" class="w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${active ? 'bg-[#FDF0EB] border-[#D97757]' : 'bg-[#FAF8F5] border-[#E8E2DA] hover:border-[#D97757]/60'}">
                <div class="min-w-0">
                  <p class="text-xs font-extrabold text-[#2C2A27] truncate">${esc(item.title)}</p>
                  <p class="text-[11px] text-[#6B6560] mt-0.5">${esc(item.duration)}</p>
                </div>
                <span class="w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-[#8A9A86] text-white' : 'bg-white border border-[#E8E2DA] text-[#A89F98]'}">
                  <i data-lucide="${done ? 'check' : 'play'}" class="w-3 h-3"></i>
                </span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
  }

  function renderDiscussion() {
    return `
      <form id="cd-disc-form" class="mb-4 space-y-2">
        <textarea id="cd-disc-input" rows="2" placeholder="Ajukan pertanyaan atau catatan modul ini..." class="w-full p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2DA] text-xs focus:outline-none focus:border-[#D97757]"></textarea>
        <button type="submit" class="px-3.5 py-2 rounded-xl bg-[#D97757] text-white text-xs font-extrabold cursor-pointer">Kirim Pertanyaan</button>
      </form>
      <div class="space-y-3">
        ${state.discussions.map((d) => `
          <div class="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA] space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold text-[#2C2A27]">${esc(d.author)}</span>
              <span class="text-[11px] text-[#A89F98]">${esc(d.time)}</span>
            </div>
            <p class="text-xs text-[#2C2A27] leading-relaxed">${esc(d.text)}</p>
            <div class="flex items-center gap-3">
              <button type="button" data-upvote="${esc(d.id)}" class="text-[11px] font-extrabold text-[#D97757] cursor-pointer">▲ ${d.upvotes}</button>
              <button type="button" data-reply-toggle="${esc(d.id)}" class="text-[11px] font-bold text-[#6B6560] hover:text-[#2C2A27] cursor-pointer">Balas (${d.replies.length})</button>
            </div>
            ${d.replies.length ? `
              <div class="pl-3 border-l-2 border-[#E8E2DA] space-y-2 pt-1">
                ${d.replies.map((r) => `
                  <div class="p-2.5 rounded-xl bg-white border border-[#E8E2DA]">
                    <p class="text-[11px] font-extrabold text-[#5E7C6B]">${esc(r.author)} · <span class="font-normal text-[#A89F98]">${esc(r.time)}</span></p>
                    <p class="text-xs text-[#2C2A27] mt-0.5">${esc(r.text)}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            <form data-reply-form="${esc(d.id)}" class="hidden flex gap-1.5 pt-1">
              <input type="text" placeholder="Tulis balasan..." class="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#E8E2DA] text-xs focus:outline-none focus:border-[#D97757]" />
              <button type="submit" class="px-2.5 py-1.5 rounded-lg bg-[#D97757] text-white text-[11px] font-bold cursor-pointer">Kirim</button>
            </form>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderMicroTasks() {
    return `
      <div class="space-y-2.5">
        ${state.microTasks.map((mt) => `
          <button type="button" data-mt-id="${esc(mt.id)}" class="w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${mt.done ? 'bg-[#F0F3EF] border-[#8A9A86]' : 'bg-[#FAF8F5] border-[#E8E2DA] hover:border-[#D97757]'}">
            <div>
              <p class="text-xs font-extrabold text-[#2C2A27]">${esc(mt.title)}</p>
              <p class="text-[11px] text-[#6B6560] mt-1">${esc(mt.desc)}</p>
              <span class="inline-block mt-2 text-[10px] font-bold text-[#A89F98]">Estimasi ${esc(mt.est)}</span>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${mt.done ? 'bg-[#8A9A86] text-white' : 'bg-[#FDF0EB] text-[#D97757]'}">${mt.done ? 'Selesai' : 'Kerjakan'}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  function renderMicroTaskModal() {
    const mt = state.activeMicroTask;
    return `
      <div id="microtask-overlay" class="fixed inset-0 z-50 bg-[#2C2A27]/45 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-lg bg-[#FDFBF7] border border-[#E8E2DA] rounded-3xl p-6 shadow-xl animate-slide-up">
          <div class="flex items-center justify-between mb-3">
            <span class="px-2.5 py-1 rounded-full bg-[#FDF0EB] text-[#D97757] text-[11px] font-extrabold">Micro-Task Overlay</span>
            <button type="button" id="mt-close" class="p-1 rounded-lg text-[#6B6560] hover:bg-[#F5F0EA] cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>
          <h3 class="text-lg font-black text-[#2C2A27]">${esc(mt.title)}</h3>
          <p class="text-xs text-[#6B6560] mt-1 mb-4">${esc(mt.desc)}</p>
          <textarea id="mt-submission" rows="4" placeholder="Tempel potongan kode atau ringkasan solusi Anda..." class="w-full p-3 rounded-xl bg-white border border-[#E8E2DA] font-mono text-xs focus:outline-none focus:border-[#D97757] mb-4"></textarea>
          <div class="flex justify-end gap-2">
            <button type="button" id="mt-cancel" class="px-4 py-2 rounded-xl border border-[#E8E2DA] text-xs font-bold text-[#6B6560] cursor-pointer">Batal</button>
            <button type="button" id="mt-submit" class="px-5 py-2 rounded-xl bg-[#D97757] text-white text-xs font-extrabold cursor-pointer">Selesaikan Micro-Task</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderClassroomModal() {
    return `
      <div id="classroom-modal" class="fixed inset-0 z-50 bg-[#2C2A27]/45 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-3xl bg-[#FDFBF7] border border-[#E8E2DA] rounded-3xl p-6 shadow-xl animate-slide-up max-h-[88vh] overflow-y-auto">
          <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E8E2DA]">
            <div>
              <span class="px-2.5 py-0.5 rounded-full bg-[#F0F3EF] text-[#5E7C6B] text-[11px] font-extrabold">LIVE COHORT #12</span>
              <h2 class="text-lg font-black text-[#2C2A27] mt-1">Bootcamp Live Classroom</h2>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" id="lc-raise-hand" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold border cursor-pointer ${state.handRaised ? 'bg-[#C4904B] text-white border-[#C4904B]' : 'bg-white text-[#2C2A27] border-[#E8E2DA]'}">
                <i data-lucide="hand" class="w-4 h-4"></i> ${state.handRaised ? 'Hand Raised!' : 'Raise Hand'}
              </button>
              <button type="button" id="lc-close" class="p-2 rounded-lg text-[#6B6560] hover:bg-[#F5F0EA] cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div class="p-4 rounded-2xl bg-white border border-[#E8E2DA] flex flex-col justify-between">
              <div>
                <p class="text-xs font-extrabold uppercase text-[#A89F98] mb-2">Live Chat Kelas</p>
                <div class="space-y-2 max-h-52 overflow-y-auto mb-3">
                  ${state.liveMessages.map((m) => `
                    <div class="p-2.5 rounded-xl bg-[#FAF8F5] text-xs">
                      <span class="font-extrabold text-[#D97757]">${esc(m.author)}:</span>
                      <span class="text-[#2C2A27]"> ${esc(m.text)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
              <form id="lc-chat-form" class="flex gap-2">
                <input id="lc-chat-input" type="text" placeholder="Tulis pesan ke kelas..." class="flex-1 px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2DA] text-xs focus:outline-none focus:border-[#D97757]" />
                <button type="submit" class="px-3.5 py-2 rounded-xl bg-[#D97757] text-white text-xs font-extrabold cursor-pointer">Kirim</button>
              </form>
            </div>

            <div class="p-4 rounded-2xl bg-white border border-[#E8E2DA]">
              <p class="text-xs font-extrabold uppercase text-[#A89F98] mb-2">Tugas Kelas Sesi Ini</p>
              <div class="space-y-2">
                ${state.liveTasks.map((t) => `
                  <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2DA] text-xs font-bold cursor-pointer">
                    <input type="checkbox" data-lc-task="${esc(t.id)}" ${t.done ? 'checked' : ''} class="accent-[#8A9A86]" />
                    <span class="${t.done ? 'line-through text-[#A89F98]' : 'text-[#2C2A27]'}">${esc(t.label)}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function bindEvents(allLessons) {
    const togglePlay = () => {
      state.playing = !state.playing;
      syncPlayInterval();
      render();
    };
    document.getElementById('cd-play-center')?.addEventListener('click', togglePlay);
    document.getElementById('cd-play-btn')?.addEventListener('click', togglePlay);

    document.getElementById('cd-progress-track')?.addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      state.progressPct = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
      render();
    });

    document.querySelectorAll('[data-speed]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.speed = Number(btn.dataset.speed);
        syncPlayInterval();
        render();
      });
    });

    document.getElementById('cd-volume')?.addEventListener('input', (e) => {
      state.volume = Number(e.target.value);
    });

    document.getElementById('cd-cc-btn')?.addEventListener('click', () => {
      state.ccOn = !state.ccOn;
      render();
    });

    document.getElementById('cd-mark-complete')?.addEventListener('click', () => {
      const lid = state.activeLesson?.id || 'l-def-1';
      window.NovastraStore?.toggleLesson?.(state.course.id, lid);
      window.NovastraStore?.touchStreak?.();
      render();
    });

    document.getElementById('cd-toggle-overview')?.addEventListener('click', () => {
      state.overviewOpen = !state.overviewOpen;
      render();
    });

    document.querySelectorAll('[data-right-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.rightTab = btn.dataset.rightTab;
        render();
      });
    });

    document.querySelectorAll('[data-lesson-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeLesson = allLessons.find((l) => l.id === btn.dataset.lessonId) || state.activeLesson;
        state.progressPct = 0;
        render();
      });
    });

    document.getElementById('cd-disc-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('cd-disc-input');
      const text = (input?.value || '').trim();
      if (!text) return;
      const name = window.NovastraStore?.getUser?.()?.name || 'Learner';
      state.discussions.unshift({ id: `d-${Date.now()}`, author: name, time: 'Baru saja', text, upvotes: 1, replies: [] });
      render();
    });

    document.querySelectorAll('[data-upvote]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const d = state.discussions.find((x) => x.id === btn.dataset.upvote);
        if (d) { d.upvotes += 1; render(); }
      });
    });

    document.querySelectorAll('[data-reply-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelector(`[data-reply-form="${btn.dataset.replyToggle}"]`)?.classList.toggle('hidden');
      });
    });

    document.querySelectorAll('[data-reply-form]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = (form.querySelector('input')?.value || '').trim();
        if (!text) return;
        const d = state.discussions.find((x) => x.id === form.dataset.replyForm);
        const name = window.NovastraStore?.getUser?.()?.name || 'Learner';
        if (d) {
          d.replies.push({ author: name, time: 'Baru saja', text });
          render();
        }
      });
    });

    document.querySelectorAll('[data-mt-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeMicroTask = state.microTasks.find((m) => m.id === btn.dataset.mtId) || null;
        render();
      });
    });

    document.getElementById('mt-close')?.addEventListener('click', () => { state.activeMicroTask = null; render(); });
    document.getElementById('mt-cancel')?.addEventListener('click', () => { state.activeMicroTask = null; render(); });
    document.getElementById('mt-submit')?.addEventListener('click', () => {
      if (state.activeMicroTask) {
        state.activeMicroTask.done = true;
        window.NovastraStore?.completeLesson?.(state.course.id, state.activeMicroTask.id);
        window.NovastraStore?.enrollCourse?.(state.course.id);
        state.activeMicroTask = null;
        render();
      }
    });

    document.getElementById('cd-open-classroom')?.addEventListener('click', () => { state.classroomOpen = true; render(); });
    document.getElementById('lc-close')?.addEventListener('click', () => { state.classroomOpen = false; render(); });
    document.getElementById('lc-raise-hand')?.addEventListener('click', () => { state.handRaised = !state.handRaised; render(); });

    document.getElementById('lc-chat-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('lc-chat-input');
      const text = (input?.value || '').trim();
      if (!text) return;
      const name = window.NovastraStore?.getUser?.()?.name || 'Learner';
      state.liveMessages.push({ author: name, text });
      render();
    });

    document.querySelectorAll('[data-lc-task]').forEach((chk) => {
      chk.addEventListener('change', () => {
        const t = state.liveTasks.find((x) => x.id === chk.dataset.lcTask);
        if (t) { t.done = chk.checked; render(); }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const D = window.NOVASTRA_DATA || {};
    const courses = D.COURSES || [];
    const id = new URLSearchParams(window.location.search).get('id');
    state.course = courses.find((c) => c.id === id) || courses[0];
    if (!state.course) return;
    state.modules = D.CURRICULUM?.[state.course.id] || D.CURRICULUM?.default || [];
    state.activeLesson = state.modules[0]?.items?.[0] || { id: 'l-def-1', title: state.course.title, duration: '20 mnt' };
    render();
  });
})();
