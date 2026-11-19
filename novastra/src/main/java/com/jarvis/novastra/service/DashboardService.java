package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.CareerRole;
import com.jarvis.novastra.entity.Course;
import com.jarvis.novastra.entity.Enrollment;
import com.jarvis.novastra.entity.User;
import com.jarvis.novastra.entity.UserSkillGap;
import com.jarvis.novastra.repository.CareerRoleRepository;
import com.jarvis.novastra.repository.CourseRepository;
import com.jarvis.novastra.repository.EnrollmentRepository;
import com.jarvis.novastra.repository.UserRepository;
import com.jarvis.novastra.repository.UserSkillGapRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final CareerRoleRepository careerRoleRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserSkillGapRepository userSkillGapRepository;

    public DashboardService(
            UserRepository userRepository,
            CareerRoleRepository careerRoleRepository,
            EnrollmentRepository enrollmentRepository,
            CourseRepository courseRepository,
            UserSkillGapRepository userSkillGapRepository) {
        this.userRepository = userRepository;
        this.careerRoleRepository = careerRoleRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
        this.userSkillGapRepository = userSkillGapRepository;
    }

    public Map<String, Object> getDashboard(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId wajib diisi.");
        }
        String uid = userId.trim();
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new NoSuchElementException("User tidak ditemukan."));

        String roleName = user.isOnboarded()
                ? careerRoleRepository.findById(user.getRoleId()).map(CareerRole::getRoleName).orElse(null)
                : null;

        List<Enrollment> rawEnrollments = enrollmentRepository.findByUserId(uid);
        Map<String, Course> courseMap = rawEnrollments.isEmpty()
                ? Map.of()
                : courseRepository.findAllById(
                        rawEnrollments.stream().map(Enrollment::getCourseId).collect(Collectors.toSet()))
                        .stream()
                        .collect(Collectors.toMap(Course::getCourseId, c -> c));

        List<Map<String, Object>> enrollments = rawEnrollments.stream().map((e) -> {
            Course c = courseMap.get(e.getCourseId());
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("enrollmentId", e.getEnrollmentId());
            item.put("courseId", e.getCourseId());
            item.put("progressPercentage", e.getProgressPercentage() != null ? e.getProgressPercentage() : BigDecimal.ZERO);
            item.put("enrolledAt", e.getEnrolledAt());
            item.put("title", c != null ? c.getTitle() : e.getCourseId());
            item.put("typeCourse", c != null ? c.getTypeCourse() : null);
            item.put("instructorName", c != null ? c.getInstructorName() : null);
            item.put("duration", c != null ? c.getDuration() : null);
            return item;
        }).toList();

        int averageProgress = 0;
        if (!rawEnrollments.isEmpty()) {
            BigDecimal sum = rawEnrollments.stream()
                    .map((e) -> e.getProgressPercentage() != null ? e.getProgressPercentage() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            averageProgress = sum.divide(BigDecimal.valueOf(rawEnrollments.size()), 0, RoundingMode.HALF_UP).intValue();
        }

        List<UserSkillGap> skillGaps = userSkillGapRepository.findByUserId(uid);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("userId", user.getUserId());
        payload.put("fullName", user.getFullName());
        payload.put("email", user.getEmail());
        payload.put("roleId", user.getRoleId());
        payload.put("roleName", roleName);
        payload.put("dailyTimeLimit", user.getDailyTimeLimit() != null ? user.getDailyTimeLimit() : 0);
        payload.put("experienceLevel", user.getExperienceLevel() != null ? user.getExperienceLevel() : 0);
        payload.put("totalXp", user.getTotalXp() != null ? user.getTotalXp() : 0);
        payload.put("streakCount", user.getStreakCount() != null ? user.getStreakCount() : 0);
        payload.put("isOnboarded", user.isOnboarded());
        payload.put("averageProgress", averageProgress);
        payload.put("enrolledCount", enrollments.size());
        payload.put("enrollments", enrollments);
        payload.put("skillGaps", skillGaps);
        return payload;
    }
}
