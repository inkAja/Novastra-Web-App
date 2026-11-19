(() => {
  const FIELD_META = {
    ai: { label: 'AI & Machine Learning', color: '#D97757', bg: '#FDF0EB', icon: 'cpu' },
    backend: { label: 'Backend & APIs', color: '#5E7C6B', bg: '#EDF3EF', icon: 'server' },
    frontend: { label: 'Frontend & UI', color: '#C4904B', bg: '#FAF3E7', icon: 'layout' },
    cloud: { label: 'Cloud & DevOps', color: '#637994', bg: '#EEF2F7', icon: 'cloud' },
    security: { label: 'Cybersecurity', color: '#A65D57', bg: '#F8ECEB', icon: 'shield' },
    data: { label: 'Data Engineering', color: '#8A9A86', bg: '#F0F3EF', icon: 'database' },
    mobile: { label: 'Mobile & Cross-Platform', color: '#B07A57', bg: '#F9F1EB', icon: 'smartphone' }
  };

  const COURSES = [
    { id: 'c-ai-1', title: 'Applied LLM Systems & RAG Architecture', field: 'ai', level: 'Intermediate', duration: '6j 30m', lessons: 14, progress: 64, rating: 4.9, students: 1840, instructor: 'Dr. Raka Pratama', tags: ['LLM', 'Vector DB', 'Python'], powVerified: true, desc: 'Bangun pipeline Retrieval-Augmented Generation produksi dengan evaluasi kualitas respons.' },
    { id: 'c-ai-2', title: 'Neural Networks & PyTorch Foundations', field: 'ai', level: 'Beginner', duration: '8j 15m', lessons: 18, progress: 20, rating: 4.8, students: 2410, instructor: 'Sinta Wijaya', tags: ['PyTorch', 'Deep Learning'], powVerified: true, desc: 'Pahami backpropagation, tensor ops, dan training model klasifikasi dari nol.' },
    { id: 'c-be-1', title: 'Spring Boot 3 Clean REST & Microservices', field: 'backend', level: 'Intermediate', duration: '7j 40m', lessons: 16, progress: 80, rating: 4.9, students: 1960, instructor: 'Bima Santoso', tags: ['Java 21', 'Spring Boot', 'JPA'], powVerified: true, desc: 'Rancang REST API tangguh, validasi DTO, keamanan JWT, dan migrasi database Flyway.' },
    { id: 'c-be-2', title: 'Distributed Caching & Event-Driven Systems', field: 'backend', level: 'Advanced', duration: '5j 50m', lessons: 12, progress: 0, rating: 4.7, students: 920, instructor: 'Adi Nugroho', tags: ['Kafka', 'Redis', 'Concurrency'], powVerified: true, desc: 'Skalakan layanan backend dengan idempotency, message queue, dan strategi caching.' },
    { id: 'c-fe-1', title: 'Modern Vanilla JS & Component Architecture', field: 'frontend', level: 'Beginner', duration: '5j 10m', lessons: 12, progress: 100, rating: 4.8, students: 3120, instructor: 'Nadia Kusuma', tags: ['JavaScript', 'DOM', 'Tailwind'], powVerified: true, desc: 'Kuasai state management ringan, event delegation, dan UI responsif tanpa framework berat.' },
    { id: 'c-fe-2', title: 'Design Systems & Accessible Web UI', field: 'frontend', level: 'Intermediate', duration: '4j 45m', lessons: 10, progress: 35, rating: 4.9, students: 1450, instructor: 'Tariq Ramadhan', tags: ['A11y', 'CSS Tokens', 'UI'], powVerified: false, desc: 'Terapkan design token konsisten, navigasi keyboard, dan kontras WCAG AA.' },
    { id: 'c-cl-1', title: 'Docker, Kubernetes & Zero-Downtime CI/CD', field: 'cloud', level: 'Intermediate', duration: '6j 20m', lessons: 15, progress: 45, rating: 4.8, students: 1620, instructor: 'Fajar Hidayat', tags: ['Docker', 'K8s', 'GitHub Actions'], powVerified: true, desc: 'Kontainerisasi aplikasi Spring Boot dan otomatisasi deployment aman ke cluster.' },
    { id: 'c-cl-2', title: 'Terraform Infrastructure as Code on GCP', field: 'cloud', level: 'Advanced', duration: '5j 05m', lessons: 11, progress: 0, rating: 4.7, students: 780, instructor: 'Fajar Hidayat', tags: ['Terraform', 'GCP', 'IaC'], powVerified: false, desc: 'Kelola jaringan VPC, Cloud SQL, dan autoscaling secara deklaratif dan reproducable.' },
    { id: 'c-sc-1', title: 'OWASP Top 10 & Secure API Engineering', field: 'security', level: 'Intermediate', duration: '5j 30m', lessons: 13, progress: 15, rating: 4.9, students: 1330, instructor: 'Hendra Gunawan', tags: ['OWASP', 'OAuth2', 'AppSec'], powVerified: true, desc: 'Mitigasi SQL injection, broken access control, CSRF, dan kebocoran token di produksi.' },
    { id: 'c-sc-2', title: 'Threat Modeling & Penetration Testing Lab', field: 'security', level: 'Advanced', duration: '7j 00m', lessons: 14, progress: 0, rating: 4.8, students: 870, instructor: 'Maya Putri', tags: ['Pentest', 'STRIDE', 'Security'], powVerified: true, desc: 'Identifikasi celah arsitektur sejak fase desain dan validasi lewat simulasi eksploitasi.' },
    { id: 'c-dt-1', title: 'SQL Performance Tuning & Warehouse Modeling', field: 'data', level: 'Intermediate', duration: '5j 45m', lessons: 12, progress: 50, rating: 4.8, students: 1590, instructor: 'Bagas Permana', tags: ['PostgreSQL', 'Indexing', 'dbt'], powVerified: true, desc: 'Optimalkan query plan, composite index, dan star schema untuk analitik skala besar.' },
    { id: 'c-dt-2', title: 'Streaming ETL Pipelines with Apache Airflow', field: 'data', level: 'Advanced', duration: '6j 10m', lessons: 13, progress: 0, rating: 4.7, students: 840, instructor: 'Bagas Permana', tags: ['Airflow', 'ETL', 'Python'], powVerified: false, desc: 'Orkestrasi data batch dan streaming dengan SLA monitoring serta data quality checks.' },
    { id: 'c-mb-1', title: 'Kotlin Multiplatform & Clean Mobile Architecture', field: 'mobile', level: 'Intermediate', duration: '6j 00m', lessons: 14, progress: 10, rating: 4.8, students: 1120, instructor: 'Dina Maharani', tags: ['Kotlin', 'KMP', 'MVVM'], powVerified: true, desc: 'Berbagi business logic antara Android dan iOS sambil menjaga UI native responsif.' },
    { id: 'c-mb-2', title: 'Offline-First Sync & Local Storage Patterns', field: 'mobile', level: 'Beginner', duration: '4j 20m', lessons: 9, progress: 0, rating: 4.7, students: 960, instructor: 'Dina Maharani', tags: ['SQLite', 'Sync', 'Mobile'], powVerified: false, desc: 'Rancang aplikasi mobile tahan koneksi putus dengan antrean sinkronisasi konflik-aman.' }
  ];

  const TARGET_ROLES = [
    { id: 'r-1', title: 'Backend Java Engineer', field: 'backend', demand: 'Sangat Tinggi', salary: 'Rp 14–26 jt', skills: ['Java', 'Spring Boot', 'SQL', 'REST API'] },
    { id: 'r-2', title: 'AI Systems Engineer', field: 'ai', demand: 'Sangat Tinggi', salary: 'Rp 18–35 jt', skills: ['Python', 'LLM / RAG', 'Vector DB', 'Eval'] },
    { id: 'r-3', title: 'Frontend Product Engineer', field: 'frontend', demand: 'Tinggi', salary: 'Rp 12–23 jt', skills: ['JavaScript', 'Tailwind CSS', 'Accessibility', 'State'] },
    { id: 'r-4', title: 'Cloud & Platform Engineer', field: 'cloud', demand: 'Tinggi', salary: 'Rp 16–30 jt', skills: ['Docker', 'Kubernetes', 'CI/CD', 'Terraform'] },
    { id: 'r-5', title: 'Application Security Engineer', field: 'security', demand: 'Tinggi', salary: 'Rp 16–29 jt', skills: ['OWASP', 'OAuth2', 'Threat Modeling', 'SAST'] },
    { id: 'r-6', title: 'Data Engineer', field: 'data', demand: 'Tinggi', salary: 'Rp 14–27 jt', skills: ['SQL', 'Airflow', 'Data Modeling', 'Python'] },
    { id: 'r-7', title: 'Fullstack Web Developer', field: 'backend', demand: 'Sangat Tinggi', salary: 'Rp 12–24 jt', skills: ['Spring Boot', 'JavaScript', 'PostgreSQL', 'Git'] },
    { id: 'r-8', title: 'Machine Learning Engineer', field: 'ai', demand: 'Tinggi', salary: 'Rp 17–32 jt', skills: ['PyTorch', 'MLOps', 'Feature Store', 'Python'] },
    { id: 'r-9', title: 'Mobile Systems Developer', field: 'mobile', demand: 'Stabil', salary: 'Rp 12–22 jt', skills: ['Kotlin', 'Offline Sync', 'REST API', 'Testing'] },
    { id: 'r-10', title: 'Site Reliability Engineer', field: 'cloud', demand: 'Tinggi', salary: 'Rp 17–31 jt', skills: ['Observability', 'Linux', 'Kubernetes', 'Incident Response'] }
  ];

  const SKILL_CHIPS = [
    'Java 21', 'Spring Boot', 'PostgreSQL', 'REST API', 'Vanilla JS', 'Tailwind CSS',
    'Python', 'PyTorch', 'RAG & LLM', 'Docker', 'Kubernetes', 'GitHub Actions',
    'OWASP Security', 'Redis', 'Kafka', 'SQL Tuning', 'Kotlin', 'System Design'
  ];

  const BOOTCAMPS = [
    { id: 'bc-1', title: 'Spring Boot Production Cohort #12', field: 'backend', startDate: '1 Des 2026', duration: '8 Minggu', seatsLeft: 6, mentor: 'Bima Santoso', mode: 'Live + Blind Test' },
    { id: 'bc-2', title: 'Applied GenAI & RAG Builder Camp', field: 'ai', startDate: '8 Des 2026', duration: '6 Minggu', seatsLeft: 4, mentor: 'Dr. Raka Pratama', mode: 'Capstone Sprint' },
    { id: 'bc-3', title: 'Cloud Native DevOps & K8s Intensive', field: 'cloud', startDate: '15 Des 2026', duration: '6 Minggu', seatsLeft: 9, mentor: 'Fajar Hidayat', mode: 'Hands-on Lab' },
    { id: 'bc-4', title: 'Secure Fullstack Engineering Bootcamp', field: 'security', startDate: '5 Jan 2027', duration: '8 Minggu', seatsLeft: 11, mentor: 'Hendra Gunawan', mode: 'Live + Code Audit' }
  ];

  const RP_SCENARIOS = [
    { id: 'rp-1', title: 'Insiden Latensi API Saat Flash Sale', role: 'Lead Backend Engineer', field: 'backend', difficulty: 'Hard', duration: '15 mnt', context: 'Endpoint checkout Spring Boot melonjak ke p95 4.2s dan connection pool HikariCP habis.' },
    { id: 'rp-2', title: 'Design Review Pipeline RAG Anti-Halusinasi', role: 'AI Architect', field: 'ai', difficulty: 'Medium', duration: '12 mnt', context: 'Tim produk meminta akurasi kutipan dokumen internal di atas 92% dengan biaya token hemat.' },
    { id: 'rp-3', title: 'Audit Temuan IDOR Sebelum Rilis Publik', role: 'Security Reviewer', field: 'security', difficulty: 'Hard', duration: '15 mnt', context: 'Endpoint /api/orders/{id} dapat diakses user lain yang hanya mengganti angka ID.' },
    { id: 'rp-4', title: 'Negosiasi Scope MVP dengan Product Manager', role: 'Senior Tech Lead', field: 'frontend', difficulty: 'Easy', duration: '10 mnt', context: 'PM meminta 5 fitur analitik tambahan dua hari sebelum deadline demo.' }
  ];

  const TOPICS = [
    { id: 'top-1', label: 'System Design & Arsitektur API', field: 'backend', activePeers: 18, icon: 'layers' },
    { id: 'top-2', label: 'Mock Interview Java & Spring Boot', field: 'backend', activePeers: 24, icon: 'terminal' },
    { id: 'top-3', label: 'Pair Debugging Vanilla JS & UI', field: 'frontend', activePeers: 14, icon: 'code' },
    { id: 'top-4', label: 'Bedah Paper & Prompt Engineering', field: 'ai', activePeers: 16, icon: 'sparkles' },
    { id: 'top-5', label: 'SQL Query Optimization & Indexing', field: 'data', activePeers: 11, icon: 'database' },
    { id: 'top-6', label: 'Code Review & Secure Coding', field: 'security', activePeers: 9, icon: 'shield-check' }
  ];

  const THREADS = [
    { id: 'th-1', author: 'Rizky Mahendra', role: 'Backend Learner', field: 'backend', time: '22 mnt lalu', title: 'Cara paling bersih handle global exception di Spring Boot 3?', body: 'Apakah lebih baik pakai @RestControllerAdvice dengan ProblemDetail RFC 7807 atau custom wrapper JSON?', replies: 14, upvotes: 39, solved: true },
    { id: 'th-2', author: 'Clarissa Tan', role: 'AI Cohort #4', field: 'ai', time: '1 jam lalu', title: 'Chunk size optimal untuk dokumen hukum berbahasa Indonesia', body: 'Setelah uji 256 vs 512 token dengan overlap 15%, recall meningkat signifikan pada 380 token.', replies: 9, upvotes: 27, solved: false },
    { id: 'th-3', author: 'Dimas Aditya', role: 'Frontend Builder', field: 'frontend', time: '3 jam lalu', title: 'State sync antara localStorage dan Fetch API tanpa flicker UI', body: 'Berbagi pola render optimistik pakai Vanilla JS untuk katalog kursus Spring Boot static.', replies: 11, upvotes: 31, solved: true },
    { id: 'th-4', author: 'Larasati Dewi', role: 'Cloud Track', field: 'cloud', time: '5 jam lalu', title: 'Multi-stage Dockerfile bikin image Spring Boot turun dari 620MB ke 195MB', body: 'Pakai eclipse-temurin:21-jre-alpine plus jdeps custom runtime hasilnya jauh lebih cepat deploy.', replies: 17, upvotes: 52, solved: true },
    { id: 'th-5', author: 'Kevin Prakoso', role: 'AppSec Enthusiast', field: 'security', time: '1 hari lalu', title: 'Checklist validasi input sebelum ikut Blind Test Security', body: 'Jangan lupa cek authorization per-resource (BOLA/IDOR), bukan cuma validasi JWT signature.', replies: 8, upvotes: 44, solved: false }
  ];

  const CURRICULUM = {
    'c-be-1': [
      { module: 'Modul 1: Arsitektur & DTO Boundary', items: [
        { id: 'l-be-1', title: 'Struktur Paket Controller-Service-Repository', duration: '18 mnt' },
        { id: 'l-be-2', title: 'Record DTO & Bean Validation (@Valid)', duration: '24 mnt' },
        { id: 'l-be-3', title: 'Global Error Handling dengan ProblemDetail', duration: '22 mnt' }
      ]},
      { module: 'Modul 2: Persistence & Keamanan', items: [
        { id: 'l-be-4', title: 'Optimasi Fetch JPA & Mencegah N+1 Query', duration: '28 mnt' },
        { id: 'l-be-5', title: 'Stateless Auth & Role Guard di Spring Security', duration: '32 mnt' }
      ]}
    ],
    'c-ai-1': [
      { module: 'Modul 1: Indexing & Retrieval', items: [
        { id: 'l-ai-1', title: 'Semantic Chunking & Metadata Filtering', duration: '20 mnt' },
        { id: 'l-ai-2', title: 'Hybrid Search (BM25 + Dense Embeddings)', duration: '26 mnt' }
      ]},
      { module: 'Modul 2: Evaluasi & Guardrails', items: [
        { id: 'l-ai-3', title: 'Mengukur Faithfulness & Context Precision', duration: '25 mnt' }
      ]}
    ],
    default: [
      { module: 'Modul 1: Fondasi & Konsep Inti', items: [
        { id: 'l-def-1', title: 'Mental Model & Arsitektur Dasar', duration: '16 mnt' },
        { id: 'l-def-2', title: 'Studi Kasus Implementasi Nyata', duration: '24 mnt' }
      ]},
      { module: 'Modul 2: Praktik & Uji Kompetensi', items: [
        { id: 'l-def-3', title: 'Refactor, Edge Case & Verifikasi', duration: '28 mnt' }
      ]}
    ]
  };

  const POW_TESTS = [
    {
      id: 'pow-be-1',
      title: 'Blind Test: Spring Boot REST & Concurrency',
      field: 'backend',
      durationMin: 20,
      passingScore: 75,
      badge: 'Verified Backend Builder',
      questions: [
        { q: 'Apa risiko utama mengembalikan entity JPA langsung dari @RestController tanpa DTO?', opts: ['LazyInitializationException & kebocoran kolom sensitif', 'Spring Boot gagal kompilasi', 'Port server berubah otomatis', 'Browser tidak bisa parse JSON'], ans: 0 },
        { q: 'Strategi tepat mencegah N+1 query saat mengambil daftar Order beserta Item-nya adalah...', opts: ['Menambah sleep di loop', 'JOIN FETCH atau @EntityGraph', 'Mematikan transaction', 'Mengganti POST menjadi PUT'], ans: 1 },
        { q: 'HTTP status paling tepat saat payload JSON gagal validasi @Valid adalah...', opts: ['200 OK', '302 Found', '400 Bad Request', '503 Service Unavailable'], ans: 2 }
      ]
    },
    {
      id: 'pow-ai-1',
      title: 'Blind Test: Applied RAG & Evaluation',
      field: 'ai',
      durationMin: 20,
      passingScore: 75,
      badge: 'Verified AI Engineer',
      questions: [
        { q: 'Mengapa hybrid search (BM25 + vector) sering mengungguli pure vector search?', opts: ['Menghapus kebutuhan tokenizer', 'Menangkap kecocokan kata kunci eksak sekaligus makna semantik', 'Mengurangi ukuran model LLM', 'Tidak butuh embedding'], ans: 1 },
        { q: 'Metrik evaluasi RAG yang menilai apakah jawaban tetap setia pada konteks yang diambil adalah...', opts: ['Faithfulness', 'Perplexity CSS', 'BLEU-1 saja', 'FPS'], ans: 0 }
      ]
    },
    {
      id: 'pow-sc-1',
      title: 'Blind Test: Secure Web & API Defense',
      field: 'security',
      durationMin: 15,
      passingScore: 80,
      badge: 'Verified Security Practitioner',
      questions: [
        { q: 'User A mengganti parameter /api/invoices/101 menjadi 102 milik User B dan berhasil membaca datanya. Kerentanan ini disebut...', opts: ['XSS', 'BOLA / IDOR', 'Clickjacking', 'DNS Spoofing'], ans: 1 },
        { q: 'Cara paling efektif mencegah SQL Injection pada query dinamis adalah...', opts: ['Blacklist kata SELECT di frontend', 'Parameterized query / PreparedStatement', 'Base64 encode input', 'Menyembunyikan stack trace saja'], ans: 1 }
      ]
    }
  ];

  const CERTIFICATES = [
    { id: 'cert-1', title: 'Certified Vanilla JS & Web UI Builder', code: 'NV-POW-2026-8841', issuedAt: '12 Okt 2026', score: 94, field: 'frontend', holder: 'Hanif Mishbah', verified: true },
    { id: 'cert-2', title: 'Spring Boot Clean Architecture Specialist', code: 'NV-POW-2026-9104', issuedAt: '02 Nov 2026', score: 91, field: 'backend', holder: 'Hanif Mishbah', verified: true },
    { id: 'cert-3', title: 'Applied LLM & RAG Evaluation Foundations', code: 'NV-POW-2026-9452', issuedAt: '15 Nov 2026', score: 88, field: 'ai', holder: 'Hanif Mishbah', verified: true }
  ];

  // 20-week x 7-day deterministic activity matrix (values 0..4) + sage green palette
  const HC = ['#F0ECE4', '#D7DFD4', '#B7C5B3', '#8A9A86', '#5F715B'];
  const HM = Array.from({ length: 20 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const v = (w * 5 + d * 3 + (w % 4)) % 11;
      return v < 3 ? 0 : v < 5 ? 1 : v < 7 ? 2 : v < 9 ? 3 : 4;
    })
  );
  const HEATMAP_DATA = { HM, HC };

  window.NOVASTRA_DATA = {
    FIELD_META,
    COURSES,
    TARGET_ROLES,
    SKILL_CHIPS,
    BOOTCAMPS,
    RP_SCENARIOS,
    TOPICS,
    THREADS,
    CURRICULUM,
    POW_TESTS,
    CERTIFICATES,
    HEATMAP_DATA,
    HM,
    HC
  };
})();
