package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.CareerRole;
import com.jarvis.novastra.entity.User;
import com.jarvis.novastra.entity.UserSkillGap;
import com.jarvis.novastra.repository.CareerRoleRepository;
import com.jarvis.novastra.repository.UserRepository;
import com.jarvis.novastra.repository.UserSkillGapRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final CareerRoleRepository careerRoleRepository;
    private final EnrollmentService enrollmentService;
    private final UserSkillGapRepository userSkillGapRepository;

    public DashboardService(
            UserRepository userRepository,
            CareerRoleRepository careerRoleRepository,
            EnrollmentService enrollmentService,
            UserSkillGapRepository userSkillGapRepository) {
        this.userRepository = userRepository;
        this.careerRoleRepository = careerRoleRepository;
        this.enrollmentService = enrollmentService;
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

        List<Map<String, Object>> enrolledCourses = enrollmentService.getEnrollmentsByUser(uid);

        int averageProgress = 0;
        if (!enrolledCourses.isEmpty()) {
            BigDecimal sum = enrolledCourses.stream()
                    .map(e -> (BigDecimal) e.getOrDefault("progressPercentage", BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            averageProgress = sum.divide(BigDecimal.valueOf(enrolledCourses.size()), 0, RoundingMode.HALF_UP).intValue();
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
        payload.put("activeCoursesCount", enrolledCourses.size());
        payload.put("enrolledCourses", enrolledCourses);
        payload.put("enrolledCount", enrolledCourses.size());
        payload.put("enrollments", enrolledCourses);
        payload.put("skillGaps", skillGaps);
        return payload;
    }
}
