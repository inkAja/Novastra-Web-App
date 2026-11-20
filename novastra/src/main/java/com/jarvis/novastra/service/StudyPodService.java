package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.CareerRole;
import com.jarvis.novastra.entity.StudyPodSession;
import com.jarvis.novastra.entity.User;
import com.jarvis.novastra.repository.CareerRoleRepository;
import com.jarvis.novastra.repository.StudyPodSessionRepository;
import com.jarvis.novastra.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudyPodService {

    public static final String PEER_MATCH = "PEER_MATCH";
    private static final BigDecimal DEFAULT_SENTIMENT_SCORE = new BigDecimal("85.00");
    private static final BigDecimal MAX_SCORE = new BigDecimal("100.00");
    private static final String DEFAULT_ROLE_NAME = "General Tech Track";
    private static final PracticeTopic CROSS_ROLE_TOPIC = new PracticeTopic(
            "cross-1",
            "Cross-Role Technical Collaboration",
            16,
            "users",
            "Jelaskan kontribusi modul atau deliverable utama dari perspektif peran Anda tanpa jargon berlebihan.",
            "Ajukan pertanyaan klarifikasi lintas-peran dan beri 1 saran integrasi ke alur kerja tim.",
            "Rubrik Kolaborasi Lintas-Role: Keselarasan tujuan -> Batas serah-terima (API/Data/Desain) -> Rencana tindak lanjut.");

    public record PracticeTopic(
            String id,
            String title,
            int activePeers,
            String icon,
            String taskA,
            String taskB,
            String initialRubric) {}

    private final StudyPodSessionRepository studyPodSessionRepository;
    private final UserRepository userRepository;
    private final CareerRoleRepository careerRoleRepository;

    public StudyPodService(
            StudyPodSessionRepository studyPodSessionRepository,
            UserRepository userRepository,
            CareerRoleRepository careerRoleRepository) {
        this.studyPodSessionRepository = studyPodSessionRepository;
        this.userRepository = userRepository;
        this.careerRoleRepository = careerRoleRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTopicsForUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId wajib diisi.");
        }
        String uid = userId.trim();
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new NoSuchElementException("User tidak ditemukan."));

        String roleId = user.getRoleId();
        String roleName = (roleId != null && !roleId.isBlank())
                ? careerRoleRepository.findById(roleId.trim())
                        .map(CareerRole::getRoleName)
                        .filter(name -> !name.isBlank())
                        .orElse(DEFAULT_ROLE_NAME)
                : DEFAULT_ROLE_NAME;

        List<PracticeTopic> topics = new ArrayList<>(topicsForRoleName(roleName));
        topics.add(CROSS_ROLE_TOPIC);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("userId", uid);
        response.put("roleId", roleId);
        response.put("roleName", roleName);
        response.put("topics", topics);
        return response;
    }

    // shortcut: curated topic catalog in code per career role; move to DB table when admin editing is needed
    private static List<PracticeTopic> topicsForRoleName(String roleName) {
        String lower = roleName.toLowerCase(Locale.ROOT);
        if (lower.contains("ui/ux") || lower.contains("ux") || lower.contains("designer")) {
            return List.of(
                    new PracticeTopic(
                            "ux-1",
                            "Design System & Token Consistency",
                            9,
                            "palette",
                            "Definisikan skala tipografi & token warna yang memenuhi rasio kontras aksesibel WCAG.",
                            "Audit kontras warna, hierarki skala, dan konsistensi varian komponen.",
                            "Rubrik Design System: Skala tipografi -> Semantic color tokens -> Audit kontras WCAG AA (min. 4.5:1)."),
                    new PracticeTopic(
                            "ux-2",
                            "User Flow & Checkout Friction Audit",
                            11,
                            "git-branch",
                            "Petakan 4 langkah alur onboarding atau checkout yang ringkas dan bebas langkah berulang.",
                            "Identifikasi titik drop-off utama user beserta usulan penyederhanaan interaksi.",
                            "Rubrik User Flow: Tujuan user -> 4 langkah inti -> Mitigasi drop-off & beban kognitif."),
                    new PracticeTopic(
                            "ux-3",
                            "Usability Testing Scenario & Heuristic",
                            8,
                            "clipboard-check",
                            "Susun 2 skenario tugas usability testing yang netral tanpa kalimat mengarahkan jawaban.",
                            "Evaluasi skenario & temuan prototipe berdasarkan 10 Nielsen Usability Heuristics.",
                            "Rubrik Usability & Heuristic: Tugas berbasis konteks -> Pertanyaan bebas bias -> Pemetaan Nielsen Heuristics."),
                    new PracticeTopic(
                            "ux-4",
                            "Developer Handoff & Responsive Spec",
                            10,
                            "smartphone",
                            "Jelaskan perilaku layout dan komponen saat berpindah breakpoint dari mobile ke desktop.",
                            "Periksa kelengkapan spesifikasi state loading, empty, error, serta jarak spacing handoff.",
                            "Rubrik Handoff Dev: Breakpoint mobile-to-desktop -> Spesifikasi spacing -> State empty/error/loading."));
        }
        if (lower.contains("data") || lower.contains("analyst") || lower.contains("scientist")) {
            return List.of(
                    new PracticeTopic(
                            "da-1",
                            "SQL Exploratory & Window Functions",
                            13,
                            "database",
                            "Tulis query cohort atau retention analysis menggunakan CTE dan window function (LAG/ROW_NUMBER).",
                            "Review efisiensi eksekusi query, partisi window, serta edge-case nilai NULL.",
                            "Rubrik SQL Analytics: Definisi cohort (CTE) -> Window aggregation -> Penanganan NULL & duplikasi."),
                    new PracticeTopic(
                            "da-2",
                            "Data Cleaning & Outlier Strategy",
                            10,
                            "filter",
                            "Jelaskan strategi imputasi data hilang dan ambang deteksi outlier untuk dataset transaksi.",
                            "Evaluasi risiko distorsi maupun bias distribusi jika data dihapus atau diimputasi.",
                            "Rubrik Data Cleaning: Profil missingness -> Metode imputasi/trimming -> Uji pergeseran distribusi."),
                    new PracticeTopic(
                            "da-3",
                            "Dashboard KPI & Business Storytelling",
                            12,
                            "bar-chart-3",
                            "Tentukan 3 metrik utama penurunan churn dan narasikan insight bisnisnya untuk eksekutif.",
                            "Kritisi kejelasan definisi metrik, visualisasi yang dipilih, dan actionability keputusan.",
                            "Rubrik KPI Storytelling: North-star & leading metrics -> Konteks tren -> Rekomendasi aksi terukur."),
                    new PracticeTopic(
                            "da-4",
                            "A/B Testing & Statistical Significance",
                            9,
                            "flask-conical",
                            "Rancang hipotesis nol/alternatif, metrik primer, dan estimasi ukuran sampel uji A/B.",
                            "Cek potensi confounding variables, novelty effect, dan risiko peeking terlalu dini.",
                            "Rubrik A/B Testing: Hipotesis & MDE -> Power & durasi sampel -> Guardrail & bias kontrol."));
        }
        if (lower.contains("full-stack") || lower.contains("web") || lower.contains("software")
                || lower.contains("backend") || lower.contains("frontend") || lower.contains("java")) {
            return List.of(
                    new PracticeTopic(
                            "fs-1",
                            "System Design & Arsitektur API",
                            14,
                            "layers",
                            "Rancang kontrak endpoint REST, skema DB, dan strategi caching untuk traffic tinggi.",
                            "Review potensi bottleneck skalabilitas, single point of failure, serta celah keamanan API.",
                            "Rubrik System Design: Spesifikasi API & data (1m) -> Caching & scaling (2m) -> Bottleneck & security."),
                    new PracticeTopic(
                            "fs-2",
                            "Mock Interview Java & Spring Boot",
                            12,
                            "terminal",
                            "Jelaskan Spring Bean lifecycle, dependency injection constructor, serta batas @Transactional.",
                            "Evaluasi ketepatan konsep JVM/Spring lalu ajukan 1 pertanyaan follow-up studi kasus nyata.",
                            "Rubrik Java/Spring: IoC & Bean lifecycle -> @Transactional boundary -> Penanganan N+1 query JPA."),
                    new PracticeTopic(
                            "fs-3",
                            "Pair Debugging Vanilla JS & Async UI",
                            11,
                            "code",
                            "Uraikan skenario race condition saat fetch ganda atau error handling UI async yang gagal.",
                            "Identifikasi akar bug pada state/event listener dan rumuskan perbaikannya langkah demi langkah.",
                            "Rubrik Debugging JS: Reproduksi race condition -> Abort/guard state -> Cleanup listener & error UI."),
                    new PracticeTopic(
                            "fs-4",
                            "SQL Query Optimization & Indexing",
                            10,
                            "database",
                            "Tulis contoh query multi-JOIN laporan yang lambat beserta struktur tabel dasarnya.",
                            "Usulkan composite index B-Tree yang tepat dan optimasi pembacaan query plan EXPLAIN.",
                            "Rubrik SQL Optimization: Analisis EXPLAIN -> Urutan kolom composite index -> Trade-off overhead write."));
        }
        return List.of(
                new PracticeTopic(
                        "gen-1",
                        "System Design & Arsitektur API",
                        12,
                        "layers",
                        "Rancang alur API, pembagian layanan inti, dan batas skalabilitas sistem aplikasi modern.",
                        "Tinjau kejelasan aliran data, potensi bottleneck, dan kemudahan pemeliharaan arsitektur.",
                        "Rubrik System Design: Alur komponen inti -> Skalabilitas -> Trade-off & keandalan."),
                new PracticeTopic(
                        "gen-2",
                        "Problem Solving & Code Review",
                        10,
                        "git-pull-request",
                        "Presentasikan pendekatan pemecahan masalah beserta struktur fungsi modularnya.",
                        "Beri feedback atas kejelasan logika, cakupan edge-case null/kosong, dan keterbacaan kode.",
                        "Rubrik Code Review: Modularitas helper -> Penanganan edge case -> Keterbacaan & kompleksitas."),
                new PracticeTopic(
                        "gen-3",
                        "Technical Communication & Pitching",
                        11,
                        "briefcase",
                        "Sampaikan ringkasan masalah, solusi proyek, dan dampak bisnisnya dalam 90 detik tanpa slide.",
                        "Berikan 2 poin feedback: 1 kekuatan narasi dan 1 bagian argumen teknis yang perlu dipertajam.",
                        "Rubrik Komunikasi Teknis: Masalah & konteks (15s) -> Solusi inti -> Dampak terukur & Q&A."),
                new PracticeTopic(
                        "gen-4",
                        "Database & Data Modeling",
                        9,
                        "database",
                        "Jelaskan desain relasi entitas, primary/foreign key, serta kebutuhan query utama proyek.",
                        "Evaluasi normalisasi skema, integritas referensial, dan indeks untuk pola baca tersering.",
                        "Rubrik Data Modeling: Relasi & cardinality -> Integritas FK -> Strategi indeks query utama."));
    }

    @Transactional
    public Map<String, Object> createPeerSession(
            String userId, String sessionType, String scenarioType, BigDecimal sentimentScore) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId wajib diisi.");
        }
        String uid = userId.trim();
        if (!userRepository.existsById(uid)) {
            throw new NoSuchElementException("User tidak ditemukan.");
        }

        String requestedType = sessionType != null ? sessionType.trim().toUpperCase(Locale.ROOT) : "";
        if (!requestedType.isEmpty() && !PEER_MATCH.equals(requestedType)) {
            throw new IllegalArgumentException("Hanya tipe sesi PEER_MATCH yang didukung.");
        }

        String scenario = scenarioType != null ? scenarioType.trim() : "";
        if (scenario.isEmpty() || scenario.length() > 255) {
            throw new IllegalArgumentException("Topik latihan (scenarioType) wajib diisi (maksimal 255 karakter).");
        }

        BigDecimal score;
        if (sentimentScore == null) {
            score = DEFAULT_SENTIMENT_SCORE;
        } else {
            if (sentimentScore.compareTo(BigDecimal.ZERO) < 0 || sentimentScore.compareTo(MAX_SCORE) > 0) {
                throw new IllegalArgumentException("Skor evaluasi sesi harus antara 0 dan 100.");
            }
            score = sentimentScore.setScale(2, RoundingMode.HALF_UP);
        }

        String latestSpId = studyPodSessionRepository
                .findTopBySessionIdStartingWithAndSessionIdLessThanOrderBySessionIdDesc("SP", "SPA")
                .map(StudyPodSession::getSessionId)
                .orElse(null);

        StudyPodSession session = new StudyPodSession();
        session.setSessionId(AuthService.nextId("SP", latestSpId));
        session.setUserId(uid);
        session.setSessionType(PEER_MATCH);
        session.setScenarioType(scenario);
        session.setSentimentScore(score);
        session.setSessionDate(LocalDate.now());
        StudyPodSession saved = studyPodSessionRepository.save(session);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("sessionId", saved.getSessionId());
        response.put("userId", saved.getUserId());
        response.put("sessionType", saved.getSessionType());
        response.put("scenarioType", saved.getScenarioType());
        response.put("sentimentScore", saved.getSentimentScore());
        response.put("sessionDate", saved.getSessionDate().toString());
        response.put("message", "Sesi Peer Practice berhasil dicatat.");
        return response;
    }
}
