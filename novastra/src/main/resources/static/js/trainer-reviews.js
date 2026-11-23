(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const state = {
    statusFilter: 'ALL',
    query: '',
    submissions: [],
    summary: { total: 0, pending: 0, verified: 0, rejected: 0 },
    selectedId: null,
    activeDetail: null,
    pendingPayload: null,
    saving: false,
    toastTimer: null
  };

  function safeHttpUrl(url) {
    const trimmed = String(url || '').trim();
    return /^https?:\/\/.+/i.test(trimmed) ? trimmed : '';
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function showToast(msg) {
    const toast = document.getElementById('tr-toast');
    const textEl = document.getElementById('tr-toast-text');
    if (!toast || !textEl) return;
    textEl.textContent = msg;
    toast.classList.remove('is-hidden');
    if (state.toastTimer) clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.add('is-hidden'), 4000);
  }

  function showFormError(msg) {
    const el = document.getElementById('tr-form-error');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('is-hidden', !msg);
  }

  function formatExpectedOutputHtml(raw) {
    const lines = String(raw || '').split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) {
      return '<p>Belum ada rincian Expected Output untuk proyek ini.</p>';
    }
    const prefixes = ['Tujuan Proyek:', 'Kriteria Wajib:', 'Format Pengumpulan:'];
    let html = '';
    let inList = false;
    const closeList = () => {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
    };
    for (const line of lines) {
      if (line.startsWith('- ')) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += `<li>${esc(line.slice(2).trim())}</li>`;
        continue;
      }
      closeList();
      const matched = prefixes.find((p) => line.startsWith(p));
      if (matched) {
        const rest = line.slice(matched.length).trim();
        html += `<p><strong>${esc(matched)}</strong>${rest ? ` ${esc(rest)}` : ''}</p>`;
      } else {
        html += `<p>${esc(line)}</p>`;
      }
    }
    closeList();
    return html;
  }

  function renderSummary() {
    const s = state.summary || {};
    document.getElementById('stat-total').textContent = String(s.total ?? 0);
    document.getElementById('stat-pending').textContent = String(s.pending ?? 0);
    document.getElementById('stat-verified').textContent = String(s.verified ?? 0);
    document.getElementById('stat-rejected').textContent = String(s.rejected ?? 0);
  }

  function statusBadgeClass(norm) {
    if (norm === 'VERIFIED') return 'tr-badge--verified';
    if (norm === 'REJECTED') return 'tr-badge--rejected';
    return 'tr-badge--pending';
  }

  function renderTable() {
    const tbody = document.getElementById('tr-submissions-tbody');
    const subEl = document.getElementById('tr-table-subtitle');
    if (!tbody) return;

    if (subEl) {
      subEl.textContent = `Menampilkan ${state.submissions.length} dari ${state.summary.total ?? 0} total submisi`;
    }

    if (!state.submissions.length) {
      tbody.innerHTML = `<tr class="tr-empty-row"><td colspan="6">Tidak ada submisi yang cocok dengan filter saat ini.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.submissions.map((item) => {
      const selected = state.selectedId === item.submissionId;
      const scoreVal = Math.round(Number(item.score ?? 0));
      return `
        <tr data-row-id="${esc(item.submissionId)}" class="tr-row ${selected ? 'is-selected' : ''}">
          <td class="tr-cell-id">${esc(item.submissionId)}</td>
          <td>
            <span class="tr-cell-name">${esc(item.userFullName)}</span>
            <span class="tr-cell-email">${esc(item.userEmail)}</span>
          </td>
          <td>
            <span class="tr-cell-project">${esc(item.projectTitle)}</span>
            <span class="tr-cell-course">${esc(item.courseTitle || item.courseId)}</span>
          </td>
          <td><span class="tr-badge ${statusBadgeClass(item.normalizedStatus)}">${esc(item.normalizedStatus)}</span></td>
          <td class="tr-cell-score">${scoreVal}</td>
          <td class="tr-col-action">
            <button type="button" data-review-btn="${esc(item.submissionId)}" class="tr-btn-review">Review</button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('[data-row-id]').forEach((row) => {
      row.addEventListener('click', () => openReviewDetail(row.dataset.rowId));
    });
    tbody.querySelectorAll('[data-review-btn]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openReviewDetail(btn.dataset.reviewBtn);
      });
    });
  }

  function renderDetailDrawer() {
    const emptyEl = document.getElementById('tr-detail-empty');
    const bodyEl = document.getElementById('tr-detail-content');
    const item = state.activeDetail;
    if (!emptyEl || !bodyEl) return;

    if (!item) {
      emptyEl.classList.remove('is-hidden');
      bodyEl.classList.add('is-hidden');
      return;
    }

    emptyEl.classList.add('is-hidden');
    bodyEl.classList.remove('is-hidden');

    document.getElementById('tr-detail-id').textContent = item.submissionId;
    document.getElementById('tr-detail-project').textContent = item.projectTitle;
    document.getElementById('tr-detail-course').textContent = item.courseTitle || item.courseId;

    const badge = document.getElementById('tr-detail-status-badge');
    badge.textContent = item.normalizedStatus;
    badge.className = `tr-badge ${statusBadgeClass(item.normalizedStatus)}`;

    document.getElementById('tr-detail-learner').textContent = item.userFullName;
    document.getElementById('tr-detail-email').textContent = item.userEmail;

    const linkEl = document.getElementById('tr-detail-link');
    const validHref = safeHttpUrl(item.externalUrl);
    if (validHref) {
      linkEl.href = validHref;
      linkEl.classList.remove('is-disabled');
    } else {
      linkEl.href = '#';
      linkEl.classList.add('is-disabled');
    }

    document.getElementById('tr-detail-expected').innerHTML = formatExpectedOutputHtml(item.expectedOutput);

    const scoreVal = Math.round(Number(item.score ?? 0));
    document.getElementById('tr-score-input').value = item.normalizedStatus === 'PENDING' && scoreVal === 0 ? '' : String(scoreVal);

    const targetDecision = item.normalizedStatus === 'REJECTED' ? 'REJECTED' : 'VERIFIED';
    document.querySelectorAll('input[name="tr-decision"]').forEach((radio) => {
      radio.checked = radio.value === targetDecision;
    });

    const fb = String(item.feedbackNotes || '').trim();
    document.getElementById('tr-feedback-input').value = /menunggu proses ai audit/i.test(fb) ? '' : fb;
    showFormError('');
  }

  function redirectToLogin() {
    window.location.replace('/trainer/login');
  }

  async function loadSubmissions() {
    const errEl = document.getElementById('tr-table-error');
    if (errEl) errEl.classList.add('is-hidden');

    const qs = new URLSearchParams();
    if (state.statusFilter && state.statusFilter !== 'ALL') qs.set('status', state.statusFilter);
    if (state.query.trim()) qs.set('q', state.query.trim());

    try {
      const res = await fetch(`/api/trainer/submissions?${qs.toString()}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      state.summary = data.summary || { total: 0, pending: 0, verified: 0, rejected: 0 };
      state.submissions = Array.isArray(data.submissions) ? data.submissions : [];
      renderSummary();
      renderTable();
      refreshIcons();
    } catch (err) {
      if (errEl) {
        errEl.textContent = `Gagal memuat daftar submisi: ${err.message}`;
        errEl.classList.remove('is-hidden');
      }
    }
  }

  async function openReviewDetail(submissionId) {
    if (!submissionId) return;
    state.selectedId = submissionId;
    renderTable();

    try {
      const res = await fetch(`/api/trainer/submissions/${encodeURIComponent(submissionId)}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      const detail = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(detail?.message || `HTTP ${res.status}`);
      state.activeDetail = detail;
      renderDetailDrawer();
      refreshIcons();
    } catch (err) {
      showFormError(`Gagal memuat detail submisi: ${err.message}`);
    }
  }

  function openConfirmModal(payload) {
    const item = state.activeDetail;
    if (!item) return;
    state.pendingPayload = payload;
    document.getElementById('tr-cf-id').textContent = item.submissionId;
    document.getElementById('tr-cf-learner').textContent = item.userFullName;
    document.getElementById('tr-cf-project').textContent = item.projectTitle;
    document.getElementById('tr-cf-score').textContent = `${payload.score} / 100`;
    document.getElementById('tr-cf-status').textContent = payload.status === 'VERIFIED' ? 'VERIFIED (Disetujui)' : 'REJECTED (Ditolak / Revisi)';
    document.getElementById('tr-cf-feedback').textContent = payload.feedbackNotes || '(Tidak ada catatan tambahan)';
    document.getElementById('tr-confirm-modal')?.classList.remove('is-hidden');
    refreshIcons();
  }

  function closeConfirmModal() {
    if (state.saving) return;
    state.pendingPayload = null;
    document.getElementById('tr-confirm-modal')?.classList.add('is-hidden');
  }

  async function submitConfirmedReview() {
    if (state.saving || !state.activeDetail || !state.pendingPayload) return;
    const confirmBtn = document.getElementById('tr-confirm-submit');
    state.saving = true;
    if (confirmBtn) confirmBtn.disabled = true;

    try {
      const res = await fetch(`/api/trainer/submissions/${encodeURIComponent(state.activeDetail.submissionId)}/review`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.pendingPayload)
      });
      if (res.status === 401) {
        state.saving = false;
        closeConfirmModal();
        redirectToLogin();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      if (data.summary) state.summary = data.summary;
      if (data.submission) state.activeDetail = data.submission;
      state.saving = false;
      closeConfirmModal();
      renderSummary();
      renderDetailDrawer();
      await loadSubmissions();
      showToast(data.message || 'Penilaian berhasil disimpan.');
    } catch (err) {
      state.saving = false;
      closeConfirmModal();
      showFormError(err.message || 'Gagal menyimpan penilaian ke server.');
    } finally {
      if (confirmBtn) confirmBtn.disabled = false;
    }
  }

  async function checkSession() {
    try {
      const res = await fetch('/api/trainer/session', { credentials: 'include', cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.authenticated) {
        redirectToLogin();
        return;
      }
      const nameEl = document.getElementById('tr-trainer-name');
      if (nameEl) nameEl.textContent = data?.trainerName || 'Novastra Trainer';
      loadSubmissions();
    } catch {
      redirectToLogin();
    }
  }

  function bindEvents() {
    document.getElementById('tr-logout-btn')?.addEventListener('click', async () => {
      await fetch('/api/trainer/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
      redirectToLogin();
    });

    document.querySelectorAll('[data-status-filter]').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.statusFilter = chip.dataset.statusFilter || 'ALL';
        document.querySelectorAll('[data-status-filter]').forEach((c) => {
          const active = c === chip;
          c.classList.toggle('is-active', active);
          c.setAttribute('aria-selected', String(active));
        });
        loadSubmissions();
      });
    });

    document.getElementById('tr-search-input')?.addEventListener('input', (e) => {
      state.query = e.target.value || '';
      loadSubmissions();
    });

    document.getElementById('tr-refresh-btn')?.addEventListener('click', loadSubmissions);

    document.getElementById('tr-review-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!state.activeDetail) return;

      const rawScore = document.getElementById('tr-score-input')?.value?.trim() || '';
      const score = Number(rawScore);
      const status = document.querySelector('input[name="tr-decision"]:checked')?.value || 'VERIFIED';
      const feedbackNotes = document.getElementById('tr-feedback-input')?.value?.trim() || '';

      if (rawScore === '' || !Number.isInteger(score) || score < 0 || score > 100) {
        showFormError('Skor harus berupa bilangan bulat antara 0 hingga 100.');
        return;
      }
      if (status === 'REJECTED' && !feedbackNotes) {
        showFormError('Catatan feedback wajib diisi jika status ditolak / perlu revisi.');
        return;
      }

      showFormError('');
      openConfirmModal({ score, feedbackNotes, status });
    });

    document.getElementById('tr-confirm-cancel')?.addEventListener('click', closeConfirmModal);
    document.getElementById('tr-confirm-submit')?.addEventListener('click', submitConfirmedReview);
    document.getElementById('tr-confirm-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'tr-confirm-modal') closeConfirmModal();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    refreshIcons();
    bindEvents();
    checkSession();
  });
})();
