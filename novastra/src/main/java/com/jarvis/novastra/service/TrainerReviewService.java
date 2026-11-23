package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.Course;
import com.jarvis.novastra.entity.PortfolioProject;
import com.jarvis.novastra.entity.PortfolioSubmission;
import com.jarvis.novastra.entity.User;
import com.jarvis.novastra.repository.CourseRepository;
import com.jarvis.novastra.repository.PortfolioProjectRepository;
import com.jarvis.novastra.repository.PortfolioSubmissionRepository;
import com.jarvis.novastra.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrainerReviewService {

    private static final Set<String> VALID_TARGET_STATUSES = Set.of("VERIFIED", "APPROVED", "REJECTED", "PENDING");

    public record TrainerSubmissionItem(
            String submissionId,
            String userId,
            String userFullName,
            String userEmail,
            String projectId,
            String projectTitle,
            String expectedOutput,
            String courseId,
            String courseTitle,
            String externalUrl,
            BigDecimal score,
            String feedbackNotes,
            String status,
            String normalizedStatus) {}

    public record TrainerSubmissionSummary(long total, long pending, long verified, long rejected) {}

    public record TrainerSubmissionsResponse(
            TrainerSubmissionSummary summary,
            List<TrainerSubmissionItem> submissions) {}

    public record TrainerReviewRequest(Integer score, String feedbackNotes, String status) {}

    private final PortfolioSubmissionRepository portfolioSubmissionRepository;
    private final PortfolioProjectRepository portfolioProjectRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public TrainerReviewService(
            PortfolioSubmissionRepository portfolioSubmissionRepository,
            PortfolioProjectRepository portfolioProjectRepository,
            CourseRepository courseRepository,
            UserRepository userRepository) {
        this.portfolioSubmissionRepository = portfolioSubmissionRepository;
        this.portfolioProjectRepository = portfolioProjectRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    public TrainerSubmissionsResponse listSubmissions(String statusFilter, String query) {
        List<PortfolioSubmission> all = portfolioSubmissionRepository.findAll();
        List<TrainerSubmissionItem> enriched = mapSubmissions(all);

        long total = enriched.size();
        long pending = enriched.stream().filter(i -> "PENDING".equals(i.normalizedStatus())).count();
        long verified = enriched.stream().filter(i -> "VERIFIED".equals(i.normalizedStatus())).count();
        long rejected = enriched.stream().filter(i -> "REJECTED".equals(i.normalizedStatus())).count();

        String filterNorm = statusFilter != null ? statusFilter.trim().toUpperCase(Locale.ROOT) : "";
        boolean applyStatus = !filterNorm.isEmpty() && !"ALL".equals(filterNorm);
        String qNorm = query != null ? query.trim().toLowerCase(Locale.ROOT) : "";

        List<TrainerSubmissionItem> filtered = enriched.stream()
                .filter(i -> !applyStatus || filterNorm.equals(i.normalizedStatus()))
                .filter(i -> qNorm.isEmpty()
                        || containsIgnoreCase(i.submissionId(), qNorm)
                        || containsIgnoreCase(i.userFullName(), qNorm)
                        || containsIgnoreCase(i.userEmail(), qNorm)
                        || containsIgnoreCase(i.projectTitle(), qNorm)
                        || containsIgnoreCase(i.courseTitle(), qNorm))
                .sorted(Comparator
                        .comparingInt((TrainerSubmissionItem i) -> statusSortOrder(i.normalizedStatus()))
                        .thenComparing(TrainerSubmissionItem::submissionId, Comparator.reverseOrder()))
                .toList();

        return new TrainerSubmissionsResponse(new TrainerSubmissionSummary(total, pending, verified, rejected), filtered);
    }

    public TrainerSubmissionItem getSubmissionDetail(String submissionId) {
        String sid = requireSubmissionId(submissionId);
        PortfolioSubmission sub = portfolioSubmissionRepository.findById(sid)
                .orElseThrow(() -> new NoSuchElementException("Submisi tidak ditemukan."));
        return mapSubmissions(List.of(sub)).get(0);
    }

    @Transactional
    public Map<String, Object> reviewSubmission(String submissionId, TrainerReviewRequest req) {
        String sid = requireSubmissionId(submissionId);
        PortfolioSubmission sub = portfolioSubmissionRepository.findById(sid)
                .orElseThrow(() -> new NoSuchElementException("Submisi tidak ditemukan."));

        if (req == null || req.score() == null || req.score() < 0 || req.score() > 100) {
            throw new IllegalArgumentException("Skor wajib berupa angka antara 0 hingga 100.");
        }
        String rawStatus = req.status() != null ? req.status().trim().toUpperCase(Locale.ROOT) : "";
        if (!VALID_TARGET_STATUSES.contains(rawStatus)) {
            throw new IllegalArgumentException("Status review harus bernilai VERIFIED, APPROVED, REJECTED, atau PENDING.");
        }

        String feedback = req.feedbackNotes() != null ? req.feedbackNotes().trim() : "";
        if ("REJECTED".equals(rawStatus) && feedback.isEmpty()) {
            throw new IllegalArgumentException("Catatan feedback wajib diisi jika status ditolak/revisi.");
        }

        sub.setScore(BigDecimal.valueOf(req.score()).setScale(2, RoundingMode.HALF_UP));
        sub.setFeedbackNotes(feedback);
        sub.setStatus(rawStatus);
        PortfolioSubmission saved = portfolioSubmissionRepository.saveAndFlush(sub);

        TrainerSubmissionItem updatedItem = mapSubmissions(List.of(saved)).get(0);
        TrainerSubmissionSummary summary = listSubmissions(null, null).summary();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Penilaian berhasil disimpan.");
        response.put("submission", updatedItem);
        response.put("summary", summary);
        return response;
    }

    public static String normalizeStatus(String rawStatus) {
        String upper = rawStatus != null ? rawStatus.trim().toUpperCase(Locale.ROOT) : "";
        if ("VERIFIED".equals(upper) || "APPROVED".equals(upper) || "PASSED".equals(upper) || "LULUS".equals(upper)) {
            return "VERIFIED";
        }
        if ("REJECTED".equals(upper) || "REVISION".equals(upper) || "REVISI".equals(upper) || "DITOLAK".equals(upper)) {
            return "REJECTED";
        }
        return "PENDING";
    }

    private List<TrainerSubmissionItem> mapSubmissions(List<PortfolioSubmission> submissions) {
        if (submissions.isEmpty()) {
            return List.of();
        }
        Set<String> userIds = submissions.stream()
                .map(s -> s.getUserId().trim())
                .collect(Collectors.toSet());
        Set<String> projectIds = submissions.stream()
                .map(s -> s.getProjectId().trim())
                .collect(Collectors.toSet());

        Map<String, User> users = new HashMap<>();
        userRepository.findAllById(userIds).forEach(u -> users.put(u.getUserId().trim(), u));

        Map<String, PortfolioProject> projects = new HashMap<>();
        portfolioProjectRepository.findAllById(projectIds).forEach(p -> projects.put(p.getProjectId().trim(), p));

        Set<String> courseIds = projects.values().stream()
                .map(p -> p.getCourseId().trim())
                .collect(Collectors.toSet());
        Map<String, Course> courses = new HashMap<>();
        if (!courseIds.isEmpty()) {
            courseRepository.findAllById(courseIds).forEach(c -> courses.put(c.getCourseId().trim(), c));
        }

        return submissions.stream().map(s -> {
            User user = users.get(s.getUserId().trim());
            PortfolioProject project = projects.get(s.getProjectId().trim());
            String cid = project != null ? project.getCourseId().trim() : "";
            Course course = !cid.isEmpty() ? courses.get(cid) : null;

            return new TrainerSubmissionItem(
                    s.getSubmissionId(),
                    s.getUserId(),
                    user != null ? user.getFullName() : s.getUserId(),
                    user != null ? user.getEmail() : "",
                    s.getProjectId(),
                    project != null ? project.getTitle() : s.getProjectId(),
                    project != null ? project.getExpectedOutput() : "",
                    cid,
                    course != null ? course.getTitle() : "",
                    s.getExternalUrl(),
                    s.getScore() != null ? s.getScore() : BigDecimal.ZERO,
                    s.getFeedbackNotes() != null ? s.getFeedbackNotes() : "",
                    s.getStatus(),
                    normalizeStatus(s.getStatus()));
        }).toList();
    }

    private static String requireSubmissionId(String submissionId) {
        if (submissionId == null || submissionId.isBlank()) {
            throw new IllegalArgumentException("submissionId wajib diisi.");
        }
        return submissionId.trim();
    }

    private static int statusSortOrder(String normalizedStatus) {
        return switch (normalizedStatus) {
            case "PENDING" -> 0;
            case "REJECTED" -> 1;
            default -> 2;
        };
    }

    private static boolean containsIgnoreCase(String value, String lowerQuery) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(lowerQuery);
    }
}
