(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const TOPIC_TASKS = {
    'System Design & Arsitektur API': {
      icon: 'layers',
      taskA: 'Jelaskan desain endpoint & strategi scaling untuk layanan high-traffic secara ringkas tanpa slide.',
      taskB: 'Berikan 2 umpan balik konstruktif — 1 kekuatan arsitektur dan 1 potensi bottleneck.',
      initialNote: 'Rubrik System Design: Klarifikasi skala (1m) -> API & DB (2m) -> Trade-off & Bottleneck.',
      captions: [
        {
          peer: '"Bisa jelaskan bagaimana kamu menangani rate limiting di API gateway saat lonjakan traffic?"',
          user: '"Kami pakai token bucket per user ID di Redis, plus read replica agar query utama tetap stabil."'
        },
        {
          peer: '"Menarik! Bagaimana fallback-nya jika node Redis sementara tidak merespons?"',
          user: '"Ada circuit breaker lokal in-memory sehingga request kritikal tetap berjalan aman tanpa cascade failure."'
        },
        {
          peer: '"Struktur metrik p95 dan proteksinya jelas. Coba tambahkan estimasi kapasitas koneksi pool DB."',
          user: '"Siap, kita batasi HikariCP sesuai jumlah core DB agar tidak terjadi thread contention."'
        }
      ]
    },
    'Mock Interview Java & Spring Boot': {
      icon: 'terminal',
      taskA: 'Uraikan alur Controller-Service-Repository serta penanganan N+1 query di Spring Boot dalam 1–2 menit.',
      taskB: 'Evaluasi kejelasan konsep transaksi JPA & berikan 1 pertanyaan follow-up teknis.',
      initialNote: 'Rubrik Interview Java: Separation of concerns -> Query tuning -> Validasi error handling.',
      captions: [
        {
          peer: '"Bagaimana cara kamu mencegah N+1 query saat mengambil daftar course beserta modulnya di JPA?"',
          user: '"Gunakan @EntityGraph atau JOIN FETCH di repository query agar relasi terambil dalam satu roundtrip."'
        },
        {
          peer: '"Bagus! Lalu kapan kamu memilih @Transactional(readOnly = true) di Service layer?"',
          user: '"Untuk seluruh method GET agar Hibernate melewati dirty checking dan koneksi DB lebih ringan."'
        },
        {
          peer: '"Penjelasan DTO boundary kamu solid. Pertajam contoh rollback untuk checked exception."',
          user: '"Siap, dengan @Transactional(rollbackFor = Exception.class) untuk alur yang membutuhkan rollback eksplisit."'
        }
      ]
    },
    'Pair Debugging Vanilla JS & UI': {
      icon: 'code',
      taskA: 'Ceritakan langkah isolasi bug state UI yang tidak sinkron dengan respons API secara terstruktur.',
      taskB: 'Catat 1 teknik debugging yang sudah tepat dan 1 edge case yang perlu diverifikasi.',
      initialNote: 'Checklist Debugging: Reproduksi kasus -> Cek payload network -> Validasi guard state.',
      captions: [
        {
          peer: '"Saat fetch gagal di tengah jalan, apa yang kamu cek pertama kali pada state UI-nya?"',
          user: '"Cek blok catch dan finally agar flag loading langsung direset dan UI menampilkan pesan error jelas."'
        },
        {
          peer: '"Tepat. Bagaimana jika tombol submit diklik dua kali sebelum respons API kembali?"',
          user: '"Kami pasang guard flag isSubmitting di state dan atribut disabled pada tombol selama request berlangsung."'
        },
        {
          peer: '"Alur reproduksinya rapi. Pastikan event listener tidak terdaftar ganda saat re-render."',
          user: '"Betul, setiap kali container dirender ulang, kita ikat ulang listener bersih di bindEvents."'
        }
      ]
    },
    'Bedah Arsitektur & Clean Code': {
      icon: 'git-branch',
      taskA: 'Presentasikan contoh refactoring kode duplikat menjadi helper modular yang mudah diuji.',
      taskB: 'Berikan feedback tentang keterbacaan nama fungsi, batas tanggung jawab, dan edge case.',
      initialNote: 'Fokus Clean Code: Single purpose -> Hindari duplikasi -> Penamaan fungsi yang eksplisit.',
      captions: [
        {
          peer: '"Di fungsi tadi ada dua cabang validasi yang mirip. Kriteria apa yang membuatmu mengekstrak helper?"',
          user: '"Begitu dua blok berbagi aturan bisnis yang sama dan harus berubah serentak, kita satukan jadi satu helper."'
        },
        {
          peer: '"Setuju. Apakah ada kasus edge case kosong atau null yang ikut ter-cover setelah digabung?"',
          user: '"Ya, guard null di awal helper langsung melindungi seluruh caller sekaligus."'
        },
        {
          peer: '"Penamaan helper-nya mudah dibaca sekilas. Pertahankan nesting maksimal dua tingkat."',
          user: '"Terima kasih! Early return membantu menjaga logika utama tetap datar dan jelas."'
        }
      ]
    },
    'SQL Query Optimization & Indexing': {
      icon: 'database',
      taskA: 'Jelaskan kapan composite index B-Tree efektif mempercepat query laporan berparameter.',
      taskB: 'Soroti kelebihan analisis query plan dan sarankan 1 skenario uji write overhead.',
      initialNote: 'Rubrik SQL Tuning: Selektivitas kolom -> Urutan index -> Dampak operasi INSERT/UPDATE.',
      captions: [
        {
          peer: '"Mengapa urutan kolom di composite index (user_id, enrolled_at) sangat berpengaruh di PostgreSQL?"',
          user: '"Karena B-Tree mengurutkan berdasar kolom paling kiri lebih dulu, cocok untuk filter = user_id lalu range tanggal."'
        },
        {
          peer: '"Tepat sekali. Bagaimana cara memverifikasi index-nya benar dipakai query planner?"',
          user: '"Jalankan EXPLAIN ANALYZE untuk memastikan rencana berubah dari Seq Scan menjadi Index Scan."'
        },
        {
          peer: '"Analisis selectivity bagus. Cek juga overhead write bila tabel punya terlalu banyak index."',
          user: '"Siap, kita ukur throughput INSERT dan buang index duplikat yang tidak dipakai."'
        }
      ]
    },
    'Code Review & Secure Coding': {
      icon: 'shield-check',
      taskA: 'Tunjukkan cara mendeteksi dan menutup celah IDOR/XSS pada endpoint API serta DOM rendering.',
      taskB: 'Berikan 2 catatan review: 1 praktik keamanan solid dan 1 celah validasi input tersisa.',
      initialNote: 'Checklist AppSec: Auth check per-resource -> Validasi DTO -> Escaping output HTML.',
      captions: [
        {
          peer: '"Di fitur sharing link tadi, bagaimana cara mencegah user memasukkan payload javascript:alert(1)?"',
          user: '"Validasi ketat protokol hanya http:// atau https:// baik di backend maupun sebelum render link di DOM."'
        },
        {
          peer: '"Bagus! Lalu bagaimana agar teks catatan biasa tidak dieksekusi sebagai tag HTML?"',
          user: '"Semua field dinamis selalu melewati helper esc() sebelum disisipkan ke template literal DOM."'
        },
        {
          peer: '"Pertahanan XSS rapi. Lanjutkan dengan audit ownership check sebelum rilis produksi."',
          user: '"Siap, tiap resource akan divalidasi kesesuaian pemiliknya dengan userId yang sedang aktif."'
        }
      ]
    },
    'Business & Pitching': {
      icon: 'briefcase',
      taskA: 'Present your 1-minute elevator pitch for your product idea. No slides — voice only.',
      taskB: 'Give 2 points of constructive feedback — one strength, one improvement area.',
      initialNote: 'Elevator pitch rubric: Hook (15s) -> Problem -> Traction -> Ask.',
      captions: [
        {
          peer: '"How do you quantify the ROI for your early enterprise pilot customers?"',
          user: '"We track time-to-hire reduction by 35% through verified Proof-of-Work portfolios."'
        },
        {
          peer: '"Clear hook! What makes your onboarding conversion sticky in week one?"',
          user: '"Learners get an immediate role-tailored skill roadmap and peer practice match right away."'
        },
        {
          peer: '"Strong problem framing. Tighten your closing ask with concrete pilot metrics."',
          user: '"Got it — leading with 3-month retention targets and onboarding volume."'
        }
      ]
    }
  };

  const DEFAULT_TASK = {
    icon: 'briefcase',
    taskA: 'Jelaskan konsep utama dan solusi implementasi proyek Anda dalam 1–2 menit secara ringkas.',
    taskB: 'Berikan 2 poin feedback konstruktif — 1 kekuatan utama dan 1 area peningkatan.',
    initialNote: 'Rubrik diskusi: Konteks masalah (15s) -> Solusi teknis -> Trade-off & evaluasi.',
    captions: [
      {
        peer: '"Bisa jelaskan komponen inti dari solusi yang baru saja kamu presentasikan?"',
        user: '"Fokus utamanya menjaga alur data tetap sederhana, terukur, dan tervalidasi di setiap batas modul."'
      },
      {
        peer: '"Bagaimana cara memvalidasi bahwa solusi tersebut tetap tahan terhadap input ekstrem?"',
        user: '"Dengan menambahkan pengecekan edge case serta integration test langsung ke database."'
      },
      {
        peer: '"Struktur penjelasannya jelas. Lanjutkan merangkum trade-off performa ke catatan bersama."',
        user: '"Siap, poin trade-off akan saya bagikan di Shared Links & Notes."'
      }
    ]
  };

  const params = new URLSearchParams(window.location.search);
  const durationMin = Math.max(1, Math.min(90, parseInt(params.get('duration'), 10) || 10));
  const totalSeconds = durationMin * 60;

  const state = {
    topic: (params.get('topic') || 'System Design & Arsitektur API').trim(),
    muted: false,
    handRaised: false,
    totalSeconds,
    remainingSeconds: totalSeconds,
    timerId: null,
    captionIndex: 0,
    captionTimerId: null,
    leaving: false,
    userName: 'Learner',
    userRole: 'Peserta Jalur Karier',
    notes: []
  };

  function getInitials(name) {
    return String(name || 'NL').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || 'NL';
  }

  function getFirstName(name) {
    return String(name || 'Learner').trim().split(/\s+/)[0] || 'Learner';
  }

  function formatMmSs(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    const mm = String(Math.floor(safe / 60)).padStart(2, '0');
    const ss = String(safe % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function syncUserIdentityUI() {
    const initialsEl = document.getElementById('pr-user-initials');
    const nameEl = document.getElementById('pr-user-name');
    const roleEl = document.getElementById('pr-user-role');
    if (initialsEl) initialsEl.textContent = getInitials(state.userName);
    if (nameEl) nameEl.textContent = `You (${getFirstName(state.userName)})`;
    if (roleEl) roleEl.textContent = state.userRole || 'Peserta Jalur Karier';
  }

  function syncControlsUI() {
    const muteBtn = document.getElementById('pr-btn-mute');
    const userMutePill = document.getElementById('pr-user-mute-pill');
    const userMuteText = document.getElementById('pr-user-mute-text');
    if (muteBtn) {
      muteBtn.classList.toggle('is-muted-active', state.muted);
      muteBtn.setAttribute('aria-pressed', String(state.muted));
      const label = muteBtn.querySelector('span');
      if (label) label.textContent = state.muted ? 'Unmute' : 'Mute';
    }
    if (userMutePill) userMutePill.classList.toggle('is-muted', state.muted);
    if (userMuteText) userMuteText.textContent = state.muted ? 'Muted / Tap to unmute' : 'Speaking / Tap to mute';

    const handBtn = document.getElementById('pr-btn-hand');
    const handBadge = document.getElementById('pr-hand-badge');
    if (handBtn) {
      handBtn.classList.toggle('is-terra-active', state.handRaised);
      handBtn.setAttribute('aria-pressed', String(state.handRaised));
    }
    if (handBadge) handBadge.classList.toggle('is-hidden', !state.handRaised);
    syncCaptionsUI();
  }

  function syncCaptionsUI() {
    const cfg = TOPIC_TASKS[state.topic] || DEFAULT_TASK;
    const list = cfg.captions || DEFAULT_TASK.captions;
    const item = list[state.captionIndex % list.length];
    const userBox = document.getElementById('pr-user-caption');
    const userText = document.getElementById('pr-user-caption-text');
    const peerText = document.getElementById('pr-peer-caption-text');
    if (userBox) userBox.classList.toggle('is-dimmed', state.muted);
    if (userText) {
      userText.textContent = state.muted
        ? 'Mikrofon dimatikan — klik Unmute untuk berbicara.'
        : item.user;
    }
    if (peerText) peerText.textContent = item.peer;
  }

  function startCaptionRotation() {
    if (state.captionTimerId) clearInterval(state.captionTimerId);
    state.captionTimerId = setInterval(() => {
      state.captionIndex += 1;
      syncCaptionsUI();
    }, 7000);
  }

  function renderNotes() {
    const listEl = document.getElementById('pr-notes-list');
    if (!listEl) return;
    listEl.innerHTML = state.notes.map((note) => {
      const isUrl = /^https?:\/\/\S+$/i.test(note.text);
      const bodyHtml = isUrl
        ? `<a href="${esc(note.text)}" target="_blank" rel="noopener noreferrer" class="pr-note-link">${esc(note.text)}</a>`
        : esc(note.text);
      return `
        <article class="pr-note-item">
          <div class="pr-note-meta">
            <span class="pr-note-author">${esc(note.author)}</span>
            <span class="pr-note-time">${esc(note.time)}</span>
          </div>
          <p class="pr-note-body">${bodyHtml}</p>
        </article>
      `;
    }).join('');
    listEl.scrollTop = listEl.scrollHeight;
  }

  function showError(msg) {
    const banner = document.getElementById('pr-error-banner');
    if (!banner) return;
    banner.textContent = msg;
    banner.classList.toggle('is-hidden', !msg);
  }

  function updateTimerDisplay() {
    const timerEl = document.getElementById('pr-timer-value');
    if (timerEl) timerEl.textContent = formatMmSs(state.remainingSeconds);
  }

  function startCountdown() {
    updateTimerDisplay();
    state.timerId = setInterval(() => {
      state.remainingSeconds = Math.max(0, state.remainingSeconds - 1);
      updateTimerDisplay();
      if (state.remainingSeconds === 0) {
        clearInterval(state.timerId);
        state.timerId = null;
        finishAndLeaveRoom();
      }
    }, 1000);
  }

  async function finishAndLeaveRoom() {
    if (state.leaving) return;
    state.leaving = true;
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    if (state.captionTimerId) {
      clearInterval(state.captionTimerId);
      state.captionTimerId = null;
    }

    const leaveBtn = document.getElementById('pr-leave-btn');
    const leaveText = leaveBtn?.querySelector('span');
    if (leaveBtn) leaveBtn.disabled = true;
    if (leaveText) leaveText.textContent = 'Menyimpan...';
    showError('');

    const session = window.getSession?.();
    const userNotesCount = state.notes.filter((n) => !n.isSystem).length;
    const elapsed = Math.max(0, state.totalSeconds - state.remainingSeconds);
    const sentimentScore = Math.min(95.0, 85.0 + Math.min(4, userNotesCount) * 2.0 + (elapsed >= 30 ? 2.0 : 0.0));

    if (session?.userId && !session.isGuest) {
      try {
        const res = await fetch('/api/studypod/sessions', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.userId,
            sessionType: 'PEER_MATCH',
            scenarioType: state.topic,
            sentimentScore
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      } catch (err) {
        state.leaving = false;
        if (leaveBtn) leaveBtn.disabled = false;
        if (leaveText) leaveText.textContent = 'Leave Room';
        showError(`Gagal menyimpan sesi latihan ke server: ${err.message}. Silakan coba klik Leave Room lagi.`);
        return;
      }
    }

    try {
      window.sessionStorage.setItem(
        'novastra_practice_notice',
        'Sesi latihan selesai dan tercatat di riwayat StudyPod!'
      );
    } catch {
      // Ignore storage failures in restricted contexts
    }
    window.location.href = '/quiz?completed=1';
  }

  async function hydrateUserFromProfile(session) {
    if (!session?.userId || session.isGuest) return;
    if (session.fullName && session.fullName !== 'Learner Novastra' && session.roleName) return;
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(session.userId)}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!res.ok) return;
      const profile = await res.json();
      if (profile.fullName) state.userName = profile.fullName;
      if (profile.roleName) state.userRole = profile.roleName;
      window.saveSession?.({
        userId: session.userId,
        fullName: state.userName,
        roleName: state.userRole,
        isOnboarded: session.isOnboarded
      });
      syncUserIdentityUI();
    } catch {
      // Non-blocking fallback to session values
    }
  }

  function initRoom() {
    const session = window.requireAuth?.({ requireOnboarded: true });
    if (!session) return;

    state.userName = session.fullName || 'Learner';
    state.userRole = session.roleName || 'Peserta Jalur Karier';

    const cfg = TOPIC_TASKS[state.topic] || DEFAULT_TASK;
    const titleEl = document.getElementById('pr-topic-title');
    const iconEl = document.getElementById('pr-topic-icon');
    const taskAEl = document.getElementById('pr-task-a-text');
    const taskBEl = document.getElementById('pr-task-b-text');
    if (titleEl) titleEl.textContent = state.topic;
    if (iconEl) iconEl.setAttribute('data-lucide', cfg.icon);
    if (taskAEl) taskAEl.textContent = cfg.taskA;
    if (taskBEl) taskBEl.textContent = cfg.taskB;

    state.notes = [
      { author: 'Sarah K.', time: '01:12', text: cfg.initialNote, isSystem: true }
    ];

    syncUserIdentityUI();
    syncControlsUI();
    renderNotes();
    refreshIcons();
    startCountdown();
    startCaptionRotation();
    hydrateUserFromProfile(session);

    const toggleMute = () => { state.muted = !state.muted; syncControlsUI(); };
    document.getElementById('pr-btn-mute')?.addEventListener('click', toggleMute);
    document.getElementById('pr-user-mute-pill')?.addEventListener('click', toggleMute);

    document.getElementById('pr-btn-hand')?.addEventListener('click', () => {
      state.handRaised = !state.handRaised;
      syncControlsUI();
    });

    document.getElementById('pr-note-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('pr-note-input');
      const text = String(input?.value || '').trim();
      if (!text) return;
      const elapsed = Math.max(0, state.totalSeconds - state.remainingSeconds);
      state.notes.push({
        author: `You (${getFirstName(state.userName)})`,
        time: formatMmSs(elapsed),
        text,
        isSystem: false
      });
      if (input) input.value = '';
      renderNotes();
    });

    document.getElementById('pr-leave-btn')?.addEventListener('click', finishAndLeaveRoom);
  }

  document.addEventListener('DOMContentLoaded', initRoom);
})();
