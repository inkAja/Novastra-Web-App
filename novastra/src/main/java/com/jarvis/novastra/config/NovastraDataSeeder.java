package com.jarvis.novastra.config;

import com.jarvis.novastra.entity.CareerRole;
import com.jarvis.novastra.entity.CareerSkillCalculation;
import com.jarvis.novastra.entity.Course;
import com.jarvis.novastra.entity.CourseModule;
import com.jarvis.novastra.entity.MicroTask;
import com.jarvis.novastra.entity.PortfolioProject;
import com.jarvis.novastra.entity.Skill;
import com.jarvis.novastra.repository.CareerRoleRepository;
import com.jarvis.novastra.repository.CareerSkillCalculationRepository;
import com.jarvis.novastra.repository.CourseModuleRepository;
import com.jarvis.novastra.repository.CourseRepository;
import com.jarvis.novastra.repository.MicroTaskRepository;
import com.jarvis.novastra.repository.PortfolioProjectRepository;
import com.jarvis.novastra.repository.SkillRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class NovastraDataSeeder implements CommandLineRunner {

    private static final String BLIND_TEST = "BLIND_TEST";

    private final CareerRoleRepository careerRoleRepository;
    private final SkillRepository skillRepository;
    private final CareerSkillCalculationRepository careerSkillCalculationRepository;
    private final CourseRepository courseRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final MicroTaskRepository microTaskRepository;
    private final PortfolioProjectRepository portfolioProjectRepository;

    public NovastraDataSeeder(
            CareerRoleRepository careerRoleRepository,
            SkillRepository skillRepository,
            CareerSkillCalculationRepository careerSkillCalculationRepository,
            CourseRepository courseRepository,
            CourseModuleRepository courseModuleRepository,
            MicroTaskRepository microTaskRepository,
            PortfolioProjectRepository portfolioProjectRepository) {
        this.careerRoleRepository = careerRoleRepository;
        this.skillRepository = skillRepository;
        this.careerSkillCalculationRepository = careerSkillCalculationRepository;
        this.courseRepository = courseRepository;
        this.courseModuleRepository = courseModuleRepository;
        this.microTaskRepository = microTaskRepository;
        this.portfolioProjectRepository = portfolioProjectRepository;
    }

    private record SkillSeed(String skillId, String name, int targetLevel) {}
    private record ModuleSeed(String moduleId, String title, String videoUrl, int durationSeconds, int order) {}
    private record TaskSeed(String taskId, int timestampSeconds, String questionText) {}
    private record ProjectSeed(String projectId, String title, String expectedOutput) {}
    private record CourseSeed(
            String courseId,
            String title,
            String instructor,
            int durationMinutes,
            List<ModuleSeed> modules,
            List<TaskSeed> firstModuleBlindTests,
            ProjectSeed project) {}
    private record RoleBundle(
            String roleId,
            String roleName,
            String description,
            List<SkillSeed> skills,
            List<CourseSeed> courses) {}

    @Override
    @Transactional
    public void run(String... args) {
        for (RoleBundle bundle : masterCatalog()) {
            seedRoleBundle(bundle);
        }
    }

    private void seedRoleBundle(RoleBundle bundle) {
        CareerRole role = ensureRole(bundle.roleId(), bundle.roleName(), bundle.description());
        for (SkillSeed s : bundle.skills()) {
            Skill skill = ensureSkill(s.skillId(), s.name(), role.getRoleName());
            ensureCareerSkill(role.getRoleId(), skill.getSkillId(), s.targetLevel());
        }
        for (CourseSeed c : bundle.courses()) {
            Course course = ensureCourse(c.courseId(), c.title(), role.getRoleName(), c.instructor(), c.durationMinutes());
            CourseModule firstModule = null;
            for (ModuleSeed m : c.modules()) {
                CourseModule mod = ensureModule(m.moduleId(), course.getCourseId(), m.title(), m.videoUrl(), m.durationSeconds(), m.order());
                if (m.order() == 1) {
                    firstModule = mod;
                }
            }
            if (firstModule != null) {
                for (TaskSeed t : c.firstModuleBlindTests()) {
                    ensureMicroTask(t.taskId(), firstModule.getModuleId(), t.timestampSeconds(), t.questionText());
                }
            }
            ProjectSeed p = c.project();
            ensurePortfolioProject(p.projectId(), course.getCourseId(), p.title(), p.expectedOutput());
        }
    }

    private CareerRole ensureRole(String roleId, String roleName, String description) {
        return careerRoleRepository.findByRoleName(roleName).orElseGet(() -> {
            if (careerRoleRepository.existsById(roleId)) {
                return careerRoleRepository.findById(roleId).orElseThrow();
            }
            CareerRole r = new CareerRole();
            r.setRoleId(roleId);
            r.setRoleName(roleName);
            r.setDescription(description);
            return careerRoleRepository.save(r);
        });
    }

    private Skill ensureSkill(String skillId, String skillName, String category) {
        return skillRepository.findBySkillNameAndCategory(skillName, category).orElseGet(() -> {
            if (skillRepository.existsById(skillId)) {
                return skillRepository.findById(skillId).orElseThrow();
            }
            Skill s = new Skill();
            s.setSkillId(skillId);
            s.setSkillName(skillName);
            s.setCategory(category);
            return skillRepository.save(s);
        });
    }

    private void ensureCareerSkill(String roleId, String skillId, int targetLevel) {
        if (!careerSkillCalculationRepository.existsByRoleIdAndSkillId(roleId, skillId)) {
            CareerSkillCalculation csc = new CareerSkillCalculation();
            csc.setRoleId(roleId);
            csc.setSkillId(skillId);
            csc.setTargetLevel(BigDecimal.valueOf(targetLevel));
            csc.setTimestamp(LocalDateTime.now());
            careerSkillCalculationRepository.save(csc);
        }
    }

    private Course ensureCourse(String courseId, String title, String typeCourse, String instructor, int durationMinutes) {
        return courseRepository.findByTitle(title).orElseGet(() -> {
            if (courseRepository.existsById(courseId)) {
                return courseRepository.findById(courseId).orElseThrow();
            }
            Course c = new Course();
            c.setCourseId(courseId);
            c.setTitle(title);
            c.setTypeCourse(typeCourse);
            c.setInstructorName(instructor);
            c.setDuration(durationMinutes);
            return courseRepository.save(c);
        });
    }

    private CourseModule ensureModule(String moduleId, String courseId, String title, String videoUrl, int durationSeconds, int order) {
        return courseModuleRepository.findByCourseIdAndSequenceOrder(courseId, order).orElseGet(() -> {
            if (courseModuleRepository.existsById(moduleId)) {
                return courseModuleRepository.findById(moduleId).orElseThrow();
            }
            CourseModule m = new CourseModule();
            m.setModuleId(moduleId);
            m.setCourseId(courseId);
            m.setTitle(title);
            m.setVideoUrl(videoUrl);
            m.setDurationSeconds(durationSeconds);
            m.setSequenceOrder(order);
            return courseModuleRepository.save(m);
        });
    }

    private void ensureMicroTask(String taskId, String moduleId, int timestampSeconds, String questionText) {
        if (!microTaskRepository.existsByModuleIdAndQuestionText(moduleId, questionText)
                && !microTaskRepository.existsById(taskId)) {
            MicroTask t = new MicroTask();
            t.setTaskId(taskId);
            t.setModuleId(moduleId);
            t.setTimestampSeconds(timestampSeconds);
            t.setQuestionText(questionText);
            t.setTaskType(BLIND_TEST);
            microTaskRepository.save(t);
        }
    }

    private void ensurePortfolioProject(String projectId, String courseId, String title, String expectedOutput) {
        if (!portfolioProjectRepository.existsByCourseIdAndTitle(courseId, title)
                && !portfolioProjectRepository.existsById(projectId)) {
            PortfolioProject p = new PortfolioProject();
            p.setProjectId(projectId);
            p.setCourseId(courseId);
            p.setTitle(title);
            p.setExpectedOutput(expectedOutput);
            portfolioProjectRepository.save(p);
        }
    }

    private static List<RoleBundle> masterCatalog() {
        return List.of(
                new RoleBundle(
                        "ROL01",
                        "Digital Marketing Lead",
                        "Mengelola strategi kampanye pemasaran digital, akuisisi funnel, dan growth analytics.",
                        List.of(
                                new SkillSeed("SKL11", "SEO & SEM", 88),
                                new SkillSeed("SKL12", "Content Strategy", 85),
                                new SkillSeed("SKL13", "Paid Ads (Meta/Google)", 90),
                                new SkillSeed("SKL14", "Marketing Analytics", 92),
                                new SkillSeed("SKL15", "Funnel Optimization", 86),
                                new SkillSeed("SKL16", "Copywriting", 82)
                        ),
                        List.of(
                                new CourseSeed("CRS11", "[Beginner] Digital Marketing & SEO Foundations", "Nadia Kusuma", 300,
                                        List.of(
                                                new ModuleSeed("MOD11", "Search Intent & Technical SEO Audit", "https://www.youtube.com/embed/novastra-dm-11", 780, 1),
                                                new ModuleSeed("MOD12", "Content Pillar & Editorial Calendar", "https://www.youtube.com/embed/novastra-dm-12", 840, 2),
                                                new ModuleSeed("MOD13", "On-Page Copywriting & Conversion Hooks", "https://www.youtube.com/embed/novastra-dm-13", 720, 3)
                                        ),
                                        List.of(
                                                new TaskSeed("TSK11", 120, "Susun 3 cluster keyword transactional vs informational untuk produk SaaS B2B."),
                                                new TaskSeed("TSK12", 260, "Identifikasi 3 error technical SEO yang paling menurunkan crawl budget.")
                                        ),
                                        new ProjectSeed("PRJ11", "SEO Audit & Keyword Map Kit", "Dokumen audit technical SEO dan peta keyword 30 hari siap eksekusi.")),
                                new CourseSeed("CRS12", "[Intermediate] Performance Ads & Funnel Optimization", "Rafi Pratama", 360,
                                        List.of(
                                                new ModuleSeed("MOD14", "Meta & Google Ads Bidding Architecture", "https://www.youtube.com/embed/novastra-dm-14", 900, 1),
                                                new ModuleSeed("MOD15", "GA4 Attribution & Event Tracking", "https://www.youtube.com/embed/novastra-dm-15", 860, 2),
                                                new ModuleSeed("MOD16", "Landing Page A/B Testing & CRO", "https://www.youtube.com/embed/novastra-dm-16", 780, 3)
                                        ),
                                        List.of(
                                                new TaskSeed("TSK13", 150, "Hitung ROAS dan tentukan kapan kampanye Meta Ads harus di-scale atau di-pause."),
                                                new TaskSeed("TSK14", 310, "Rancang hipotesis A/B test untuk menaikkan conversion rate landing page sebesar 15%.")
                                        ),
                                        new ProjectSeed("PRJ12", "Full-Funnel Paid Ads Blueprint", "Struktur kampanye Meta/Google Ads lengkap dengan tracking UTM & KPI ROAS.")),
                                new CourseSeed("CRS13", "[Advanced] Growth Strategy & Omnichannel Scaling", "Clarissa Tan", 420,
                                        List.of(
                                                new ModuleSeed("MOD17", "Multi-Touch Attribution & Cohort LTV", "https://www.youtube.com/embed/novastra-dm-17", 960, 1),
                                                new ModuleSeed("MOD18", "B2B Retention Loop & Lifecycle CRM", "https://www.youtube.com/embed/novastra-dm-18", 900, 2),
                                                new ModuleSeed("MOD19", "Marketing Budget Allocation Modeling", "https://www.youtube.com/embed/novastra-dm-19", 840, 3)
                                        ),
                                        List.of(
                                                new TaskSeed("TSK15", 180, "Bandingkan CAC payback period antara channel organik dan paid search."),
                                                new TaskSeed("TSK16", 340, "Rancang strategi alokasi budget kuartalan saat CPL naik 25%.")
                                        ),
                                        new ProjectSeed("PRJ13", "Omnichannel Growth Playbook", "Proposal strategi growth 90 hari beserta proyeksi CAC, LTV, dan payback."))
                        )),
                new RoleBundle(
                        "ROL04",
                        "Backend Engineer (Java)",
                        "Merancang REST API tangguh, database PostgreSQL berkinerja tinggi, dan sistem terdistribusi Java.",
                        List.of(
                                new SkillSeed("SKL17", "Java OOP & Concurrency", 90),
                                new SkillSeed("SKL18", "Spring Boot REST", 94),
                                new SkillSeed("SKL19", "PostgreSQL & SQL Tuning", 88),
                                new SkillSeed("SKL20", "System Design", 85),
                                new SkillSeed("SKL21", "Web Security (OWASP)", 86),
                                new SkillSeed("SKL22", "Docker & Deployment", 80)
                        ),
                        List.of(
                                new CourseSeed("CRS14", "[Beginner] Java 21 OOP & Clean Architecture", "Bima Santoso", 340,
                                        List.of(
                                                new ModuleSeed("MOD20", "Encapsulation, Interface & Record DTO", "https://www.youtube.com/embed/novastra-be-20", 840, 1),
                                                new ModuleSeed("MOD21", "Java Collections, Stream API & Optional", "https://www.youtube.com/embed/novastra-be-21", 900, 2),
                                                new ModuleSeed("MOD22", "Concurrency Basics & ExecutorService", "https://www.youtube.com/embed/novastra-be-22", 860, 3)
                                        ),
                                        List.of(
                                                new TaskSeed("TSK17", 110, "Jelaskan mengapa mengembalikan entity JPA langsung di controller melanggar encapsulation."),
                                                new TaskSeed("TSK18", 250, "Tulis pola thread-safe menggunakan ConcurrentHashMap untuk cache sederhana.")
                                        ),
                                        new ProjectSeed("PRJ14", "Library CLI & Concurrency Engine", "Repo Java 21 dengan unit test JUnit 5 dan pemrosesan paralel aman race condition.")),
                                new CourseSeed("CRS15", "[Intermediate] Spring Boot 3 REST & PostgreSQL", "Adi Nugroho", 460,
                                        List.of(
                                                new ModuleSeed("MOD23", "Layered Controller-Service-Repository & Validation", "https://www.youtube.com/embed/novastra-be-23", 960, 1),
                                                new ModuleSeed("MOD24", "JPA Fetch Strategy & Mencegah N+1 Query", "https://www.youtube.com/embed/novastra-be-24", 1020, 2),
                                                new ModuleSeed("MOD25", "PostgreSQL Indexing & Transaction Isolation", "https://www.youtube.com/embed/novastra-be-25", 920, 3)
                                        ),
                                        List.of(
                                                new TaskSeed("TSK19", 140, "Bagaimana @EntityGraph atau JOIN FETCH menyelesaikan masalah N+1 query pada JPA?"),
                                                new TaskSeed("TSK20", 290, "Pilih isolasi transaksi dan index PostgreSQL yang tepat untuk endpoint transfer saldo.")
                                        ),
                                        new ProjectSeed("PRJ15", "Spring Boot REST & PostgreSQL API", "REST API Spring Boot + PostgreSQL dengan @Transactional dan integrasi test.")),
                                new CourseSeed("CRS16", "[Advanced] Distributed Systems, OWASP & Docker", "Hendra Gunawan", 480,
                                        List.of(
                                                new ModuleSeed("MOD26", "Mitigasi OWASP Top 10 & IDOR pada API", "https://www.youtube.com/embed/novastra-be-26", 980, 1),
                                                new ModuleSeed("MOD27", "Idempotency, Rate Limiting & Redis Cache", "https://www.youtube.com/embed/novastra-be-27", 940, 2),
                                                new ModuleSeed("MOD28", "Multi-Stage Dockerfile & Zero-Downtime Deploy", "https://www.youtube.com/embed/novastra-be-28", 880, 3)
                                        ),
                                        List.of(
                                                new TaskSeed("TSK21", 160, "Tunjukkan cara menutup celah BOLA/IDOR pada endpoint GET /api/orders/{id}."),
                                                new TaskSeed("TSK22", 330, "Rancang mekanisme idempotency key agar retry webhook pembayaran tidak memproses ganda.")
                                        ),
                                        new ProjectSeed("PRJ16", "Resilient Microservice Docker Stack", "Layanan Spring Boot containerized lengkap dengan rate limiter dan audit OWASP."))
                        )),
                new RoleBundle(
                        "ROL05",
                        "AI & Machine Learning Engineer",
                        "Membangun model machine learning, deep learning PyTorch, dan sistem RAG/LLM siap produksi.",
                        List.of(
                                new SkillSeed("SKL23", "Python & Data Prep", 90),
                                new SkillSeed("SKL24", "Classical ML & Metrics", 86),
                                new SkillSeed("SKL25", "Deep Learning (PyTorch)", 88),
                                new SkillSeed("SKL26", "LLM & RAG Architecture", 94),
                                new SkillSeed("SKL27", "Prompt & Eval Engineering", 85),
                                new SkillSeed("SKL28", "MLOps & Model Serving", 78)
                        ),
                        List.of(
                                new CourseSeed("CRS17", "[Beginner] Python ML Foundations & Evaluation", "Sinta Wijaya", 350,
                                        List.of(
                                                new ModuleSeed("MOD29", "Feature Engineering & Data Leakage Prevention", "https://www.youtube.com/embed/novastra-ai-29", 840, 1),
                                                new ModuleSeed("MOD30", "Classification Metrics: Precision, Recall & F1", "https://www.youtube.com/embed/novastra-ai-30", 900, 2),
                                                new ModuleSeed("MOD31", "Cross-Validation & Hyperparameter Tuning", "https://www.youtube.com/embed/novastra-ai-31", 780, 3)
                                        ),
                                        List.of(
                                                new TaskSeed("TSK23", 120, "Mengapa melakukan scaling sebelum train-test split menyebabkan data leakage?"),
                                                new TaskSeed("TSK24", 260, "Pilih metrik evaluasi terbaik untuk dataset deteksi fraud dengan kelas tidak seimbang.")
                                        ),
                                        new ProjectSeed("PRJ17", "Customer Churn Prediction Pipeline", "Notebook Python terstruktur dengan pipeline scikit-learn bebas data leakage.")),
                                new CourseSeed("CRS18", "[Intermediate] Neural Networks with PyTorch", "Dr. Raka Pratama", 440,
                                        List.of(
                                                new ModuleSeed("MOD32", "Autograd, Tensor Ops & Training Loop", "https://www.youtube.com/embed/novastra-ai-32", 960, 1),
                                                new ModuleSeed("MOD33", "Regularization, Dropout & AdamW Optimizer", "https://www.youtube.com/embed/novastra-ai-33", 900, 2),
                                                new ModuleSeed("MOD34", "Transfer Learning & Fine-Tuning Vision/NLP", "https://www.youtube.com/embed/novastra-ai-34", 940, 3)
                                        ),
                                        List.of(
                                                new TaskSeed("TSK25", 135, "Apa peran optimizer.zero_grad() sebelum loss.backward() pada PyTorch training loop?"),
                                                new TaskSeed("TSK26", 295, "Diagnosis penyebab training loss turun drastis namun validation loss naik.")
                                        ),
                                        new ProjectSeed("PRJ18", "PyTorch Image Classifier Service", "Model PyTorch hasil fine-tuning dengan kurva validasi dan API inferensi.")),
                                new CourseSeed("CRS19", "[Advanced] Production RAG & LLM Systems", "Dr. Raka Pratama", 480,
                                        List.of(
                                                new ModuleSeed("MOD35", "Semantic Chunking & Hybrid Vector Search", "https://www.youtube.com/embed/novastra-ai-35", 1020, 1),
                                                new ModuleSeed("MOD36", "RAG Faithfulness & Hallucination Guardrails", "https://www.youtube.com/embed/novastra-ai-36", 960, 2),
                                                new ModuleSeed("MOD37", "Latency Optimization & Token Cost Control", "https://www.youtube.com/embed/novastra-ai-37", 900, 3)
                                        ),
                                        List.of(
                                                new TaskSeed("TSK27", 170, "Kapan hybrid search (BM25 + dense vector) lebih unggul dari pure semantic search?"),
                                                new TaskSeed("TSK28", 350, "Rancang guardrail untuk memastikan LLM menolak menjawab jika konteks tidak relevan.")
                                        ),
                                        new ProjectSeed("PRJ19", "Production RAG Q&A Assistant", "Sistem RAG dengan hybrid retrieval, sitasi sumber, dan skor faithfulness >= 90%."))
                        )),
                new RoleBundle(
                        "ROL06",
                        "Frontend & PWA Developer",
                        "Mengembangkan antarmuka web modern, aksesibel, responsif, dan Progressive Web App (PWA) offline-first.",
                        List.of(
                                new SkillSeed("SKL29", "Modern JavaScript (ES6+)", 92),
                                new SkillSeed("SKL30", "HTML/CSS & Design System", 88),
                                new SkillSeed("SKL31", "State & REST Integration", 90),
                                new SkillSeed("SKL32", "PWA & Service Workers", 85),
                                new SkillSeed("SKL33", "Web Performance", 84),
                                new SkillSeed("SKL34", "Accessibility (A11y)", 80)
                        ),
                        List.of(
                                new CourseSeed("CRS20", "[Beginner] Semantic HTML, Tailwind & Modern JS", "Tariq Ramadhan", 310,
                                        List.of(
                                                new ModuleSeed("MOD38", "Semantic Landmarks, Keyboard Nav & WCAG AA", "https://www.youtube.com/embed/novastra-fe-38", 780, 1),
                                                new ModuleSeed("MOD39", "CSS Design Tokens & Responsive Grid", "https://www.youtube.com/embed/novastra-fe-39", 840, 2),
                                                new ModuleSeed("MOD40", "DOM Event Delegation & XSS Safe Rendering", "https://www.youtube.com/embed/novastra-fe-40", 800, 3)
                                        ),
                                        List.of(
                                                new TaskSeed("TSK29", 105, "Mengapa input data user ke innerHTML tanpa escaping berisiko Stored/Reflected XSS?"),
                                                new TaskSeed("TSK30", 240, "Sebutkan 3 atribut ARIA penting agar modal dialog aksesibel lewat keyboard.")
                                        ),
                                        new ProjectSeed("PRJ20", "Accessible Design Token UI Kit", "Koleksi komponen UI responsif lulus audit kontras WCAG AA dan navigasi keyboard.")),
                                new CourseSeed("CRS21", "[Intermediate] Asynchronous JS, State & PWA Core", "Dimas Aditya", 380,
                                        List.of(
                                                new ModuleSeed("MOD41", "Fetch API, Error Boundary & Optimistic UI", "https://www.youtube.com/embed/novastra-fe-41", 900, 1),
                                                new ModuleSeed("MOD42", "Web App Manifest & Service Worker Lifecycle", "https://www.youtube.com/embed/novastra-fe-42", 960, 2),
                                                new ModuleSeed("MOD43", "IndexedDB & Cache-First Offline Strategy", "https://www.youtube.com/embed/novastra-fe-43", 920, 3)
                                        ),
                                        List.of(
                                                new TaskSeed("TSK31", 145, "Bedakan strategi caching Stale-While-Revalidate vs Network-First pada Service Worker."),
                                                new TaskSeed("TSK32", 300, "Tangani kondisi fetch HTTP 500 agar state UI tidak menampilkan sukses palsu.")
                                        ),
                                        new ProjectSeed("PRJ21", "Offline-First PWA Task Workspace", "Aplikasi PWA installable dengan Service Worker caching dan sinkronisasi REST API.")),
                                new CourseSeed("CRS22", "[Advanced] Web Performance & Core Web Vitals", "Nadia Kusuma", 360,
                                        List.of(
                                                new ModuleSeed("MOD44", "Optimasi LCP, CLS & INP di Browser", "https://www.youtube.com/embed/novastra-fe-44", 900, 1),
                                                new ModuleSeed("MOD45", "Code Splitting & Critical Rendering Path", "https://www.youtube.com/embed/novastra-fe-45", 860, 2),
                                                new ModuleSeed("MOD46", "Background Sync & Push Notifications PWA", "https://www.youtube.com/embed/novastra-fe-46", 840, 3)
                                        ),
                                        List.of(
                                                new TaskSeed("TSK33", 165, "Bagaimana gambar tanpa dimensi eksplisit menyebabkan Cumulative Layout Shift (CLS)?"),
                                                new TaskSeed("TSK34", 320, "Identifikasi bottleneck rendering yang membuat Interaction to Next Paint (INP) > 200ms.")
                                        ),
                                        new ProjectSeed("PRJ22", "Core Web Vitals Optimized App", "Laporan Lighthouse >= 95 di Performance, Accessibility, dan PWA checklist."))
                        )),
                new RoleBundle(
                        "ROL07",
                        "Data Analyst",
                        "Mengolah data SQL & Python menjadi insight bisnis, visualisasi KPI, dan eksperimen analitik terukur.",
                        List.of(
                                new SkillSeed("SKL35", "SQL & Querying", 95),
                                new SkillSeed("SKL36", "Spreadsheet & BI Modeling", 88),
                                new SkillSeed("SKL37", "Python (Pandas)", 85),
                                new SkillSeed("SKL38", "Data Visualization", 90),
                                new SkillSeed("SKL39", "Statistical Analysis", 84),
                                new SkillSeed("SKL40", "Business Storytelling", 82)
                        ),
                        List.of(
                                new CourseSeed("CRS23", "[Beginner] SQL Analytics & Business Metrics", "Bagas Permana", 320,
                                        List.of(
                                                new ModuleSeed("MOD47", "SELECT, JOIN, CTE & Window Functions", "https://www.youtube.com/embed/novastra-da-47", 880, 1),
                                                new ModuleSeed("MOD48", "Data Cleaning & Missing Value Handling SQL", "https://www.youtube.com/embed/novastra-da-48", 800, 2),
                                                new ModuleSeed("MOD49", "North Star Metric & Cohort Table Query", "https://www.youtube.com/embed/novastra-da-49", 840, 3)
                                        ),
                                        List.of(
                                                new TaskSeed("TSK35", 115, "Bedakan hasil ROW_NUMBER(), RANK(), dan DENSE_RANK() saat ada nilai revenue seri."),
                                                new TaskSeed("TSK36", 255, "Kapan LEFT JOIN lebih tepat daripada INNER JOIN saat menghitung conversion funnel?")
                                        ),
                                        new ProjectSeed("PRJ23", "E-Commerce Revenue SQL Workbook", "Kumpulan query CTE & window function untuk analisis cohort retensi dan AOV.")),
                                new CourseSeed("CRS24", "[Intermediate] Python Pandas & BI Storytelling", "Maya Putri", 390,
                                        List.of(
                                                new ModuleSeed("MOD50", "Exploratory Data Analysis dengan Pandas", "https://www.youtube.com/embed/novastra-da-50", 920, 1),
                                                new ModuleSeed("MOD51", "Memilih Grafik KPI & Menghindari Bias Visual", "https://www.youtube.com/embed/novastra-da-51", 860, 2),
                                                new ModuleSeed("MOD52", "Executive Dashboard Design Patterns", "https://www.youtube.com/embed/novastra-da-52", 840, 3)
                                        ),
                                        List.of(
                                                new TaskSeed("TSK37", 140, "Mengapa sumbu Y yang tidak dimulai dari nol dapat menyesatkan pembaca bar chart?"),
                                                new TaskSeed("TSK38", 290, "Tulis langkah membersihkan duplikasi transaksi dan outlier sebelum agregasi Pandas.")
                                        ),
                                        new ProjectSeed("PRJ24", "Cohort Retention Executive Deck", "Dashboard interaktif + ringkasan temuan bisnis dalam 5 slide eksekutif.")),
                                new CourseSeed("CRS25", "[Advanced] Statistical Experimentation & A/B Tests", "Bagas Permana", 410,
                                        List.of(
                                                new ModuleSeed("MOD53", "Hypothesis Testing, P-Value & Power Analysis", "https://www.youtube.com/embed/novastra-da-53", 960, 1),
                                                new ModuleSeed("MOD54", "Root Cause Analysis & Anomaly Detection", "https://www.youtube.com/embed/novastra-da-54", 900, 2),
                                                new ModuleSeed("MOD55", "Automating Weekly KPI Reports", "https://www.youtube.com/embed/novastra-da-55", 820, 3)
                                        ),
                                        List.of(
                                                new TaskSeed("TSK39", 175, "Apa risiko menghentikan A/B test terlalu dini saat p-value sempat di bawah 0.05?"),
                                                new TaskSeed("TSK40", 335, "Jelaskan cara memisahkan efek musiman dari penurunan konversi aktual pada funnel.")
                                        ),
                                        new ProjectSeed("PRJ25", "Automated KPI Anomaly Monitor", "Skrip analisis statistik otomatis untuk validasi A/B test dan deteksi anomali KPI."))
                        ))
        );
    }
}
