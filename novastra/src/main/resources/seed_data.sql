-- Novastra Master Data Seed (PostgreSQL / DB-Novastra, schema public)
-- Idempotent: safe to re-run via ON CONFLICT DO NOTHING

-- 1. Career Roles (5 jalur karir utama)
INSERT INTO public.career_role (role_id, role_name, description) VALUES
  ('ROL01', 'Digital Marketing Lead', 'Mengelola strategi kampanye pemasaran digital, akuisisi funnel, dan growth analytics.'),
  ('ROL04', 'Backend Engineer (Java)', 'Merancang REST API tangguh, database PostgreSQL berkinerja tinggi, dan sistem terdistribusi Java.'),
  ('ROL05', 'AI & Machine Learning Engineer', 'Membangun model machine learning, deep learning PyTorch, dan sistem RAG/LLM siap produksi.'),
  ('ROL06', 'Frontend & PWA Developer', 'Mengembangkan antarmuka web modern, aksesibel, responsif, dan Progressive Web App (PWA) offline-first.'),
  ('ROL07', 'Data Analyst', 'Mengolah data SQL & Python menjadi insight bisnis, visualisasi KPI, dan eksperimen analitik terukur.')
ON CONFLICT (role_id) DO NOTHING;

-- 2. Skills (6 skill per role, category = role_name)
INSERT INTO public.skill (skill_id, skill_name, category) VALUES
  ('SKL11', 'SEO & SEM', 'Digital Marketing Lead'),
  ('SKL12', 'Content Strategy', 'Digital Marketing Lead'),
  ('SKL13', 'Paid Ads (Meta/Google)', 'Digital Marketing Lead'),
  ('SKL14', 'Marketing Analytics', 'Digital Marketing Lead'),
  ('SKL15', 'Funnel Optimization', 'Digital Marketing Lead'),
  ('SKL16', 'Copywriting', 'Digital Marketing Lead'),

  ('SKL17', 'Java OOP & Concurrency', 'Backend Engineer (Java)'),
  ('SKL18', 'Spring Boot REST', 'Backend Engineer (Java)'),
  ('SKL19', 'PostgreSQL & SQL Tuning', 'Backend Engineer (Java)'),
  ('SKL20', 'System Design', 'Backend Engineer (Java)'),
  ('SKL21', 'Web Security (OWASP)', 'Backend Engineer (Java)'),
  ('SKL22', 'Docker & Deployment', 'Backend Engineer (Java)'),

  ('SKL23', 'Python & Data Prep', 'AI & Machine Learning Engineer'),
  ('SKL24', 'Classical ML & Metrics', 'AI & Machine Learning Engineer'),
  ('SKL25', 'Deep Learning (PyTorch)', 'AI & Machine Learning Engineer'),
  ('SKL26', 'LLM & RAG Architecture', 'AI & Machine Learning Engineer'),
  ('SKL27', 'Prompt & Eval Engineering', 'AI & Machine Learning Engineer'),
  ('SKL28', 'MLOps & Model Serving', 'AI & Machine Learning Engineer'),

  ('SKL29', 'Modern JavaScript (ES6+)', 'Frontend & PWA Developer'),
  ('SKL30', 'HTML/CSS & Design System', 'Frontend & PWA Developer'),
  ('SKL31', 'State & REST Integration', 'Frontend & PWA Developer'),
  ('SKL32', 'PWA & Service Workers', 'Frontend & PWA Developer'),
  ('SKL33', 'Web Performance', 'Frontend & PWA Developer'),
  ('SKL34', 'Accessibility (A11y)', 'Frontend & PWA Developer'),

  ('SKL35', 'SQL & Querying', 'Data Analyst'),
  ('SKL36', 'Spreadsheet & BI Modeling', 'Data Analyst'),
  ('SKL37', 'Python (Pandas)', 'Data Analyst'),
  ('SKL38', 'Data Visualization', 'Data Analyst'),
  ('SKL39', 'Statistical Analysis', 'Data Analyst'),
  ('SKL40', 'Business Storytelling', 'Data Analyst')
ON CONFLICT (skill_id) DO NOTHING;

-- 3. Target Skill Level per Role
INSERT INTO public.career_skill_calculation (role_id, skill_id, target_level) VALUES
  ('ROL01', 'SKL11', 88.00), ('ROL01', 'SKL12', 85.00), ('ROL01', 'SKL13', 90.00),
  ('ROL01', 'SKL14', 92.00), ('ROL01', 'SKL15', 86.00), ('ROL01', 'SKL16', 82.00),

  ('ROL04', 'SKL17', 90.00), ('ROL04', 'SKL18', 94.00), ('ROL04', 'SKL19', 88.00),
  ('ROL04', 'SKL20', 85.00), ('ROL04', 'SKL21', 86.00), ('ROL04', 'SKL22', 80.00),

  ('ROL05', 'SKL23', 90.00), ('ROL05', 'SKL24', 86.00), ('ROL05', 'SKL25', 88.00),
  ('ROL05', 'SKL26', 94.00), ('ROL05', 'SKL27', 85.00), ('ROL05', 'SKL28', 78.00),

  ('ROL06', 'SKL29', 92.00), ('ROL06', 'SKL30', 88.00), ('ROL06', 'SKL31', 90.00),
  ('ROL06', 'SKL32', 85.00), ('ROL06', 'SKL33', 84.00), ('ROL06', 'SKL34', 80.00),

  ('ROL07', 'SKL35', 95.00), ('ROL07', 'SKL36', 88.00), ('ROL07', 'SKL37', 85.00),
  ('ROL07', 'SKL38', 90.00), ('ROL07', 'SKL39', 84.00), ('ROL07', 'SKL40', 82.00)
ON CONFLICT (role_id, skill_id) DO NOTHING;

-- 4. Courses (3 berjenjang per role = 15 courses)
INSERT INTO public.course (course_id, title, type_course, instructor_name, duration) VALUES
  ('CRS11', '[Beginner] Digital Marketing & SEO Foundations', 'Digital Marketing Lead', 'Nadia Kusuma', 300),
  ('CRS12', '[Intermediate] Performance Ads & Funnel Optimization', 'Digital Marketing Lead', 'Rafi Pratama', 360),
  ('CRS13', '[Advanced] Growth Strategy & Omnichannel Scaling', 'Digital Marketing Lead', 'Clarissa Tan', 420),

  ('CRS14', '[Beginner] Java 21 OOP & Clean Architecture', 'Backend Engineer (Java)', 'Bima Santoso', 340),
  ('CRS15', '[Intermediate] Spring Boot 3 REST & PostgreSQL', 'Backend Engineer (Java)', 'Adi Nugroho', 460),
  ('CRS16', '[Advanced] Distributed Systems, OWASP & Docker', 'Backend Engineer (Java)', 'Hendra Gunawan', 480),

  ('CRS17', '[Beginner] Python ML Foundations & Evaluation', 'AI & Machine Learning Engineer', 'Sinta Wijaya', 350),
  ('CRS18', '[Intermediate] Neural Networks with PyTorch', 'AI & Machine Learning Engineer', 'Dr. Raka Pratama', 440),
  ('CRS19', '[Advanced] Production RAG & LLM Systems', 'AI & Machine Learning Engineer', 'Dr. Raka Pratama', 480),

  ('CRS20', '[Beginner] Semantic HTML, Tailwind & Modern JS', 'Frontend & PWA Developer', 'Tariq Ramadhan', 310),
  ('CRS21', '[Intermediate] Asynchronous JS, State & PWA Core', 'Frontend & PWA Developer', 'Dimas Aditya', 380),
  ('CRS22', '[Advanced] Web Performance & Core Web Vitals', 'Frontend & PWA Developer', 'Nadia Kusuma', 360),

  ('CRS23', '[Beginner] SQL Analytics & Business Metrics', 'Data Analyst', 'Bagas Permana', 320),
  ('CRS24', '[Intermediate] Python Pandas & BI Storytelling', 'Data Analyst', 'Maya Putri', 390),
  ('CRS25', '[Advanced] Statistical Experimentation & A/B Tests', 'Data Analyst', 'Bagas Permana', 410)
ON CONFLICT (course_id) DO NOTHING;

-- 5. Modules (3 modul berurutan per course = 45 modules)
INSERT INTO public.modules (module_id, course_id, title, video_url, duration_seconds, sequence_order) VALUES
  ('MOD11', 'CRS11', 'Search Intent & Technical SEO Audit', 'https://www.youtube.com/embed/novastra-dm-11', 780, 1),
  ('MOD12', 'CRS11', 'Content Pillar & Editorial Calendar', 'https://www.youtube.com/embed/novastra-dm-12', 840, 2),
  ('MOD13', 'CRS11', 'On-Page Copywriting & Conversion Hooks', 'https://www.youtube.com/embed/novastra-dm-13', 720, 3),
  ('MOD14', 'CRS12', 'Meta & Google Ads Bidding Architecture', 'https://www.youtube.com/embed/novastra-dm-14', 900, 1),
  ('MOD15', 'CRS12', 'GA4 Attribution & Event Tracking', 'https://www.youtube.com/embed/novastra-dm-15', 860, 2),
  ('MOD16', 'CRS12', 'Landing Page A/B Testing & CRO', 'https://www.youtube.com/embed/novastra-dm-16', 780, 3),
  ('MOD17', 'CRS13', 'Multi-Touch Attribution & Cohort LTV', 'https://www.youtube.com/embed/novastra-dm-17', 960, 1),
  ('MOD18', 'CRS13', 'B2B Retention Loop & Lifecycle CRM', 'https://www.youtube.com/embed/novastra-dm-18', 900, 2),
  ('MOD19', 'CRS13', 'Marketing Budget Allocation Modeling', 'https://www.youtube.com/embed/novastra-dm-19', 840, 3),

  ('MOD20', 'CRS14', 'Encapsulation, Interface & Record DTO', 'https://www.youtube.com/embed/novastra-be-20', 840, 1),
  ('MOD21', 'CRS14', 'Java Collections, Stream API & Optional', 'https://www.youtube.com/embed/novastra-be-21', 900, 2),
  ('MOD22', 'CRS14', 'Concurrency Basics & ExecutorService', 'https://www.youtube.com/embed/novastra-be-22', 860, 3),
  ('MOD23', 'CRS15', 'Layered Controller-Service-Repository & Validation', 'https://www.youtube.com/embed/novastra-be-23', 960, 1),
  ('MOD24', 'CRS15', 'JPA Fetch Strategy & Mencegah N+1 Query', 'https://www.youtube.com/embed/novastra-be-24', 1020, 2),
  ('MOD25', 'CRS15', 'PostgreSQL Indexing & Transaction Isolation', 'https://www.youtube.com/embed/novastra-be-25', 920, 3),
  ('MOD26', 'CRS16', 'Mitigasi OWASP Top 10 & IDOR pada API', 'https://www.youtube.com/embed/novastra-be-26', 980, 1),
  ('MOD27', 'CRS16', 'Idempotency, Rate Limiting & Redis Cache', 'https://www.youtube.com/embed/novastra-be-27', 940, 2),
  ('MOD28', 'CRS16', 'Multi-Stage Dockerfile & Zero-Downtime Deploy', 'https://www.youtube.com/embed/novastra-be-28', 880, 3),

  ('MOD29', 'CRS17', 'Feature Engineering & Data Leakage Prevention', 'https://www.youtube.com/embed/novastra-ai-29', 840, 1),
  ('MOD30', 'CRS17', 'Classification Metrics: Precision, Recall & F1', 'https://www.youtube.com/embed/novastra-ai-30', 900, 2),
  ('MOD31', 'CRS17', 'Cross-Validation & Hyperparameter Tuning', 'https://www.youtube.com/embed/novastra-ai-31', 780, 3),
  ('MOD32', 'CRS18', 'Autograd, Tensor Ops & Training Loop', 'https://www.youtube.com/embed/novastra-ai-32', 960, 1),
  ('MOD33', 'CRS18', 'Regularization, Dropout & AdamW Optimizer', 'https://www.youtube.com/embed/novastra-ai-33', 900, 2),
  ('MOD34', 'CRS18', 'Transfer Learning & Fine-Tuning Vision/NLP', 'https://www.youtube.com/embed/novastra-ai-34', 940, 3),
  ('MOD35', 'CRS19', 'Semantic Chunking & Hybrid Vector Search', 'https://www.youtube.com/embed/novastra-ai-35', 1020, 1),
  ('MOD36', 'CRS19', 'RAG Faithfulness & Hallucination Guardrails', 'https://www.youtube.com/embed/novastra-ai-36', 960, 2),
  ('MOD37', 'CRS19', 'Latency Optimization & Token Cost Control', 'https://www.youtube.com/embed/novastra-ai-37', 900, 3),

  ('MOD38', 'CRS20', 'Semantic Landmarks, Keyboard Nav & WCAG AA', 'https://www.youtube.com/embed/novastra-fe-38', 780, 1),
  ('MOD39', 'CRS20', 'CSS Design Tokens & Responsive Grid', 'https://www.youtube.com/embed/novastra-fe-39', 840, 2),
  ('MOD40', 'CRS20', 'DOM Event Delegation & XSS Safe Rendering', 'https://www.youtube.com/embed/novastra-fe-40', 800, 3),
  ('MOD41', 'CRS21', 'Fetch API, Error Boundary & Optimistic UI', 'https://www.youtube.com/embed/novastra-fe-41', 900, 1),
  ('MOD42', 'CRS21', 'Web App Manifest & Service Worker Lifecycle', 'https://www.youtube.com/embed/novastra-fe-42', 960, 2),
  ('MOD43', 'CRS21', 'IndexedDB & Cache-First Offline Strategy', 'https://www.youtube.com/embed/novastra-fe-43', 920, 3),
  ('MOD44', 'CRS22', 'Optimasi LCP, CLS & INP di Browser', 'https://www.youtube.com/embed/novastra-fe-44', 900, 1),
  ('MOD45', 'CRS22', 'Code Splitting & Critical Rendering Path', 'https://www.youtube.com/embed/novastra-fe-45', 860, 2),
  ('MOD46', 'CRS22', 'Background Sync & Push Notifications PWA', 'https://www.youtube.com/embed/novastra-fe-46', 840, 3),

  ('MOD47', 'CRS23', 'SELECT, JOIN, CTE & Window Functions', 'https://www.youtube.com/embed/novastra-da-47', 880, 1),
  ('MOD48', 'CRS23', 'Data Cleaning & Missing Value Handling SQL', 'https://www.youtube.com/embed/novastra-da-48', 800, 2),
  ('MOD49', 'CRS23', 'North Star Metric & Cohort Table Query', 'https://www.youtube.com/embed/novastra-da-49', 840, 3),
  ('MOD50', 'CRS24', 'Exploratory Data Analysis dengan Pandas', 'https://www.youtube.com/embed/novastra-da-50', 920, 1),
  ('MOD51', 'CRS24', 'Memilih Grafik KPI & Menghindari Bias Visual', 'https://www.youtube.com/embed/novastra-da-51', 860, 2),
  ('MOD52', 'CRS24', 'Executive Dashboard Design Patterns', 'https://www.youtube.com/embed/novastra-da-52', 840, 3),
  ('MOD53', 'CRS25', 'Hypothesis Testing, P-Value & Power Analysis', 'https://www.youtube.com/embed/novastra-da-53', 960, 1),
  ('MOD54', 'CRS25', 'Root Cause Analysis & Anomaly Detection', 'https://www.youtube.com/embed/novastra-da-54', 900, 2),
  ('MOD55', 'CRS25', 'Automating Weekly KPI Reports', 'https://www.youtube.com/embed/novastra-da-55', 820, 3)
ON CONFLICT (module_id) DO NOTHING;

-- 6. Micro Tasks (2 BLIND_TEST per modul pertama tiap course = 30 tasks)
INSERT INTO public.micro_task (task_id, module_id, timestamp_seconds, question_text, task_type) VALUES
  ('TSK11', 'MOD11', 120, 'Susun 3 cluster keyword transactional vs informational untuk produk SaaS B2B.', 'BLIND_TEST'),
  ('TSK12', 'MOD11', 260, 'Identifikasi 3 error technical SEO yang paling menurunkan crawl budget.', 'BLIND_TEST'),
  ('TSK13', 'MOD14', 150, 'Hitung ROAS dan tentukan kapan kampanye Meta Ads harus di-scale atau di-pause.', 'BLIND_TEST'),
  ('TSK14', 'MOD14', 310, 'Rancang hipotesis A/B test untuk menaikkan conversion rate landing page sebesar 15%.', 'BLIND_TEST'),
  ('TSK15', 'MOD17', 180, 'Bandingkan CAC payback period antara channel organik dan paid search.', 'BLIND_TEST'),
  ('TSK16', 'MOD17', 340, 'Rancang strategi alokasi budget kuartalan saat CPL naik 25%.', 'BLIND_TEST'),

  ('TSK17', 'MOD20', 110, 'Jelaskan mengapa mengembalikan entity JPA langsung di controller melanggar encapsulation.', 'BLIND_TEST'),
  ('TSK18', 'MOD20', 250, 'Tulis pola thread-safe menggunakan ConcurrentHashMap untuk cache sederhana.', 'BLIND_TEST'),
  ('TSK19', 'MOD23', 140, 'Bagaimana @EntityGraph atau JOIN FETCH menyelesaikan masalah N+1 query pada JPA?', 'BLIND_TEST'),
  ('TSK20', 'MOD23', 290, 'Pilih isolasi transaksi dan index PostgreSQL yang tepat untuk endpoint transfer saldo.', 'BLIND_TEST'),
  ('TSK21', 'MOD26', 160, 'Tunjukkan cara menutup celah BOLA/IDOR pada endpoint GET /api/orders/{id}.', 'BLIND_TEST'),
  ('TSK22', 'MOD26', 330, 'Rancang mekanisme idempotency key agar retry webhook pembayaran tidak memproses ganda.', 'BLIND_TEST'),

  ('TSK23', 'MOD29', 120, 'Mengapa melakukan scaling sebelum train-test split menyebabkan data leakage?', 'BLIND_TEST'),
  ('TSK24', 'MOD29', 260, 'Pilih metrik evaluasi terbaik untuk dataset deteksi fraud dengan kelas tidak seimbang.', 'BLIND_TEST'),
  ('TSK25', 'MOD32', 135, 'Apa peran optimizer.zero_grad() sebelum loss.backward() pada PyTorch training loop?', 'BLIND_TEST'),
  ('TSK26', 'MOD32', 295, 'Diagnosis penyebab training loss turun drastis namun validation loss naik.', 'BLIND_TEST'),
  ('TSK27', 'MOD35', 170, 'Kapan hybrid search (BM25 + dense vector) lebih unggul dari pure semantic search?', 'BLIND_TEST'),
  ('TSK28', 'MOD35', 350, 'Rancang guardrail untuk memastikan LLM menolak menjawab jika konteks tidak relevan.', 'BLIND_TEST'),

  ('TSK29', 'MOD38', 105, 'Mengapa input data user ke innerHTML tanpa escaping berisiko Stored/Reflected XSS?', 'BLIND_TEST'),
  ('TSK30', 'MOD38', 240, 'Sebutkan 3 atribut ARIA penting agar modal dialog aksesibel lewat keyboard.', 'BLIND_TEST'),
  ('TSK31', 'MOD41', 145, 'Bedakan strategi caching Stale-While-Revalidate vs Network-First pada Service Worker.', 'BLIND_TEST'),
  ('TSK32', 'MOD41', 300, 'Tangani kondisi fetch HTTP 500 agar state UI tidak menampilkan sukses palsu.', 'BLIND_TEST'),
  ('TSK33', 'MOD44', 165, 'Bagaimana gambar tanpa dimensi eksplisit menyebabkan Cumulative Layout Shift (CLS)?', 'BLIND_TEST'),
  ('TSK34', 'MOD44', 320, 'Identifikasi bottleneck rendering yang membuat Interaction to Next Paint (INP) > 200ms.', 'BLIND_TEST'),

  ('TSK35', 'MOD47', 115, 'Bedakan hasil ROW_NUMBER(), RANK(), dan DENSE_RANK() saat ada nilai revenue seri.', 'BLIND_TEST'),
  ('TSK36', 'MOD47', 255, 'Kapan LEFT JOIN lebih tepat daripada INNER JOIN saat menghitung conversion funnel?', 'BLIND_TEST'),
  ('TSK37', 'MOD50', 140, 'Mengapa sumbu Y yang tidak dimulai dari nol dapat menyesatkan pembaca bar chart?', 'BLIND_TEST'),
  ('TSK38', 'MOD50', 290, 'Tulis langkah membersihkan duplikasi transaksi dan outlier sebelum agregasi Pandas.', 'BLIND_TEST'),
  ('TSK39', 'MOD53', 175, 'Apa risiko menghentikan A/B test terlalu dini saat p-value sempat di bawah 0.05?', 'BLIND_TEST'),
  ('TSK40', 'MOD53', 335, 'Jelaskan cara memisahkan efek musiman dari penurunan konversi aktual pada funnel.', 'BLIND_TEST')
ON CONFLICT (task_id) DO NOTHING;

-- 7. Portfolio Projects (1 proyek per course = 15 projects)
INSERT INTO public.portfolio_project (project_id, course_id, title, expected_output) VALUES
  ('PRJ11', 'CRS11', 'SEO Audit & Keyword Map Kit', 'Dokumen audit technical SEO dan peta keyword 30 hari siap eksekusi.'),
  ('PRJ12', 'CRS12', 'Full-Funnel Paid Ads Blueprint', 'Struktur kampanye Meta/Google Ads lengkap dengan tracking UTM & KPI ROAS.'),
  ('PRJ13', 'CRS13', 'Omnichannel Growth Playbook', 'Proposal strategi growth 90 hari beserta proyeksi CAC, LTV, dan payback.'),

  ('PRJ14', 'CRS14', 'Library CLI & Concurrency Engine', 'Repo Java 21 dengan unit test JUnit 5 dan pemrosesan paralel aman race condition.'),
  ('PRJ15', 'CRS15', 'Spring Boot REST & PostgreSQL API', 'REST API Spring Boot + PostgreSQL dengan @Transactional dan integrasi test.'),
  ('PRJ16', 'CRS16', 'Resilient Microservice Docker Stack', 'Layanan Spring Boot containerized lengkap dengan rate limiter dan audit OWASP.'),

  ('PRJ17', 'CRS17', 'Customer Churn Prediction Pipeline', 'Notebook Python terstruktur dengan pipeline scikit-learn bebas data leakage.'),
  ('PRJ18', 'CRS18', 'PyTorch Image Classifier Service', 'Model PyTorch hasil fine-tuning dengan kurva validasi dan API inferensi.'),
  ('PRJ19', 'CRS19', 'Production RAG Q&A Assistant', 'Sistem RAG dengan hybrid retrieval, sitasi sumber, dan skor faithfulness >= 90%.'),

  ('PRJ20', 'CRS20', 'Accessible Design Token UI Kit', 'Koleksi komponen UI responsif lulus audit kontras WCAG AA dan navigasi keyboard.'),
  ('PRJ21', 'CRS21', 'Offline-First PWA Task Workspace', 'Aplikasi PWA installable dengan Service Worker caching dan sinkronisasi REST API.'),
  ('PRJ22', 'CRS22', 'Core Web Vitals Optimized App', 'Laporan Lighthouse >= 95 di Performance, Accessibility, dan PWA checklist.'),

  ('PRJ23', 'CRS23', 'E-Commerce Revenue SQL Workbook', 'Kumpulan query CTE & window function untuk analisis cohort retensi dan AOV.'),
  ('PRJ24', 'CRS24', 'Cohort Retention Executive Deck', 'Dashboard interaktif + ringkasan temuan bisnis dalam 5 slide eksekutif.'),
  ('PRJ25', 'CRS25', 'Automated KPI Anomaly Monitor', 'Skrip analisis statistik otomatis untuk validasi A/B test dan deteksi anomali KPI.')
ON CONFLICT (project_id) DO NOTHING;
