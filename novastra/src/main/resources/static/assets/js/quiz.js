(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const state = {
    selectedTopic: '',
    topics: [],
    roleName: '',
    fullName: 'Learner',
    experienceLevel: 1,
    loading: true,
    loadError: '',
    language: 'Bahasa Indonesia',
    sessionLength: '10 Mins (Quick Practice)',
    skillBadge: 'Matched',
    completionNotice: ''
  };

  function getInitials(name) {
    return String(name || 'NV').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || 'NV';
  }

  function formatExperienceLevel(level) {
    const num = Number(level ?? 1);
    if (num >= 2) return 'Advanced';
    if (num === 1) return 'Intermediate';
    return 'Beginner';
  }

  function toTopicItem(raw) {
    return {
      id: raw.id,
      title: raw.title || raw.label || 'Practice Topic',
      activePeers: raw.activePeers ?? 0,
      icon: raw.icon || 'code',
      taskA: raw.taskA || '',
      taskB: raw.taskB || '',
      initialRubric: raw.initialRubric || ''
    };
  }

  function fallbackTopics() {
    return (window.NOVASTRA_DATA?.TOPICS || []).map(toTopicItem);
  }

  function render() {
    const main = document.getElementById('main-content');
    if (!main) return;
    const topics = state.topics;
    const activeTopic = topics.find((t) => t.id === state.selectedTopic) || topics[0] || null;
    const totalOnline = topics.reduce((acc, t) => acc + (t.activePeers || 0), 0);

    main.innerHTML = `
      <div class="sp-desktop-view space-y-6">
        ${state.completionNotice ? `
          <div class="p-4 rounded-2xl bg-[#F0F3EF] border border-[#8A9A86]/60 text-xs font-extrabold text-[#5E7C6B] flex items-center justify-between gap-3">
            <span>✓ ${esc(state.completionNotice)}</span>
            <button type="button" id="qz-dismiss-notice" class="text-[11px] underline cursor-pointer">Tutup</button>
          </div>
        ` : ''}

        <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl md:text-3xl font-black text-[#2C2A27]">Interactive Practice Arena</h1>
            <p class="text-sm text-[#6B6560] mt-1">Asah komunikasi teknis dan problem solving secara langsung bersama peer yang setara.</p>
          </div>
          <span class="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#F0F3EF] border border-[#8A9A86]/40 text-xs font-extrabold text-[#5E7C6B] shrink-0">
            <i data-lucide="users" class="w-4 h-4"></i> Match Peers
          </span>
        </section>

        <div class="grid grid-cols-1 min-[900px]:grid-cols-[64fr_36fr] gap-6 items-start">
          <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="text-lg font-black text-[#2C2A27]">Choose a Practice Focus</h2>
                <p class="text-xs text-[#6B6560] mt-0.5">Pilih satu fokus latihan untuk dipasangkan dengan peer yang setara.</p>
              </div>
              ${state.roleName ? `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF0EB] border border-[#D97757]/30 text-[11px] font-extrabold text-[#D97757]">
                  <i data-lucide="compass" class="w-3.5 h-3.5"></i>
                  Disesuaikan untuk jalur: ${esc(state.roleName)}
                </span>
              ` : ''}
            </div>

            ${state.loadError ? `
              <div class="p-3 rounded-xl bg-[#FDF0EB]/70 border border-[#D97757]/40 text-xs font-bold text-[#B85738]">
                ${esc(state.loadError)}
              </div>
            ` : ''}

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              ${state.loading ? `
                <div class="col-span-full py-10 text-center text-xs font-bold text-[#6B6560]">
                  Memuat topik latihan sesuai jalur karier Anda...
                </div>
              ` : topics.slice(0, 6).map((t) => {
                const active = activeTopic?.id === t.id;
                return `
                  <button type="button" data-topic-id="${esc(t.id)}" class="text-left p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${active ? 'bg-[#FDF0EB]/70 border-[#D97757] shadow-sm' : 'bg-[#FAF8F5] border-[#E8E2DA] hover:border-[#D97757]/60'}">
                    <div class="flex items-start gap-3 min-w-0">
                      <div class="w-[44px] h-[44px] rounded-xl flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-[#D97757] text-white' : 'bg-[#F5F0EA] text-[#6B6560]'}">
                        <i data-lucide="${esc(t.icon || 'code')}" class="w-5 h-5"></i>
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-extrabold text-[#2C2A27] leading-snug">${esc(t.title)}</p>
                        <p class="text-[11px] font-semibold text-[#6B6560] mt-1">${t.activePeers} peers aktif</p>
                      </div>
                    </div>
                    <span class="w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${active ? 'border-[#D97757]' : 'border-[#D5CEC6]'}">
                      ${active ? `<span class="w-2.5 h-2.5 rounded-full bg-[#D97757]"></span>` : ''}
                    </span>
                  </button>
                `;
              }).join('')}
            </div>
          </section>

          <aside class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-black text-[#2C2A27]">Matching Preferences</h2>
              <button type="button" id="qz-skill-badge" class="px-2.5 py-1 rounded-full text-[11px] font-extrabold cursor-pointer ${state.skillBadge === 'Matched' ? 'bg-[#F0F3EF] text-[#5E7C6B]' : 'bg-[#F5F0EA] text-[#6B6560]'}">${esc(state.skillBadge)}</button>
            </div>

            <div>
              <label for="qz-lang" class="block text-xs font-bold text-[#6B6560] mb-1.5">Language</label>
              <select id="qz-lang" class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2DA] text-xs font-bold text-[#2C2A27] focus:outline-none focus:border-[#D97757]">
                ${['Bahasa Indonesia', 'English', 'Bilingual'].map((l) => `<option value="${l}" ${state.language === l ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
            </div>

            <div>
              <label for="qz-length" class="block text-xs font-bold text-[#6B6560] mb-1.5">Session Length</label>
              <select id="qz-length" class="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2DA] text-xs font-bold text-[#2C2A27] focus:outline-none focus:border-[#D97757]">
                ${['10 Mins (Quick Practice)', '25 Mins (Deep Dive)', '45 Mins (Full Mock)'].map((len) => `<option value="${len}" ${state.sessionLength === len ? 'selected' : ''}>${len}</option>`).join('')}
              </select>
            </div>

            <div class="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#F0F3EF]/60 border border-[#8A9A86]/30">
              <span class="flex items-center gap-2 text-xs font-bold text-[#5E7C6B]">
                <span class="w-2.5 h-2.5 rounded-full bg-[#8A9A86] animate-dot-pulse"></span>
                Peers Online Now
              </span>
              <span class="text-xs font-black text-[#2C2A27] font-mono">${totalOnline} online</span>
            </div>

            <button type="button" id="qz-enter-room" ${!activeTopic ? 'disabled' : ''} class="w-full h-[52px] rounded-2xl bg-[#D97757] hover:opacity-95 disabled:opacity-50 text-white text-sm font-extrabold shadow-sm transition-opacity cursor-pointer">
              Masuk Live Practice Room (${esc(activeTopic?.title?.split(' ')[0] || 'Match')})
            </button>
          </aside>
        </div>
      </div>

      <div class="sp-mobile-view">
        ${state.completionNotice ? `
          <div class="p-3.5 rounded-2xl bg-[#F0F3EF] border border-[#8A9A86]/60 text-xs font-extrabold text-[#5E7C6B] flex items-center justify-between gap-2">
            <span>✓ ${esc(state.completionNotice)}</span>
            <button type="button" id="sp-mobile-dismiss-notice" class="text-[11px] underline cursor-pointer shrink-0">Tutup</button>
          </div>
        ` : ''}

        <section class="sp-section" aria-label="Pilih Fokus Latihan">
          <div class="sp-head-row">
            <p class="sp-kicker">CHOOSE A PRACTICE FOCUS</p>
            ${state.roleName ? `<span class="sp-role-pill">${esc(state.roleName)}</span>` : ''}
          </div>

          ${state.loadError ? `
            <div class="p-3 rounded-2xl bg-[#FDF0EB] border border-[#D97757]/40 text-xs font-bold text-[#B85738]">
              ${esc(state.loadError)}
            </div>
          ` : ''}

          <div class="sp-topic-list">
            ${state.loading ? `
              <div class="p-6 rounded-2xl bg-white border border-[#E8E1DB] text-center text-xs font-bold text-[#78716C]">
                Memuat topik latihan sesuai jalur karier Anda...
              </div>
            ` : topics.slice(0, 6).map((t) => {
              const active = activeTopic?.id === t.id;
              const desc = t.taskA || t.taskB || t.initialRubric || `${t.activePeers} peers siap berdiskusi`;
              return `
                <button type="button" data-topic-id="${esc(t.id)}" class="sp-topic-card ${active ? 'is-selected' : ''}">
                  <span class="sp-topic-icon"><i data-lucide="${esc(t.icon || 'code')}" class="w-5 h-5"></i></span>
                  <span class="sp-topic-body">
                    <span class="block sp-topic-title">${esc(t.title)}</span>
                    <span class="block sp-topic-desc">${esc(desc)}</span>
                  </span>
                  <span class="sp-radio" aria-hidden="true">
                    ${active ? '<i data-lucide="check" class="w-3.5 h-3.5"></i>' : ''}
                  </span>
                </button>
              `;
            }).join('')}
          </div>
        </section>

        <section class="sp-section" aria-label="Preferensi Pencocokan">
          <p class="sp-kicker">MATCHING PREFERENCES</p>
          <div class="sp-pref-card">
            <div class="sp-pref-row">
              <label for="sp-mobile-length" class="sp-pref-label">
                <i data-lucide="timer" class="w-4 h-4 text-[#78716C]"></i>
                <span>Session Length</span>
              </label>
              <select id="sp-mobile-length" class="sp-pref-pill">
                ${[
                  ['5 Mins', '5 Mins'],
                  ['10 Mins (Quick Practice)', '10 Mins (Quick Practice)'],
                  ['15 Mins', '15 Mins']
                ].map(([val, lbl]) => `<option value="${val}" ${state.sessionLength === val ? 'selected' : ''}>${lbl}</option>`).join('')}
              </select>
            </div>

            <div class="sp-pref-row">
              <label for="sp-mobile-lang" class="sp-pref-label">
                <i data-lucide="globe" class="w-4 h-4 text-[#78716C]"></i>
                <span>Language</span>
              </label>
              <select id="sp-mobile-lang" class="sp-pref-pill">
                ${['Bahasa Indonesia', 'English'].map((l) => `<option value="${l}" ${state.language === l ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
            </div>

            <div class="sp-pref-row">
              <span class="sp-pref-label">
                <i data-lucide="bar-chart-2" class="w-4 h-4 text-[#78716C]"></i>
                <span>Skill Level</span>
              </span>
              <span class="sp-pref-pill">${esc(formatExperienceLevel(state.experienceLevel))}</span>
            </div>
          </div>
        </section>

        <section class="sp-arena-card" aria-label="Active Practice Arena">
          <div class="sp-head-row">
            <p class="sp-kicker">ACTIVE PRACTICE ARENA</p>
            <span class="sp-arena-dot" aria-hidden="true"></span>
          </div>
          <div class="sp-arena-row">
            <div class="sp-peer-avatars" aria-hidden="true">
              <span class="sp-peer-circle sp-peer-circle--user">${esc(getInitials(state.fullName))}</span>
              <span class="sp-peer-circle sp-peer-circle--partner"><i data-lucide="user-round" class="w-4 h-4"></i></span>
            </div>
            <p class="sp-arena-copy">Terhubung otomatis dengan rekan satu topik di jaringan yang sama</p>
          </div>
        </section>
      </div>

      <div class="sp-sticky-cta">
        <button type="button" id="sp-mobile-enter-room" ${!activeTopic ? 'disabled' : ''} class="sp-enter-btn">
          <i data-lucide="users" class="w-5 h-5"></i>
          <span>Masuk Live Practice Room</span>
        </button>
      </div>
    `;

    bindEvents(topics);
    if (window.lucide) window.lucide.createIcons();
  }

  function enterPracticeRoom(topics) {
    const activeTopic = topics.find((t) => t.id === state.selectedTopic) || topics[0];
    if (!activeTopic) return;
    try {
      window.sessionStorage.setItem('novastra_active_topic', activeTopic.title);
      window.sessionStorage.setItem('novastra_active_topic_meta', JSON.stringify({
        id: activeTopic.id,
        title: activeTopic.title,
        icon: activeTopic.icon,
        taskA: activeTopic.taskA,
        taskB: activeTopic.taskB,
        initialRubric: activeTopic.initialRubric
      }));
    } catch {
      // Non-blocking if storage is restricted
    }
    const query = new URLSearchParams({
      topic: activeTopic.title,
      duration: String(parseInt(state.sessionLength, 10) || 10),
      lang: state.language
    });
    window.location.href = `/practice-room.html?${query.toString()}`;
  }

  function bindEvents(topics) {
    const dismissNotice = () => {
      state.completionNotice = '';
      render();
    };
    document.getElementById('qz-dismiss-notice')?.addEventListener('click', dismissNotice);
    document.getElementById('sp-mobile-dismiss-notice')?.addEventListener('click', dismissNotice);
    document.querySelectorAll('[data-topic-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedTopic = btn.dataset.topicId;
        render();
      });
    });

    document.getElementById('qz-lang')?.addEventListener('change', (e) => { state.language = e.target.value; });
    document.getElementById('sp-mobile-lang')?.addEventListener('change', (e) => { state.language = e.target.value; });
    document.getElementById('qz-length')?.addEventListener('change', (e) => { state.sessionLength = e.target.value; });
    document.getElementById('sp-mobile-length')?.addEventListener('change', (e) => { state.sessionLength = e.target.value; });
    document.getElementById('qz-skill-badge')?.addEventListener('click', () => {
      state.skillBadge = state.skillBadge === 'Matched' ? 'Locked' : 'Matched';
      render();
    });
    document.getElementById('qz-enter-room')?.addEventListener('click', () => enterPracticeRoom(topics));
    document.getElementById('sp-mobile-enter-room')?.addEventListener('click', () => enterPracticeRoom(topics));
  }

  async function loadRoleTopics(session) {
    if (session?.fullName) state.fullName = session.fullName;
    if (!session?.userId || session.isGuest) {
      state.topics = fallbackTopics();
      state.selectedTopic = state.topics[0]?.id || '';
      state.loading = false;
      render();
      return;
    }

    try {
      const res = await fetch(`/api/studypod/topics/${encodeURIComponent(session.userId)}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      state.roleName = data.roleName || session.roleName || '';
      if (data.fullName) state.fullName = data.fullName;
      if (data.experienceLevel !== undefined && data.experienceLevel !== null) {
        state.experienceLevel = Number(data.experienceLevel);
      }
      const serverTopics = Array.isArray(data.topics) ? data.topics.map(toTopicItem) : [];
      state.topics = serverTopics.length ? serverTopics : fallbackTopics();
      state.loadError = '';
    } catch {
      state.roleName = session.roleName || '';
      state.topics = fallbackTopics();
      state.loadError = 'Gagal memuat topik spesifik role dari server — menampilkan daftar standar.';
    } finally {
      state.selectedTopic = state.topics[0]?.id || '';
      state.loading = false;
      render();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const session = window.requireAuth ? window.requireAuth({ requireOnboarded: true }) : null;
    if (window.requireAuth && !session) return;
    try {
      const stored = window.sessionStorage.getItem('novastra_practice_notice');
      if (stored) {
        state.completionNotice = stored;
        window.sessionStorage.removeItem('novastra_practice_notice');
      } else if (new URLSearchParams(window.location.search).get('completed') === '1') {
        state.completionNotice = 'Sesi latihan selesai dan tercatat di riwayat StudyPod!';
      }
    } catch {
      // Ignore storage errors
    }
    if (window.location.search.includes('completed=')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    render();
    loadRoleTopics(session);
  });
})();
