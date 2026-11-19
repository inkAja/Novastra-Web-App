(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const state = {
    course: null,
    fromDb: false,
    courseProgress: 0,
    enrollmentId: null,
    courseModules: [],
    currentModuleId: null,
    completedModuleIds: new Set(),
    videoProgress: 0,
    playing: false,
    speed: 1,
    playTimer: null,
    autoAdvanceTimer: null,
    isAutoCompleting: false,
    completing: false,
    volume: 80,
    ccOn: true,
    overviewOpen: true,
    rightTab: 'upnext', // upnext | discussion | microtasks
    activeMicroTask: null,
    microTasks: [],
    isTaskLocked: false,
    lockedTask: null,
    lockWarning: false,
    submittingTask: false,
    mtError: '',
    feedbackMsg: '',
    loadError: '',
    toastMsg: '',
    toastTimer: null,
    classroomOpen: false,
    handRaised: false,
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
    liveMessages: [
      { author: 'Mentor Bima', text: 'Selamat datang di Live Classroom Cohort #12! Siapkan repo Spring Boot Anda.' },
      { author: 'Rizky M.', text: 'Sudah ready Mas, tadi sempat coba @EntityGraph dan query turun ke 1x select.' }
    ],
    liveTasks: [
      { id: 'lt-1', label: 'Fork starter repository cohort', done: true },
      { id: 'lt-2', label: 'Jalankan endpoint GET /api/courses', done: false }
    ]
  };

  function getCourseId() {
    return state.course?.courseId || state.course?.id || null;
  }

  function getActiveModule() {
    return state.courseModules.find((m) => m.moduleId === state.currentModuleId) || null;
  }

  function completionStoreKey(cid) {
    const uid = window.getSession?.()?.userId || 'guest';
    return `${uid}:${cid}`;
  }

  function syncCompletedModulesFromDb(cid) {
    // DB courseProgress=0 is authoritative so stale localStorage from prior accounts never blocks auto-claim
    if (state.courseProgress <= 0) {
      state.completedModuleIds = new Set();
      return;
    }
    if (state.courseProgress >= 100) {
      state.completedModuleIds = new Set(state.courseModules.map((m) => m.moduleId));
      return;
    }
    const stored = window.NovastraStore?.getCompletedLessons?.(completionStoreKey(cid)) || [];
    state.completedModuleIds = new Set(Array.isArray(stored) ? stored : []);
  }

  function isModuleDone(moduleId) {
    return Boolean(moduleId && state.completedModuleIds.has(moduleId));
  }

  function formatTime(sec) {
    const total = Math.max(0, Math.round(Number(sec) || 0));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function computeTriggerPct(task, durationSeconds) {
    const dur = Number(durationSeconds || 0);
    const ts = Number(task?.timestampSeconds || 0);
    if (dur > 300 && ts > 0 && ts < dur) {
      return Math.min(95, Math.max(5, +((ts / dur) * 100).toFixed(1)));
    }
    return 35;
  }

  function findBlockingTask(pct = state.videoProgress) {
    return state.microTasks.find((t) => !t.isCompleted && pct >= t.triggerPct) || null;
  }

  function syncTaskLockState() {
    state.lockedTask = findBlockingTask();
    state.isTaskLocked = Boolean(state.lockedTask);
    if (!state.isTaskLocked) {
      state.lockWarning = false;
    }
  }

  function showToast(msg) {
    state.toastMsg = msg || '';
    if (state.toastTimer) {
      clearTimeout(state.toastTimer);
      state.toastTimer = null;
    }
    if (state.toastMsg) {
      state.toastTimer = setTimeout(() => {
        state.toastMsg = '';
        state.toastTimer = null;
        document.getElementById('cd-toast')?.remove();
      }, 4500);
    }
  }

  function clearAutoAdvance() {
    if (state.autoAdvanceTimer) {
      clearTimeout(state.autoAdvanceTimer);
      state.autoAdvanceTimer = null;
    }
  }

  function stopVideoPlayback() {
    if (state.playTimer) {
      clearInterval(state.playTimer);
      state.playTimer = null;
    }
    state.playing = false;
  }

  function updatePlayerProgressDom() {
    const durationSec = Number(getActiveModule()?.durationSeconds || 900);
    const bar = document.getElementById('cd-video-bar');
    const pctText = document.getElementById('cd-video-pct');
    const timeText = document.getElementById('cd-video-time');
    if (bar) bar.style.width = `${state.videoProgress}%`;
    if (pctText) pctText.textContent = `${Math.round(state.videoProgress)}%`;
    if (timeText) timeText.textContent = `${formatTime((state.videoProgress / 100) * durationSec)} / ${formatTime(durationSec)}`;
  }

  async function loadModuleMicroTasks(moduleId, session) {
    state.activeMicroTask = null;
    state.mtError = '';
    if (!moduleId || !state.fromDb || !window.apiFetch) {
      state.microTasks = [];
      syncTaskLockState();
      return;
    }
    const uid = session?.userId ? `?userId=${encodeURIComponent(session.userId)}` : '';
    const rows = await window.apiFetch(`/api/modules/${encodeURIComponent(moduleId)}/micro-tasks${uid}`, []);
    if (state.currentModuleId !== moduleId) return;
    const durationSec = Number(getActiveModule()?.durationSeconds || 900);
    state.microTasks = Array.isArray(rows)
      ? rows.map((t) => ({
          ...t,
          isCompleted: Boolean(t.isCompleted),
          triggerPct: computeTriggerPct(t, durationSec)
        }))
      : [];
    syncTaskLockState();
  }

  function lockPlayerOnTask(task) {
    state.videoProgress = task.triggerPct;
    stopVideoPlayback();
    state.isTaskLocked = true;
    state.lockedTask = task;
    state.activeMicroTask = task;
    state.mtError = '';
    state.lockWarning = true;
    state.feedbackMsg = 'Video dijeda untuk Checkpoint Micro-Task. Selesaikan tugas agar video dapat dilanjutkan.';
    render();
  }

  function startVideoPlayback() {
    syncTaskLockState();
    if (state.isTaskLocked) {
      stopVideoPlayback();
      state.lockWarning = true;
      showToast('Selesaikan Micro-Task terlebih dahulu untuk melanjutkan video');
      render();
      return false;
    }
    if (!state.currentModuleId) return false;

    clearAutoAdvance();
    if (state.videoProgress >= 100) {
      state.videoProgress = 0;
      state.isAutoCompleting = false;
    }
    state.playing = true;
    syncPlayInterval();
    render();
    return true;
  }

  function syncPlayInterval() {
    if (state.playTimer) {
      clearInterval(state.playTimer);
      state.playTimer = null;
    }
    if (!state.playing) return;

    state.playTimer = setInterval(() => {
      const nextPct = +(state.videoProgress + 0.8 * state.speed).toFixed(1);
      const clampedPct = Math.min(100, nextPct);
      const blocker = findBlockingTask(clampedPct);
      if (blocker) {
        lockPlayerOnTask(blocker);
        return;
      }

      state.videoProgress = clampedPct;
      updatePlayerProgressDom();

      if (state.videoProgress >= 100) {
        state.videoProgress = 100;
        stopVideoPlayback();
        updatePlayerProgressDom();
        handleVideoCompleted();
      }
    }, 300);
  }

  async function handleVideoCompleted() {
    if (state.isAutoCompleting) return;
    state.isAutoCompleting = true;
    render();

    const currentIndex = state.courseModules.findIndex((m) => m.moduleId === state.currentModuleId);
    const nextModule = currentIndex >= 0 && currentIndex + 1 < state.courseModules.length
      ? state.courseModules[currentIndex + 1]
      : null;

    if (!isModuleDone(state.currentModuleId)) {
      const saved = await markModuleAsCompleted(state.currentModuleId, {
        auto: true,
        hasNext: Boolean(nextModule)
      });
      if (!saved) {
        state.isAutoCompleting = false;
        render();
        return;
      }
    } else if (nextModule) {
      showToast('Modul sudah selesai. Melanjutkan ke modul berikutnya...');
      render();
    }

    if (nextModule) {
      clearAutoAdvance();
      state.autoAdvanceTimer = setTimeout(async () => {
        state.autoAdvanceTimer = null;
        await selectModule(nextModule, { autoPlay: true });
      }, 1500);
    } else {
      const finishMsg = 'Selamat! Seluruh modul pada course ini telah selesai (100%)';
      state.feedbackMsg = finishMsg;
      showToast(finishMsg);
      state.isAutoCompleting = false;
      render();
    }
  }

  async function selectModule(nextModule, { autoPlay = false } = {}) {
    const nextId = nextModule?.moduleId ?? nextModule?.id;
    if (!nextModule || !nextId) return;

    clearAutoAdvance();
    stopVideoPlayback();

    state.currentModuleId = nextId;
    state.videoProgress = 0;
    state.isAutoCompleting = false;
    state.isTaskLocked = false;
    state.lockedTask = null;
    state.lockWarning = false;
    state.activeMicroTask = null;
    state.mtError = '';

    await loadModuleMicroTasks(nextId, window.getSession?.());
    if (state.currentModuleId !== nextId) return;

    if (autoPlay) {
      state.feedbackMsg = `Memutar modul berikutnya: ${nextModule.title}`;
      startVideoPlayback();
    } else {
      state.feedbackMsg = '';
      render();
    }
  }

  async function markModuleAsCompleted(moduleId, { auto = false, hasNext = false } = {}) {
    if (state.completing) return false;
    const cid = getCourseId();
    const lid = moduleId || state.currentModuleId;
    const session = window.getSession?.();
    if (!cid || !lid) {
      state.feedbackMsg = 'Modul belum tersedia untuk course ini.';
      render();
      return false;
    }

    if (isModuleDone(lid)) {
      if (!auto) {
        const modTitle = getActiveModule()?.title || lid;
        state.feedbackMsg = `Modul "${modTitle}" sudah selesai. Pilih modul berikutnya di panel Up Next.`;
      }
      render();
      return true;
    }

    if (!session || session.isGuest || !state.fromDb || !session.userId) {
      state.completedModuleIds.add(lid);
      window.NovastraStore?.completeLesson?.(completionStoreKey(cid), lid);
      window.NovastraStore?.touchStreak?.();
      const msg = auto
        ? (hasNext ? 'Modul selesai (+50 XP)! Melanjutkan ke modul berikutnya...' : 'Selamat! Seluruh modul pada course ini telah selesai (100%)')
        : 'Modul ditandai selesai.';
      state.feedbackMsg = msg;
      showToast(msg);
      render();
      return true;
    }

    state.completing = true;
    render();

    let saved = false;
    try {
      const res = await fetch(`/api/courses/${encodeURIComponent(cid)}/modules/${encodeURIComponent(lid)}/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.userId })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      state.completedModuleIds.add(lid);
      window.NovastraStore?.completeLesson?.(completionStoreKey(cid), lid);
      state.courseProgress = Number(data.progressPercentage ?? state.courseProgress);
      window.saveSession?.({
        totalXp: data.totalXp ?? session.totalXp,
        streakCount: data.streakCount ?? session.streakCount
      });
      document.querySelectorAll('[data-nv-streak]').forEach((el) => {
        el.textContent = `${data.streakCount ?? 0}d`;
      });

      const xpLabel = data.xpAwarded > 0 ? ` (+${data.xpAwarded} XP)` : '';
      const msg = auto
        ? (hasNext
            ? `Modul selesai${xpLabel}! Melanjutkan ke modul berikutnya...`
            : 'Selamat! Seluruh modul pada course ini telah selesai (100%)')
        : `${data.xpAwarded > 0 ? `+${data.xpAwarded} XP! ` : ''}Progres course diperbarui menjadi ${Math.round(state.courseProgress)}%.`;
      state.feedbackMsg = msg;
      showToast(msg);
      saved = true;
    } catch (err) {
      state.feedbackMsg = `Gagal menyimpan progres: ${err.message}`;
      showToast(state.feedbackMsg);
    } finally {
      state.completing = false;
    }
    render();
    return saved;
  }

  async function submitActiveMicroTask() {
    const mt = state.activeMicroTask;
    if (!mt || state.submittingTask) return;
    const answer = (document.getElementById('mt-submission')?.value || '').trim();
    if (!answer) {
      state.mtError = 'Tuliskan jawaban Anda terlebih dahulu.';
      render();
      return;
    }

    const session = window.getSession?.();
    if (!session || session.isGuest || !state.fromDb || !session.userId) {
      mt.isCompleted = true;
      mt.score = 100;
      state.activeMicroTask = null;
      state.mtError = '';
      syncTaskLockState();
      showToast('Micro-Task selesai! Pemutaran video dilanjutkan.');
      if (!state.isTaskLocked && state.videoProgress < 100) {
        startVideoPlayback();
        return;
      }
      render();
      return;
    }

    state.submittingTask = true;
    state.mtError = '';
    render();

    try {
      const res = await fetch(`/api/micro-tasks/${encodeURIComponent(mt.taskId)}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.userId, answer })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      mt.isCompleted = true;
      mt.score = data.score ?? 100;
      state.activeMicroTask = null;
      state.mtError = '';
      syncTaskLockState();
      state.feedbackMsg = 'Micro-Task selesai! Video dibuka kembali.';
      showToast('Micro-Task selesai! Pemutaran video dilanjutkan.');
      if (!state.isTaskLocked && state.videoProgress < 100) {
        state.submittingTask = false;
        startVideoPlayback();
        return;
      }
    } catch (err) {
      state.mtError = `Gagal mengirim jawaban: ${err.message}`;
    } finally {
      state.submittingTask = false;
    }
    render();
  }

  function render() {
    const main = document.getElementById('main-content');
    if (!main) return;
    if (!state.course) {
      main.innerHTML = `
        <div class="rounded-3xl bg-white border border-[#E8E2DA] p-8 max-w-xl">
          <p class="text-sm font-black text-[#2C2A27]">Course belum tersedia</p>
          <p class="text-xs text-[#6B6560] mt-1">${esc(state.loadError || 'Course tidak ditemukan di database.')}</p>
          <a href="/courses" class="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-[#D97757] text-white text-xs font-extrabold">Kembali ke Katalog Courses</a>
        </div>`;
      return;
    }

    const D = window.NOVASTRA_DATA || {};
    const cid = getCourseId();
    const activeMod = getActiveModule();
    const fm = (D.FIELD_META || {})[state.course.field] || {
      label: state.course.typeCourse || state.course.field || 'Course',
      color: '#D97757',
      bg: '#FDF0EB'
    };
    const hasModule = Boolean(state.currentModuleId);
    const isCompleted = hasModule && isModuleDone(state.currentModuleId);
    const coursePct = Math.round(state.courseProgress);
    const durationSec = Number(activeMod?.durationSeconds || 900);
    const pendingTasks = state.microTasks.filter((t) => !t.isCompleted).length;

    main.innerHTML = `
      ${state.feedbackMsg ? `<div class="mb-4 p-3.5 rounded-2xl bg-[#F0F3EF] border border-[#8A9A86]/50 text-xs font-bold text-[#5E7C6B]">${esc(state.feedbackMsg)}</div>` : ''}

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <a href="/home" class="text-xs font-bold text-[#6B6560] hover:text-[#D97757]">← Kembali ke Home</a>
            <span class="px-2.5 py-1 rounded-full text-[11px] font-bold" style="background:${fm.bg};color:${fm.color}">${esc(fm.label)}</span>
          </div>
          <h1 class="text-xl md:text-2xl font-black text-[#2C2A27] mt-2">${esc(state.course.title)}</h1>
          <p class="text-xs text-[#6B6560] mt-0.5">Instruktur: ${esc(state.course.instructorName || state.course.instructor || '-')} · ${esc(state.course.duration ?? '')} mnt · Progres Course: <span class="font-extrabold text-[#D97757]">${coursePct}%</span></p>
        </div>
        <button type="button" id="cd-open-classroom" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FDF0EB] border border-[#F2A68D] text-[#D97757] text-xs font-extrabold hover:bg-[#D97757] hover:text-white transition-colors shrink-0 cursor-pointer">
          <i data-lucide="video" class="w-4 h-4"></i> Bootcamp Cohort &amp; Live Classroom
        </button>
      </div>

      <div class="mb-5 h-2 rounded-full bg-[#F5F0EA] overflow-hidden">
        <div class="h-full rounded-full bg-[#8A9A86] transition-all duration-300" style="width:${coursePct}%"></div>
      </div>

      <div class="grid grid-cols-1 min-[900px]:grid-cols-[64fr_36fr] gap-6 items-start">
        <div class="space-y-4">
          <div class="rounded-3xl overflow-hidden bg-[#2C2A27] border border-[#E8E2DA] shadow-sm">
            <div class="relative aspect-video bg-gradient-to-br from-[#2C2A27] via-[#3A3530] to-[#1F1D1B] flex flex-col items-center justify-center p-6 text-white">
              <div class="text-center max-w-md">
                <span class="px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-bold text-[#F2A68D]">${esc(activeMod?.duration || (hasModule ? '15 mnt' : 'Belum ada modul'))}</span>
                <h2 class="text-lg md:text-xl font-extrabold mt-2">${esc(activeMod?.title || state.course.title)}</h2>
                <p class="text-xs text-white/70 mt-1">${!hasModule ? 'Belum ada modul di database untuk course ini' : state.isTaskLocked ? 'Video terkunci · Selesaikan Micro-Task terlebih dahulu' : state.playing ? `Memutar pada kecepatan ${state.speed}x` : 'Klik Play untuk memulai materi modul'}</p>
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
                  <div id="cd-video-bar" class="h-full bg-[#D97757] transition-all duration-150" style="width:${state.videoProgress}%"></div>
                </div>
                <span id="cd-video-time" class="text-[11px] font-mono text-[#6B6560] whitespace-nowrap">${formatTime((state.videoProgress / 100) * durationSec)} / ${formatTime(durationSec)}</span>
                <span id="cd-video-pct" class="text-xs font-mono font-bold text-[#6B6560] w-10 text-right">${Math.round(state.videoProgress)}%</span>
              </div>

              ${state.isTaskLocked ? `
                <div class="p-3 rounded-xl bg-[#FDF0EB] border border-[#F2A68D] flex flex-wrap items-center justify-between gap-2">
                  <p class="text-xs font-bold text-[#A64B2A]">Selesaikan Micro-Task terlebih dahulu untuk melanjutkan video.</p>
                  <button type="button" id="cd-open-locked-task" class="px-3 py-1.5 rounded-lg bg-[#D97757] text-white text-xs font-extrabold cursor-pointer">Buka Micro-Task</button>
                </div>
              ` : ''}

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

                <button type="button" id="cd-mark-complete" ${(!hasModule || state.completing) ? 'disabled' : ''} class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${isCompleted ? 'bg-[#8A9A86] text-white border-[#8A9A86]' : 'bg-[#D97757] text-white border-[#D97757] hover:opacity-95'} disabled:opacity-60 disabled:cursor-not-allowed">
                  <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                  <span>${state.completing ? 'Menyimpan...' : !hasModule ? 'Modul Belum Tersedia' : isCompleted ? 'Selesai ✓' : 'Tandai Selesai (+50 XP)'}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="rounded-2xl bg-white border border-[#E8E2DA] overflow-hidden">
            <button type="button" id="cd-toggle-overview" class="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition-colors cursor-pointer">
              <div>
                <p class="text-xs font-extrabold uppercase tracking-wider text-[#8A9A86]">Module Summary</p>
                <p class="text-sm font-black text-[#2C2A27] mt-0.5">${esc(activeMod?.title || state.course.title)}</p>
              </div>
              <i data-lucide="${state.overviewOpen ? 'chevron-up' : 'chevron-down'}" class="w-5 h-5 text-[#6B6560]"></i>
            </button>
            ${state.overviewOpen ? `
              <div class="px-5 pb-5 pt-1 border-t border-[#E8E2DA] text-xs text-[#6B6560] space-y-2 leading-relaxed">
                <p>${esc(state.course.desc || `Pelajari ${state.course.title} bersama ${state.course.instructorName || 'instruktur Novastra'}.`)}</p>
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
              <button type="button" data-right-tab="${key}" class="py-3.5 text-xs font-extrabold border-b-2 transition-colors cursor-pointer ${state.rightTab === key ? 'border-[#D97757] text-[#D97757] bg-white' : 'border-transparent text-[#6B6560]'}">${label}${key === 'microtasks' && pendingTasks > 0 ? ` <span class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${state.isTaskLocked ? 'bg-[#D97757] text-white' : 'bg-[#FDF0EB] text-[#D97757]'}">${pendingTasks}</span>` : ''}</button>
            `).join('')}
          </div>

          <div class="p-4 max-h-[640px] overflow-y-auto">
            ${state.rightTab === 'upnext' ? renderUpNext() : state.rightTab === 'discussion' ? renderDiscussion() : renderMicroTasks()}
          </div>
        </aside>
      </div>

      ${state.toastMsg ? `
        <div id="cd-toast" class="fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-2xl bg-[#2C2A27] text-white text-xs font-bold shadow-xl border border-white/10 flex items-center gap-2.5 animate-slide-up">
          <span class="w-2 h-2 rounded-full bg-[#D97757] shrink-0"></span>
          <span>${esc(state.toastMsg)}</span>
        </div>
      ` : ''}
      ${state.activeMicroTask ? renderMicroTaskModal() : ''}
      ${state.classroomOpen ? renderClassroomModal() : ''}
    `;

    bindEvents(cid);
    if (window.lucide) window.lucide.createIcons();
  }

  function renderUpNext() {
    if (!state.courseModules.length) {
      return '<p class="text-xs text-[#6B6560] py-6 text-center">Belum ada modul di database untuk course ini.</p>';
    }
    return `
      <div class="mb-4 last:mb-0">
        <p class="text-[11px] font-extrabold uppercase tracking-wider text-[#A89F98] mb-2">Kurikulum Modul</p>
        <div class="space-y-2">
          ${state.courseModules.map((item) => {
            const itemId = item.moduleId;
            const active = state.currentModuleId === itemId;
            const done = isModuleDone(itemId);
            return `
              <button type="button" data-lesson-id="${esc(itemId)}" class="w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${active ? 'bg-[#FDF0EB] border-[#D97757]' : 'bg-[#FAF8F5] border-[#E8E2DA] hover:border-[#D97757]/60'}">
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
    `;
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
    if (!state.microTasks.length) {
      return '<p class="text-xs text-[#6B6560] py-6 text-center">Belum ada Micro-Task untuk modul ini.</p>';
    }
    return `
      <div class="space-y-2.5">
        ${state.microTasks.map((mt, idx) => {
          const done = Boolean(mt.isCompleted);
          const ready = !done && state.videoProgress >= mt.triggerPct;
          const badgeClass = done
            ? 'bg-[#8A9A86] text-white'
            : ready
              ? 'bg-[#FDF0EB] text-[#D97757]'
              : 'bg-[#F5F0EA] text-[#6B6560]';
          const badgeText = done ? 'Selesai' : ready ? 'Perlu Dikerjakan' : 'Terkunci';
          const cardClass = done
            ? 'bg-[#F0F3EF] border-[#8A9A86]'
            : ready
              ? 'bg-[#FDF0EB]/50 border-[#F2A68D]'
              : 'bg-[#FAF8F5] border-[#E8E2DA]';
          return `
            <div class="p-3.5 rounded-2xl border transition-all space-y-2.5 ${cardClass}">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5 mb-1">
                    <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#A89F98]">Checkpoint ${idx + 1} · Menit ${formatTime(mt.timestampSeconds)}</span>
                    <span class="text-[10px] font-bold text-[#6B6560]">· ${esc(mt.taskType || 'CHECKPOINT')}</span>
                  </div>
                  <p class="text-xs font-bold text-[#2C2A27] leading-relaxed">${esc(mt.questionText)}</p>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${badgeClass}">${badgeText}</span>
              </div>
              <div class="flex items-center justify-between gap-2 pt-1">
                <span class="text-[11px] font-semibold text-[#6B6560]">${done ? `Skor ${Math.round(Number(mt.score ?? 100))}` : ready ? 'Membuka kunci video' : `Terbuka di ${mt.triggerPct}%`}</span>
                <button type="button" data-mt-id="${esc(mt.taskId)}" class="px-3 py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer ${done ? 'bg-white border border-[#8A9A86] text-[#5E7C6B]' : 'bg-[#D97757] text-white hover:opacity-95'}">
                  ${done ? 'Lihat / Perbarui' : 'Kerjakan / Submit'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderMicroTaskModal() {
    const mt = state.activeMicroTask;
    return `
      <div id="microtask-overlay" class="fixed inset-0 z-50 bg-[#2C2A27]/45 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-lg bg-[#FDFBF7] border border-[#E8E2DA] rounded-3xl p-6 shadow-xl animate-slide-up">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-full bg-[#FDF0EB] text-[#D97757] text-[11px] font-extrabold">Checkpoint ${formatTime(mt.timestampSeconds)}</span>
              <span class="text-[11px] font-bold text-[#6B6560]">${esc(mt.taskType || 'VIDEO_CHECKPOINT')}</span>
            </div>
            <button type="button" id="mt-close" class="p-1 rounded-lg text-[#6B6560] hover:bg-[#F5F0EA] cursor-pointer" aria-label="Tutup Sementara"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>
          <h3 class="text-lg font-black text-[#2C2A27]">Checkpoint Micro-Task</h3>
          <p class="text-xs text-[#2C2A27] leading-relaxed mt-2 mb-4">${esc(mt.questionText)}</p>
          ${state.mtError ? `<div class="mb-3 p-2.5 rounded-xl bg-[#FDF0EB] border border-[#F2A68D] text-xs font-bold text-[#A64B2A]">${esc(state.mtError)}</div>` : ''}
          <textarea id="mt-submission" rows="4" placeholder="Tuliskan pemahaman, analisis, atau langkah implementasi Anda..." class="w-full p-3 rounded-xl bg-white border border-[#E8E2DA] text-xs text-[#2C2A27] focus:outline-none focus:border-[#D97757] mb-4"></textarea>
          <div class="flex justify-end gap-2">
            <button type="button" id="mt-cancel" class="px-4 py-2 rounded-xl border border-[#E8E2DA] text-xs font-bold text-[#6B6560] hover:bg-[#F5F0EA] cursor-pointer">Tutup Sementara</button>
            <button type="button" id="mt-submit" ${state.submittingTask ? 'disabled' : ''} class="px-5 py-2 rounded-xl bg-[#D97757] text-white text-xs font-extrabold cursor-pointer disabled:opacity-60">${state.submittingTask ? 'Mengirim...' : 'Kirim Jawaban'}</button>
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

  function bindEvents(cid) {
    const togglePlay = () => {
      if (state.playing) {
        stopVideoPlayback();
        render();
        return;
      }
      startVideoPlayback();
    };
    document.getElementById('cd-play-center')?.addEventListener('click', togglePlay);
    document.getElementById('cd-play-btn')?.addEventListener('click', togglePlay);

    document.getElementById('cd-open-locked-task')?.addEventListener('click', () => {
      syncTaskLockState();
      state.activeMicroTask = state.lockedTask || findBlockingTask() || null;
      state.mtError = '';
      render();
    });

    document.getElementById('cd-progress-track')?.addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const targetPct = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
      const blocker = findBlockingTask(targetPct);
      if (blocker) {
        lockPlayerOnTask(blocker);
        return;
      }
      state.videoProgress = targetPct;
      syncTaskLockState();
      if (state.videoProgress >= 100) {
        state.videoProgress = 100;
        stopVideoPlayback();
        updatePlayerProgressDom();
        handleVideoCompleted();
        return;
      }
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
      markModuleAsCompleted(state.currentModuleId, { auto: false });
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
        const picked = state.courseModules.find((m) => m.moduleId === btn.dataset.lessonId);
        if (picked) selectModule(picked, { autoPlay: false });
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
        state.activeMicroTask = state.microTasks.find((m) => String(m.taskId) === btn.dataset.mtId) || null;
        state.mtError = '';
        render();
      });
    });

    const closeMicroTaskModal = () => {
      state.activeMicroTask = null;
      state.mtError = '';
      syncTaskLockState();
      render();
    };
    document.getElementById('mt-close')?.addEventListener('click', closeMicroTaskModal);
    document.getElementById('mt-cancel')?.addEventListener('click', closeMicroTaskModal);
    document.getElementById('mt-submit')?.addEventListener('click', submitActiveMicroTask);

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

  document.addEventListener('DOMContentLoaded', async () => {
    const session = window.requireAuth?.({ requireOnboarded: true });
    if (!session) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('courseId') || params.get('id');

    if (!id) {
      state.loadError = 'Parameter courseId tidak ditemukan pada URL.';
      render();
      return;
    }

    const dbCourse = await (window.apiFetch ? window.apiFetch(`/api/courses/${encodeURIComponent(id)}`, null) : Promise.resolve(null));
    if (!dbCourse || !dbCourse.courseId) {
      state.loadError = `Course "${id}" tidak ditemukan di database.`;
      render();
      return;
    }

    state.course = dbCourse;
    state.fromDb = true;
    const dbModules = await (window.apiFetch ? window.apiFetch(`/api/courses/${encodeURIComponent(dbCourse.courseId)}/modules`, []) : Promise.resolve([]));
    state.courseModules = Array.isArray(dbModules)
      ? dbModules
          .filter((m) => m && (m.moduleId || m.id))
          .map((m) => {
            const mid = m.moduleId ?? m.id;
            const durationSeconds = Number(m.durationSeconds || 900);
            return {
              moduleId: mid,
              id: mid,
              title: m.title,
              videoUrl: m.videoUrl,
              durationSeconds,
              duration: `${Math.max(1, Math.round(durationSeconds / 60))} mnt`
            };
          })
      : [];

    if (!session.isGuest && session.userId) {
      const enrollments = await (window.apiFetch ? window.apiFetch(`/api/enrollments/user/${encodeURIComponent(session.userId)}`, []) : Promise.resolve([]));
      const match = Array.isArray(enrollments) ? enrollments.find((e) => e.courseId === dbCourse.courseId) : null;
      if (match) {
        state.enrollmentId = match.enrollmentId;
        state.courseProgress = Number(match.progressPercentage ?? 0);
      }
    }

    syncCompletedModulesFromDb(dbCourse.courseId);

    if (!state.courseModules.length) {
      state.feedbackMsg = 'Belum ada modul di database untuk course ini.';
      render();
      return;
    }

    await selectModule(state.courseModules[0], { autoPlay: false });
  });
})();
