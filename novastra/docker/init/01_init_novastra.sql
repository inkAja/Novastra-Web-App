--
-- PostgreSQL database dump
--

\restrict XfNbUDXBVIPD3m0ELmlSRz85RZcDifgKH7BnqknWFmvnEiV9YCqZnFumxMYX5PK

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: career_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.career_role (
    role_id character(5) NOT NULL,
    role_name character varying(60) NOT NULL,
    description character varying(255)
);


--
-- Name: career_skill_calculation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.career_skill_calculation (
    role_id character(5) NOT NULL,
    skill_id character(5) NOT NULL,
    target_level numeric(5,2) NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT career_skill_calculation_target_level_check CHECK (((target_level >= (0)::numeric) AND (target_level <= (100)::numeric)))
);


--
-- Name: certificate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificate (
    certificate_id character(5) NOT NULL,
    user_id character(5) NOT NULL,
    course_id character(5) NOT NULL,
    credential_url character varying(255) NOT NULL,
    issue_date date DEFAULT CURRENT_DATE NOT NULL
);


--
-- Name: course; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course (
    course_id character(5) NOT NULL,
    title character varying(255) NOT NULL,
    type_course character varying(60) NOT NULL,
    instructor_name character varying(255) NOT NULL,
    duration integer NOT NULL
);


--
-- Name: enrollment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollment (
    enrollment_id character(5) NOT NULL,
    user_id character(5) NOT NULL,
    course_id character(5) NOT NULL,
    progress_percentage numeric(5,2) DEFAULT 0.00 NOT NULL,
    enrolled_at date DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT enrollment_progress_percentage_check CHECK (((progress_percentage >= (0)::numeric) AND (progress_percentage <= (100)::numeric)))
);


--
-- Name: micro_task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.micro_task (
    task_id character(5) NOT NULL,
    module_id character(5) NOT NULL,
    timestamp_seconds integer NOT NULL,
    question_text character varying(255) NOT NULL,
    task_type character varying(60) NOT NULL,
    CONSTRAINT micro_task_timestamp_seconds_check CHECK ((timestamp_seconds >= 0))
);


--
-- Name: micro_task_result; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.micro_task_result (
    result_id character(5) NOT NULL,
    user_id character(5) NOT NULL,
    task_id character(5) NOT NULL,
    score numeric(5,2) DEFAULT 0.00 NOT NULL,
    completed_at date DEFAULT CURRENT_DATE NOT NULL
);


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    module_id character(5) NOT NULL,
    course_id character(5) NOT NULL,
    title character varying(100) NOT NULL,
    video_url character varying(255) NOT NULL,
    duration_seconds integer NOT NULL,
    sequence_order integer NOT NULL,
    CONSTRAINT modules_duration_seconds_check CHECK ((duration_seconds >= 0))
);


--
-- Name: portfolio_project; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolio_project (
    project_id character(5) NOT NULL,
    course_id character(5) NOT NULL,
    title character varying(60) NOT NULL,
    expected_output character varying(255) NOT NULL
);


--
-- Name: portfolio_submission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolio_submission (
    submission_id character(5) NOT NULL,
    user_id character(5) NOT NULL,
    project_id character(5) NOT NULL,
    external_url character varying(255) NOT NULL,
    score numeric(5,2) DEFAULT 0.00 NOT NULL,
    feedback_notes text,
    status character varying(60) NOT NULL,
    CONSTRAINT portfolio_submission_score_check CHECK (((score >= (0)::numeric) AND (score <= (100)::numeric)))
);


--
-- Name: skill; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill (
    skill_id character(5) NOT NULL,
    skill_name character varying(60) NOT NULL,
    category character varying(60) NOT NULL
);


--
-- Name: studypod_session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.studypod_session (
    session_id character(5) NOT NULL,
    user_id character(5) NOT NULL,
    session_type character varying(60) NOT NULL,
    scenario_type character varying(255) NOT NULL,
    sentiment_score numeric(5,2) DEFAULT 0.00 NOT NULL,
    session_date date DEFAULT CURRENT_DATE NOT NULL
);


--
-- Name: user_skill_gap; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_skill_gap (
    user_id character(5) NOT NULL,
    skill_id character(5) NOT NULL,
    current_level numeric(5,2) DEFAULT 0.00 NOT NULL,
    is_priority boolean DEFAULT false NOT NULL,
    CONSTRAINT user_skill_gap_current_level_check CHECK (((current_level >= (0)::numeric) AND (current_level <= (100)::numeric)))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id character(5) NOT NULL,
    full_name character varying(60) NOT NULL,
    email character varying(255) NOT NULL,
    password_user character varying(255) NOT NULL,
    experience_level integer DEFAULT 0 NOT NULL,
    daily_time_limit integer DEFAULT 0 NOT NULL,
    total_xp integer DEFAULT 0 NOT NULL,
    streak_count integer DEFAULT 0 NOT NULL,
    joined_at date DEFAULT CURRENT_DATE NOT NULL,
    role_id character(5)
);


--
-- Data for Name: career_role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.career_role (role_id, role_name, description) FROM stdin;
ROL01	Digital Marketing Lead	Mengelola strategi kampanye pemasaran digital dan negosiasi klien B2B.
ROL02	Senior UI/UX Designer	Merancang arsitektur дизайн sistem berskala besar dan riset pengguna.
ROL03	Full-Stack Web Developer	Membangun aplikasi web modern end-to-end dengan arsitektur cloud.
ROL04	Backend Engineer (Java)	Merancang REST API tangguh, database PostgreSQL berkinerja tinggi, dan sistem terdistribusi Java.
ROL05	AI & Machine Learning Engineer	Membangun model machine learning, deep learning PyTorch, dan sistem RAG/LLM siap produksi.
ROL06	Frontend & PWA Developer	Mengembangkan antarmuka web modern, aksesibel, responsif, dan Progressive Web App (PWA) offline-first.
ROL07	Data Analyst	Mengolah data SQL & Python menjadi insight bisnis, visualisasi KPI, dan eksperimen analitik terukur.
\.


--
-- Data for Name: career_skill_calculation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.career_skill_calculation (role_id, skill_id, target_level, "timestamp") FROM stdin;
ROL01	SKL01	85.00	2026-11-11 09:52:30.969853
ROL02	SKL02	90.00	2026-11-11 09:52:30.969853
ROL02	SKL03	85.00	2026-11-11 09:52:30.969853
ROL03	SKL04	88.00	2026-11-11 09:52:30.969853
ROL03	SKL05	80.00	2026-11-11 09:52:30.969853
ROL01	SKL11	88.00	2026-11-19 15:31:39.573399
ROL01	SKL12	85.00	2026-11-19 15:31:39.597935
ROL01	SKL13	90.00	2026-11-19 15:31:39.604145
ROL01	SKL14	92.00	2026-11-19 15:31:39.609266
ROL01	SKL15	86.00	2026-11-19 15:31:39.615491
ROL01	SKL16	82.00	2026-11-19 15:31:39.621858
ROL04	SKL17	90.00	2026-11-19 15:31:39.712814
ROL04	SKL18	94.00	2026-11-19 15:31:39.718182
ROL04	SKL19	88.00	2026-11-19 15:31:39.721716
ROL04	SKL20	85.00	2026-11-19 15:31:39.72596
ROL04	SKL21	86.00	2026-11-19 15:31:39.730009
ROL04	SKL22	80.00	2026-11-19 15:31:39.733785
ROL05	SKL23	90.00	2026-11-19 15:31:39.78341
ROL05	SKL24	86.00	2026-11-19 15:31:39.787677
ROL05	SKL25	88.00	2026-11-19 15:31:39.790792
ROL05	SKL26	94.00	2026-11-19 15:31:39.794026
ROL05	SKL27	85.00	2026-11-19 15:31:39.797642
ROL05	SKL28	78.00	2026-11-19 15:31:39.80114
ROL06	SKL29	92.00	2026-11-19 15:31:39.863667
ROL06	SKL30	88.00	2026-11-19 15:31:39.86884
ROL06	SKL31	90.00	2026-11-19 15:31:39.873809
ROL06	SKL32	85.00	2026-11-19 15:31:39.87766
ROL06	SKL33	84.00	2026-11-19 15:31:39.882035
ROL06	SKL34	80.00	2026-11-19 15:31:39.887238
ROL07	SKL35	95.00	2026-11-19 15:31:39.932704
ROL07	SKL36	88.00	2026-11-19 15:31:39.936097
ROL07	SKL37	85.00	2026-11-19 15:31:39.938973
ROL07	SKL38	90.00	2026-11-19 15:31:39.942824
ROL07	SKL39	84.00	2026-11-19 15:31:39.946227
ROL07	SKL40	82.00	2026-11-19 15:31:39.949959
ROL02	SL001	88.00	2026-11-19 21:52:34.355445
ROL02	SL002	92.00	2026-11-19 21:52:34.375155
ROL02	SL003	86.00	2026-11-19 21:52:34.382689
ROL02	SL004	82.00	2026-11-19 21:52:34.388995
ROL02	SL005	84.00	2026-11-19 21:52:34.396737
ROL02	SL006	90.00	2026-11-19 21:52:34.405419
ROL03	SL007	90.00	2026-11-19 21:52:34.474534
ROL03	SL008	92.00	2026-11-19 21:52:34.478925
ROL03	SL009	88.00	2026-11-19 21:52:34.48302
ROL03	SL010	86.00	2026-11-19 21:52:34.48661
ROL03	SL011	85.00	2026-11-19 21:52:34.489701
ROL03	SL012	80.00	2026-11-19 21:52:34.492958
\.


--
-- Data for Name: certificate; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certificate (certificate_id, user_id, course_id, credential_url, issue_date) FROM stdin;
CRT01	USR01	CRS01	https://novastra.id/cert/CRT01-USR01	2026-02-28
\.


--
-- Data for Name: course; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.course (course_id, title, type_course, instructor_name, duration) FROM stdin;
CRS01	Figma Mastery: Design Systems at Scale	UI/UX Design	Sarah Chen	720
CRS02	UX Research: From Interview to Insights	UI/UX Design	Maya Patel	480
CRS03	React 19 & Next.js: Full-Stack Mastery	Web Programming	James Liu	1200
CRS04	TypeScript Deep Dive	Web Programming	Anika Ross	600
CRS05	Digital Marketing & B2B Sales Strategy	Marketing	Sarah Jenkins	540
CRS11	[Beginner] Digital Marketing & SEO Foundations	Digital Marketing Lead	Nadia Kusuma	300
CRS12	[Intermediate] Performance Ads & Funnel Optimization	Digital Marketing Lead	Rafi Pratama	360
CRS13	[Advanced] Growth Strategy & Omnichannel Scaling	Digital Marketing Lead	Clarissa Tan	420
CRS14	[Beginner] Java 21 OOP & Clean Architecture	Backend Engineer (Java)	Bima Santoso	340
CRS15	[Intermediate] Spring Boot 3 REST & PostgreSQL	Backend Engineer (Java)	Adi Nugroho	460
CRS16	[Advanced] Distributed Systems, OWASP & Docker	Backend Engineer (Java)	Hendra Gunawan	480
CRS17	[Beginner] Python ML Foundations & Evaluation	AI & Machine Learning Engineer	Sinta Wijaya	350
CRS18	[Intermediate] Neural Networks with PyTorch	AI & Machine Learning Engineer	Dr. Raka Pratama	440
CRS19	[Advanced] Production RAG & LLM Systems	AI & Machine Learning Engineer	Dr. Raka Pratama	480
CRS20	[Beginner] Semantic HTML, Tailwind & Modern JS	Frontend & PWA Developer	Tariq Ramadhan	310
CRS21	[Intermediate] Asynchronous JS, State & PWA Core	Frontend & PWA Developer	Dimas Aditya	380
CRS22	[Advanced] Web Performance & Core Web Vitals	Frontend & PWA Developer	Nadia Kusuma	360
CRS23	[Beginner] SQL Analytics & Business Metrics	Data Analyst	Bagas Permana	320
CRS24	[Intermediate] Python Pandas & BI Storytelling	Data Analyst	Maya Putri	390
CRS25	[Advanced] Statistical Experimentation & A/B Tests	Data Analyst	Bagas Permana	410
CS001	[Beginner] UI/UX Foundations & Figma Systems	Senior UI/UX Designer	Nadia Kusuma	280
CS002	[Intermediate] User Research & Interactive Prototyping	Senior UI/UX Designer	Maya Putri	340
CS003	[Advanced] Design Ops & Accessibility Audit	Senior UI/UX Designer	Nadia Kusuma	390
CS004	[Beginner] Modern Web & TypeScript Foundations	Full-Stack Web Developer	Rizky Pratama	300
CS005	[Intermediate] Full-Stack API & PostgreSQL Integration	Full-Stack Web Developer	Dimas Pratama	360
CS006	[Advanced] Scalable Deployment, Caching & Security	Full-Stack Web Developer	Bima Santoso	420
\.


--
-- Data for Name: enrollment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enrollment (enrollment_id, user_id, course_id, progress_percentage, enrolled_at) FROM stdin;
ENR01	USR01	CRS05	45.50	2026-02-01
ENR02	USR01	CRS01	100.00	2026-01-20
ENR03	USR02	CRS01	70.00	2026-02-15
ENR04	USR03	CRS03	25.00	2026-03-05
ENR09	USR07	CS004	100.00	2026-11-19
ENR10	USR07	CS005	100.00	2026-11-19
ENR11	USR07	CS006	100.00	2026-11-19
ENR05	USR07	CRS01	100.00	2026-11-19
ENR06	USR07	CRS02	100.00	2026-11-19
ENR08	USR07	CRS04	0.00	2026-11-19
ENR07	USR07	CRS03	33.33	2026-11-19
ENR12	USR05	CRS11	0.00	2026-11-20
\.


--
-- Data for Name: micro_task; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.micro_task (task_id, module_id, timestamp_seconds, question_text, task_type) FROM stdin;
TSK01	MOD02	105	Identify 3 client objections from the scenario	Multiple Choice
TSK02	MOD02	270	Draft a 60-sec pitch for a sceptical CFO	Fill-in-the-Blank
TSK03	MOD02	410	The client states your software is too expensive. Construct a response using the Value-Pivot framework.	Fill-in-the-Blank
TSK11	MOD11	120	Susun 3 cluster keyword transactional vs informational untuk produk SaaS B2B.	BLIND_TEST
TSK12	MOD11	260	Identifikasi 3 error technical SEO yang paling menurunkan crawl budget.	BLIND_TEST
TSK13	MOD14	150	Hitung ROAS dan tentukan kapan kampanye Meta Ads harus di-scale atau di-pause.	BLIND_TEST
TSK14	MOD14	310	Rancang hipotesis A/B test untuk menaikkan conversion rate landing page sebesar 15%.	BLIND_TEST
TSK15	MOD17	180	Bandingkan CAC payback period antara channel organik dan paid search.	BLIND_TEST
TSK16	MOD17	340	Rancang strategi alokasi budget kuartalan saat CPL naik 25%.	BLIND_TEST
TSK17	MOD20	110	Jelaskan mengapa mengembalikan entity JPA langsung di controller melanggar encapsulation.	BLIND_TEST
TSK18	MOD20	250	Tulis pola thread-safe menggunakan ConcurrentHashMap untuk cache sederhana.	BLIND_TEST
TSK19	MOD23	140	Bagaimana @EntityGraph atau JOIN FETCH menyelesaikan masalah N+1 query pada JPA?	BLIND_TEST
TSK20	MOD23	290	Pilih isolasi transaksi dan index PostgreSQL yang tepat untuk endpoint transfer saldo.	BLIND_TEST
TSK21	MOD26	160	Tunjukkan cara menutup celah BOLA/IDOR pada endpoint GET /api/orders/{id}.	BLIND_TEST
TSK22	MOD26	330	Rancang mekanisme idempotency key agar retry webhook pembayaran tidak memproses ganda.	BLIND_TEST
TSK23	MOD29	120	Mengapa melakukan scaling sebelum train-test split menyebabkan data leakage?	BLIND_TEST
TSK24	MOD29	260	Pilih metrik evaluasi terbaik untuk dataset deteksi fraud dengan kelas tidak seimbang.	BLIND_TEST
TSK25	MOD32	135	Apa peran optimizer.zero_grad() sebelum loss.backward() pada PyTorch training loop?	BLIND_TEST
TSK26	MOD32	295	Diagnosis penyebab training loss turun drastis namun validation loss naik.	BLIND_TEST
TSK27	MOD35	170	Kapan hybrid search (BM25 + dense vector) lebih unggul dari pure semantic search?	BLIND_TEST
TSK28	MOD35	350	Rancang guardrail untuk memastikan LLM menolak menjawab jika konteks tidak relevan.	BLIND_TEST
TSK29	MOD38	105	Mengapa input data user ke innerHTML tanpa escaping berisiko Stored/Reflected XSS?	BLIND_TEST
TSK30	MOD38	240	Sebutkan 3 atribut ARIA penting agar modal dialog aksesibel lewat keyboard.	BLIND_TEST
TSK31	MOD41	145	Bedakan strategi caching Stale-While-Revalidate vs Network-First pada Service Worker.	BLIND_TEST
TSK32	MOD41	300	Tangani kondisi fetch HTTP 500 agar state UI tidak menampilkan sukses palsu.	BLIND_TEST
TSK33	MOD44	165	Bagaimana gambar tanpa dimensi eksplisit menyebabkan Cumulative Layout Shift (CLS)?	BLIND_TEST
TSK34	MOD44	320	Identifikasi bottleneck rendering yang membuat Interaction to Next Paint (INP) > 200ms.	BLIND_TEST
TSK35	MOD47	115	Bedakan hasil ROW_NUMBER(), RANK(), dan DENSE_RANK() saat ada nilai revenue seri.	BLIND_TEST
TSK36	MOD47	255	Kapan LEFT JOIN lebih tepat daripada INNER JOIN saat menghitung conversion funnel?	BLIND_TEST
TSK37	MOD50	140	Mengapa sumbu Y yang tidak dimulai dari nol dapat menyesatkan pembaca bar chart?	BLIND_TEST
TSK38	MOD50	290	Tulis langkah membersihkan duplikasi transaksi dan outlier sebelum agregasi Pandas.	BLIND_TEST
TSK39	MOD53	175	Apa risiko menghentikan A/B test terlalu dini saat p-value sempat di bawah 0.05?	BLIND_TEST
TSK40	MOD53	335	Jelaskan cara memisahkan efek musiman dari penurunan konversi aktual pada funnel.	BLIND_TEST
MT001	MOD01	300	Checkpoint Menit 5 (Module 1: Foundations of Enterprise Sales): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT002	MOD02	300	Checkpoint Menit 5 (Module 2: Advanced B2B Negotiation): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT003	MOD03	300	Checkpoint Menit 5 (Module 3: Closing High-Value Deals): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT004	MOD04	300	Checkpoint Menit 5 (Module 4: Handling Price Objections): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT005	MOD05	300	Checkpoint Menit 5 (Module 5: Post-Sale Relationship Building): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT006	MOD11	300	Checkpoint Menit 5 (Search Intent & Technical SEO Audit): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT007	MOD12	300	Checkpoint Menit 5 (Content Pillar & Editorial Calendar): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT008	MOD13	300	Checkpoint Menit 5 (On-Page Copywriting & Conversion Hooks): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT009	MOD14	300	Checkpoint Menit 5 (Meta & Google Ads Bidding Architecture): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT010	MOD15	300	Checkpoint Menit 5 (GA4 Attribution & Event Tracking): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT011	MOD16	300	Checkpoint Menit 5 (Landing Page A/B Testing & CRO): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT012	MOD17	300	Checkpoint Menit 5 (Multi-Touch Attribution & Cohort LTV): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT013	MOD18	300	Checkpoint Menit 5 (B2B Retention Loop & Lifecycle CRM): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT014	MOD19	300	Checkpoint Menit 5 (Marketing Budget Allocation Modeling): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT015	MOD20	300	Checkpoint Menit 5 (Encapsulation, Interface & Record DTO): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT016	MOD21	300	Checkpoint Menit 5 (Java Collections, Stream API & Optional): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT017	MOD22	300	Checkpoint Menit 5 (Concurrency Basics & ExecutorService): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT018	MOD23	300	Checkpoint Menit 5 (Layered Controller-Service-Repository & Validation): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT019	MOD24	300	Checkpoint Menit 5 (JPA Fetch Strategy & Mencegah N+1 Query): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT020	MOD25	300	Checkpoint Menit 5 (PostgreSQL Indexing & Transaction Isolation): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT021	MOD26	300	Checkpoint Menit 5 (Mitigasi OWASP Top 10 & IDOR pada API): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT022	MOD27	300	Checkpoint Menit 5 (Idempotency, Rate Limiting & Redis Cache): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT023	MOD28	300	Checkpoint Menit 5 (Multi-Stage Dockerfile & Zero-Downtime Deploy): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT024	MOD29	300	Checkpoint Menit 5 (Feature Engineering & Data Leakage Prevention): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT025	MOD30	300	Checkpoint Menit 5 (Classification Metrics: Precision, Recall & F1): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT026	MOD31	300	Checkpoint Menit 5 (Cross-Validation & Hyperparameter Tuning): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT027	MOD32	300	Checkpoint Menit 5 (Autograd, Tensor Ops & Training Loop): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT028	MOD33	300	Checkpoint Menit 5 (Regularization, Dropout & AdamW Optimizer): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT029	MOD34	300	Checkpoint Menit 5 (Transfer Learning & Fine-Tuning Vision/NLP): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT030	MOD35	300	Checkpoint Menit 5 (Semantic Chunking & Hybrid Vector Search): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT031	MOD36	300	Checkpoint Menit 5 (RAG Faithfulness & Hallucination Guardrails): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT032	MOD37	300	Checkpoint Menit 5 (Latency Optimization & Token Cost Control): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT033	MOD38	300	Checkpoint Menit 5 (Semantic Landmarks, Keyboard Nav & WCAG AA): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT034	MOD39	300	Checkpoint Menit 5 (CSS Design Tokens & Responsive Grid): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT035	MOD40	300	Checkpoint Menit 5 (DOM Event Delegation & XSS Safe Rendering): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT036	MOD42	300	Checkpoint Menit 5 (Web App Manifest & Service Worker Lifecycle): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT037	MOD43	300	Checkpoint Menit 5 (IndexedDB & Cache-First Offline Strategy): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT038	MOD44	300	Checkpoint Menit 5 (Optimasi LCP, CLS & INP di Browser): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT039	MOD45	300	Checkpoint Menit 5 (Code Splitting & Critical Rendering Path): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT040	MOD46	300	Checkpoint Menit 5 (Background Sync & Push Notifications PWA): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT041	MOD47	300	Checkpoint Menit 5 (SELECT, JOIN, CTE & Window Functions): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT042	MOD48	300	Checkpoint Menit 5 (Data Cleaning & Missing Value Handling SQL): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT043	MOD49	300	Checkpoint Menit 5 (North Star Metric & Cohort Table Query): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT044	MOD50	300	Checkpoint Menit 5 (Exploratory Data Analysis dengan Pandas): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT045	MOD51	300	Checkpoint Menit 5 (Memilih Grafik KPI & Menghindari Bias Visual): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT046	MOD52	300	Checkpoint Menit 5 (Executive Dashboard Design Patterns): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT047	MOD53	300	Checkpoint Menit 5 (Hypothesis Testing, P-Value & Power Analysis): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT048	MOD54	300	Checkpoint Menit 5 (Root Cause Analysis & Anomaly Detection): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT049	MOD55	300	Checkpoint Menit 5 (Automating Weekly KPI Reports): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT050	MOD56	300	Checkpoint Menit 5 (1. Fondasi & Konsep Inti): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT051	MOD57	300	Checkpoint Menit 5 (2. Studi Kasus Implementasi Nyata): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT052	MOD58	300	Checkpoint Menit 5 (3. Praktik & Uji Kompetensi): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT053	MOD59	300	Checkpoint Menit 5 (1. Fondasi & Konsep Inti): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT054	MOD60	300	Checkpoint Menit 5 (2. Studi Kasus Implementasi Nyata): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT055	MOD61	300	Checkpoint Menit 5 (3. Praktik & Uji Kompetensi): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT056	MOD62	300	Checkpoint Menit 5 (1. Fondasi & Konsep Inti): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT057	MOD63	300	Checkpoint Menit 5 (2. Studi Kasus Implementasi Nyata): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT058	MOD64	300	Checkpoint Menit 5 (3. Praktik & Uji Kompetensi): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT059	MOD65	300	Checkpoint Menit 5 (1. Fondasi & Konsep Inti): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT060	MOD66	300	Checkpoint Menit 5 (2. Studi Kasus Implementasi Nyata): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT061	MOD67	300	Checkpoint Menit 5 (3. Praktik & Uji Kompetensi): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
BT001	MD001	120	Bagaimana design tokens menjaga konsistensi warna dan tipografi lintas tim produk?	BLIND_TEST
BT002	MD001	260	Jelaskan cara menyusun hierarki informasi dari user flow ke wireframe low-fidelity.	BLIND_TEST
BT003	MD004	140	Kapan moderated usability testing lebih tepat dibandingkan unmoderated remote test?	BLIND_TEST
BT004	MD004	290	Identifikasi friction utama pada alur checkout 4 langkah berdasarkan metrik drop-off.	BLIND_TEST
BT005	MD007	160	Mengapa rasio kontras minimum 4.5:1 penting pada komponen form dan state error?	BLIND_TEST
BT006	MD007	310	Rancang checklist handoff developer agar spesifikasi spacing dan state tidak ambigu.	BLIND_TEST
BT007	MD010	120	Bagaimana Semantic HTML dan TypeScript strict mode mencegah bug runtime di UI?	BLIND_TEST
BT008	MD010	260	Bedakan state lokal komponen dan state server dalam arsitektur aplikasi web modern.	BLIND_TEST
BT009	MD013	145	Bagaimana desain endpoint RESTful memisahkan validasi DTO input dari model database?	BLIND_TEST
BT010	MD013	300	Mengapa index foreign key dan constraint idempotency penting pada alur registrasi/order?	BLIND_TEST
BT011	MD016	170	Jelaskan mitigasi CORS misconfiguration, XSS, dan CSRF pada aplikasi full-stack produksi.	BLIND_TEST
BT012	MD016	320	Bagaimana strategi caching API mengurangi latency p95 tanpa menyajikan data basi?	BLIND_TEST
MT062	MD001	300	Checkpoint Menit 5 (1. Fondasi & Konsep Inti): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT063	MD002	300	Checkpoint Menit 5 (2. Studi Kasus Implementasi Nyata): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT064	MD003	300	Checkpoint Menit 5 (3. Praktik & Uji Kompetensi): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT065	MD004	300	Checkpoint Menit 5 (1. Fondasi & Konsep Inti): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT066	MD005	300	Checkpoint Menit 5 (2. Studi Kasus Implementasi Nyata): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT067	MD006	300	Checkpoint Menit 5 (3. Praktik & Uji Kompetensi): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT068	MD007	300	Checkpoint Menit 5 (1. Fondasi & Konsep Inti): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT069	MD008	300	Checkpoint Menit 5 (2. Studi Kasus Implementasi Nyata): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT070	MD009	300	Checkpoint Menit 5 (3. Praktik & Uji Kompetensi): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT071	MD010	300	Checkpoint Menit 5 (1. Fondasi & Konsep Inti): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT072	MD011	300	Checkpoint Menit 5 (2. Studi Kasus Implementasi Nyata): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT073	MD012	300	Checkpoint Menit 5 (3. Praktik & Uji Kompetensi): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT074	MD014	300	Checkpoint Menit 5 (2. Studi Kasus Implementasi Nyata): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT075	MD015	300	Checkpoint Menit 5 (3. Praktik & Uji Kompetensi): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT076	MD016	300	Checkpoint Menit 5 (1. Fondasi & Konsep Inti): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT077	MD017	300	Checkpoint Menit 5 (2. Studi Kasus Implementasi Nyata): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
MT078	MD018	300	Checkpoint Menit 5 (3. Praktik & Uji Kompetensi): Jelaskan konsep inti dan langkah penerapan paling penting dari materi ini.	VIDEO_CHECKPOINT
\.


--
-- Data for Name: micro_task_result; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.micro_task_result (result_id, user_id, task_id, score, completed_at) FROM stdin;
RES01	USR01	TSK01	100.00	2026-03-15
RES02	USR01	TSK02	85.00	2026-03-15
RES03	USR02	TSK01	90.00	2026-03-16
MR001	USR07	MT056	100.00	2026-11-19
MR002	USR07	BT007	100.00	2026-11-19
MR003	USR07	BT008	100.00	2026-11-19
MR004	USR07	BT009	100.00	2026-11-19
MR005	USR07	BT010	100.00	2026-11-19
MR006	USR07	BT011	100.00	2026-11-19
MR007	USR07	BT012	100.00	2026-11-19
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.modules (module_id, course_id, title, video_url, duration_seconds, sequence_order) FROM stdin;
MOD01	CRS05	Module 1: Foundations of Enterprise Sales	https://cdn.novastra.id/v/mod01.mp4	900	1
MOD02	CRS05	Module 2: Advanced B2B Negotiation	https://cdn.novastra.id/v/mod02.mp4	1112	2
MOD03	CRS05	Module 3: Closing High-Value Deals	https://cdn.novastra.id/v/mod03.mp4	840	3
MOD04	CRS05	Module 4: Handling Price Objections	https://cdn.novastra.id/v/mod04.mp4	540	4
MOD05	CRS05	Module 5: Post-Sale Relationship Building	https://cdn.novastra.id/v/mod05.mp4	720	5
MD001	CS001	1. Fondasi & Konsep Inti	https://www.youtube.com/embed/novastra-cs001-1	900	1
MD002	CS001	2. Studi Kasus Implementasi Nyata	https://www.youtube.com/embed/novastra-cs001-2	1080	2
MD003	CS001	3. Praktik & Uji Kompetensi	https://www.youtube.com/embed/novastra-cs001-3	1200	3
MD004	CS002	1. Fondasi & Konsep Inti	https://www.youtube.com/embed/novastra-cs002-1	900	1
MD005	CS002	2. Studi Kasus Implementasi Nyata	https://www.youtube.com/embed/novastra-cs002-2	1080	2
MD006	CS002	3. Praktik & Uji Kompetensi	https://www.youtube.com/embed/novastra-cs002-3	1200	3
MD007	CS003	1. Fondasi & Konsep Inti	https://www.youtube.com/embed/novastra-cs003-1	900	1
MD008	CS003	2. Studi Kasus Implementasi Nyata	https://www.youtube.com/embed/novastra-cs003-2	1080	2
MD009	CS003	3. Praktik & Uji Kompetensi	https://www.youtube.com/embed/novastra-cs003-3	1200	3
MD010	CS004	1. Fondasi & Konsep Inti	https://www.youtube.com/embed/novastra-cs004-1	900	1
MD011	CS004	2. Studi Kasus Implementasi Nyata	https://www.youtube.com/embed/novastra-cs004-2	1080	2
MD012	CS004	3. Praktik & Uji Kompetensi	https://www.youtube.com/embed/novastra-cs004-3	1200	3
MD013	CS005	1. Fondasi & Konsep Inti	https://www.youtube.com/embed/novastra-cs005-1	900	1
MD014	CS005	2. Studi Kasus Implementasi Nyata	https://www.youtube.com/embed/novastra-cs005-2	1080	2
MD015	CS005	3. Praktik & Uji Kompetensi	https://www.youtube.com/embed/novastra-cs005-3	1200	3
MD016	CS006	1. Fondasi & Konsep Inti	https://www.youtube.com/embed/novastra-cs006-1	900	1
MD017	CS006	2. Studi Kasus Implementasi Nyata	https://www.youtube.com/embed/novastra-cs006-2	1080	2
MD018	CS006	3. Praktik & Uji Kompetensi	https://www.youtube.com/embed/novastra-cs006-3	1200	3
MOD11	CRS11	Search Intent & Technical SEO Audit	https://www.youtube.com/embed/novastra-dm-11	780	1
MOD12	CRS11	Content Pillar & Editorial Calendar	https://www.youtube.com/embed/novastra-dm-12	840	2
MOD13	CRS11	On-Page Copywriting & Conversion Hooks	https://www.youtube.com/embed/novastra-dm-13	720	3
MOD14	CRS12	Meta & Google Ads Bidding Architecture	https://www.youtube.com/embed/novastra-dm-14	900	1
MOD15	CRS12	GA4 Attribution & Event Tracking	https://www.youtube.com/embed/novastra-dm-15	860	2
MOD16	CRS12	Landing Page A/B Testing & CRO	https://www.youtube.com/embed/novastra-dm-16	780	3
MOD17	CRS13	Multi-Touch Attribution & Cohort LTV	https://www.youtube.com/embed/novastra-dm-17	960	1
MOD18	CRS13	B2B Retention Loop & Lifecycle CRM	https://www.youtube.com/embed/novastra-dm-18	900	2
MOD19	CRS13	Marketing Budget Allocation Modeling	https://www.youtube.com/embed/novastra-dm-19	840	3
MOD20	CRS14	Encapsulation, Interface & Record DTO	https://www.youtube.com/embed/novastra-be-20	840	1
MOD21	CRS14	Java Collections, Stream API & Optional	https://www.youtube.com/embed/novastra-be-21	900	2
MOD22	CRS14	Concurrency Basics & ExecutorService	https://www.youtube.com/embed/novastra-be-22	860	3
MOD23	CRS15	Layered Controller-Service-Repository & Validation	https://www.youtube.com/embed/novastra-be-23	960	1
MOD24	CRS15	JPA Fetch Strategy & Mencegah N+1 Query	https://www.youtube.com/embed/novastra-be-24	1020	2
MOD25	CRS15	PostgreSQL Indexing & Transaction Isolation	https://www.youtube.com/embed/novastra-be-25	920	3
MOD26	CRS16	Mitigasi OWASP Top 10 & IDOR pada API	https://www.youtube.com/embed/novastra-be-26	980	1
MOD27	CRS16	Idempotency, Rate Limiting & Redis Cache	https://www.youtube.com/embed/novastra-be-27	940	2
MOD28	CRS16	Multi-Stage Dockerfile & Zero-Downtime Deploy	https://www.youtube.com/embed/novastra-be-28	880	3
MOD29	CRS17	Feature Engineering & Data Leakage Prevention	https://www.youtube.com/embed/novastra-ai-29	840	1
MOD30	CRS17	Classification Metrics: Precision, Recall & F1	https://www.youtube.com/embed/novastra-ai-30	900	2
MOD31	CRS17	Cross-Validation & Hyperparameter Tuning	https://www.youtube.com/embed/novastra-ai-31	780	3
MOD32	CRS18	Autograd, Tensor Ops & Training Loop	https://www.youtube.com/embed/novastra-ai-32	960	1
MOD33	CRS18	Regularization, Dropout & AdamW Optimizer	https://www.youtube.com/embed/novastra-ai-33	900	2
MOD34	CRS18	Transfer Learning & Fine-Tuning Vision/NLP	https://www.youtube.com/embed/novastra-ai-34	940	3
MOD35	CRS19	Semantic Chunking & Hybrid Vector Search	https://www.youtube.com/embed/novastra-ai-35	1020	1
MOD36	CRS19	RAG Faithfulness & Hallucination Guardrails	https://www.youtube.com/embed/novastra-ai-36	960	2
MOD37	CRS19	Latency Optimization & Token Cost Control	https://www.youtube.com/embed/novastra-ai-37	900	3
MOD38	CRS20	Semantic Landmarks, Keyboard Nav & WCAG AA	https://www.youtube.com/embed/novastra-fe-38	780	1
MOD39	CRS20	CSS Design Tokens & Responsive Grid	https://www.youtube.com/embed/novastra-fe-39	840	2
MOD40	CRS20	DOM Event Delegation & XSS Safe Rendering	https://www.youtube.com/embed/novastra-fe-40	800	3
MOD41	CRS21	Fetch API, Error Boundary & Optimistic UI	https://www.youtube.com/embed/novastra-fe-41	900	1
MOD42	CRS21	Web App Manifest & Service Worker Lifecycle	https://www.youtube.com/embed/novastra-fe-42	960	2
MOD43	CRS21	IndexedDB & Cache-First Offline Strategy	https://www.youtube.com/embed/novastra-fe-43	920	3
MOD44	CRS22	Optimasi LCP, CLS & INP di Browser	https://www.youtube.com/embed/novastra-fe-44	900	1
MOD45	CRS22	Code Splitting & Critical Rendering Path	https://www.youtube.com/embed/novastra-fe-45	860	2
MOD46	CRS22	Background Sync & Push Notifications PWA	https://www.youtube.com/embed/novastra-fe-46	840	3
MOD47	CRS23	SELECT, JOIN, CTE & Window Functions	https://www.youtube.com/embed/novastra-da-47	880	1
MOD48	CRS23	Data Cleaning & Missing Value Handling SQL	https://www.youtube.com/embed/novastra-da-48	800	2
MOD49	CRS23	North Star Metric & Cohort Table Query	https://www.youtube.com/embed/novastra-da-49	840	3
MOD50	CRS24	Exploratory Data Analysis dengan Pandas	https://www.youtube.com/embed/novastra-da-50	920	1
MOD51	CRS24	Memilih Grafik KPI & Menghindari Bias Visual	https://www.youtube.com/embed/novastra-da-51	860	2
MOD52	CRS24	Executive Dashboard Design Patterns	https://www.youtube.com/embed/novastra-da-52	840	3
MOD53	CRS25	Hypothesis Testing, P-Value & Power Analysis	https://www.youtube.com/embed/novastra-da-53	960	1
MOD54	CRS25	Root Cause Analysis & Anomaly Detection	https://www.youtube.com/embed/novastra-da-54	900	2
MOD55	CRS25	Automating Weekly KPI Reports	https://www.youtube.com/embed/novastra-da-55	820	3
MOD56	CRS01	1. Fondasi & Konsep Inti	https://www.youtube.com/embed/novastra-crs01-1	900	1
MOD57	CRS01	2. Studi Kasus Implementasi Nyata	https://www.youtube.com/embed/novastra-crs01-2	1080	2
MOD58	CRS01	3. Praktik & Uji Kompetensi	https://www.youtube.com/embed/novastra-crs01-3	1200	3
MOD59	CRS02	1. Fondasi & Konsep Inti	https://www.youtube.com/embed/novastra-crs02-1	900	1
MOD60	CRS02	2. Studi Kasus Implementasi Nyata	https://www.youtube.com/embed/novastra-crs02-2	1080	2
MOD61	CRS02	3. Praktik & Uji Kompetensi	https://www.youtube.com/embed/novastra-crs02-3	1200	3
MOD62	CRS03	1. Fondasi & Konsep Inti	https://www.youtube.com/embed/novastra-crs03-1	900	1
MOD63	CRS03	2. Studi Kasus Implementasi Nyata	https://www.youtube.com/embed/novastra-crs03-2	1080	2
MOD64	CRS03	3. Praktik & Uji Kompetensi	https://www.youtube.com/embed/novastra-crs03-3	1200	3
MOD65	CRS04	1. Fondasi & Konsep Inti	https://www.youtube.com/embed/novastra-crs04-1	900	1
MOD66	CRS04	2. Studi Kasus Implementasi Nyata	https://www.youtube.com/embed/novastra-crs04-2	1080	2
MOD67	CRS04	3. Praktik & Uji Kompetensi	https://www.youtube.com/embed/novastra-crs04-3	1200	3
\.


--
-- Data for Name: portfolio_project; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.portfolio_project (project_id, course_id, title, expected_output) FROM stdin;
PJ006	CS006	Production Full-Stack Stack	Tujuan Proyek: Siapkan deployment full-stack aman & siap produksi.\nKriteria Wajib:\n- Pipeline CI/CD otomatis di GitHub\n- Optimasi index SQL & caching API\n- Security headers, CORS & healthcheck\nFormat Pengumpulan: Repo GitHub + URL demo / DockerHub.
PRJ01	CRS01	Enterprise Design System Kit	Tujuan Proyek: Rancang sistem desain enterprise dengan atomic design.\nKriteria Wajib:\n- Hierarki atom, molekul & organisme\n- Auto-layout & design tokens rapi\n- Dokumentasi usage & do/don't\nFormat Pengumpulan: Link Figma publik (view access).
PRJ02	CRS03	SaaS Dashboard Full-Stack App	Tujuan Proyek: Bangun dashboard SaaS full-stack dengan Next.js.\nKriteria Wajib:\n- Auth & role-based route protection\n- Tabel metrik & filter API dinamis\n- Responsive layout + loading state\nFormat Pengumpulan: Repo GitHub + URL Vercel/Netlify.
PRJ03	CRS05	B2B Pitch Deck & Objection Script	Tujuan Proyek: Susun strategi negosiasi B2B kerangka Value-Pivot.\nKriteria Wajib:\n- Pitch deck 8-10 slide fokus ROI\n- Skrip tangani 5 keberatan utama\n- Simulasi call & follow-up email\nFormat Pengumpulan: Link Google Slides/Docs atau PDF publik.
PRJ11	CRS11	SEO Audit & Keyword Map Kit	Tujuan Proyek: Lakukan audit technical SEO & rencana konten 30 hari.\nKriteria Wajib:\n- Checklist 10 isu technical SEO\n- Peta cluster keyword intent jelas\n- Kalender editorial & on-page brief\nFormat Pengumpulan: Link Google Sheets / Notion publik.
PRJ12	CRS12	Full-Funnel Paid Ads Blueprint	Tujuan Proyek: Rancang arsitektur kampanye Meta & Google Ads terukur.\nKriteria Wajib:\n- Struktur funnel TOFU, MOFU, BOFU\n- Konvensi tagging UTM & event GA4\n- Target KPI ROAS, CPA & copy variasi\nFormat Pengumpulan: Link Notion / Google Slides / Sheet.
PRJ13	CRS13	Omnichannel Growth Playbook	Tujuan Proyek: Susun proposal growth 90 hari lintas channel akuisisi.\nKriteria Wajib:\n- Proyeksi CAC, LTV & payback period\n- Simulasi realokasi budget kuartal\n- Eksperimen retensi & CRM lifecycle\nFormat Pengumpulan: Link Notion / Google Docs / Slide.
PRJ14	CRS14	Library CLI & Concurrency Engine	Tujuan Proyek: Bangun CLI Java 21 dengan pemrosesan paralel aman.\nKriteria Wajib:\n- Clean architecture & Record DTO\n- Thread-safe via ExecutorService\n- Unit test JUnit 5 lolos semua\nFormat Pengumpulan: Repo GitHub publik + README lengkap.
PRJ15	CRS15	Spring Boot REST & PostgreSQL API	Tujuan Proyek: Bangun REST API Spring Boot 3 terhubung PostgreSQL.\nKriteria Wajib:\n- Layer Controller-Service-Repo + DTO\n- Query bebas N+1 & @Transactional\n- Integration test endpoint lulus\nFormat Pengumpulan: Repo GitHub + koleksi Postman/Swagger.
PRJ16	CRS16	Resilient Microservice Docker Stack	Tujuan Proyek: Containerize layanan Spring Boot tahan beban & aman.\nKriteria Wajib:\n- Multi-stage Dockerfile + compose\n- Mitigasi IDOR & API rate limiter\n- Idempotency key & health endpoint\nFormat Pengumpulan: Repo GitHub publik + Docker Compose.
PRJ17	CRS17	Customer Churn Prediction Pipeline	Tujuan Proyek: Bangun pipeline ML prediksi churn bebas data leakage.\nKriteria Wajib:\n- Split data sebelum preprocessing\n- Evaluasi F1, Precision-Recall & AUC\n- Tuning model & feature importance\nFormat Pengumpulan: Repo GitHub / Colab notebook publik.
PRJ18	CRS18	PyTorch Image Classifier Service	Tujuan Proyek: Latih model PyTorch fine-tuned & sajikan via API.\nKriteria Wajib:\n- Training loop valid + dropout/AdamW\n- Plot loss train vs val konvergen\n- Endpoint inferensi FastAPI/Flask\nFormat Pengumpulan: Repo GitHub + link demo API/Colab.
PRJ19	CRS19	Production RAG Q&A Assistant	Tujuan Proyek: Bangun asisten RAG akurat bersitasi sumber.\nKriteria Wajib:\n- Hybrid search (BM25 + dense vector)\n- Sitasi sumber & guardrail halusinasi\n- Skor faithfulness >= 90% terukur\nFormat Pengumpulan: Repo GitHub + URL demo / arsitektur.
PRJ20	CRS20	Accessible Design Token UI Kit	Tujuan Proyek: Bangun UI kit Tailwind responsif aksesibel WCAG AA.\nKriteria Wajib:\n- Design tokens konsisten & grid rapi\n- Navigasi keyboard & atribut ARIA\n- Escaping DOM aman dari celah XSS\nFormat Pengumpulan: Repo GitHub + link demo Vercel/Netlify.
PRJ21	CRS21	Offline-First PWA Task Workspace	Tujuan Proyek: Bangun aplikasi PWA installable dengan mode offline.\nKriteria Wajib:\n- Manifest & Service Worker caching\n- Cache offline IndexedDB + sync REST\n- Error handling status HTTP rapi\nFormat Pengumpulan: Repo GitHub + URL HTTPS deployment.
PRJ22	CRS22	Core Web Vitals Optimized App	Tujuan Proyek: Optimalkan web app hingga lulus Core Web Vitals.\nKriteria Wajib:\n- Skor Lighthouse Performance >= 95\n- Optimasi LCP, CLS=0 & INP < 200ms\n- Code splitting & checklist PWA lolos\nFormat Pengumpulan: Repo GitHub + link demo & laporan audit.
PRJ23	CRS23	E-Commerce Revenue SQL Workbook	Tujuan Proyek: Susun workbook SQL analitik metrik bisnis e-commerce.\nKriteria Wajib:\n- Query CTE & window function lengkap\n- Analisis cohort retensi & metrik AOV\n- Pembersihan null & duplikasi data\nFormat Pengumpulan: Repo GitHub (.sql + ringkasan).
PRJ24	CRS24	Cohort Retention Executive Deck	Tujuan Proyek: Olah data Pandas menjadi dashboard & deck eksekutif.\nKriteria Wajib:\n- Notebook EDA bersih bebas duplikasi\n- Visualisasi KPI netral tanpa bias\n- Deck 5 slide insight & rekomendasi\nFormat Pengumpulan: Repo GitHub + link Slides/BI Deck.
PRJ25	CRS25	Automated KPI Anomaly Monitor	Tujuan Proyek: Bangun skrip validasi A/B test & deteksi anomali KPI.\nKriteria Wajib:\n- Uji hipotesis p-value & sample power\n- Pisahkan efek musiman & funnel drop\n- Laporan mingguan otomatis + alert\nFormat Pengumpulan: Repo GitHub / Notebook analisis.
PJ001	CS001	UI Design Token Kit	Tujuan Proyek: Bangun UI Design System modular berbasis token di Figma.\nKriteria Wajib:\n- Token warna, spasi & tipografi\n- Varian tombol, input & kartu\n- Panduan pakai & state interaktif\nFormat Pengumpulan: Link Figma publik (view access).
PJ002	CS002	Usability Research Dossier	Tujuan Proyek: Susun riset usability & prototipe alur checkout baru.\nKriteria Wajib:\n- Rangkuman wawancara min 5 user\n- Analisis drop-off & friction\n- Prototipe interaktif teruji task\nFormat Pengumpulan: Link Figma prototype / Notion publik.
PJ003	CS003	WCAG Design Ops Playbook	Tujuan Proyek: Susun audit aksesibilitas WCAG AA & alur handoff dev.\nKriteria Wajib:\n- Audit rasio kontras teks >=4.5:1\n- Checklist spesifikasi spacing\n- Dokumentasi state focus & error\nFormat Pengumpulan: Link Figma / Notion / PDF publik.
PJ004	CS004	Type-Safe Web Component App	Tujuan Proyek: Bangun web app responsif dengan TypeScript strict.\nKriteria Wajib:\n- Zero TypeScript strict errors\n- Semantic HTML5 & navigasi mobile\n- Unit test komponen UI utama\nFormat Pengumpulan: Repo GitHub publik + URL Vercel/Netlify.
PJ005	CS005	Full-Stack CRUD & Auth Platform	Tujuan Proyek: Bangun aplikasi web full-stack terhubung PostgreSQL.\nKriteria Wajib:\n- Auth register/login & proteksi API\n- Operasi CRUD penuh + validasi DTO\n- Skema relasi DB & error handling\nFormat Pengumpulan: Repo GitHub + URL deployment aktif.
\.


--
-- Data for Name: portfolio_submission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.portfolio_submission (submission_id, user_id, project_id, external_url, score, feedback_notes, status) FROM stdin;
SUB01	USR01	PRJ01	https://figma.com/@nialarsson/design-system	92.50	Struktur komponen dan auto-layout sangat rapi.	Approved
SUB02	USR01	PRJ03	https://docs.google.com/document/d/b2b-script	88.00	Penerapan Value-Pivot sangat kuat pada studi kasus CFO.	Approved
SUB03	USR03	PRJ02	https://github.com/budisantoso/nextjs-saas	0.00	Menunggu peninjauan dari instruktur.	Pending
SB001	USR07	PJ004	https://gemini.google.com/u/1/app/9d8ec939815d6795?dest=create&pli=1	0.00	Menunggu proses AI Audit...	SUBMITTED
SB002	USR07	PJ005	https://gemini.google.com/u/1/app/9d8ec939815d6795?dest=create&pli=1	0.00	Menunggu proses AI Audit...	SUBMITTED
SB003	USR07	PJ006	https://gemini.google.com/u/1/app/9d8ec939815d6795?dest=create&pli=1	0.00	Menunggu proses AI Audit...	SUBMITTED
\.


--
-- Data for Name: skill; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.skill (skill_id, skill_name, category) FROM stdin;
SKL01	B2B Negotiation	Business
SKL02	Design Systems	UI/UX Design
SKL03	UX Research	UI/UX Design
SKL04	React & Next.js	Web Programming
SKL05	TypeScript Architecture	Web Programming
SKL11	SEO & SEM	Digital Marketing Lead
SKL12	Content Strategy	Digital Marketing Lead
SKL13	Paid Ads (Meta/Google)	Digital Marketing Lead
SKL14	Marketing Analytics	Digital Marketing Lead
SKL15	Funnel Optimization	Digital Marketing Lead
SKL16	Copywriting	Digital Marketing Lead
SKL17	Java OOP & Concurrency	Backend Engineer (Java)
SKL18	Spring Boot REST	Backend Engineer (Java)
SKL19	PostgreSQL & SQL Tuning	Backend Engineer (Java)
SKL20	System Design	Backend Engineer (Java)
SKL21	Web Security (OWASP)	Backend Engineer (Java)
SKL22	Docker & Deployment	Backend Engineer (Java)
SKL23	Python & Data Prep	AI & Machine Learning Engineer
SKL24	Classical ML & Metrics	AI & Machine Learning Engineer
SKL25	Deep Learning (PyTorch)	AI & Machine Learning Engineer
SKL26	LLM & RAG Architecture	AI & Machine Learning Engineer
SKL27	Prompt & Eval Engineering	AI & Machine Learning Engineer
SKL28	MLOps & Model Serving	AI & Machine Learning Engineer
SKL29	Modern JavaScript (ES6+)	Frontend & PWA Developer
SKL30	HTML/CSS & Design System	Frontend & PWA Developer
SKL31	State & REST Integration	Frontend & PWA Developer
SKL32	PWA & Service Workers	Frontend & PWA Developer
SKL33	Web Performance	Frontend & PWA Developer
SKL34	Accessibility (A11y)	Frontend & PWA Developer
SKL35	SQL & Querying	Data Analyst
SKL36	Spreadsheet & BI Modeling	Data Analyst
SKL37	Python (Pandas)	Data Analyst
SKL38	Data Visualization	Data Analyst
SKL39	Statistical Analysis	Data Analyst
SKL40	Business Storytelling	Data Analyst
SL001	Wireframing & User Flows	Senior UI/UX Designer
SL002	Design Systems & Tokens	Senior UI/UX Designer
SL003	UX Research & Usability Testing	Senior UI/UX Designer
SL004	Interaction & Micro-Animation	Senior UI/UX Designer
SL005	WCAG Accessibility Audit	Senior UI/UX Designer
SL006	Product Discovery & Prototyping	Senior UI/UX Designer
SL007	HTML, CSS & Responsive UI	Full-Stack Web Developer
SL008	JavaScript & TypeScript	Full-Stack Web Developer
SL009	React & Next.js Frontend	Full-Stack Web Developer
SL010	Backend REST API & Auth	Full-Stack Web Developer
SL011	Relational SQL & Schema Design	Full-Stack Web Developer
SL012	Deployment & Web Performance	Full-Stack Web Developer
\.


--
-- Data for Name: studypod_session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.studypod_session (session_id, user_id, session_type, scenario_type, sentiment_score, session_date) FROM stdin;
SPS01	USR01	AI_ROLEPLAY	Angry Client Roleplay: Software Price Objection	86.50	2026-03-10
SPS02	USR02	PEER_MATCH	Design Critique: Design System Scalability	91.00	2026-03-12
SPS03	USR03	AI_ROLEPLAY	Technical Interview: React State Management	78.00	2026-03-14
SP001	USR07	PEER_MATCH	System Design & Arsitektur API	85.00	2026-11-20
SP002	USR07	PEER_MATCH	System Design & Arsitektur API	85.00	2026-11-20
SP003	USR07	PEER_MATCH	System Design & Arsitektur API	85.00	2026-11-20
SP004	USR07	PEER_MATCH	System Design & Arsitektur API	85.00	2026-11-20
SP005	USR07	PEER_MATCH	System Design & Arsitektur API	85.00	2026-11-20
SP006	USR07	PEER_MATCH	System Design & Arsitektur API	90.00	2026-11-20
SP007	USR07	PEER_MATCH	System Design & Arsitektur API	90.00	2026-11-20
SP008	USR05	PEER_MATCH	System Design & Arsitektur API	90.00	2026-11-20
SP009	USR07	PEER_MATCH	System Design & Arsitektur API	90.00	2026-11-21
SP010	USR07	PEER_MATCH	System Design & Arsitektur API	90.00	2026-11-21
\.


--
-- Data for Name: user_skill_gap; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_skill_gap (user_id, skill_id, current_level, is_priority) FROM stdin;
USR01	SKL01	75.00	t
USR02	SKL02	65.00	t
USR02	SKL03	80.00	f
USR03	SKL04	50.00	t
USR05	SKL16	0.00	t
USR07	SKL26	0.00	t
USR07	SKL32	0.00	t
USR07	SL007	90.00	f
USR07	SL008	92.00	f
USR07	SL009	88.00	f
USR07	SL010	86.00	f
USR07	SL011	85.00	f
USR07	SL012	80.00	f
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (user_id, full_name, email, password_user, experience_level, daily_time_limit, total_xp, streak_count, joined_at, role_id) FROM stdin;
USR01	Nia Larsson	nia.larsson@novastra.id	hashed_pw_101	3	45	2450	14	2026-01-15	ROL01
USR02	Riya Kapoor	riya.kapoor@novastra.id	hashed_pw_102	2	30	1320	5	2026-02-10	ROL02
USR03	Budi Santoso	budi.santoso@novastra.id	hashed_pw_103	1	60	890	3	2026-03-01	ROL03
USR04	Fuad	nama@novastra.id	fuffafa12	0	0	0	0	2026-11-19	\N
USR07	Jane Doe	test2@nova.id	123456	1	30	800	1	2026-11-19	ROL03
USR05	test acc	test@novastra.id	LautLaos	0	30	0	0	2026-11-19	ROL01
\.


--
-- Name: career_role career_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.career_role
    ADD CONSTRAINT career_role_pkey PRIMARY KEY (role_id);


--
-- Name: career_skill_calculation career_skill_calculation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.career_skill_calculation
    ADD CONSTRAINT career_skill_calculation_pkey PRIMARY KEY (role_id, skill_id);


--
-- Name: certificate certificate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate
    ADD CONSTRAINT certificate_pkey PRIMARY KEY (certificate_id);


--
-- Name: course course_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_pkey PRIMARY KEY (course_id);


--
-- Name: enrollment enrollment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollment
    ADD CONSTRAINT enrollment_pkey PRIMARY KEY (enrollment_id);


--
-- Name: micro_task micro_task_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.micro_task
    ADD CONSTRAINT micro_task_pkey PRIMARY KEY (task_id);


--
-- Name: micro_task_result micro_task_result_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.micro_task_result
    ADD CONSTRAINT micro_task_result_pkey PRIMARY KEY (result_id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (module_id);


--
-- Name: portfolio_project portfolio_project_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_project
    ADD CONSTRAINT portfolio_project_pkey PRIMARY KEY (project_id);


--
-- Name: portfolio_submission portfolio_submission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_submission
    ADD CONSTRAINT portfolio_submission_pkey PRIMARY KEY (submission_id);


--
-- Name: skill skill_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill
    ADD CONSTRAINT skill_pkey PRIMARY KEY (skill_id);


--
-- Name: studypod_session studypod_session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studypod_session
    ADD CONSTRAINT studypod_session_pkey PRIMARY KEY (session_id);


--
-- Name: user_skill_gap user_skill_gap_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_skill_gap
    ADD CONSTRAINT user_skill_gap_pkey PRIMARY KEY (user_id, skill_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: career_skill_calculation career_skill_calculation_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.career_skill_calculation
    ADD CONSTRAINT career_skill_calculation_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.career_role(role_id) ON DELETE CASCADE;


--
-- Name: career_skill_calculation career_skill_calculation_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.career_skill_calculation
    ADD CONSTRAINT career_skill_calculation_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skill(skill_id) ON DELETE CASCADE;


--
-- Name: certificate certificate_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate
    ADD CONSTRAINT certificate_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.course(course_id) ON DELETE CASCADE;


--
-- Name: certificate certificate_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate
    ADD CONSTRAINT certificate_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: enrollment enrollment_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollment
    ADD CONSTRAINT enrollment_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.course(course_id) ON DELETE CASCADE;


--
-- Name: enrollment enrollment_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollment
    ADD CONSTRAINT enrollment_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: micro_task micro_task_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.micro_task
    ADD CONSTRAINT micro_task_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(module_id) ON DELETE CASCADE;


--
-- Name: micro_task_result micro_task_result_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.micro_task_result
    ADD CONSTRAINT micro_task_result_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.micro_task(task_id) ON DELETE CASCADE;


--
-- Name: micro_task_result micro_task_result_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.micro_task_result
    ADD CONSTRAINT micro_task_result_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: modules modules_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.course(course_id) ON DELETE CASCADE;


--
-- Name: portfolio_project portfolio_project_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_project
    ADD CONSTRAINT portfolio_project_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.course(course_id) ON DELETE CASCADE;


--
-- Name: portfolio_submission portfolio_submission_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_submission
    ADD CONSTRAINT portfolio_submission_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.portfolio_project(project_id) ON DELETE CASCADE;


--
-- Name: portfolio_submission portfolio_submission_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_submission
    ADD CONSTRAINT portfolio_submission_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: studypod_session studypod_session_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.studypod_session
    ADD CONSTRAINT studypod_session_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_skill_gap user_skill_gap_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_skill_gap
    ADD CONSTRAINT user_skill_gap_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skill(skill_id) ON DELETE CASCADE;


--
-- Name: user_skill_gap user_skill_gap_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_skill_gap
    ADD CONSTRAINT user_skill_gap_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.career_role(role_id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict XfNbUDXBVIPD3m0ELmlSRz85RZcDifgKH7BnqknWFmvnEiV9YCqZnFumxMYX5PK

