package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.CareerRole;
import com.jarvis.novastra.entity.Certificate;
import com.jarvis.novastra.entity.Course;
import com.jarvis.novastra.entity.Enrollment;
import com.jarvis.novastra.entity.MicroTaskResult;
import com.jarvis.novastra.entity.PortfolioProject;
import com.jarvis.novastra.entity.PortfolioSubmission;
import com.jarvis.novastra.entity.StudyPodSession;
import com.jarvis.novastra.entity.User;
import com.jarvis.novastra.repository.CareerRoleRepository;
import com.jarvis.novastra.repository.CertificateRepository;
import com.jarvis.novastra.repository.CourseRepository;
import com.jarvis.novastra.repository.EnrollmentRepository;
import com.jarvis.novastra.repository.MicroTaskResultRepository;
import com.jarvis.novastra.repository.PortfolioProjectRepository;
import com.jarvis.novastra.repository.PortfolioSubmissionRepository;
import com.jarvis.novastra.repository.StudyPodSessionRepository;
import com.jarvis.novastra.repository.UserRepository;
import com.jarvis.novastra.repository.UserSkillGapRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
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
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private static final int HEATMAP_DAYS = 140;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final UserRepository userRepository;
    private final CareerRoleRepository careerRoleRepository;
    private final CourseRepository courseRepository;
    private final CertificateRepository certificateRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final MicroTaskResultRepository microTaskResultRepository;
    private final StudyPodSessionRepository studyPodSessionRepository;
    private final PortfolioSubmissionRepository portfolioSubmissionRepository;
    private final PortfolioProjectRepository portfolioProjectRepository;
    private final UserSkillGapRepository userSkillGapRepository;

    public ProfileService(
            UserRepository userRepository,
            CareerRoleRepository careerRoleRepository,
            CourseRepository courseRepository,
            CertificateRepository certificateRepository,
            EnrollmentRepository enrollmentRepository,
            MicroTaskResultRepository microTaskResultRepository,
            StudyPodSessionRepository studyPodSessionRepository,
            PortfolioSubmissionRepository portfolioSubmissionRepository,
            PortfolioProjectRepository portfolioProjectRepository,
            UserSkillGapRepository userSkillGapRepository) {
        this.userRepository = userRepository;
        this.careerRoleRepository = careerRoleRepository;
        this.courseRepository = courseRepository;
        this.certificateRepository = certificateRepository;
        this.enrollmentRepository = enrollmentRepository;
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

        List<Map<String, Object>> dailyConsistency = buildDailyConsistency(uid, user.getJoinedAt());
        List<Certificate> certs = certificateRepository.findByUserIdOrderByIssueDateDesc(uid);

        List<PortfolioSubmission> auditedSubmissions = portfolioSubmissionRepository.findByUserId(uid).stream()
                .filter(s -> s.getScore() != null && s.getScore().compareTo(BigDecimal.ZERO) > 0)
                .sorted(Comparator.comparing(PortfolioSubmission::getScore).reversed()
                        .thenComparing(PortfolioSubmission::getSubmissionId))
                .toList();

        int avgAiScore = auditedSubmissions.isEmpty()
                ? 0
                : (int) Math.round(auditedSubmissions.stream()
                        .mapToDouble(s -> s.getScore().doubleValue())
                        .average()
                        .orElse(0));

        Set<String> projectIds = auditedSubmissions.stream()
                .map(s -> s.getProjectId().trim())
                .collect(Collectors.toSet());
        Map<String, PortfolioProject> projectMap = projectIds.isEmpty()
                ? Map.of()
                : portfolioProjectRepository.findAllById(projectIds).stream()
                        .collect(Collectors.toMap(p -> p.getProjectId().trim(), p -> p, (a, b) -> a));

        Set<String> courseIds = new HashSet<>();
        certs.forEach(c -> courseIds.add(c.getCourseId().trim()));
        projectMap.values().forEach(p -> courseIds.add(p.getCourseId().trim()));
        Map<String, Course> courseMap = courseIds.isEmpty()
                ? Map.of()
                : courseRepository.findAllById(courseIds).stream()
                        .collect(Collectors.toMap(c -> c.getCourseId().trim(), c -> c, (a, b) -> a));

        List<Map<String, Object>> certificateItems = certs.stream().map(c -> {
            Course course = courseMap.get(c.getCourseId().trim());
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("certificateId", c.getCertificateId());
            item.put("courseId", c.getCourseId());
            item.put("courseTitle", course != null ? course.getTitle() : c.getCourseId());
            item.put("credentialUrl", c.getCredentialUrl());
            item.put("issueDate", c.getIssueDate() != null ? c.getIssueDate().toString() : "");
            return item;
        }).toList();

        List<Map<String, Object>> verifiedItems = auditedSubmissions.stream().map(s -> {
            PortfolioProject project = projectMap.get(s.getProjectId().trim());
            Course course = project != null ? courseMap.get(project.getCourseId().trim()) : null;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("submissionId", s.getSubmissionId());
            item.put("projectId", s.getProjectId());
            item.put("title", project != null ? project.getTitle() : s.getProjectId());
            item.put("courseTitle", course != null ? course.getTitle() : "");
            item.put("typeCourse", course != null ? course.getTypeCourse() : "");
            item.put("externalUrl", s.getExternalUrl());
            item.put("score", s.getScore());
            item.put("feedbackNotes", s.getFeedbackNotes() != null ? s.getFeedbackNotes() : "");
            item.put("status", s.getStatus());
            return item;
        }).toList();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("userId", uid);
        payload.put("fullName", user.getFullName());
        payload.put("email", user.getEmail());
        payload.put("roleId", role != null ? role.getRoleId() : "");
        payload.put("roleName", role != null ? role.getRoleName() : "");
        payload.put("streakCount", user.getStreakCount() != null ? user.getStreakCount() : 0);
        payload.put("joinedAt", user.getJoinedAt() != null ? user.getJoinedAt().toString() : "");
        payload.put("avgAiScore", avgAiScore);
        payload.put("dailyConsistency", dailyConsistency);
        payload.put("certificates", certificateItems);
        payload.put("verifiedProofOfWork", verifiedItems);
        return payload;
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
