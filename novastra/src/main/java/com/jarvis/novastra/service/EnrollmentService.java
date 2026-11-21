package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.Course;
import com.jarvis.novastra.entity.CourseModule;
import com.jarvis.novastra.entity.Enrollment;
import com.jarvis.novastra.entity.User;
import com.jarvis.novastra.repository.CourseModuleRepository;
import com.jarvis.novastra.repository.CourseRepository;
import com.jarvis.novastra.repository.EnrollmentRepository;
import com.jarvis.novastra.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EnrollmentService {

    private static final int DEFAULT_XP_BONUS = 50;

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final UserRepository userRepository;
    private final CareerService careerService;

    public EnrollmentService(
            EnrollmentRepository enrollmentRepository,
            CourseRepository courseRepository,
            CourseModuleRepository courseModuleRepository,
            UserRepository userRepository,
            CareerService careerService) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
        this.courseModuleRepository = courseModuleRepository;
        this.userRepository = userRepository;
        this.careerService = careerService;
    }

    @Transactional
    public Map<String, Object> enroll(String userId, String courseId) {
        if (userId == null || userId.isBlank() || courseId == null || courseId.isBlank()) {
            throw new IllegalArgumentException("userId dan courseId wajib diisi.");
        }
        String uid = userId.trim();
        String cid = courseId.trim();

        if (!userRepository.existsById(uid)) {
            throw new NoSuchElementException("User tidak ditemukan.");
        }
        Course course = courseRepository.findById(cid)
                .orElseThrow(() -> new NoSuchElementException("Course tidak ditemukan."));

        boolean alreadyEnrolled = enrollmentRepository.existsByUserIdAndCourseId(uid, cid);
        Enrollment enrollment = alreadyEnrolled
                ? enrollmentRepository.findByUserIdAndCourseId(uid, cid).orElseThrow()
                : createEnrollment(uid, cid);

        Map<String, Object> result = toEnrollmentMap(enrollment, course);
        result.put("alreadyEnrolled", alreadyEnrolled);
        return result;
    }

    public List<Map<String, Object>> getEnrollmentsByUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId wajib diisi.");
        }
        String uid = userId.trim();
        List<Enrollment> enrollments = enrollmentRepository.findByUserId(uid);
        if (enrollments.isEmpty()) {
            return List.of();
        }
        Map<String, Course> courseMap = courseRepository.findAllById(
                        enrollments.stream().map(Enrollment::getCourseId).collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(Course::getCourseId, c -> c));

        return enrollments.stream()
                .map(e -> toEnrollmentMap(e, courseMap.get(e.getCourseId())))
                .toList();
    }

    @Transactional
    public Map<String, Object> updateProgress(String enrollmentId, BigDecimal progressPercentage, Integer xpBonus) {
        if (enrollmentId == null || enrollmentId.isBlank()) {
            throw new IllegalArgumentException("enrollmentId wajib diisi.");
        }
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId.trim())
                .orElseThrow(() -> new NoSuchElementException("Enrollment tidak ditemukan."));

        BigDecimal target = progressPercentage != null
                ? progressPercentage.setScale(2, RoundingMode.HALF_UP)
                : computeNextStep(enrollment);

        boolean advanced = enrollment.advanceProgress(target);
        enrollmentRepository.save(enrollment);

        User user = userRepository.findById(enrollment.getUserId())
                .orElseThrow(() -> new NoSuchElementException("User tidak ditemukan."));
        int awarded = 0;
        if (advanced) {
            awarded = (xpBonus != null && xpBonus > 0) ? xpBonus : DEFAULT_XP_BONUS;
            user.awardXp(awarded);
            userRepository.save(user);
        }
        careerService.recalculateUserSkillGaps(enrollment.getUserId());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("enrollmentId", enrollment.getEnrollmentId());
        response.put("userId", enrollment.getUserId());
        response.put("courseId", enrollment.getCourseId());
        response.put("progressPercentage", enrollment.getProgressPercentage());
        response.put("totalXp", user.getTotalXp() != null ? user.getTotalXp() : 0);
        response.put("streakCount", user.getStreakCount() != null ? user.getStreakCount() : 0);
        response.put("xpAwarded", awarded);
        return response;
    }

    @Transactional
    public Map<String, Object> completeModule(String userId, String courseId, String moduleId) {
        if (userId == null || userId.isBlank() || courseId == null || courseId.isBlank() || moduleId == null || moduleId.isBlank()) {
            throw new IllegalArgumentException("userId, courseId, dan moduleId wajib diisi.");
        }
        String uid = userId.trim();
        String cid = courseId.trim();
        String mid = moduleId.trim();

        if (!userRepository.existsById(uid)) {
            throw new NoSuchElementException("User tidak ditemukan.");
        }
        if (!courseRepository.existsById(cid)) {
            throw new NoSuchElementException("Course tidak ditemukan.");
        }

        CourseModule mod = courseModuleRepository.findById(mid)
                .orElseThrow(() -> new NoSuchElementException("Modul tidak ditemukan."));
        if (!cid.equals(mod.getCourseId())) {
            throw new IllegalArgumentException("Modul bukan bagian dari course tersebut.");
        }

        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(uid, cid)
                .orElseGet(() -> createEnrollment(uid, cid));

        return updateProgress(enrollment.getEnrollmentId(), null, DEFAULT_XP_BONUS);
    }

    private Enrollment createEnrollment(String userId, String courseId) {
        String latestId = enrollmentRepository.findTopByOrderByEnrollmentIdDesc()
                .map(Enrollment::getEnrollmentId)
                .orElse(null);
        Enrollment enrollment = new Enrollment();
        enrollment.setEnrollmentId(AuthService.nextId("ENR", latestId));
        enrollment.setUserId(userId);
        enrollment.setCourseId(courseId);
        enrollment.setProgressPercentage(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        enrollment.setEnrolledAt(LocalDate.now());
        return enrollmentRepository.save(enrollment);
    }

    private BigDecimal computeNextStep(Enrollment enrollment) {
        long moduleCount = Math.max(1L, courseModuleRepository.countByCourseId(enrollment.getCourseId()));
        BigDecimal step = BigDecimal.valueOf(100).divide(BigDecimal.valueOf(moduleCount), 2, RoundingMode.HALF_UP);
        BigDecimal current = enrollment.getProgressPercentage() != null ? enrollment.getProgressPercentage() : BigDecimal.ZERO;
        BigDecimal next = current.add(step);
        if (next.compareTo(BigDecimal.valueOf(99)) >= 0) {
            return BigDecimal.valueOf(100).setScale(2, RoundingMode.HALF_UP);
        }
        return next;
    }

    private Map<String, Object> toEnrollmentMap(Enrollment e, Course c) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("enrollmentId", e.getEnrollmentId());
        item.put("userId", e.getUserId());
        item.put("courseId", e.getCourseId());
        item.put("progressPercentage", e.getProgressPercentage() != null ? e.getProgressPercentage() : BigDecimal.ZERO);
        item.put("enrolledAt", e.getEnrolledAt());
        item.put("title", c != null ? c.getTitle() : e.getCourseId());
        item.put("typeCourse", c != null ? c.getTypeCourse() : null);
        item.put("instructorName", c != null ? c.getInstructorName() : null);
        item.put("duration", c != null ? c.getDuration() : null);
        return item;
    }
}
