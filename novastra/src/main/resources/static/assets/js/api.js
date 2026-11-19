(() => {
  const API_BASE = '/api';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  }

  async function loginUser(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.user) {
      window.saveSession?.({
        ...data.user,
        isOnboarded: Boolean(data.isOnboarded ?? Boolean(data.user.roleId)),
        isGuest: false
      });
    }
    return data;
  }

  async function registerUser(fullName, email, password) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password })
    });
  }

  async function getOnboardingOptions() {
    return request('/onboarding/options');
  }

  async function submitOnboarding(userId, payload) {
    return request(`/onboarding/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async function fetchDashboard(userId) {
    return request(`/dashboard/${encodeURIComponent(userId)}`);
  }

  async function fetchCareer(userId) {
    return request(`/career/${encodeURIComponent(userId)}`);
  }

  async function fetchCourses() {
    return request('/courses');
  }

  async function fetchCourseModules(courseId) {
    return request(`/courses/${encodeURIComponent(courseId)}/modules`);
  }

  async function enrollCourse(userId, courseId) {
    return request('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ userId, courseId })
    });
  }

  async function fetchUserEnrollments(userId) {
    return request(`/enrollments/user/${encodeURIComponent(userId)}`);
  }

  async function updateEnrollmentProgress(enrollmentId, progressPercentage, xpBonus = 50) {
    return request(`/enrollments/${encodeURIComponent(enrollmentId)}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ progressPercentage, xpBonus })
    });
  }

  async function completeCourseModule(courseId, moduleId, userId) {
    return request(`/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/complete`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async function renderCourseList(containerId = 'course-list') {
    const container = document.getElementById(containerId);
    if (!container) return;
    try {
      const courses = await fetchCourses();
      container.innerHTML = courses.map((c) => `
        <div class="p-4 rounded-2xl bg-white border border-[#E8E2DA]">
          <span class="text-xs font-bold text-[#D97757]">${esc(c.typeCourse || 'Course')}</span>
          <h3 class="text-base font-extrabold text-[#2C2A27] mt-1">${esc(c.title)}</h3>
          <p class="text-xs text-[#6B6560] mt-1">${esc(c.instructorName || '-')} · ${esc(c.duration || '-')}</p>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<p class="text-xs text-[#A65D57]">Gagal memuat course: ${esc(err.message)}</p>`;
    }
  }

  window.NovastraApi = {
    loginUser,
    registerUser,
    getOnboardingOptions,
    submitOnboarding,
    fetchDashboard,
    fetchCareer,
    fetchCourses,
    fetchCourseModules,
    enrollCourse,
    fetchUserEnrollments,
    updateEnrollmentProgress,
    completeCourseModule,
    renderCourseList
  };
})();
