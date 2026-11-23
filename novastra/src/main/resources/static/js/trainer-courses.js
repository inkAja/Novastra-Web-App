(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const state = {
    courses: [],
    roleNames: [],
    query: '',
    selectedCourseId: null,
    modules: [],
    editingCourseId: null,
    editingModuleId: null,
    pendingConfirm: null,
    busy: false,
    toastTimer: null
  };

  function safeHttpUrl(url) {
    const trimmed = String(url || '').trim();
    return /^https?:\/\/.+/i.test(trimmed) ? trimmed : '';
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function redirectToLogin() {
    window.location.replace('/trainer/login');
  }

  function formatDurationSeconds(sec) {
    const total = Math.max(0, Number(sec) || 0);
    const mins = Math.floor(total / 60);
    const rem = total % 60;
    if (mins === 0) return `${rem} dtk`;
    return rem > 0 ? `${mins}m ${rem}d (${total}s)` : `${mins} mnt (${total}s)`;
  }

  function showGlobalAlert(msg) {
    const el = document.getElementById('tc-alert');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('is-hidden', !msg);
  }

  function showToast(msg) {
    const toast = document.getElementById('tc-toast');
    const textEl = document.getElementById('tc-toast-text');
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

  function renderRoleDatalist() {
    const dl = document.getElementById('tc-role-datalist');
    if (!dl) return;
    const unique = Array.from(new Set([
      ...state.roleNames,
      ...state.courses.map((c) => c.typeCourse).filter(Boolean)
    ])).sort();
    dl.innerHTML = unique.map((r) => `<option value="${esc(r)}"></option>`).join('');
  }

  function renderCourses() {
    const listEl = document.getElementById('tc-course-list');
    const subEl = document.getElementById('tc-course-sub');
    if (!listEl) return;

    const q = state.query.trim().toLowerCase();
    const visible = state.courses.filter((c) => !q
      || String(c.courseId).toLowerCase().includes(q)
      || String(c.title).toLowerCase().includes(q)
      || String(c.typeCourse).toLowerCase().includes(q)
      || String(c.instructorName).toLowerCase().includes(q));

    if (subEl) {
      subEl.textContent = `Menampilkan ${visible.length} dari ${state.courses.length} course`;
    }

    if (!visible.length) {
      listEl.innerHTML = '<div class="tc-empty-box"><p>Tidak ada course yang cocok dengan pencarian.</p></div>';
      return;
    }

    listEl.innerHTML = visible.map((c) => {
      const selected = c.courseId === state.selectedCourseId;
      return `
        <article data-select-course="${esc(c.courseId)}" class="tc-course-item ${selected ? 'is-selected' : ''}">
          <div class="tc-course-top">
            <div class="tc-course-badges">
              <span class="tr-id-tag">${esc(c.courseId)}</span>
              <span class="tc-role-tag">${esc(c.typeCourse)}</span>
            </div>
            <div class="tc-course-actions">
              <button type="button" data-edit-course="${esc(c.courseId)}" class="tr-btn-outline-sm">Edit</button>
              <button type="button" data-delete-course="${esc(c.courseId)}" class="tc-btn-danger-sm">Hapus</button>
            </div>
          </div>
          <h3 class="tc-course-title">${esc(c.title)}</h3>
          <div class="tc-course-meta">
            <span>Instruktur: ${esc(c.instructorName)} · ${esc(c.duration)} mnt</span>
            <span>${esc(c.moduleCount)} materi · ${esc(c.projectCount)} proyek</span>
          </div>
        </article>
      `;
    }).join('');

    listEl.querySelectorAll('[data-select-course]').forEach((card) => {
      card.addEventListener('click', () => selectCourse(card.dataset.selectCourse));
    });
    listEl.querySelectorAll('[data-edit-course]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openCourseModal(btn.dataset.editCourse);
      });
    });
    listEl.querySelectorAll('[data-delete-course]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        promptDeleteCourse(btn.dataset.deleteCourse);
      });
    });
  }

  function renderModulesPanel() {
    const selectedCourse = state.courses.find((c) => c.courseId === state.selectedCourseId) || null;
    const idTag = document.getElementById('tc-selected-id');
    const roleTag = document.getElementById('tc-selected-role');
    const titleEl = document.getElementById('tc-module-title');
    const subEl = document.getElementById('tc-module-sub');
    const addBtn = document.getElementById('tc-add-module-btn');
    const emptyEl = document.getElementById('tc-module-empty');
    const wrapEl = document.getElementById('tc-module-wrap');
    const tbody = document.getElementById('tc-modules-tbody');

    if (!selectedCourse) {
      idTag?.classList.add('is-hidden');
      roleTag?.classList.add('is-hidden');
      if (titleEl) titleEl.textContent = 'Pilih Course di Sebelah Kiri';
      if (subEl) subEl.textContent = 'Klik salah satu course untuk melihat, menambah, atau mengubah materi videonya.';
      if (addBtn) addBtn.disabled = true;
      emptyEl?.classList.remove('is-hidden');
      wrapEl?.classList.add('is-hidden');
      return;
    }

    idTag.textContent = selectedCourse.courseId;
    idTag.classList.remove('is-hidden');
    roleTag.textContent = selectedCourse.typeCourse;
    roleTag.classList.remove('is-hidden');
    titleEl.textContent = selectedCourse.title;
    subEl.textContent = `Instruktur: ${selectedCourse.instructorName} · ${selectedCourse.duration} menit · ${state.modules.length} materi terdaftar`;
    addBtn.disabled = false;

    if (!state.modules.length) {
      emptyEl.querySelector('h3').textContent = 'Belum ada materi video';
      emptyEl.querySelector('p').textContent = 'Klik "+ Tambah Materi" untuk menambahkan modul pembelajaran pertama pada course ini.';
      emptyEl.classList.remove('is-hidden');
      wrapEl.classList.add('is-hidden');
      refreshIcons();
      return;
    }

    emptyEl.classList.add('is-hidden');
    wrapEl.classList.remove('is-hidden');

    tbody.innerHTML = state.modules.map((m) => {
      const safeUrl = safeHttpUrl(m.videoUrl);
      const previewHtml = safeUrl
        ? `<a href="${esc(safeUrl)}" target="_blank" rel="noopener noreferrer" class="tc-video-link"><span>Buka Video</span><i data-lucide="external-link" class="tr-icon-xs"></i></a>`
        : `<span class="tr-cell-email">${esc(m.videoUrl)}</span>`;
      return `
        <tr>
          <td><span class="tc-seq-pill">#${esc(m.sequenceOrder)}</span></td>
          <td class="tr-cell-id">${esc(m.moduleId)}</td>
          <td><span class="tr-cell-name">${esc(m.title)}</span></td>
          <td>${previewHtml}</td>
          <td>${esc(formatDurationSeconds(m.durationSeconds))}</td>
          <td class="tr-col-action">
            <div class="tc-row-actions">
              <button type="button" data-edit-module="${esc(m.moduleId)}" class="tr-btn-outline-sm">Edit</button>
              <button type="button" data-delete-module="${esc(m.moduleId)}" class="tc-btn-danger-sm">Hapus</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('[data-edit-module]').forEach((btn) => {
      btn.addEventListener('click', () => openModuleModal(btn.dataset.editModule));
    });
    tbody.querySelectorAll('[data-delete-module]').forEach((btn) => {
      btn.addEventListener('click', () => promptDeleteModule(btn.dataset.deleteModule));
    });
    refreshIcons();
  }

  async function loadCourses(preserveSelection = true) {
    showGlobalAlert('');
    try {
      const data = await apiJson('/api/trainer/courses');
      if (!data) return;
      state.courses = Array.isArray(data.courses) ? data.courses : [];
      state.roleNames = Array.isArray(data.roleNames) ? data.roleNames : [];
      renderRoleDatalist();

      const stillExists = preserveSelection && state.courses.some((c) => c.courseId === state.selectedCourseId);
      if (!stillExists) {
        state.selectedCourseId = state.courses[0]?.courseId || null;
      }
      renderCourses();
      if (state.selectedCourseId) {
        await loadModules(state.selectedCourseId);
      } else {
        state.modules = [];
        renderModulesPanel();
      }
      refreshIcons();
    } catch (err) {
      showGlobalAlert(err.message);
    }
  }

  async function loadModules(courseId) {
    if (!courseId) return;
    try {
      const data = await apiJson(`/api/trainer/courses/${encodeURIComponent(courseId)}/modules`);
      if (!data) return;
      state.modules = Array.isArray(data.modules) ? data.modules : [];
      renderModulesPanel();
    } catch (err) {
      showGlobalAlert(err.message);
    }
  }

  async function selectCourse(courseId) {
    if (!courseId) return;
    state.selectedCourseId = courseId;
    renderCourses();
    await loadModules(courseId);
  }

  function openCourseModal(courseId = null) {
    const course = courseId ? state.courses.find((c) => c.courseId === courseId) : null;
    state.editingCourseId = course ? course.courseId : null;
    document.getElementById('tc-cm-badge').textContent = course ? `Edit ${course.courseId}` : 'Tambah Course';
    document.getElementById('tc-cm-title').textContent = course ? `Perbarui Course: ${course.title}` : 'Tambah Course Baru';
    document.getElementById('tc-f-title').value = course ? course.title : '';
    document.getElementById('tc-f-role').value = course ? course.typeCourse : '';
    document.getElementById('tc-f-duration').value = course ? String(course.duration) : '';
    document.getElementById('tc-f-instructor').value = course ? course.instructorName : '';
    const errEl = document.getElementById('tc-cm-error');
    if (errEl) errEl.classList.add('is-hidden');
    document.getElementById('tc-course-modal')?.classList.remove('is-hidden');
  }

  function closeCourseModal() {
    document.getElementById('tc-course-modal')?.classList.add('is-hidden');
  }

  function openModuleModal(moduleId = null) {
    const selectedCourse = state.courses.find((c) => c.courseId === state.selectedCourseId);
    if (!selectedCourse) return;
    const mod = moduleId ? state.modules.find((m) => m.moduleId === moduleId) : null;
    state.editingModuleId = mod ? mod.moduleId : null;
    document.getElementById('tc-mm-badge').textContent = mod ? `Edit ${mod.moduleId}` : 'Tambah Materi';
    document.getElementById('tc-mm-title').textContent = mod ? `Perbarui Materi: ${mod.title}` : 'Tambah Materi Video Baru';
    document.getElementById('tc-mm-course-note').textContent = `Course induk: ${selectedCourse.courseId} — ${selectedCourse.title}`;
    document.getElementById('tc-m-title').value = mod ? mod.title : '';
    document.getElementById('tc-m-video').value = mod ? mod.videoUrl : '';
    document.getElementById('tc-m-duration').value = mod ? String(mod.durationSeconds) : '';
    document.getElementById('tc-m-seq').value = mod ? String(mod.sequenceOrder) : String(state.modules.length + 1);
    updateModuleDurationHint();
    const errEl = document.getElementById('tc-mm-error');
    if (errEl) errEl.classList.add('is-hidden');
    document.getElementById('tc-module-modal')?.classList.remove('is-hidden');
  }

  function closeModuleModal() {
    document.getElementById('tc-module-modal')?.classList.add('is-hidden');
  }

  function updateModuleDurationHint() {
    const val = Number(document.getElementById('tc-m-duration')?.value || 0);
    const hint = document.getElementById('tc-m-duration-hint');
    if (hint) {
      hint.textContent = val > 0 ? `Format terbaca: ${formatDurationSeconds(val)}` : 'Format terbaca: -';
    }
  }

  function openConfirmModal({ badge, title, desc, rows, btnLabel, danger, onConfirm }) {
    state.pendingConfirm = onConfirm;
    document.getElementById('tc-cf-badge').textContent = badge;
    document.getElementById('tc-cf-title').textContent = title;
    document.getElementById('tc-cf-desc').textContent = desc;
    document.getElementById('tc-cf-summary').innerHTML = rows.map(([k, v]) => `
      <div class="tr-confirm-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>
    `).join('');
    const submitBtn = document.getElementById('tc-cf-submit');
    submitBtn.classList.toggle('tc-btn-danger-confirm', Boolean(danger));
    document.getElementById('tc-cf-btn-label').textContent = btnLabel;
    document.getElementById('tc-confirm-modal')?.classList.remove('is-hidden');
    refreshIcons();
  }

  function closeConfirmModal() {
    if (state.busy) return;
    state.pendingConfirm = null;
    document.getElementById('tc-confirm-modal')?.classList.add('is-hidden');
  }

  async function executePendingConfirm() {
    if (state.busy || typeof state.pendingConfirm !== 'function') return;
    const fn = state.pendingConfirm;
    const submitBtn = document.getElementById('tc-cf-submit');
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

  function promptDeleteCourse(courseId) {
    const c = state.courses.find((item) => item.courseId === courseId);
    if (!c) return;
    openConfirmModal({
      badge: 'Konfirmasi Hapus Course',
      title: 'Hapus course ini dari database?',
      desc: 'Penghapusan hanya diizinkan apabila course belum memiliki materi modul, enrollment, atau target proyek.',
      rows: [
        ['Kode Course', c.courseId],
        ['Judul Course', c.title],
        ['Role / Kategori', c.typeCourse]
      ],
      btnLabel: 'Ya, Hapus Course',
      danger: true,
      onConfirm: async () => {
        showGlobalAlert('');
        try {
          const data = await apiJson(`/api/trainer/courses/${encodeURIComponent(c.courseId)}`, { method: 'DELETE' });
          if (!data) return;
          if (state.selectedCourseId === c.courseId) state.selectedCourseId = null;
          await loadCourses(true);
          showToast(data.message || 'Course berhasil dihapus.');
        } catch (err) {
          showGlobalAlert(err.message);
        }
      }
    });
  }

  function promptDeleteModule(moduleId) {
    const m = state.modules.find((item) => item.moduleId === moduleId);
    if (!m) return;
    openConfirmModal({
      badge: 'Konfirmasi Hapus Materi',
      title: 'Hapus materi modul ini?',
      desc: 'Penghapusan ditolak apabila masih terdapat Micro-Task atau soal kuis yang terhubung.',
      rows: [
        ['Kode Materi', m.moduleId],
        ['Urutan', `#${m.sequenceOrder}`],
        ['Judul Materi', m.title]
      ],
      btnLabel: 'Ya, Hapus Materi',
      danger: true,
      onConfirm: async () => {
        showGlobalAlert('');
        try {
          const data = await apiJson(`/api/trainer/modules/${encodeURIComponent(m.moduleId)}`, { method: 'DELETE' });
          if (!data) return;
          await loadCourses(true);
          showToast(data.message || 'Materi modul berhasil dihapus.');
        } catch (err) {
          showGlobalAlert(err.message);
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
      await loadCourses(false);
    } catch {
      redirectToLogin();
    }
  }

  function bindEvents() {
    document.getElementById('tr-logout-btn')?.addEventListener('click', async () => {
      await fetch('/api/trainer/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
      redirectToLogin();
    });

    document.getElementById('tc-course-search')?.addEventListener('input', (e) => {
      state.query = e.target.value || '';
      renderCourses();
    });

    document.getElementById('tc-add-course-btn')?.addEventListener('click', () => openCourseModal(null));
    document.getElementById('tc-cm-cancel')?.addEventListener('click', closeCourseModal);
    document.getElementById('tc-course-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'tc-course-modal') closeCourseModal();
    });

    document.getElementById('tc-course-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('tc-f-title')?.value?.trim() || '';
      const typeCourse = document.getElementById('tc-f-role')?.value?.trim() || '';
      const duration = Number(document.getElementById('tc-f-duration')?.value || 0);
      const instructorName = document.getElementById('tc-f-instructor')?.value?.trim() || '';
      const errEl = document.getElementById('tc-cm-error');

      if (!title || !typeCourse || !instructorName || !Number.isInteger(duration) || duration <= 0) {
        if (errEl) {
          errEl.textContent = 'Semua field wajib diisi dan durasi course harus bilangan bulat > 0 menit.';
          errEl.classList.remove('is-hidden');
        }
        return;
      }
      if (errEl) errEl.classList.add('is-hidden');
      const isEdit = Boolean(state.editingCourseId);
      const targetId = state.editingCourseId;
      closeCourseModal();

      openConfirmModal({
        badge: isEdit ? 'Konfirmasi Perubahan Course' : 'Konfirmasi Course Baru',
        title: isEdit ? `Simpan perubahan course ${targetId}?` : 'Tambahkan course baru ke Novastra?',
        desc: 'Periksa kembali judul, role karier, instruktur, dan estimasi durasi sebelum disimpan.',
        rows: [
          ['Judul Course', title],
          ['Kategori / Role', typeCourse],
          ['Instruktur', instructorName],
          ['Durasi Total', `${duration} menit`]
        ],
        btnLabel: isEdit ? 'Ya, Simpan Perubahan' : 'Ya, Buat Course',
        danger: false,
        onConfirm: async () => {
          showGlobalAlert('');
          try {
            const url = isEdit
              ? `/api/trainer/courses/${encodeURIComponent(targetId)}`
              : '/api/trainer/courses';
            const data = await apiJson(url, {
              method: isEdit ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title, typeCourse, instructorName, duration })
            });
            if (!data) return;
            state.selectedCourseId = data.course?.courseId || state.selectedCourseId;
            await loadCourses(true);
            showToast(data.message || 'Data course berhasil disimpan.');
          } catch (err) {
            showGlobalAlert(err.message);
          }
        }
      });
    });

    document.getElementById('tc-add-module-btn')?.addEventListener('click', () => openModuleModal(null));
    document.getElementById('tc-mm-cancel')?.addEventListener('click', closeModuleModal);
    document.getElementById('tc-module-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'tc-module-modal') closeModuleModal();
    });
    document.getElementById('tc-m-duration')?.addEventListener('input', updateModuleDurationHint);

    document.getElementById('tc-module-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('tc-m-title')?.value?.trim() || '';
      const videoUrl = document.getElementById('tc-m-video')?.value?.trim() || '';
      const durationSeconds = Number(document.getElementById('tc-m-duration')?.value || 0);
      const sequenceOrder = Number(document.getElementById('tc-m-seq')?.value || 0);
      const errEl = document.getElementById('tc-mm-error');

      if (!title || !/^https?:\/\/.+/i.test(videoUrl) || !Number.isInteger(durationSeconds) || durationSeconds <= 0
        || !Number.isInteger(sequenceOrder) || sequenceOrder < 1) {
        if (errEl) {
          errEl.textContent = 'Judul, URL video (http/https), durasi detik (> 0), dan urutan (>= 1) wajib valid.';
          errEl.classList.remove('is-hidden');
        }
        return;
      }
      if (errEl) errEl.classList.add('is-hidden');

      const isEdit = Boolean(state.editingModuleId);
      const modId = state.editingModuleId;
      const courseId = state.selectedCourseId;
      closeModuleModal();

      openConfirmModal({
        badge: isEdit ? 'Konfirmasi Perubahan Materi' : 'Konfirmasi Materi Baru',
        title: isEdit ? `Simpan perubahan materi ${modId}?` : 'Tambahkan materi video baru?',
        desc: 'Materi ini akan langsung muncul di daftar belajar peserta pada course terkait.',
        rows: [
          ['Course Induk', courseId],
          ['Urutan', `#${sequenceOrder}`],
          ['Judul Materi', title],
          ['Durasi', formatDurationSeconds(durationSeconds)]
        ],
        btnLabel: isEdit ? 'Ya, Simpan Materi' : 'Ya, Tambah Materi',
        danger: false,
        onConfirm: async () => {
          showGlobalAlert('');
          try {
            const url = isEdit
              ? `/api/trainer/modules/${encodeURIComponent(modId)}`
              : `/api/trainer/courses/${encodeURIComponent(courseId)}/modules`;
            const data = await apiJson(url, {
              method: isEdit ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title, videoUrl, durationSeconds, sequenceOrder })
            });
            if (!data) return;
            await loadCourses(true);
            showToast(data.message || 'Materi modul berhasil disimpan.');
          } catch (err) {
            showGlobalAlert(err.message);
          }
        }
      });
    });

    document.getElementById('tc-cf-cancel')?.addEventListener('click', closeConfirmModal);
    document.getElementById('tc-cf-submit')?.addEventListener('click', executePendingConfirm);
    document.getElementById('tc-confirm-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'tc-confirm-modal') closeConfirmModal();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    refreshIcons();
    bindEvents();
    initSession();
  });
})();
