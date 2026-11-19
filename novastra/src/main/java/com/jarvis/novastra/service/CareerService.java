package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.CareerRole;
import com.jarvis.novastra.entity.CareerSkillCalculation;
import com.jarvis.novastra.entity.Course;
import com.jarvis.novastra.entity.CourseModule;
import com.jarvis.novastra.entity.Enrollment;
import com.jarvis.novastra.entity.MicroTask;
import com.jarvis.novastra.entity.PortfolioProject;
import com.jarvis.novastra.entity.Skill;
import com.jarvis.novastra.entity.User;
import com.jarvis.novastra.entity.UserSkillGap;
import com.jarvis.novastra.repository.CareerRoleRepository;
import com.jarvis.novastra.repository.CareerSkillCalculationRepository;
import com.jarvis.novastra.repository.CourseModuleRepository;
import com.jarvis.novastra.repository.CourseRepository;
import com.jarvis.novastra.repository.EnrollmentRepository;
import com.jarvis.novastra.repository.MicroTaskRepository;
import com.jarvis.novastra.repository.PortfolioProjectRepository;
import com.jarvis.novastra.repository.SkillRepository;
import com.jarvis.novastra.repository.UserRepository;
import com.jarvis.novastra.repository.UserSkillGapRepository;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class CareerService {

    private static final String BLIND_TEST = "BLIND_TEST";

    private final UserRepository userRepository;
    private final CareerRoleRepository careerRoleRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final MicroTaskRepository microTaskRepository;
    private final PortfolioProjectRepository portfolioProjectRepository;
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
            PortfolioProjectRepository portfolioProjectRepository,
            CareerSkillCalculationRepository careerSkillCalculationRepository,
            SkillRepository skillRepository,
            UserSkillGapRepository userSkillGapRepository) {
        this.userRepository = userRepository;
        this.careerRoleRepository = careerRoleRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.courseModuleRepository = courseModuleRepository;
        this.microTaskRepository = microTaskRepository;
        this.portfolioProjectRepository = portfolioProjectRepository;
        this.careerSkillCalculationRepository = careerSkillCalculationRepository;
        this.skillRepository = skillRepository;
        this.userSkillGapRepository = userSkillGapRepository;
    }

    public Map<String, Object> getCareerData(String userId) {
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
            empty.put("averageProgress", 0);
            empty.put("curriculum", List.of());
            empty.put("skillGaps", List.of());
            empty.put("topPriorityGaps", List.of());
            empty.put("blindTests", List.of());
            empty.put("roadmap", List.of());
            empty.put("portfolioProjects", List.of());
            return empty;
        }

        String roleId = role.getRoleId();
        String roleName = role.getRoleName();

        List<Course> roleCourses = courseRepository.findByTypeCourse(roleName);
        List<String> courseIds = roleCourses.stream().map(Course::getCourseId).toList();

        Map<String, Integer> enrollmentProgress = enrollmentRepository.findByUserId(uid).stream()
                .collect(Collectors.toMap(
                        Enrollment::getCourseId,
                        e -> e.getProgressPercentage() != null ? e.getProgressPercentage().intValue() : 0,
                        Math::max));

        List<PortfolioProject> projects = courseIds.isEmpty()
                ? List.of()
                : portfolioProjectRepository.findByCourseIdIn(courseIds);
        Map<String, PortfolioProject> projectByCourse = projects.stream()
                .collect(Collectors.toMap(PortfolioProject::getCourseId, p -> p, (a, b) -> a));

        List<Map<String, Object>> curriculum = roleCourses.stream().map(c -> {
            int progress = enrollmentProgress.getOrDefault(c.getCourseId(), 0);
            PortfolioProject proj = projectByCourse.get(c.getCourseId());
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("courseId", c.getCourseId());
            item.put("title", c.getTitle());
            item.put("typeCourse", c.getTypeCourse());
            item.put("instructorName", c.getInstructorName());
            item.put("duration", c.getDuration());
            item.put("progress", progress);
            item.put("portfolioTitle", proj != null ? proj.getTitle() : null);
            return item;
        }).toList();

        int averageProgress = curriculum.isEmpty()
                ? 0
                : (int) Math.round(curriculum.stream()
                        .mapToInt(m -> (int) m.get("progress"))
                        .average()
                        .orElse(0));

        List<Map<String, Object>> skillGaps = buildSkillGaps(uid, roleId, roleName);
        List<Map<String, Object>> blindTests = buildBlindTests(roleCourses, courseIds, roleName);
        List<Map<String, Object>> sortedByGap = skillGaps.stream()
                .sorted(Comparator.comparingInt((Map<String, Object> m) -> (int) m.get("gap")).reversed()
                        .thenComparing(m -> String.valueOf(m.get("skillId"))))
                .toList();

        List<String> topPriorityGaps = sortedByGap.stream()
                .limit(3)
                .map(m -> String.valueOf(m.get("skillName")))
                .toList();
        List<Map<String, Object>> roadmap = buildRoadmap(sortedByGap, roleName);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("userId", uid);
        payload.put("isOnboarded", true);
        payload.put("roleId", roleId);
        payload.put("roleName", roleName);
        payload.put("roleDescription", role.getDescription());
        payload.put("averageProgress", averageProgress);
        payload.put("curriculum", curriculum);
        payload.put("skillGaps", skillGaps);
        payload.put("topPriorityGaps", topPriorityGaps);
        payload.put("blindTests", blindTests);
        payload.put("roadmap", roadmap);
        payload.put("portfolioProjects", projects);
        return payload;
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
                    return s != null && roleName.equals(s.getCategory());
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
            List<Course> roleCourses, List<String> courseIds, String roleName) {
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
        Map<String, List<MicroTask>> tasksByCourse = tasks.stream()
                .filter(t -> moduleMap.containsKey(t.getModuleId()))
                .collect(Collectors.groupingBy(t -> moduleMap.get(t.getModuleId()).getCourseId()));

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
                                Map<String, Object> tm = new LinkedHashMap<>();
                                tm.put("taskId", t.getTaskId());
                                tm.put("moduleId", t.getModuleId());
                                tm.put("moduleTitle", mod != null ? mod.getTitle() : "");
                                tm.put("timestampSeconds", t.getTimestampSeconds());
                                tm.put("questionText", t.getQuestionText());
                                return tm;
                            })
                            .toList();

                    Map<String, Object> card = new LinkedHashMap<>();
                    card.put("testId", "bt-" + course.getCourseId());
                    card.put("courseId", course.getCourseId());
                    card.put("title", "Blind Test: " + course.getTitle());
                    card.put("typeCourse", roleName);
                    card.put("durationMin", Math.max(10, taskItems.size() * 10));
                    card.put("passingScore", 75);
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
