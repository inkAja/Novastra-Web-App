(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const state = {
    selectedTopic: 'top-1',
    language: 'Bahasa Indonesia',
    sessionLength: '10 Mins (Quick Practice)',
    skillBadge: 'Matched',
    completionNotice: ''
  };

  function render() {
    const main = document.getElementById('main-content');
    if (!main) return;
    const topics = window.NOVASTRA_DATA?.TOPICS || [];
    const activeTopic = topics.find((t) => t.id === state.selectedTopic) || topics[0];
    const totalOnline = topics.reduce((acc, t) => acc + (t.activePeers || 0), 0);

    main.innerHTML = `
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

          <div class="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#F0F3EF]/60 border border-[#8A9A86]/30">
            <span class="flex items-center gap-2 text-xs font-bold text-[#5E7C6B]">
              <span class="w-2.5 h-2.5 rounded-full bg-[#8A9A86] animate-dot-pulse"></span>
              Peers Online Now
            </span>
            <span class="text-xs font-black text-[#2C2A27] font-mono">${totalOnline} online</span>
          </div>

          <button type="button" id="qz-enter-room" class="w-full h-[52px] rounded-2xl bg-[#D97757] hover:opacity-95 text-white text-sm font-extrabold shadow-sm transition-opacity cursor-pointer">
            Masuk Live Practice Room (${esc(activeTopic?.label?.split(' ')[0] || 'Match')})
          </button>
        </aside>
      </div>
    `;

    bindEvents(topics);
    if (window.lucide) window.lucide.createIcons();
  }

  function enterPracticeRoom(topics) {
    const activeTopic = topics.find((t) => t.id === state.selectedTopic) || topics[0];
    const query = new URLSearchParams({
      topic: activeTopic?.label || 'System Design & Arsitektur API',
      duration: String(parseInt(state.sessionLength, 10) || 10),
      lang: state.language
    });
    window.location.href = `/practice-room.html?${query.toString()}`;
  }

  function bindEvents(topics) {
    document.getElementById('qz-dismiss-notice')?.addEventListener('click', () => {
      state.completionNotice = '';
      render();
    });
    document.querySelectorAll('[data-topic-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedTopic = btn.dataset.topicId;
        render();
      });
    });

    document.getElementById('qz-lang')?.addEventListener('change', (e) => { state.language = e.target.value; });
    document.getElementById('qz-length')?.addEventListener('change', (e) => { state.sessionLength = e.target.value; });
    document.getElementById('qz-skill-badge')?.addEventListener('click', () => {
      state.skillBadge = state.skillBadge === 'Matched' ? 'Locked' : 'Matched';
      render();
    });
    document.getElementById('qz-enter-room')?.addEventListener('click', () => enterPracticeRoom(topics));
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (window.requireAuth && !window.requireAuth({ requireOnboarded: true })) return;
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
  });
})();
