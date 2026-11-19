(() => {
  const STORAGE_KEY = 'novastra_state_v1';

  const DEFAULT_STATE = {
    onboarded: false,
    loggedIn: false,
    user: {
      name: 'Learner Novastra',
      email: 'learner@novastra.id',
      targetRole: 'Backend Java Engineer',
      fields: ['backend', 'ai'],
      skills: ['Java 21', 'Spring Boot', 'Vanilla JS']
    },
    enrolledCourses: ['c-be-1', 'c-ai-1', 'c-fe-1'],
    completedLessons: {
      'c-fe-1': ['l-def-1', 'l-def-2', 'l-def-3'],
      'c-be-1': ['l-be-1', 'l-be-2', 'l-be-3', 'l-be-4']
    },
    streak: {
      count: 12,
      lastActiveDate: null
    },
    privacy: {
      publicProfile: true,
      showCertificates: true,
      allowPeerMatch: true,
      showActivityHeatmap: true
    }
  };

  const todayISO = () => new Date().toISOString().slice(0, 10);

  function readState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        user: { ...DEFAULT_STATE.user, ...(parsed.user || {}) },
        streak: { ...DEFAULT_STATE.streak, ...(parsed.streak || {}) },
        privacy: { ...DEFAULT_STATE.privacy, ...(parsed.privacy || {}) },
        enrolledCourses: Array.isArray(parsed.enrolledCourses) ? parsed.enrolledCourses : [...DEFAULT_STATE.enrolledCourses],
        completedLessons: parsed.completedLessons && typeof parsed.completedLessons === 'object' ? parsed.completedLessons : {}
      };
    } catch {
      return structuredClone(DEFAULT_STATE);
    }
  }

  function writeState(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota/storage errors in restricted browser contexts
    }
    return state;
  }

  function updateState(mutator) {
    const state = readState();
    mutator(state);
    return writeState(state);
  }

  async function apiFetch(endpoint, fallbackData, options = {}) {
    const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;
    try {
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) return fallbackData;
      const contentType = res.headers.get('content-type') || '';
      return contentType.includes('application/json') ? await res.json() : fallbackData;
    } catch {
      return fallbackData;
    }
  }

  const NovastraStore = {
    getState: readState,
    reset: () => writeState(structuredClone(DEFAULT_STATE)),

    isOnboarded: () => readState().onboarded,
    completeOnboarding: (prefs = {}) => updateState((s) => {
      s.onboarded = true;
      s.user = { ...s.user, ...prefs };
    }),

    isLoggedIn: () => readState().loggedIn,
    getUser: () => readState().user,
    login: (userData = {}) => updateState((s) => {
      s.loggedIn = true;
      s.user = { ...s.user, ...userData };
    }),
    logout: () => updateState((s) => { s.loggedIn = false; }),

    getEnrolled: () => readState().enrolledCourses,
    isEnrolled: (courseId) => readState().enrolledCourses.includes(courseId),
    enrollCourse: (courseId) => updateState((s) => {
      if (courseId && !s.enrolledCourses.includes(courseId)) s.enrolledCourses.push(courseId);
    }),
    unenrollCourse: (courseId) => updateState((s) => {
      s.enrolledCourses = s.enrolledCourses.filter((id) => id !== courseId);
    }),

    getStreak: () => readState().streak,
    touchStreak: () => updateState((s) => {
      const today = todayISO();
      const last = s.streak.lastActiveDate;
      if (last === today) return;
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (!last) s.streak.count = Math.max(1, s.streak.count || 1);
      else s.streak.count = last === yesterday ? s.streak.count + 1 : 1;
      s.streak.lastActiveDate = today;
    }),

    getCompletedLessons: (courseId) => {
      const all = readState().completedLessons;
      return courseId ? (all[courseId] || []) : all;
    },
    isLessonCompleted: (courseId, lessonId) => (readState().completedLessons[courseId] || []).includes(lessonId),
    completeLesson: (courseId, lessonId) => updateState((s) => {
      const list = s.completedLessons[courseId] || (s.completedLessons[courseId] = []);
      if (lessonId && !list.includes(lessonId)) list.push(lessonId);
    }),
    toggleLesson: (courseId, lessonId) => updateState((s) => {
      const list = s.completedLessons[courseId] || (s.completedLessons[courseId] = []);
      const idx = list.indexOf(lessonId);
      if (idx >= 0) list.splice(idx, 1);
      else if (lessonId) list.push(lessonId);
    }),

    getPrivacy: () => readState().privacy,
    setPrivacy: (key, value) => updateState((s) => {
      if (key in s.privacy) s.privacy[key] = Boolean(value);
    }),
    togglePrivacy: (key) => updateState((s) => {
      if (key in s.privacy) s.privacy[key] = !s.privacy[key];
    }),

    apiFetch
  };

  window.NovastraStore = NovastraStore;
  window.apiFetch = apiFetch;
})();
