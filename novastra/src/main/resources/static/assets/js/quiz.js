(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const state = {
    selectedTopic: 'top-1',
    language: 'Bahasa Indonesia',
    sessionLength: '10 Mins (Quick Practice)',
    skillBadge: 'Matched',
    privacyAvatar: true,
    joiningRoom: false,
    sessionError: '',
    activeSession: null,
    inPracticeRoom: false,
    secondsLeft: 600,
    roomTimer: null,
    peerChat: []
  };

  function clearRoomTimer() {
    if (state.roomTimer) {
      clearInterval(state.roomTimer);
      state.roomTimer = null;
    }
  }

  function startRoomTimer() {
    clearRoomTimer();
    const mins = parseInt(state.sessionLength, 10) || 10;
    state.secondsLeft = mins * 60;
    state.roomTimer = setInterval(() => {
      state.secondsLeft = Math.max(0, state.secondsLeft - 1);
      const clock = document.getElementById('qz-room-clock');
      if (clock) {
        const mm = String(Math.floor(state.secondsLeft / 60)).padStart(2, '0');
        const ss = String(state.secondsLeft % 60).padStart(2, '0');
        clock.textContent = `${mm}:${ss}`;
      }
      if (state.secondsLeft === 0) clearRoomTimer();
    }, 1000);
  }

  function render() {
    const main = document.getElementById('main-content');
    if (!main) return;
    const topics = window.NOVASTRA_DATA?.TOPICS || [];
    const activeTopic = topics.find((t) => t.id === state.selectedTopic) || topics[0];
    const totalOnline = topics.reduce((acc, t) => acc + (t.activePeers || 0), 0);

    main.innerHTML = `
      <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-black text-[#2C2A27]">Interactive Practice Arena</h1>
          <p class="text-sm text-[#6B6560] mt-1">Asah komunikasi teknis dan problem solving secara langsung bersama peer yang setara.</p>
        </div>
        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#F0F3EF] border border-[#8A9A86]/40 text-xs font-extrabold text-[#5E7C6B] shrink-0">
          <i data-lucide="users" class="w-4 h-4"></i> Match Peers
        </span>
      </section>

      ${state.sessionError ? `<div class="p-4 rounded-2xl bg-[#FDF0EB] border border-[#F2A68D] text-xs font-bold text-[#A64B2A]">${esc(state.sessionError)}</div>` : ''}

      <div class="grid grid-cols-1 min-[900px]:grid-cols-[64fr_36fr] gap-6 items-start">
        <section class="p-6 rounded-3xl bg-white border border-[#E8E2DA] space-y-4">
          <div>
            <h2 class="text-lg font-black text-[#2C2A27]">Choose a Practice Focus</h2>
            <p class="text-xs text-[#6B6560] mt-0.5">Pilih satu fokus latihan untuk dipasangkan dengan peer yang setara.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            ${topics.slice(0, 6).map((t) => {
              const active = state.selectedTopic === t.id;
              return `
                <button type="button" data-topic-id="${esc(t.id)}" class="text-left p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${active ? 'bg-[#FDF0EB]/70 border-[#D97757] shadow-sm' : 'bg-[#FAF8F5] border-[#E8E2DA] hover:border-[#D97757]/60'}">
                  <div class="flex items-start gap-3 min-w-0">
                    <div class="w-[44px] h-[44px] rounded-xl flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-[#D97757] text-white' : 'bg-[#F5F0EA] text-[#6B6560]'}">
                      <i data-lucide="${esc(t.icon || 'code')}" class="w-5 h-5"></i>
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-extrabold text-[#2C2A27] leading-snug">${esc(t.label)}</p>
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

          <div class="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2DA] flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-extrabold text-[#2C2A27]">Privacy Avatar Filter</p>
              <p class="text-[11px] text-[#6B6560]">Sembunyikan identitas asli selama sesi</p>
            </div>
            <button type="button" id="qz-privacy-toggle" role="switch" aria-checked="${state.privacyAvatar}" class="w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${state.privacyAvatar ? 'bg-[#8A9A86]' : 'bg-[#D5CEC6]'}">
              <span class="block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${state.privacyAvatar ? 'translate-x-5' : 'translate-x-0'}"></span>
            </button>
          </div>

          <div class="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#F0F3EF]/60 border border-[#8A9A86]/30">
            <span class="flex items-center gap-2 text-xs font-bold text-[#5E7C6B]">
              <span class="w-2.5 h-2.5 rounded-full bg-[#8A9A86] animate-dot-pulse"></span>
              Peers Online Now
            </span>
            <span class="text-xs font-black text-[#2C2A27] font-mono">${totalOnline} online</span>
          </div>

          <button type="button" id="qz-enter-room" ${state.joiningRoom ? 'disabled' : ''} class="w-full h-[52px] rounded-2xl bg-[#D97757] hover:opacity-95 text-white text-sm font-extrabold shadow-sm transition-opacity cursor-pointer disabled:opacity-60">
            ${state.joiningRoom ? 'Menghubungkan Room...' : `Masuk Live Practice Room (${esc(activeTopic?.label?.split(' ')[0] || 'Match')})`}
          </button>
        </aside>
      </div>

      ${state.inPracticeRoom ? renderLivePracticeModal(activeTopic) : ''}
    `;

    bindEvents(topics);
    if (window.lucide) window.lucide.createIcons();
  }

  function renderLivePracticeModal(activeTopic) {
    const mm = String(Math.floor(state.secondsLeft / 60)).padStart(2, '0');
    const ss = String(state.secondsLeft % 60).padStart(2, '0');
    const savedBadge = state.activeSession?.sessionId
      ? `Sesi ${state.activeSession.sessionId} · PEER_MATCH`
      : 'PEER_MATCH';

    return `
      <div id="qz-room-modal" class="fixed inset-0 z-50 bg-[#2C2A27]/45 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-2xl bg-[#FDFBF7] border border-[#E8E2DA] rounded-3xl p-6 shadow-xl animate-slide-up space-y-4">
          <div class="flex items-center justify-between gap-3 pb-3 border-b border-[#E8E2DA]">
            <div>
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="px-2.5 py-0.5 rounded-full bg-[#F0F3EF] text-[#5E7C6B] text-[11px] font-extrabold">${state.privacyAvatar ? 'Anon Avatar Aktif' : 'Profil Publik'} · ${esc(state.language)}</span>
                <span class="px-2.5 py-0.5 rounded-full bg-[#FDF0EB] text-[#D97757] text-[11px] font-extrabold">${esc(savedBadge)}</span>
              </div>
              <h3 class="text-lg font-black text-[#2C2A27] mt-1">${esc(activeTopic?.label || 'Live Practice')}</h3>
            </div>
            <div class="flex items-center gap-3">
              <span id="qz-room-clock" class="px-3 py-1.5 rounded-xl bg-white border border-[#E8E2DA] font-mono text-sm font-extrabold text-[#D97757]">${mm}:${ss}</span>
              <button type="button" id="qz-leave-room" class="px-3 py-1.5 rounded-xl bg-[#F8ECEB] text-[#A65D57] text-xs font-extrabold cursor-pointer">Keluar</button>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-white border border-[#E8E2DA] h-64 overflow-y-auto space-y-2.5">
            ${state.peerChat.map((m) => `
              <div class="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2DA] text-xs">
                <span class="font-extrabold text-[#D97757]">${esc(m.sender)}:</span>
                <span class="text-[#2C2A27]"> ${esc(m.text)}</span>
              </div>
            `).join('')}
          </div>

          <form id="qz-room-form" class="flex gap-2">
            <input id="qz-room-input" type="text" placeholder="Ketik respons diskusi dengan peer..." class="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#E8E2DA] text-xs focus:outline-none focus:border-[#D97757]" />
            <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#D97757] text-white text-xs font-extrabold cursor-pointer">Kirim</button>
          </form>
        </div>
      </div>
    `;
  }

  async function enterPracticeRoom(topics) {
    if (state.joiningRoom) return;
    const activeTopic = topics.find((t) => t.id === state.selectedTopic) || topics[0];
    const scenarioType = activeTopic?.label || 'Live Peer Practice';
    const session = window.getSession?.();

    state.sessionError = '';
    state.activeSession = null;

    if (session?.userId && !session.isGuest) {
      state.joiningRoom = true;
      render();
      try {
        const res = await fetch('/api/studypod/sessions', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.userId,
            sessionType: 'PEER_MATCH',
            scenarioType
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        state.activeSession = data;
      } catch (err) {
        state.joiningRoom = false;
        state.sessionError = `Gagal memulai sesi Live Practice Room: ${err.message}`;
        return render();
      }
      state.joiningRoom = false;
    }

    state.peerChat = [
      { sender: 'Peer #418 (Anonim)', text: `Halo! Siap bahas ${scenarioType} bersama hari ini?` }
    ];
    state.inPracticeRoom = true;
    startRoomTimer();
    render();
  }

  function bindEvents(topics) {
    document.querySelectorAll('[data-topic-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedTopic = btn.dataset.topicId;
        state.sessionError = '';
        render();
      });
    });

    document.getElementById('qz-lang')?.addEventListener('change', (e) => { state.language = e.target.value; });
    document.getElementById('qz-length')?.addEventListener('change', (e) => { state.sessionLength = e.target.value; });
    document.getElementById('qz-skill-badge')?.addEventListener('click', () => {
      state.skillBadge = state.skillBadge === 'Matched' ? 'Locked' : 'Matched';
      render();
    });
    document.getElementById('qz-privacy-toggle')?.addEventListener('click', () => {
      state.privacyAvatar = !state.privacyAvatar;
      render();
    });

    document.getElementById('qz-enter-room')?.addEventListener('click', () => enterPracticeRoom(topics));
    document.getElementById('qz-leave-room')?.addEventListener('click', () => {
      state.inPracticeRoom = false;
      clearRoomTimer();
      render();
    });
    document.getElementById('qz-room-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('qz-room-input');
      const text = (input?.value || '').trim();
      if (!text) return;
      state.peerChat.push({ sender: 'Anda', text });
      state.peerChat.push({ sender: 'Peer #418 (Anonim)', text: 'Poin bagus! Bagaimana kalau kita bandingkan kompleksitas & trade-off-nya?' });
      render();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (window.requireAuth && !window.requireAuth({ requireOnboarded: true })) return;
    render();
  });
})();
