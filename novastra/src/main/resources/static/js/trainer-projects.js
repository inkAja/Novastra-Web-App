(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const state = {
    courseFilter: '',
    courses: [],
    projects: [],
    editingProjectId: null,
    pendingConfirm: null,
    busy: false,
    toastTimer: null
  };

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function redirectToLogin() {
    window.location.replace('/trainer/login');
  }

  function showAlert(msg) {
    const el = document.getElementById('tp-alert');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('is-hidden', !msg);
  }

  function showToast(msg) {
    const toast = document.getElementById('tp-toast');
    const textEl = document.getElementById('tp-toast-text');
    if (!toast || !textEl) return;
    textEl.textContent = msg;
    toast.classList.remove('is-hidden');
    if (state.toastTimer) clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.add('is-hidden'), 4200);
  }

  async function apiJson(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',
      ...options
    });
    if (res.status === 401) {
      redirectToLogin();
      return null;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || `Permintaan gagal (HTTP ${res.status}).`);
    }
    return data;
  }

  function renderCourseSelects() {
    const filterEl = document.getElementById('tp-course-filter');
    const modalSelect = document.getElementById('tp-f-course');
    const optsHtml = state.courses.map((c) =>
      `<option value="${esc(c.courseId)}">${esc(c.courseId)} — ${esc(c.title)} (${esc(c.typeCourse)})</option>`
    ).join('');

    if (filterEl) {
      const prev = state.courseFilter;
      filterEl.innerHTML = `<option value="">Semua Course</option>${optsHtml}`;
      filterEl.value = prev;
    }
    if (modalSelect) {
      const currentVal = modalSelect.value;
      modalSelect.innerHTML = optsHtml;
      if (currentVal && state.courses.some((c) => c.courseId === currentVal)) {
        modalSelect.value = currentVal;
      }
    }
  }

  function renderTable() {
    const tbody = document.getElementById('tp-projects-tbody');
    const pill = document.getElementById('tp-count-pill');
    if (pill) pill.textContent = `${state.projects.length} Proyek`;
    if (!tbody) return;

    if (!state.projects.length) {
      tbody.innerHTML = '<tr class="tr-empty-row"><td colspan="6">Belum ada target proyek untuk filter yang dipilih.</td></tr>';
      return;
    }

    tbody.innerHTML = state.projects.map((p) => {
      const subCount = Number(p.submissionCount || 0);
      return `
        <tr>
          <td class="tr-cell-id">${esc(p.projectId)}</td>
          <td><span class="tr-cell-name">${esc(p.title)}</span></td>
          <td>
            <span class="tr-cell-project">${esc(p.courseTitle || p.courseId)}</span>
            <span class="tr-cell-course">${esc(p.courseId)}</span>
          </td>
          <td class="tp-expected-cell">${esc(p.expectedOutput)}</td>
          <td>
            <span class="tp-sub-pill ${subCount > 0 ? 'has-sub' : ''}">${subCount} Peserta</span>
          </td>
          <td class="tr-col-action">
            <div class="tp-row-actions">
              <button type="button" data-edit-project="${esc(p.projectId)}" class="tr-btn-outline-sm">Edit</button>
              <button type="button" data-delete-project="${esc(p.projectId)}" class="tp-btn-danger-sm">Hapus</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('[data-edit-project]').forEach((btn) => {
      btn.addEventListener('click', () => openProjectModal(btn.dataset.editProject));
    });
    tbody.querySelectorAll('[data-delete-project]').forEach((btn) => {
      btn.addEventListener('click', () => promptDeleteProject(btn.dataset.deleteProject));
    });
  }

  async function loadProjects() {
    showAlert('');
    const qs = state.courseFilter ? `?courseId=${encodeURIComponent(state.courseFilter)}` : '';
    try {
      const data = await apiJson(`/api/trainer/projects${qs}`);
      if (!data) return;
      state.courses = Array.isArray(data.courses) ? data.courses : [];
      state.projects = Array.isArray(data.projects) ? data.projects : [];
      renderCourseSelects();
      renderTable();
      refreshIcons();
    } catch (err) {
      showAlert(err.message);
    }
  }

  function updateCharCounter() {
    const len = (document.getElementById('tp-f-expected')?.value || '').length;
    const counter = document.getElementById('tp-char-counter');
    if (counter) counter.textContent = `${len} / 255`;
  }

  function openProjectModal(projectId = null) {
    const p = projectId ? state.projects.find((item) => item.projectId === projectId) : null;
    state.editingProjectId = p ? p.projectId : null;
    document.getElementById('tp-fm-badge').textContent = p ? `Edit ${p.projectId}` : 'Tambah Proyek Tugas';
    document.getElementById('tp-fm-title').textContent = p ? `Perbarui Proyek: ${p.title}` : 'Tambah Target Proyek Portofolio';
    renderCourseSelects();
    const courseSel = document.getElementById('tp-f-course');
    if (courseSel) {
      courseSel.value = p ? p.courseId : (state.courseFilter || state.courses[0]?.courseId || '');
    }
    document.getElementById('tp-f-title').value = p ? p.title : '';
    document.getElementById('tp-f-expected').value = p ? p.expectedOutput : '';
    updateCharCounter();
    const errEl = document.getElementById('tp-fm-error');
    if (errEl) errEl.classList.add('is-hidden');
    document.getElementById('tp-form-modal')?.classList.remove('is-hidden');
  }

  function closeProjectModal() {
    document.getElementById('tp-form-modal')?.classList.add('is-hidden');
  }

  function openConfirmModal({ badge, title, desc, rows, btnLabel, danger, onConfirm }) {
    state.pendingConfirm = onConfirm;
    document.getElementById('tp-cf-badge').textContent = badge;
    document.getElementById('tp-cf-title').textContent = title;
    document.getElementById('tp-cf-desc').textContent = desc;
    document.getElementById('tp-cf-summary').innerHTML = rows.map(([k, v]) => `
      <div class="tr-confirm-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>
    `).join('');
    document.getElementById('tp-cf-submit')?.classList.toggle('tp-btn-danger-confirm', Boolean(danger));
    document.getElementById('tp-cf-btn-label').textContent = btnLabel;
    document.getElementById('tp-confirm-modal')?.classList.remove('is-hidden');
    refreshIcons();
  }

  function closeConfirmModal() {
    if (state.busy) return;
    state.pendingConfirm = null;
    document.getElementById('tp-confirm-modal')?.classList.add('is-hidden');
  }

  async function executePendingConfirm() {
    if (state.busy || typeof state.pendingConfirm !== 'function') return;
    const fn = state.pendingConfirm;
    const submitBtn = document.getElementById('tp-cf-submit');
    state.busy = true;
    if (submitBtn) submitBtn.disabled = true;
    try {
      await fn();
    } finally {
      state.busy = false;
      if (submitBtn) submitBtn.disabled = false;
      closeConfirmModal();
    }
  }

  function promptDeleteProject(projectId) {
    const p = state.projects.find((item) => item.projectId === projectId);
    if (!p) return;
    openConfirmModal({
      badge: 'Konfirmasi Hapus Proyek',
      title: 'Hapus target proyek tugas ini?',
      desc: 'Penghapusan akan diblokir (409 Conflict) apabila sudah ada submisi peserta pada proyek ini.',
      rows: [
        ['Kode Proyek', p.projectId],
        ['Course Induk', p.courseTitle || p.courseId],
        ['Judul Proyek', p.title],
        ['Jumlah Submisi', `${p.submissionCount} Peserta`]
      ],
      btnLabel: 'Ya, Hapus Proyek',
      danger: true,
      onConfirm: async () => {
        showAlert('');
        try {
          const data = await apiJson(`/api/trainer/projects/${encodeURIComponent(p.projectId)}`, { method: 'DELETE' });
          if (!data) return;
          await loadProjects();
          showToast(data.message || 'Target proyek berhasil dihapus.');
        } catch (err) {
          showAlert(err.message);
        }
      }
    });
  }

  async function initSession() {
    try {
      const res = await fetch('/api/trainer/session', { credentials: 'include', cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.authenticated) {
        redirectToLogin();
        return;
      }
      const nameEl = document.getElementById('tr-trainer-name');
      if (nameEl) nameEl.textContent = data?.trainerName || 'Novastra Trainer';
      await loadProjects();
    } catch {
      redirectToLogin();
    }
  }

  function bindEvents() {
    document.getElementById('tr-logout-btn')?.addEventListener('click', async () => {
      await fetch('/api/trainer/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
      redirectToLogin();
    });

    document.getElementById('tp-course-filter')?.addEventListener('change', (e) => {
      state.courseFilter = e.target.value || '';
      loadProjects();
    });

    document.getElementById('tp-refresh-btn')?.addEventListener('click', loadProjects);
    document.getElementById('tp-add-btn')?.addEventListener('click', () => openProjectModal(null));
    document.getElementById('tp-fm-cancel')?.addEventListener('click', closeProjectModal);
    document.getElementById('tp-form-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'tp-form-modal') closeProjectModal();
    });
    document.getElementById('tp-f-expected')?.addEventListener('input', updateCharCounter);

    document.getElementById('tp-project-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const courseId = document.getElementById('tp-f-course')?.value?.trim() || '';
      const title = document.getElementById('tp-f-title')?.value?.trim() || '';
      const expectedOutput = document.getElementById('tp-f-expected')?.value?.trim() || '';
      const errEl = document.getElementById('tp-fm-error');

      if (!courseId || !title || !expectedOutput) {
        if (errEl) {
          errEl.textContent = 'Course induk, judul proyek, dan Expected Output wajib diisi.';
          errEl.classList.remove('is-hidden');
        }
        return;
      }
      if (title.length > 60 || expectedOutput.length > 255) {
        if (errEl) {
          errEl.textContent = 'Panjang judul maksimal 60 karakter dan Expected Output maksimal 255 karakter.';
          errEl.classList.remove('is-hidden');
        }
        return;
      }
      if (errEl) errEl.classList.add('is-hidden');

      const courseObj = state.courses.find((c) => c.courseId === courseId);
      const isEdit = Boolean(state.editingProjectId);
      const targetId = state.editingProjectId;
      closeProjectModal();

      openConfirmModal({
        badge: isEdit ? 'Konfirmasi Perubahan Proyek' : 'Konfirmasi Proyek Baru',
        title: isEdit ? `Simpan perubahan proyek ${targetId}?` : 'Tambahkan target proyek baru?',
        desc: 'Proyek ini akan langsung terhubung ke course induk dan muncul pada Career Roadmap peserta.',
        rows: [
          ['Course Induk', courseObj ? `${courseObj.courseId} — ${courseObj.title}` : courseId],
          ['Judul Proyek', title],
          ['Panjang Expected Output', `${expectedOutput.length} karakter`]
        ],
        btnLabel: isEdit ? 'Ya, Simpan Perubahan' : 'Ya, Buat Target Proyek',
        danger: false,
        onConfirm: async () => {
          showAlert('');
          try {
            const url = isEdit
              ? `/api/trainer/projects/${encodeURIComponent(targetId)}`
              : '/api/trainer/projects';
            const data = await apiJson(url, {
              method: isEdit ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ courseId, title, expectedOutput })
            });
            if (!data) return;
            await loadProjects();
            showToast(data.message || 'Target proyek berhasil disimpan.');
          } catch (err) {
            showAlert(err.message);
          }
        }
      });
    });

    document.getElementById('tp-cf-cancel')?.addEventListener('click', closeConfirmModal);
    document.getElementById('tp-cf-submit')?.addEventListener('click', executePendingConfirm);
    document.getElementById('tp-confirm-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'tp-confirm-modal') closeConfirmModal();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    refreshIcons();
    bindEvents();
    initSession();
  });
})();
