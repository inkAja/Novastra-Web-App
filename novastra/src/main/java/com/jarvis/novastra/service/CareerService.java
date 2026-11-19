package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.CareerRole;
import com.jarvis.novastra.entity.CareerSkillCalculation;
import com.jarvis.novastra.entity.Course;
import com.jarvis.novastra.entity.CourseModule;
import com.jarvis.novastra.entity.Enrollment;
import com.jarvis.novastra.entity.MicroTask;
import com.jarvis.novastra.entity.MicroTaskResult;
import com.jarvis.novastra.entity.PortfolioProject;
import com.jarvis.novastra.entity.PortfolioSubmission;
import com.jarvis.novastra.entity.Skill;
import com.jarvis.novastra.entity.User;
import com.jarvis.novastra.entity.UserSkillGap;
import com.jarvis.novastra.repository.CareerRoleRepository;
import com.jarvis.novastra.repository.CareerSkillCalculationRepository;
import com.jarvis.novastra.repository.CourseModuleRepository;
import com.jarvis.novastra.repository.CourseRepository;
import com.jarvis.novastra.repository.EnrollmentRepository;
import com.jarvis.novastra.repository.MicroTaskRepository;
import com.jarvis.novastra.repository.MicroTaskResultRepository;
import com.jarvis.novastra.repository.PortfolioProjectRepository;
import com.jarvis.novastra.repository.PortfolioSubmissionRepository;
import com.jarvis.novastra.repository.SkillRepository;
import com.jarvis.novastra.repository.UserRepository;
import com.jarvis.novastra.repository.UserSkillGapRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CareerService {

    private static final String BLIND_TEST = "BLIND_TEST";
    private static final BigDecimal PASSING_SCORE = BigDecimal.valueOf(75);

    private final UserRepository userRepository;
    private final CareerRoleRepository careerRoleRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final MicroTaskRepository microTaskRepository;
    private final MicroTaskResultRepository microTaskResultRepository;
    private final PortfolioProjectRepository portfolioProjectRepository;
    private final PortfolioSubmissionRepository portfolioSubmissionRepository;
    private final CareerSkillCalculationRepository careerSkillCalculationRepository;
    private final SkillRepository skillRepository;
    private final UserSkillGapRepository userSkillGapRepository;

    public CareerService(
            UserRepository userRepository,
            CareerRoleRepository careerRoleRepository,
            CourseRepository courseRepository,
            EnrollmentRepository enrollmentRepository,
            CourseModuleRepository courseModuleRepository,
            MicroTaskRepository microTaskRepository,
            MicroTaskResultRepository microTaskResultRepository,
            PortfolioProjectRepository portfolioProjectRepository,
            PortfolioSubmissionRepository portfolioSubmissionRepository,
            CareerSkillCalculationRepository careerSkillCalculationRepository,
            SkillRepository skillRepository,
            UserSkillGapRepository userSkillGapRepository) {
        this.userRepository = userRepository;
        this.careerRoleRepository = careerRoleRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.courseModuleRepository = courseModuleRepository;
        this.microTaskRepository = microTaskRepository;
        this.microTaskResultRepository = microTaskResultRepository;
        this.portfolioProjectRepository = portfolioProjectRepository;
        this.portfolioSubmissionRepository = portfolioSubmissionRepository;
        this.careerSkillCalculationRepository = careerSkillCalculationRepository;
        this.skillRepository = skillRepository;
        this.userSkillGapRepository = userSkillGapRepository;
    }

    public Map<String, Object> getCareerData(String userId) {
        return getCareerRoadmap(userId);
    }

    public Map<String, Object> getCareerRoadmap(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId wajib diisi.");
        }
        String uid = userId.trim();
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new NoSuchElementException("User tidak ditemukan."));

        CareerRole role = user.isOnboarded()
                ? careerRoleRepository.findById(user.getRoleId()).orElse(null)
                : null;

        if (role == null) {
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("userId", uid);
            empty.put("isOnboarded", false);
            empty.put("roleId", "");
            empty.put("roleName", "");
            empty.put("overallProgress", 0);
            empty.put("averageProgress", 0);
            empty.put("curriculum", List.of());
            empty.put("skillGaps", List.of());
            empty.put("skillGapAnalysis", List.of());
            empty.put("topPriorityGaps", List.of());
            empty.put("blindTests", List.of());
            empty.put("roadmap", List.of());
            empty.put("roadmapPhases", List.of());
            empty.put("portfolioProjects", List.of());
            empty.put("isCurriculumCompleted", false);
            empty.put("isAllPowPassed", false);
            empty.put("canRunAiAudit", false);
            return empty;
        }

        String roleId = role.getRoleId();
        String roleName = role.getRoleName();

        List<Course> roleCourses = courseRepository.findByTypeCourseIgnoreCase(roleName);
        List<String> courseIds = roleCourses.stream().map(Course::getCourseId).toList();

        Map<String, Integer> enrollmentProgress = enrollmentRepository.findByUserId(uid).stream()
                .filter(e -> e.getCourseId() != null)
                .collect(Collectors.toMap(
                        e -> e.getCourseId().trim(),
                        e -> e.getProgressPercentage() != null ? e.getProgressPercentage().intValue() : 0,
                        Math::max));

        List<PortfolioProject> projects = courseIds.isEmpty()
                ? List.of()
                : portfolioProjectRepository.findByCourseIdIn(courseIds);
        Map<String, PortfolioProject> projectByCourse = projects.stream()
                .collect(Collectors.toMap(p -> p.getCourseId().trim(), p -> p, (a, b) -> a));

        List<Map<String, Object>> curriculum = roleCourses.stream().map(c -> {
            String cid = c.getCourseId().trim();
            boolean isEnrolled = enrollmentProgress.containsKey(cid);
            int progress = enrollmentProgress.getOrDefault(cid, 0);
            PortfolioProject proj = projectByCourse.get(cid);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("courseId", c.getCourseId());
            item.put("title", c.getTitle());
            item.put("typeCourse", c.getTypeCourse());
            item.put("instructorName", c.getInstructorName());
            item.put("duration", c.getDuration());
            item.put("progress", progress);
            item.put("progressPercentage", progress);
            item.put("isEnrolled", isEnrolled);
            item.put("portfolioTitle", proj != null ? proj.getTitle() : null);
            return item;
        }).toList();

        int overallProgress = curriculum.isEmpty()
                ? 0
                : (int) Math.round(curriculum.stream()
                        .mapToInt(m -> (int) m.get("progressPercentage"))
                        .average()
                        .orElse(0));

        List<Map<String, Object>> skillGaps = buildSkillGaps(uid, roleId, roleName);
        List<Map<String, Object>> blindTests = buildBlindTests(uid, roleCourses, courseIds, roleName);
        List<Map<String, Object>> sortedByGap = skillGaps.stream()
                .sorted(Comparator.comparingInt((Map<String, Object> m) -> (int) m.get("gap")).reversed()
                        .thenComparing(m -> String.valueOf(m.get("skillId"))))
                .toList();

        List<String> topPriorityGaps = sortedByGap.stream()
                .limit(3)
                .map(m -> String.valueOf(m.get("skillName")))
                .toList();
        List<Map<String, Object>> roadmap = buildRoadmap(sortedByGap, roleName);

        boolean isCurriculumCompleted = !curriculum.isEmpty() && curriculum.stream()
                .allMatch(c -> ((Number) c.getOrDefault("progressPercentage", 0)).intValue() >= 100);
        boolean isAllPowPassed = !blindTests.isEmpty() && blindTests.stream()
                .allMatch(b -> Boolean.TRUE.equals(b.get("isPassed")));
        boolean canRunAiAudit = isCurriculumCompleted && isAllPowPassed;

        List<Map<String, Object>> portfolioProjects = buildPortfolioProjects(uid, roleCourses, projects);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("userId", uid);
        payload.put("isOnboarded", true);
        payload.put("roleId", roleId);
        payload.put("roleName", roleName);
        payload.put("roleDescription", role.getDescription());
        payload.put("overallProgress", overallProgress);
        payload.put("averageProgress", overallProgress);
        payload.put("curriculum", curriculum);
        payload.put("skillGaps", skillGaps);
        payload.put("skillGapAnalysis", skillGaps);
        payload.put("topPriorityGaps", topPriorityGaps);
        payload.put("blindTests", blindTests);
        payload.put("roadmap", roadmap);
        payload.put("roadmapPhases", roadmap);
        payload.put("portfolioProjects", portfolioProjects);
        payload.put("isCurriculumCompleted", isCurriculumCompleted);
        payload.put("isAllPowPassed", isAllPowPassed);
        payload.put("canRunAiAudit", canRunAiAudit);
        return payload;
    }

    /** Memeriksa apakah user memenuhi prasyarat AI Audit (kurikulum 100% dan seluruh PoW Blind Test lulus). */
    public boolean canUserRunAudit(String userId) {
        return Boolean.TRUE.equals(getCareerRoadmap(userId).get("canRunAiAudit"));
    }

    @Transactional
    public Map<String, Object> submitPortfolioProject(String userId, String projectId, String externalUrl) {
        if (userId == null || userId.isBlank() || projectId == null || projectId.isBlank()) {
            throw new IllegalArgumentException("userId dan projectId wajib diisi.");
        }
        String trimmedUrl = externalUrl != null ? externalUrl.trim() : "";
        if (trimmedUrl.isEmpty()) {
            throw new IllegalArgumentException("Tautan proyek (URL) wajib diisi.");
        }
        String lowerUrl = trimmedUrl.toLowerCase(Locale.ROOT);
        if ((!lowerUrl.startsWith("http://") && !lowerUrl.startsWith("https://")) || trimmedUrl.length() > 255) {
            throw new IllegalArgumentException("Format URL harus diawali http:// atau https:// dan maksimal 255 karakter.");
        }

        String uid = userId.trim();
        String pid = projectId.trim();
        if (!userRepository.existsById(uid)) {
            throw new NoSuchElementException("User tidak ditemukan.");
        }
        PortfolioProject project = portfolioProjectRepository.findById(pid)
                .orElseThrow(() -> new NoSuchElementException("Proyek portofolio tidak ditemukan."));

        if (!canUserRunAudit(uid)) {
            throw new IllegalStateException("Selesaikan 100% kurikulum dan seluruh Blind Test PoW sebelum mengumpulkan proyek AI Audit.");
        }

        PortfolioSubmission submission = portfolioSubmissionRepository
                .findFirstByUserIdAndProjectIdOrderBySubmissionIdAsc(uid, pid)
                .orElseGet(() -> {
                    String latestSbId = portfolioSubmissionRepository
                            .findTopBySubmissionIdStartingWithOrderBySubmissionIdDesc("SB")
                            .map(PortfolioSubmission::getSubmissionId)
                            .orElse(null);
                    PortfolioSubmission created = new PortfolioSubmission();
                    created.setSubmissionId(AuthService.nextId("SB", latestSbId));
                    created.setUserId(uid);
                    created.setProjectId(pid);
                    return created;
                });

        submission.setExternalUrl(trimmedUrl);
        submission.setStatus("SUBMITTED");
        submission.setScore(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        submission.setFeedbackNotes("Menunggu proses AI Audit...");
        PortfolioSubmission saved = portfolioSubmissionRepository.save(submission);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("submissionId", saved.getSubmissionId());
        response.put("userId", saved.getUserId());
        response.put("projectId", saved.getProjectId());
        response.put("projectTitle", project.getTitle());
        response.put("externalUrl", saved.getExternalUrl());
        response.put("status", saved.getStatus());
        response.put("score", saved.getScore());
        response.put("feedbackNotes", saved.getFeedbackNotes());
        response.put("message", "Proyek berhasil dikumpulkan dan masuk antrean AI Audit.");
        return response;
    }

    private List<Map<String, Object>> buildPortfolioProjects(
            String userId, List<Course> roleCourses, List<PortfolioProject> projects) {
        if (projects.isEmpty()) {
            return List.of();
        }
        Map<String, Course> courseById = new LinkedHashMap<>();
        Map<String, Integer> courseOrder = new LinkedHashMap<>();
        for (int i = 0; i < roleCourses.size(); i++) {
            Course c = roleCourses.get(i);
            String cid = c.getCourseId().trim();
            courseById.put(cid, c);
            courseOrder.put(cid, i);
        }

        List<String> projectIds = projects.stream().map(PortfolioProject::getProjectId).toList();
        Map<String, PortfolioSubmission> submissionByProject = portfolioSubmissionRepository
                .findByUserIdAndProjectIdIn(userId, projectIds).stream()
                .collect(Collectors.toMap(
                        s -> s.getProjectId().trim(),
                        s -> s,
                        (a, b) -> a));

        return projects.stream()
                .sorted(Comparator
                        .comparingInt((PortfolioProject p) -> courseOrder.getOrDefault(p.getCourseId().trim(), Integer.MAX_VALUE))
                        .thenComparing(PortfolioProject::getProjectId))
                .map(p -> {
                    String cid = p.getCourseId().trim();
                    String pid = p.getProjectId().trim();
                    Course course = courseById.get(cid);
                    PortfolioSubmission sub = submissionByProject.get(pid);
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("projectId", p.getProjectId());
                    item.put("courseId", p.getCourseId());
                    item.put("courseTitle", course != null ? course.getTitle() : "");
                    item.put("title", p.getTitle());
                    item.put("expectedOutput", p.getExpectedOutput());
                    if (sub != null) {
                        item.put("submissionId", sub.getSubmissionId());
                        item.put("externalUrl", sub.getExternalUrl());
                        item.put("status", sub.getStatus());
                        item.put("score", sub.getScore());
                        item.put("feedbackNotes", sub.getFeedbackNotes() != null ? sub.getFeedbackNotes() : "");
                    } else {
                        item.put("submissionId", null);
                        item.put("externalUrl", "");
                        item.put("status", "NOT_SUBMITTED");
                        item.put("score", null);
                        item.put("feedbackNotes", "");
                    }
                    return item;
                })
                .toList();
    }

    private List<Map<String, Object>> buildSkillGaps(String userId, String roleId, String roleName) {
        List<CareerSkillCalculation> calcs = careerSkillCalculationRepository.findByRoleId(roleId);
        if (calcs.isEmpty()) {
            return List.of();
        }
        Map<String, Skill> skillMap = skillRepository.findAllById(
                        calcs.stream().map(CareerSkillCalculation::getSkillId).collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(Skill::getSkillId, s -> s));

        // Prioritize the 6 skills tagged with roleName so the radar chart renders a clean role-specific hexagon
        List<CareerSkillCalculation> roleTagged = calcs.stream()
                .filter(c -> {
                    Skill s = skillMap.get(c.getSkillId());
                    return s != null && roleName.equalsIgnoreCase(s.getCategory());
                })
                .toList();
        List<CareerSkillCalculation> selected = roleTagged.isEmpty() ? calcs : roleTagged;

        Map<String, UserSkillGap> userGapMap = userSkillGapRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(UserSkillGap::getSkillId, g -> g, (a, b) -> a));

        return selected.stream()
                .sorted(Comparator.comparing(CareerSkillCalculation::getSkillId))
                .limit(6)
                .map(calc -> {
                    Skill s = skillMap.get(calc.getSkillId());
                    UserSkillGap ug = userGapMap.get(calc.getSkillId());
                    int target = calc.getTargetLevel() != null ? calc.getTargetLevel().intValue() : 80;
                    int current = ug != null && ug.getCurrentLevel() != null ? ug.getCurrentLevel().intValue() : 0;
                    Map<String, Object> axis = new LinkedHashMap<>();
                    axis.put("skillId", calc.getSkillId());
                    axis.put("skillName", s != null ? s.getSkillName() : calc.getSkillId());
                    axis.put("currentLevel", current);
                    axis.put("targetLevel", target);
                    axis.put("gap", Math.max(0, target - current));
                    axis.put("isPriority", ug != null && Boolean.TRUE.equals(ug.getIsPriority()));
                    return axis;
                })
                .toList();
    }

    private List<Map<String, Object>> buildBlindTests(
            String userId, List<Course> roleCourses, List<String> courseIds, String roleName) {
        if (courseIds.isEmpty()) {
            return List.of();
        }
        List<CourseModule> modules = courseModuleRepository.findByCourseIdInOrderByCourseIdAscSequenceOrderAsc(courseIds);
        if (modules.isEmpty()) {
            return List.of();
        }
        Map<String, CourseModule> moduleMap = modules.stream()
                .collect(Collectors.toMap(CourseModule::getModuleId, m -> m));
        List<String> moduleIds = modules.stream().map(CourseModule::getModuleId).toList();

        List<MicroTask> tasks = microTaskRepository.findByModuleIdInAndTaskType(moduleIds, BLIND_TEST);
        if (tasks.isEmpty()) {
            tasks = microTaskRepository.findByModuleIdIn(moduleIds);
        }

        Map<String, MicroTaskResult> resultByTask = Map.of();
        if (!tasks.isEmpty()) {
            List<String> allTaskIds = tasks.stream().map(MicroTask::getTaskId).toList();
            resultByTask = microTaskResultRepository.findByUserIdAndTaskIdIn(userId, allTaskIds).stream()
                    .collect(Collectors.toMap(
                            r -> r.getTaskId().trim(),
                            r -> r,
                            (a, b) -> a.getScore().compareTo(b.getScore()) >= 0 ? a : b));
        }

        Map<String, List<MicroTask>> tasksByCourse = tasks.stream()
                .filter(t -> moduleMap.containsKey(t.getModuleId()))
                .collect(Collectors.groupingBy(t -> moduleMap.get(t.getModuleId()).getCourseId()));

        Map<String, MicroTaskResult> finalResultByTask = resultByTask;
        return roleCourses.stream()
                .map(course -> {
                    List<MicroTask> courseTasks = tasksByCourse.get(course.getCourseId());
                    if (courseTasks == null || courseTasks.isEmpty()) {
                        return null;
                    }
                    List<Map<String, Object>> taskItems = courseTasks.stream()
                            .sorted(Comparator.comparing(MicroTask::getTaskId))
                            .map(t -> {
                                CourseModule mod = moduleMap.get(t.getModuleId());
                                MicroTaskResult res = finalResultByTask.get(t.getTaskId().trim());
                                int taskBestScore = res != null && res.getScore() != null ? res.getScore().intValue() : 0;
                                boolean taskPassed = res != null && res.getScore() != null
                                        && res.getScore().compareTo(PASSING_SCORE) >= 0;
                                Map<String, Object> tm = new LinkedHashMap<>();
                                tm.put("taskId", t.getTaskId());
                                tm.put("moduleId", t.getModuleId());
                                tm.put("moduleTitle", mod != null ? mod.getTitle() : "");
                                tm.put("timestampSeconds", t.getTimestampSeconds());
                                tm.put("questionText", t.getQuestionText());
                                tm.put("isPassed", taskPassed);
                                tm.put("bestScore", taskBestScore);
                                tm.put("completedAt", res != null ? res.getCompletedAt() : null);
                                return tm;
                            })
                            .toList();

                    int totalTasksCount = taskItems.size();
                    int completedTasksCount = (int) taskItems.stream()
                            .filter(tm -> Boolean.TRUE.equals(tm.get("isPassed")))
                            .count();
                    boolean isPassed = totalTasksCount > 0 && completedTasksCount == totalTasksCount;
                    int bestScore = totalTasksCount == 0
                            ? 0
                            : (int) Math.round(taskItems.stream()
                                    .mapToInt(tm -> (int) tm.get("bestScore"))
                                    .average()
                                    .orElse(0));

                    Map<String, Object> card = new LinkedHashMap<>();
                    card.put("testId", "bt-" + course.getCourseId());
                    card.put("courseId", course.getCourseId());
                    card.put("title", "Blind Test: " + course.getTitle());
                    card.put("typeCourse", roleName);
                    card.put("durationMin", Math.max(10, totalTasksCount * 10));
                    card.put("passingScore", PASSING_SCORE.intValue());
                    card.put("isPassed", isPassed);
                    card.put("bestScore", bestScore);
                    card.put("completedTasksCount", completedTasksCount);
                    card.put("totalTasksCount", totalTasksCount);
                    card.put("tasks", taskItems);
                    return card;
                })
                .filter(Objects::nonNull)
                .toList();
    }

    private List<Map<String, Object>> buildRoadmap(List<Map<String, Object>> sortedByGap, String roleName) {
        if (sortedByGap.isEmpty()) {
            return List.of();
        }
        String[] phases = {
                "Phase 1 · Minggu 1–2",
                "Phase 2 · Minggu 3–4",
                "Phase 3 · Minggu 5–6"
        };
        String[] actions = {
                "Tutup gap fundamental %s (gap %d poin → target %d%%) dan selesaikan Blind Test awal.",
                "Perdalam %s (gap %d poin → target %d%%) lewat proyek portofolio di jalur %s.",
                "Matangkan %s (gap %d poin → target %d%%) lalu jalankan AI Audit portofolio."
        };
        int count = Math.min(3, sortedByGap.size());
        List<Map<String, Object>> roadmap = new java.util.ArrayList<>();
        for (int i = 0; i < count; i++) {
            Map<String, Object> g = sortedByGap.get(i);
            String name = String.valueOf(g.get("skillName"));
            int gap = ((Number) g.get("gap")).intValue();
            int target = ((Number) g.get("targetLevel")).intValue();
            String desc = i == 1
                    ? String.format(actions[i], name, gap, target, roleName)
                    : String.format(actions[i], name, gap, target);
            roadmap.add(Map.of(
                    "phase", phases[i],
                    "skillName", name,
                    "gap", gap,
                    "description", desc));
        }
        return roadmap;
    }
}
