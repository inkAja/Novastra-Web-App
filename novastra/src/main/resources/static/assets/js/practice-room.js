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
  const urlTopic = (params.get('topic') || '').trim();
  const savedTopic = (() => {
    try { return (window.sessionStorage.getItem('novastra_active_topic') || '').trim(); } catch { return ''; }
  })();
  const initialTopic = urlTopic || savedTopic || 'System Design & Arsitektur API';
  try { window.sessionStorage.setItem('novastra_active_topic', initialTopic); } catch { /* ignore */ }

  const durationMin = Math.max(1, Math.min(90, parseInt(params.get('duration'), 10) || 10));
  const totalSeconds = durationMin * 60;

  function loadStoredTopicConfig(topic) {
    try {
      const raw = window.sessionStorage.getItem('novastra_active_topic_meta');
      if (!raw) return null;
      const meta = JSON.parse(raw);
      if (meta && String(meta.title || '').trim().toLowerCase() === String(topic || '').trim().toLowerCase()) {
        return meta;
      }
    } catch {
      // Ignore invalid or restricted storage
    }
    return null;
  }

  function findStaticTopicConfig(topic) {
    const key = String(topic || '').trim().toLowerCase();
    const match = Object.entries(TOPIC_TASKS).find(([name]) => name.toLowerCase() === key);
    return match ? match[1] : null;
  }

  function resolveTopicConfig(topic, overrideMeta = null) {
    const base = findStaticTopicConfig(topic) || DEFAULT_TASK;
    const meta = overrideMeta || loadStoredTopicConfig(topic);
    if (!meta) return base;
    return {
      icon: meta.icon || base.icon,
      taskA: meta.taskA || base.taskA,
      taskB: meta.taskB || base.taskB,
      initialRubric: meta.initialRubric || base.initialNote,
      captions: base.captions
    };
  }

  const initialTopicMeta = loadStoredTopicConfig(initialTopic);

  const state = {
    userId: null,
    isGuest: false,
    topic: initialTopic,
    topicConfig: resolveTopicConfig(initialTopic, initialTopicMeta),
    hasMatchedMeta: Boolean(initialTopicMeta),
    muted: false,
    handRaised: false,
    totalSeconds,
    remainingSeconds: totalSeconds,
    timerId: null,
    captionIndex: 0,
    captionTimerId: null,
    pollTimerId: null,
    pollInFlight: false,
    joined: false,
    roomFull: false,
    leaving: false,
    userName: 'Learner',
    userRole: 'Peserta Jalur Karier',
    partner: null,
    notes: [],
    lastServerNotes: []
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
    const userMobileStatus = document.getElementById('pr-user-mobile-status');
    if (muteBtn) {
      muteBtn.classList.toggle('is-muted-active', state.muted);
      muteBtn.setAttribute('aria-pressed', String(state.muted));
      const label = muteBtn.querySelector('.pr-ctrl-label');
      if (label) label.textContent = state.muted ? 'Unmute' : 'Mute';
    }
    if (userMutePill) userMutePill.classList.toggle('is-muted', state.muted);
    if (userMuteText) userMuteText.textContent = state.muted ? 'Muted / Tap to unmute' : 'Speaking / Tap to mute';
    if (userMobileStatus) {
      userMobileStatus.textContent = state.handRaised ? 'Hand Raised ✋' : (state.muted ? 'Muted 🔇' : 'Speaking');
      userMobileStatus.classList.toggle('is-hand', state.handRaised);
      userMobileStatus.classList.toggle('is-muted', !state.handRaised && state.muted);
    }

    const handBtn = document.getElementById('pr-btn-hand');
    const handBadge = document.getElementById('pr-hand-badge');
    if (handBtn) {
      handBtn.classList.toggle('is-terra-active', state.handRaised);
      handBtn.setAttribute('aria-pressed', String(state.handRaised));
    }
    if (handBadge) handBadge.classList.toggle('is-hidden', !state.handRaised);
    syncCaptionsUI();
  }

  function syncPartnerUI(partner) {
    const card = document.getElementById('pr-card-peer');
    const outerRing = document.getElementById('pr-peer-outer-ring');
    const initialsEl = document.getElementById('pr-peer-initials');
    const nameEl = document.getElementById('pr-peer-name');
    const roleEl = document.getElementById('pr-peer-role');
    const handBadge = document.getElementById('pr-peer-hand-badge');
    const waitingPill = document.getElementById('pr-peer-waiting-pill');
    const mutedPill = document.getElementById('pr-peer-muted-pill');
    const speakingRow = document.getElementById('pr-peer-speaking-row');
    const peerMobileStatus = document.getElementById('pr-peer-mobile-status');
    const taskBOwner = document.getElementById('pr-task-b-owner');
    const captionSpeaker = document.getElementById('pr-peer-caption-speaker');

    const hasPartner = Boolean(partner);
    const isPartnerMuted = Boolean(partner?.isMuted);
    const isPartnerHand = Boolean(partner?.isHandRaised);

    if (card) {
      card.classList.toggle('pr-peer-card--active', hasPartner);
      card.classList.toggle('pr-peer-card--waiting', !hasPartner);
    }
    if (outerRing) {
      outerRing.classList.toggle('is-waiting', !hasPartner);
      outerRing.classList.toggle('is-muted', hasPartner && isPartnerMuted);
    }
    if (initialsEl) initialsEl.textContent = hasPartner ? getInitials(partner.fullName) : '..';
    if (nameEl) nameEl.textContent = hasPartner ? partner.fullName : 'Menunggu Peer...';
    if (roleEl) roleEl.textContent = hasPartner ? (partner.roleName || 'Peserta Jalur Karier') : 'Menunggu partner di topik yang sama';
    if (handBadge) handBadge.classList.toggle('is-hidden', !hasPartner || !isPartnerHand);
    if (waitingPill) waitingPill.classList.toggle('is-hidden', hasPartner);
    if (mutedPill) mutedPill.classList.toggle('is-hidden', !hasPartner || !isPartnerMuted);
    if (speakingRow) speakingRow.classList.toggle('is-hidden', !hasPartner || isPartnerMuted);
    if (peerMobileStatus) {
      peerMobileStatus.textContent = !hasPartner
        ? 'Waiting...'
        : (isPartnerHand ? 'Hand Raised ✋' : (isPartnerMuted ? 'Muted 🔇' : 'Connected'));
      peerMobileStatus.classList.toggle('is-waiting', !hasPartner);
      peerMobileStatus.classList.toggle('is-hand', hasPartner && isPartnerHand);
      peerMobileStatus.classList.toggle('is-muted', hasPartner && !isPartnerHand && isPartnerMuted);
      peerMobileStatus.classList.toggle('is-connected', hasPartner && !isPartnerHand && !isPartnerMuted);
    }
    if (taskBOwner) taskBOwner.textContent = hasPartner ? `Peer B (${getFirstName(partner.fullName)}):` : 'Peer B (Partner):';
    if (captionSpeaker) captionSpeaker.textContent = hasPartner ? `${getFirstName(partner.fullName)}:` : 'Partner:';
    syncCaptionsUI();
  }

  function syncCaptionsUI() {
    const cfg = TOPIC_TASKS[state.topic] || DEFAULT_TASK;
    const list = cfg.captions || DEFAULT_TASK.captions;
    const item = list[state.captionIndex % list.length];
    const userBox = document.getElementById('pr-user-caption');
    const userText = document.getElementById('pr-user-caption-text');
    const peerBox = document.getElementById('pr-peer-caption');
    const peerText = document.getElementById('pr-peer-caption-text');

    if (userBox) userBox.classList.toggle('is-dimmed', state.muted);
    if (userText) {
      userText.textContent = state.muted
        ? 'Mikrofon dimatikan — klik Unmute untuk berbicara.'
        : item.user;
    }

    const partner = state.partner;
    const peerDimmed = !partner || Boolean(partner.isMuted);
    if (peerBox) peerBox.classList.toggle('is-dimmed', peerDimmed);
    if (peerText) {
      if (!partner) {
        peerText.textContent = '"Menunggu partner bergabung ke ruang latihan ini..."';
      } else if (partner.isMuted) {
        peerText.textContent = '"Partner mematikan mikrofon."';
      } else {
        peerText.textContent = item.peer;
      }
    }
  }

  function startCaptionRotation() {
    if (state.captionTimerId) clearInterval(state.captionTimerId);
    state.captionTimerId = setInterval(() => {
      state.captionIndex += 1;
      syncCaptionsUI();
    }, 7000);
  }

  function buildTopicNotes(serverNotes) {
    const cfg = state.topicConfig || DEFAULT_TASK;
    const rubric = cfg.initialRubric || cfg.initialNote || DEFAULT_TASK.initialNote;
    const list = Array.isArray(serverNotes) ? serverNotes : [];
    const myName = String(state.userName || '').trim().toLowerCase();
    return [
      { senderName: 'Panduan Topik', timestamp: 'Rubrik', content: rubric, kind: 'rubric' },
      ...list.map((note) => {
        const sender = String(note.senderName || 'Peer').trim();
        const lower = sender.toLowerCase();
        const isSelf = lower.startsWith('you (') || (myName && lower === myName);
        return {
          senderName: sender || 'Peer',
          timestamp: note.timestamp || '',
          content: note.content || '',
          kind: isSelf ? 'self' : 'peer'
        };
      })
    ];
  }

  function syncTaskStatusUI() {
    const taskAStatus = document.getElementById('pr-task-a-status');
    const taskBStatus = document.getElementById('pr-task-b-status');
    const selfDone = state.notes.some((n) => n.kind === 'self');
    const peerDone = state.notes.some((n) => n.kind === 'peer');
    if (taskAStatus) {
      taskAStatus.textContent = selfDone ? '✓ Selesai' : 'Menunggu...';
      taskAStatus.classList.toggle('is-done', selfDone);
    }
    if (taskBStatus) {
      taskBStatus.textContent = peerDone ? '✓ Selesai' : 'Menunggu...';
      taskBStatus.classList.toggle('is-done', peerDone);
    }
  }

  function renderNotes(shouldScrollToBottom) {
    const listEl = document.getElementById('pr-notes-list');
    if (!listEl) return;
    listEl.innerHTML = state.notes.map((note) => {
      const text = String(note.content || '');
      const isUrl = /^https?:\/\/\S+$/i.test(text);
      const bodyHtml = isUrl
        ? `<a href="${esc(text)}" target="_blank" rel="noopener noreferrer" class="pr-note-link">${esc(text)}</a>`
        : esc(text);
      const kindClass = `pr-note-item--${esc(note.kind || 'peer')}`;
      return `
        <article class="pr-note-item ${kindClass}">
          <div class="pr-note-meta">
            <span class="pr-note-author">${esc(note.senderName)}</span>
            <span class="pr-note-time">${esc(note.timestamp)}</span>
          </div>
          <p class="pr-note-body">${bodyHtml}</p>
        </article>
      `;
    }).join('');
    syncTaskStatusUI();
    if (shouldScrollToBottom) {
      listEl.scrollTop = listEl.scrollHeight;
    }
  }

  function syncNotesFromServer(serverNotes, forceScroll) {
    const nextNotes = buildTopicNotes(serverNotes);
    const sig = (arr) => arr.map((n) => `${n.timestamp}|${n.senderName}|${n.content}`).join('\n');
    if (sig(state.notes) === sig(nextNotes)) return;

    const listEl = document.getElementById('pr-notes-list');
    const nearBottom = !listEl || (listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 28);
    const firstLoad = state.notes.length === 0;
    state.notes = nextNotes;
    renderNotes(Boolean(forceScroll || firstLoad || nearBottom));
  }

  function applyRoomState(roomData, options = {}) {
    if (!roomData || typeof roomData !== 'object') return;
    const participants = Array.isArray(roomData.participants) ? roomData.participants : [];
    const me = participants.find((p) => p.userId === state.userId) || null;
    if (me) {
      state.joined = true;
      state.userName = me.fullName || state.userName;
      state.userRole = me.roleName || state.userRole;
      state.muted = Boolean(me.isMuted);
      state.handRaised = Boolean(me.isHandRaised);
      syncUserIdentityUI();
      syncControlsUI();
    }

    const partner = participants.find((p) => p.userId !== state.userId) || null;
    state.partner = partner;
    state.lastServerNotes = Array.isArray(roomData.notes) ? roomData.notes : [];
    syncPartnerUI(partner);
    syncNotesFromServer(state.lastServerNotes, options.forceNoteScroll);
  }

  async function postRoomJson(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.message || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async function performRoomAction(actionType, payload = null) {
    if (!state.userId || state.isGuest) {
      if (actionType === 'TOGGLE_MUTE') { state.muted = !state.muted; syncControlsUI(); }
      if (actionType === 'TOGGLE_HAND') { state.handRaised = !state.handRaised; syncControlsUI(); }
      return null;
    }
    if (state.roomFull) return null;

    try {
      const roomData = await postRoomJson('/api/studypod/room/action', {
        userId: state.userId,
        scenarioType: state.topic,
        actionType,
        payload
      });
      showError('');
      applyRoomState(roomData, { forceNoteScroll: actionType === 'ADD_NOTE' });
      return roomData;
    } catch (err) {
      showError(`Gagal menyinkronkan aksi ke ruang latihan: ${err.message}`);
      return null;
    }
  }

  async function pollRoomState() {
    if (state.leaving || state.roomFull || state.pollInFlight) return;
    state.pollInFlight = true;
    try {
      const res = await fetch(`/api/studypod/room/state?scenarioType=${encodeURIComponent(state.topic)}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!res.ok) return;
      const roomData = await res.json().catch(() => null);
      if (!roomData) return;

      const participants = Array.isArray(roomData.participants) ? roomData.participants : [];
      if (state.joined && state.userId && !participants.some((p) => p.userId === state.userId)) {
        const rejoined = await postRoomJson('/api/studypod/room/join', {
          userId: state.userId,
          scenarioType: state.topic
        });
        applyRoomState(rejoined);
        return;
      }

      applyRoomState(roomData);
    } catch {
      // Transient LAN hiccup — next 2s poll retries automatically
    } finally {
      state.pollInFlight = false;
    }
  }

  function startRoomPolling() {
    if (state.pollTimerId) clearInterval(state.pollTimerId);
    state.pollTimerId = setInterval(pollRoomState, 2000);
  }

  async function joinRoomSession() {
    if (!state.userId || state.isGuest) return;
    try {
      const roomData = await postRoomJson('/api/studypod/room/join', {
        userId: state.userId,
        scenarioType: state.topic
      });
      showError('');
      applyRoomState(roomData, { forceNoteScroll: true });
      startRoomPolling();
    } catch (err) {
      if (err.status === 409) {
        state.roomFull = true;
        showError(err.message || 'Ruang latihan untuk topik ini sudah penuh (maksimal 2 peserta).');
      } else {
        showError(`Gagal terhubung ke ruang latihan: ${err.message}`);
      }
    }
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
    if (state.pollTimerId) {
      clearInterval(state.pollTimerId);
      state.pollTimerId = null;
    }

    const leaveBtn = document.getElementById('pr-leave-btn');
    const leaveDesktop = leaveBtn?.querySelector('.pr-leave-desktop');
    const leaveMobile = leaveBtn?.querySelector('.pr-leave-mobile');
    if (leaveBtn) leaveBtn.disabled = true;
    if (leaveDesktop) leaveDesktop.textContent = state.roomFull ? 'Kembali...' : 'Menyimpan...';
    if (leaveMobile) leaveMobile.textContent = '...';
    showError('');

    if (!state.roomFull && state.userId && !state.isGuest) {
      try {
        await postRoomJson('/api/studypod/room/leave', {
          userId: state.userId,
          scenarioType: state.topic
        });
      } catch (err) {
        state.leaving = false;
        if (leaveBtn) leaveBtn.disabled = false;
        if (leaveDesktop) leaveDesktop.textContent = 'Leave Room';
        if (leaveMobile) leaveMobile.textContent = 'Back';
        showError(`Gagal menyimpan sesi latihan ke server: ${err.message}. Silakan coba klik Leave Room lagi.`);
        return;
      }
    }

    try {
      window.sessionStorage.removeItem('novastra_active_topic');
      window.sessionStorage.removeItem('novastra_active_topic_meta');
      if (!state.roomFull) {
        window.sessionStorage.setItem(
          'novastra_practice_notice',
          'Sesi latihan selesai dan tercatat di riwayat StudyPod!'
        );
      }
    } catch {
      // Ignore storage failures in restricted contexts
    }
    window.location.href = state.roomFull ? '/quiz' : '/quiz?completed=1';
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

  function applyTopicDetails(cfg) {
    const titleEl = document.getElementById('pr-topic-title');
    const iconWrap = document.getElementById('pr-topic-icon')?.closest('.pr-topic-icon-wrap');
    const taskAEl = document.getElementById('pr-task-a-text');
    const taskBEl = document.getElementById('pr-task-b-text');
    if (titleEl) titleEl.textContent = state.topic;
    if (iconWrap) {
      iconWrap.innerHTML = `<i id="pr-topic-icon" data-lucide="${esc(cfg.icon || 'briefcase')}" class="pr-topic-icon"></i>`;
    }
    if (taskAEl) taskAEl.textContent = cfg.taskA || DEFAULT_TASK.taskA;
    if (taskBEl) taskBEl.textContent = cfg.taskB || DEFAULT_TASK.taskB;
    refreshIcons();
    syncNotesFromServer(state.lastServerNotes, false);
  }

  async function hydrateTopicFromApi(session) {
    if (state.hasMatchedMeta || !session?.userId || session.isGuest) return;
    try {
      const res = await fetch(`/api/studypod/topics/${encodeURIComponent(session.userId)}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      const topics = Array.isArray(data?.topics) ? data.topics : [];
      const targetKey = state.topic.toLowerCase();
      const matched = topics.find((t) => String(t.title || '').trim().toLowerCase() === targetKey);
      if (!matched) return;
      state.topicConfig = resolveTopicConfig(state.topic, matched);
      state.hasMatchedMeta = true;
      try {
        window.sessionStorage.setItem('novastra_active_topic_meta', JSON.stringify(matched));
      } catch {
        // Ignore storage restrictions
      }
      applyTopicDetails(state.topicConfig);
    } catch {
      // Non-blocking fallback to default task instructions
    }
  }

  async function initRoom() {
    const session = window.requireAuth?.({ requireOnboarded: true });
    if (!session) return;

    state.userId = session.userId || null;
    state.isGuest = Boolean(session.isGuest);
    state.userName = session.fullName || 'Learner';
    state.userRole = session.roleName || 'Peserta Jalur Karier';

    const durationPill = document.getElementById('pr-duration-pill');
    if (durationPill) durationPill.textContent = `${durationMin} Mins`;

    const noteInput = document.getElementById('pr-note-input');
    const mobileQuery = window.matchMedia?.('(max-width: 768px)');
    const syncNotePlaceholder = () => {
      if (!noteInput) return;
      noteInput.placeholder = mobileQuery?.matches ? 'Tuliskan solusi / review...' : 'Share Figma / Doc link...';
    };
    syncNotePlaceholder();
    mobileQuery?.addEventListener?.('change', syncNotePlaceholder);

    applyTopicDetails(state.topicConfig);

    syncUserIdentityUI();
    syncControlsUI();
    syncPartnerUI(null);
    syncNotesFromServer([], true);
    refreshIcons();
    startCountdown();
    startCaptionRotation();

    const toggleMute = () => performRoomAction('TOGGLE_MUTE');
    document.getElementById('pr-btn-mute')?.addEventListener('click', toggleMute);
    document.getElementById('pr-user-mute-pill')?.addEventListener('click', toggleMute);
    document.getElementById('pr-user-mobile-status')?.addEventListener('click', toggleMute);
    document.getElementById('pr-btn-hand')?.addEventListener('click', () => performRoomAction('TOGGLE_HAND'));

    document.getElementById('pr-note-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('pr-note-input');
      const shareBtn = document.getElementById('pr-share-btn');
      const text = String(input?.value || '').trim();
      if (!text) return;

      if (!state.userId || state.isGuest) {
        const elapsed = Math.max(0, state.totalSeconds - state.remainingSeconds);
        state.notes.push({
          senderName: `You (${getFirstName(state.userName)})`,
          timestamp: formatMmSs(elapsed),
          content: text,
          kind: 'self'
        });
        if (input) input.value = '';
        renderNotes(true);
        return;
      }

      if (shareBtn) shareBtn.disabled = true;
      const updated = await performRoomAction('ADD_NOTE', text);
      if (shareBtn) shareBtn.disabled = false;
      if (updated && input) {
        input.value = '';
        input.focus();
      }
    });

    document.getElementById('pr-leave-btn')?.addEventListener('click', finishAndLeaveRoom);

    await hydrateUserFromProfile(session);
    await hydrateTopicFromApi(session);
    await joinRoomSession();
  }

  document.addEventListener('DOMContentLoaded', initRoom);
})();
