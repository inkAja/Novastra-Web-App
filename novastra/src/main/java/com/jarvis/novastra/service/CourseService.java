package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.CareerRole;
import com.jarvis.novastra.entity.Course;
import com.jarvis.novastra.entity.CourseModule;
import com.jarvis.novastra.entity.Enrollment;
import com.jarvis.novastra.entity.User;
import com.jarvis.novastra.entity.UserSkillGap;
import com.jarvis.novastra.repository.CareerRoleRepository;
import com.jarvis.novastra.repository.CourseModuleRepository;
import com.jarvis.novastra.repository.CourseRepository;
import com.jarvis.novastra.repository.EnrollmentRepository;
import com.jarvis.novastra.repository.MicroTaskRepository;
import com.jarvis.novastra.repository.UserRepository;
import com.jarvis.novastra.repository.UserSkillGapRepository;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CourseService {

    private static final int STUDY_POD_TOPICS_COUNT = 5;

    private final CourseRepository courseRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final MicroTaskRepository microTaskRepository;
    private final UserRepository userRepository;
    private final CareerRoleRepository careerRoleRepository;
    private final UserSkillGapRepository userSkillGapRepository;
    private final EnrollmentRepository enrollmentRepository;

    public CourseService(
            CourseRepository courseRepository,
            CourseModuleRepository courseModuleRepository,
            MicroTaskRepository microTaskRepository,
            UserRepository userRepository,
            CareerRoleRepository careerRoleRepository,
            UserSkillGapRepository userSkillGapRepository,
            EnrollmentRepository enrollmentRepository) {
        this.courseRepository = courseRepository;
        this.courseModuleRepository = courseModuleRepository;
        this.microTaskRepository = microTaskRepository;
        this.userRepository = userRepository;
        this.careerRoleRepository = careerRoleRepository;
        this.userSkillGapRepository = userSkillGapRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getLearnWorkspace(String userId) {
        List<Course> courses = courseRepository.findAll().stream()
                .sorted(Comparator.comparing(Course::getCourseId))
                .toList();
        List<CourseModule> allModules = courseModuleRepository.findAll();
        Map<String, Long> moduleCountByCourse = allModules.stream()
                .collect(Collectors.groupingBy(m -> m.getCourseId().trim(), Collectors.counting()));
        long totalAssessments = microTaskRepository.count();

        String roleName = null;
        int activeSkillGapsCount = 0;
        Map<String, Integer> enrollmentProgress = Map.of();

        String uid = userId != null ? userId.trim() : "";
        if (!uid.isEmpty()) {
            User user = userRepository.findById(uid).orElse(null);
            if (user != null) {
                if (user.getRoleId() != null && !user.getRoleId().isBlank()) {
                    roleName = careerRoleRepository.findById(user.getRoleId().trim())
                            .map(CareerRole::getRoleName)
                            .orElse(null);
                }
                List<UserSkillGap> gaps = userSkillGapRepository.findByUserId(uid);
                long priorityGaps = gaps.stream().filter(g -> Boolean.TRUE.equals(g.getIsPriority())).count();
                if (priorityGaps > 0) {
                    activeSkillGapsCount = (int) priorityGaps;
                } else {
                    activeSkillGapsCount = (int) gaps.stream()
                            .filter(g -> g.getCurrentLevel() == null || g.getCurrentLevel().compareTo(BigDecimal.valueOf(80)) < 0)
                            .count();
                }
                enrollmentProgress = enrollmentRepository.findByUserId(uid).stream()
                        .collect(Collectors.toMap(
                                e -> e.getCourseId().trim(),
                                e -> e.getProgressPercentage() != null ? e.getProgressPercentage().intValue() : 0,
                                (a, b) -> b));
            }
        }

        final String targetRole = roleName;
        final Map<String, Integer> progressMap = enrollmentProgress;
        List<Map<String, Object>> courseItems = courses.stream().map(c -> {
            String cid = c.getCourseId().trim();
            boolean isEnrolled = progressMap.containsKey(cid);
            int pct = progressMap.getOrDefault(cid, 0);
            boolean recommended = targetRole != null && targetRole.equalsIgnoreCase(c.getTypeCourse());
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("courseId", c.getCourseId());
            item.put("title", c.getTitle());
            item.put("typeCourse", c.getTypeCourse());
            item.put("instructorName", c.getInstructorName());
            item.put("duration", c.getDuration());
            item.put("moduleCount", moduleCountByCourse.getOrDefault(cid, 0L));
            item.put("isRecommended", recommended);
            item.put("isEnrolled", isEnrolled);
            item.put("progressPercentage", pct);
            return item;
        }).toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("roleName", roleName);
        response.put("activeSkillGapsCount", activeSkillGapsCount);
        response.put("totalModules", allModules.size());
        response.put("totalAssessments", totalAssessments);
        response.put("studyPodTopicsCount", STUDY_POD_TOPICS_COUNT);
        response.put("courses", courseItems);
        return response;
    }

    public Course getCourseById(String courseId) {
        return courseRepository.findById(courseId.trim())
                .orElseThrow(() -> new NoSuchElementException("Course tidak ditemukan."));
    }

    public List<CourseModule> getModulesByCourseId(String courseId) {
        return courseModuleRepository.findByCourseIdOrderBySequenceOrderAsc(courseId.trim());
    }
}
