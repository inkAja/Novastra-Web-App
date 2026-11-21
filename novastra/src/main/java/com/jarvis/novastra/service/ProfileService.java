package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.CareerRole;
import com.jarvis.novastra.entity.Certificate;
import com.jarvis.novastra.entity.Course;
import com.jarvis.novastra.entity.CourseModule;
import com.jarvis.novastra.entity.Enrollment;
import com.jarvis.novastra.entity.MicroTask;
import com.jarvis.novastra.entity.MicroTaskResult;
import com.jarvis.novastra.entity.PortfolioProject;
import com.jarvis.novastra.entity.PortfolioSubmission;
import com.jarvis.novastra.entity.StudyPodSession;
import com.jarvis.novastra.entity.User;
import com.jarvis.novastra.repository.CareerRoleRepository;
import com.jarvis.novastra.repository.CertificateRepository;
import com.jarvis.novastra.repository.CourseModuleRepository;
import com.jarvis.novastra.repository.CourseRepository;
import com.jarvis.novastra.repository.EnrollmentRepository;
import com.jarvis.novastra.repository.MicroTaskRepository;
import com.jarvis.novastra.repository.MicroTaskResultRepository;
import com.jarvis.novastra.repository.PortfolioProjectRepository;
import com.jarvis.novastra.repository.PortfolioSubmissionRepository;
import com.jarvis.novastra.repository.StudyPodSessionRepository;
import com.jarvis.novastra.repository.UserRepository;
import com.jarvis.novastra.repository.UserSkillGapRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private static final int HEATMAP_DAYS = 140;
    private static final String BLIND_TEST = "BLIND_TEST";
    private static final BigDecimal PASSING_SCORE = BigDecimal.valueOf(75);
    private static final DateTimeFormatter ISSUED_MONTH_YEAR = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern TRAILING_DIGITS = Pattern.compile("(\\d+)$");

    private final UserRepository userRepository;
    private final CareerRoleRepository careerRoleRepository;
    private final CourseRepository courseRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final CertificateRepository certificateRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final MicroTaskRepository microTaskRepository;
    private final MicroTaskResultRepository microTaskResultRepository;
    private final StudyPodSessionRepository studyPodSessionRepository;
    private final PortfolioSubmissionRepository portfolioSubmissionRepository;
    private final PortfolioProjectRepository portfolioProjectRepository;
    private final UserSkillGapRepository userSkillGapRepository;

    public ProfileService(
            UserRepository userRepository,
            CareerRoleRepository careerRoleRepository,
            CourseRepository courseRepository,
            CourseModuleRepository courseModuleRepository,
            CertificateRepository certificateRepository,
            EnrollmentRepository enrollmentRepository,
            MicroTaskRepository microTaskRepository,
            MicroTaskResultRepository microTaskResultRepository,
            StudyPodSessionRepository studyPodSessionRepository,
            PortfolioSubmissionRepository portfolioSubmissionRepository,
            PortfolioProjectRepository portfolioProjectRepository,
            UserSkillGapRepository userSkillGapRepository) {
        this.userRepository = userRepository;
        this.careerRoleRepository = careerRoleRepository;
        this.courseRepository = courseRepository;
        this.courseModuleRepository = courseModuleRepository;
        this.certificateRepository = certificateRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.microTaskRepository = microTaskRepository;
        this.microTaskResultRepository = microTaskResultRepository;
        this.studyPodSessionRepository = studyPodSessionRepository;
        this.portfolioSubmissionRepository = portfolioSubmissionRepository;
        this.portfolioProjectRepository = portfolioProjectRepository;
        this.userSkillGapRepository = userSkillGapRepository;
    }

    public Map<String, Object> getProfile(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId wajib diisi.");
        }
        String uid = userId.trim();
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new NoSuchElementException("User tidak ditemukan."));

        CareerRole role = user.isOnboarded()
                ? careerRoleRepository.findById(user.getRoleId().trim()).orElse(null)
                : null;
        String roleName = role != null ? role.getRoleName() : "";

        List<Map<String, Object>> dailyConsistency = buildDailyConsistency(uid, user.getJoinedAt());
        List<Certificate> certs = certificateRepository.findByUserIdOrderByIssueDateDesc(uid);
        List<Enrollment> enrollments = enrollmentRepository.findByUserId(uid);
        List<PortfolioSubmission> userSubmissions = portfolioSubmissionRepository.findByUserId(uid);
        List<Course> roleCourses = !roleName.isBlank()
                ? courseRepository.findByTypeCourseIgnoreCase(roleName)
                : List.of();

        List<PortfolioSubmission> submittedPortfolios = userSubmissions.stream()
                .filter(s -> (s.getExternalUrl() != null && !s.getExternalUrl().isBlank())
                        || (s.getScore() != null && s.getScore().compareTo(BigDecimal.ZERO) > 0))
                .toList();

        Set<String> projectIds = submittedPortfolios.stream()
                .map(s -> s.getProjectId().trim())
                .collect(Collectors.toSet());
        Map<String, PortfolioProject> projectById = new HashMap<>();
        if (!projectIds.isEmpty()) {
            portfolioProjectRepository.findAllById(projectIds)
                    .forEach(p -> projectById.put(p.getProjectId().trim(), p));
        }

        List<String> roleCourseIds = roleCourses.stream().map(c -> c.getCourseId().trim()).toList();
        Map<String, PortfolioProject> projectByCourse = new HashMap<>();
        if (!roleCourseIds.isEmpty()) {
            for (PortfolioProject p : portfolioProjectRepository.findByCourseIdIn(roleCourseIds)) {
                projectById.putIfAbsent(p.getProjectId().trim(), p);
                projectByCourse.putIfAbsent(p.getCourseId().trim(), p);
            }
        }

        Set<String> allCourseIds = new HashSet<>(roleCourseIds);
        certs.forEach(c -> allCourseIds.add(c.getCourseId().trim()));
        projectById.values().forEach(p -> allCourseIds.add(p.getCourseId().trim()));
        enrollments.forEach(e -> {
            if (e.getCourseId() != null) allCourseIds.add(e.getCourseId().trim());
        });

        Map<String, Course> courseMap = allCourseIds.isEmpty()
                ? Map.of()
                : courseRepository.findAllById(allCourseIds).stream()
                        .collect(Collectors.toMap(c -> c.getCourseId().trim(), c -> c, (a, b) -> a));

        Map<String, Double> progressByCourse = new HashMap<>();
        Map<String, LocalDate> enrolledDateByCourse = new HashMap<>();
        for (Enrollment e : enrollments) {
            if (e.getCourseId() == null) continue;
            String cid = e.getCourseId().trim();
            double pct = e.getProgressPercentage() != null ? e.getProgressPercentage().doubleValue() : 0.0;
            progressByCourse.merge(cid, pct, Math::max);
            if (e.getEnrolledAt() != null) {
                enrolledDateByCourse.merge(cid, e.getEnrolledAt(), (a, b) -> a.isAfter(b) ? a : b);
            }
        }

        List<CourseModule> allModules = allCourseIds.isEmpty()
                ? List.of()
                : courseModuleRepository.findByCourseIdInOrderByCourseIdAscSequenceOrderAsc(allCourseIds);
        Map<String, Integer> moduleSecondsByCourse = new HashMap<>();
        Map<String, String> moduleToCourse = new HashMap<>();
        for (CourseModule mod : allModules) {
            String cid = mod.getCourseId().trim();
            moduleToCourse.put(mod.getModuleId().trim(), cid);
            moduleSecondsByCourse.merge(cid, mod.getDurationSeconds() != null ? mod.getDurationSeconds() : 0, Integer::sum);
        }

        List<MicroTask> btTasks = allModules.isEmpty()
                ? List.of()
                : microTaskRepository.findByModuleIdInAndTaskType(new ArrayList<>(moduleToCourse.keySet()), BLIND_TEST);
        if (!allModules.isEmpty() && btTasks.isEmpty()) {
            btTasks = microTaskRepository.findByModuleIdIn(new ArrayList<>(moduleToCourse.keySet()));
        }

        Map<String, BigDecimal> bestScoreByTask = new HashMap<>();
        Map<String, LocalDate> latestResultDateByCourse = new HashMap<>();
        if (!btTasks.isEmpty()) {
            List<String> btTaskIds = btTasks.stream().map(MicroTask::getTaskId).toList();
            Map<String, String> taskToCourse = new HashMap<>();
            for (MicroTask task : btTasks) {
                String cid = moduleToCourse.get(task.getModuleId().trim());
                if (cid != null) taskToCourse.put(task.getTaskId().trim(), cid);
            }
            for (MicroTaskResult r : microTaskResultRepository.findByUserIdAndTaskIdIn(uid, btTaskIds)) {
                String tid = r.getTaskId().trim();
                if (r.getScore() != null) {
                    bestScoreByTask.merge(tid, r.getScore(), (a, b) -> a.compareTo(b) >= 0 ? a : b);
                }
                String cid = taskToCourse.get(tid);
                if (cid != null && r.getCompletedAt() != null) {
                    latestResultDateByCourse.merge(cid, r.getCompletedAt(), (a, b) -> a.isAfter(b) ? a : b);
                }
            }
        }

        Map<String, List<MicroTask>> tasksByCourse = btTasks.stream()
                .filter(t -> moduleToCourse.containsKey(t.getModuleId().trim()))
                .collect(Collectors.groupingBy(t -> moduleToCourse.get(t.getModuleId().trim())));
        Map<String, Boolean> courseBtPassed = new HashMap<>();
        Map<String, Double> courseBtAvg = new HashMap<>();
        for (Map.Entry<String, List<MicroTask>> entry : tasksByCourse.entrySet()) {
            List<MicroTask> cTasks = entry.getValue();
            int passedCount = 0;
            double sum = 0.0;
            for (MicroTask t : cTasks) {
                BigDecimal sc = bestScoreByTask.get(t.getTaskId().trim());
                double val = sc != null ? sc.doubleValue() : 0.0;
                sum += val;
                if (sc != null && sc.compareTo(PASSING_SCORE) >= 0) {
                    passedCount++;
                }
            }
            courseBtPassed.put(entry.getKey(), !cTasks.isEmpty() && passedCount == cTasks.size());
            courseBtAvg.put(entry.getKey(), cTasks.isEmpty() ? 0.0 : sum / cTasks.size());
        }

        Map<String, PortfolioSubmission> subByProject = submittedPortfolios.stream()
                .collect(Collectors.toMap(s -> s.getProjectId().trim(), s -> s, (a, b) -> a));

        Set<String> coveredPowCourseIds = new HashSet<>();
        List<Map<String, Object>> verifiedItems = new ArrayList<>();
        for (PortfolioSubmission s : submittedPortfolios) {
            PortfolioProject project = projectById.get(s.getProjectId().trim());
            String cid = project != null ? project.getCourseId().trim() : "";
            if (!cid.isEmpty()) coveredPowCourseIds.add(cid);
            Course course = !cid.isEmpty() ? courseMap.get(cid) : null;

            BigDecimal effectiveScore = (s.getScore() != null && s.getScore().compareTo(BigDecimal.ZERO) > 0)
                    ? s.getScore()
                    : BigDecimal.valueOf(computeAutoPowScore(
                            progressByCourse.getOrDefault(cid, 0.0),
                            courseBtAvg.getOrDefault(cid, 0.0)))
                            .setScale(2, RoundingMode.HALF_UP);

            String rawFeedback = s.getFeedbackNotes() != null ? s.getFeedbackNotes().trim() : "";
            String cleanFeedback = (rawFeedback.isEmpty() || rawFeedback.toLowerCase(Locale.ROOT).contains("ai audit"))
                    ? "Proyek portofolio terverifikasi otomatis."
                    : rawFeedback;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("submissionId", s.getSubmissionId());
            item.put("projectId", s.getProjectId());
            item.put("title", project != null ? project.getTitle() : s.getProjectId());
            item.put("courseTitle", course != null ? course.getTitle() : "");
            item.put("typeCourse", course != null ? course.getTypeCourse() : roleName);
            item.put("externalUrl", s.getExternalUrl());
            item.put("score", effectiveScore);
            item.put("feedbackNotes", cleanFeedback);
            item.put("status", "VERIFIED");
            verifiedItems.add(item);
        }

        for (Course course : roleCourses) {
            String cid = course.getCourseId().trim();
            if (!Boolean.TRUE.equals(courseBtPassed.get(cid)) || coveredPowCourseIds.contains(cid)) {
                continue;
            }
            double btScore = courseBtAvg.getOrDefault(cid, 0.0);
            if (btScore < PASSING_SCORE.doubleValue()) {
                continue;
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("submissionId", "BT-" + cid);
            item.put("projectId", cid);
            item.put("title", "Blind Test: " + course.getTitle());
            item.put("courseTitle", course.getTitle());
            item.put("typeCourse", course.getTypeCourse());
            item.put("externalUrl", "");
            item.put("score", BigDecimal.valueOf(Math.round(btScore)).setScale(2, RoundingMode.HALF_UP));
            item.put("feedbackNotes", "Tantangan Blind Test PoW berhasil diluluskan.");
            item.put("status", "VERIFIED");
            verifiedItems.add(item);
        }

        verifiedItems.sort(Comparator
                .comparingDouble((Map<String, Object> m) -> ((Number) m.get("score")).doubleValue()).reversed()
                .thenComparing(m -> String.valueOf(m.get("submissionId"))));

        int avgPowScore = verifiedItems.isEmpty()
                ? 0
                : (int) Math.round(verifiedItems.stream()
                        .mapToDouble(m -> ((Number) m.get("score")).doubleValue())
                        .average()
                        .orElse(0));

        Set<String> coveredCertCourseIds = new HashSet<>();
        List<Map<String, Object>> certificateItems = new ArrayList<>();
        for (Certificate c : certs) {
            String cid = c.getCourseId().trim();
            coveredCertCourseIds.add(cid);
            Course course = courseMap.get(cid);
            PortfolioProject linkedProj = projectByCourse.get(cid);
            PortfolioSubmission linkedSub = linkedProj != null ? subByProject.get(linkedProj.getProjectId().trim()) : null;
            LocalDate issueDate = c.getIssueDate() != null ? c.getIssueDate() : LocalDate.now();
            String field = !roleName.isBlank() ? roleName : (course != null ? course.getTypeCourse() : "");

            certificateItems.add(buildCertificatePayload(
                    c.getCertificateId(),
                    cid,
                    course,
                    user.getFullName(),
                    field,
                    moduleSecondsByCourse.getOrDefault(cid, 0),
                    issueDate,
                    c.getCredentialUrl(),
                    linkedSub != null ? linkedSub.getExternalUrl() : ""));
        }

        for (Course course : roleCourses) {
            String cid = course.getCourseId().trim();
            if (coveredCertCourseIds.contains(cid)) {
                continue;
            }
            double pct = progressByCourse.getOrDefault(cid, 0.0);
            if (pct < 100.0) {
                continue;
            }
            PortfolioProject linkedProj = projectByCourse.get(cid);
            PortfolioSubmission linkedSub = linkedProj != null ? subByProject.get(linkedProj.getProjectId().trim()) : null;
            boolean projectSatisfied = linkedProj == null
                    || (linkedSub != null && ((linkedSub.getExternalUrl() != null && !linkedSub.getExternalUrl().isBlank())
                            || (linkedSub.getScore() != null && linkedSub.getScore().compareTo(BigDecimal.ZERO) > 0)));
            if (!projectSatisfied) {
                continue;
            }

            LocalDate issueDate = latestResultDateByCourse.getOrDefault(
                    cid, enrolledDateByCourse.getOrDefault(cid, LocalDate.now()));
            String roleCode = buildRoleCode(!roleName.isBlank() ? roleName : course.getTypeCourse());
            String autoCertId = buildAutoCertificateId(roleCode, issueDate.getYear(), cid);
            String field = !roleName.isBlank() ? roleName : course.getTypeCourse();

            certificateItems.add(buildCertificatePayload(
                    autoCertId,
                    cid,
                    course,
                    user.getFullName(),
                    field,
                    moduleSecondsByCourse.getOrDefault(cid, 0),
                    issueDate,
                    "",
                    linkedSub != null ? linkedSub.getExternalUrl() : ""));
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("userId", uid);
        payload.put("fullName", user.getFullName());
        payload.put("email", user.getEmail());
        payload.put("roleId", role != null ? role.getRoleId() : "");
        payload.put("roleName", roleName);
        payload.put("experienceLevel", user.getExperienceLevel() != null ? user.getExperienceLevel() : 0);
        payload.put("dailyTimeLimit", user.getDailyTimeLimit() != null ? user.getDailyTimeLimit() : 0);
        payload.put("streakCount", user.getStreakCount() != null ? user.getStreakCount() : 0);
        payload.put("joinedAt", user.getJoinedAt() != null ? user.getJoinedAt().toString() : "");
        payload.put("avgPowScore", avgPowScore);
        payload.put("avgAiScore", avgPowScore);
        payload.put("dailyConsistency", dailyConsistency);
        payload.put("certificates", certificateItems);
        payload.put("verifiedProofOfWork", verifiedItems);
        return payload;
    }

    private Map<String, Object> buildCertificatePayload(
            String certificateId,
            String courseId,
            Course course,
            String recipientName,
            String field,
            int moduleDurationSeconds,
            LocalDate issueDate,
            String credentialUrl,
            String submissionUrl) {
        String courseTitle = course != null && course.getTitle() != null ? course.getTitle() : courseId;
        String category = course != null && course.getTypeCourse() != null ? course.getTypeCourse() : field;
        String instructor = (course != null && course.getInstructorName() != null && !course.getInstructorName().isBlank())
                ? course.getInstructorName()
                : "Novastra Faculty";
        String duration = formatDurationLabel(course != null ? course.getDuration() : null, moduleDurationSeconds);

        Map<String, Object> item = new LinkedHashMap<>();
        item.put("certificateId", certificateId);
        item.put("courseId", courseId);
        item.put("courseTitle", courseTitle);
        item.put("courseCategory", category);
        item.put("field", field != null && !field.isBlank() ? field : category);
        item.put("recipientName", recipientName != null ? recipientName : "");
        item.put("issuer", "Novastra Academy");
        item.put("instructor", instructor);
        item.put("duration", duration);
        item.put("issueDate", issueDate != null ? issueDate.toString() : "");
        item.put("issuedDate", issueDate != null ? issueDate.format(ISSUED_MONTH_YEAR) : "");
        item.put("credentialUrl", credentialUrl != null ? credentialUrl : "");
        item.put("submissionUrl", submissionUrl != null ? submissionUrl : "");
        return item;
    }

    private static int computeAutoPowScore(double coursePct, double blindTestAvg) {
        double cRatio = Math.max(0.0, Math.min(1.0, coursePct / 100.0));
        double btRatio = Math.max(0.0, Math.min(1.0, blindTestAvg / 100.0));
        int raw = (int) Math.round(90.0 + (cRatio * 5.0) + (btRatio * 5.0));
        return Math.max(90, Math.min(100, raw));
    }

    private static String formatDurationLabel(Integer courseDurationMins, int moduleDurationSeconds) {
        int totalMins = (courseDurationMins != null && courseDurationMins > 0)
                ? courseDurationMins
                : (moduleDurationSeconds > 0 ? Math.max(1, (int) Math.round(moduleDurationSeconds / 60.0)) : 60);
        if (totalMins < 60) {
            return totalMins + " mins";
        }
        double hours = totalMins / 60.0;
        if (Math.abs(hours - Math.round(hours)) < 0.05) {
            long rounded = Math.round(hours);
            return rounded == 1 ? "1 hour" : rounded + " hours";
        }
        return String.format(Locale.ENGLISH, "%.1f hours", hours);
    }

    private static String buildRoleCode(String roleOrCategory) {
        String raw = roleOrCategory != null ? roleOrCategory.toLowerCase(Locale.ROOT) : "";
        if (raw.contains("full-stack")) return "FSW";
        if (raw.contains("marketing")) return "DML";
        if (raw.contains("backend")) return "BEJ";
        if (raw.contains("data analyst")) return "DAN";
        if (raw.contains("machine learning") || raw.contains("ai ")) return "AIM";
        if (raw.contains("frontend")) return "FPD";
        if (raw.contains("ui/ux")) return "UIX";

        StringBuilder sb = new StringBuilder();
        for (String part : raw.replaceAll("[^a-z0-9\\s]", " ").trim().split("\\s+")) {
            if (!part.isEmpty() && sb.length() < 3) {
                sb.append(Character.toUpperCase(part.charAt(0)));
            }
        }
        return sb.length() >= 2 ? sb.toString() : "NST";
    }

    private static String buildAutoCertificateId(String roleCode, int year, String courseId) {
        String cleanCid = courseId != null ? courseId.trim() : "001";
        Matcher m = TRAILING_DIGITS.matcher(cleanCid);
        if (m.find()) {
            int num = Integer.parseInt(m.group(1));
            return String.format(Locale.ROOT, "NST-%s-%d-%03d", roleCode, year, num);
        }
        return String.format(Locale.ROOT, "NST-%s-%d-%s", roleCode, year, cleanCid.toUpperCase(Locale.ROOT));
    }

    @Transactional
    public Map<String, Object> updateProfile(String userId, String fullName, String email, String newPassword) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId wajib diisi.");
        }
        String uid = userId.trim();
        String trimmedName = fullName != null ? fullName.trim() : "";
        if (trimmedName.length() < 2 || trimmedName.length() > 60) {
            throw new IllegalArgumentException("Nama lengkap wajib diisi (2-60 karakter).");
        }
        String normalizedEmail = email != null ? email.trim().toLowerCase(Locale.ROOT) : "";
        if (normalizedEmail.isEmpty() || normalizedEmail.length() > 255
                || !EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
            throw new IllegalArgumentException("Format email tidak valid.");
        }

        User user = userRepository.findById(uid)
                .orElseThrow(() -> new NoSuchElementException("User tidak ditemukan."));

        if (userRepository.existsByEmailIgnoreCaseAndUserIdNot(normalizedEmail, uid)) {
            throw new IllegalArgumentException("Email sudah digunakan oleh akun lain.");
        }

        if (newPassword != null && !newPassword.isEmpty()) {
            if (newPassword.isBlank() || newPassword.length() < 6 || newPassword.length() > 255) {
                throw new IllegalArgumentException("Password baru minimal 6 karakter dan maksimal 255 karakter.");
            }
            // shortcut: plain-text password matching AuthService; upgrade to BCryptPasswordEncoder before production
            user.setPasswordUser(newPassword);
        }

        user.setFullName(trimmedName);
        user.setEmail(normalizedEmail);
        userRepository.saveAndFlush(user);
        return getProfile(uid);
    }

    @Transactional
    public void deleteUserAccount(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId wajib diisi.");
        }
        String uid = userId.trim();
        if (!userRepository.existsById(uid)) {
            throw new NoSuchElementException("User tidak ditemukan.");
        }

        microTaskResultRepository.deleteByUserId(uid);
        portfolioSubmissionRepository.deleteByUserId(uid);
        certificateRepository.deleteByUserId(uid);
        studyPodSessionRepository.deleteByUserId(uid);
        enrollmentRepository.deleteByUserId(uid);
        userSkillGapRepository.deleteByUserId(uid);

        userRepository.deleteById(uid);
        userRepository.flush();
    }

    private List<Map<String, Object>> buildDailyConsistency(String userId, LocalDate joinedAt) {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(HEATMAP_DAYS - 1L);
        Map<LocalDate, Integer> activityCounts = new HashMap<>();

        for (MicroTaskResult r : microTaskResultRepository.findByUserIdAndCompletedAtBetween(userId, startDate, today)) {
            recordActivity(activityCounts, r.getCompletedAt(), startDate, today);
        }
        for (Enrollment e : enrollmentRepository.findByUserIdAndEnrolledAtBetween(userId, startDate, today)) {
            recordActivity(activityCounts, e.getEnrolledAt(), startDate, today);
        }
        for (StudyPodSession s : studyPodSessionRepository.findByUserIdAndSessionDateBetween(userId, startDate, today)) {
            recordActivity(activityCounts, s.getSessionDate(), startDate, today);
        }
        recordActivity(activityCounts, joinedAt, startDate, today);

        List<Map<String, Object>> days = new ArrayList<>(HEATMAP_DAYS);
        for (int i = 0; i < HEATMAP_DAYS; i++) {
            LocalDate date = startDate.plusDays(i);
            int count = activityCounts.getOrDefault(date, 0);
            Map<String, Object> cell = new LinkedHashMap<>();
            cell.put("date", date.toString());
            cell.put("count", count);
            cell.put("level", computeIntensityLevel(count));
            days.add(cell);
        }
        return days;
    }

    private static void recordActivity(
            Map<LocalDate, Integer> counts, LocalDate date, LocalDate start, LocalDate end) {
        if (date != null && !date.isBefore(start) && !date.isAfter(end)) {
            counts.merge(date, 1, Integer::sum);
        }
    }

    public static int computeIntensityLevel(int count) {
        if (count <= 0) return 0;
        if (count == 1) return 1;
        if (count == 2) return 2;
        if (count <= 4) return 3;
        return 4;
    }
}
