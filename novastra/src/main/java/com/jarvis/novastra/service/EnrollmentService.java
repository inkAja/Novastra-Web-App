package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.Enrollment;
import com.jarvis.novastra.repository.EnrollmentRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.stereotype.Service;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository) {
        this.enrollmentRepository = enrollmentRepository;
    }

    public Enrollment enroll(String userId, String courseId) {
        if (userId == null || userId.isBlank() || courseId == null || courseId.isBlank()) {
            throw new IllegalArgumentException("userId dan courseId wajib diisi.");
        }
        String uid = userId.trim();
        String cid = courseId.trim();
        return enrollmentRepository.findByUserIdAndCourseId(uid, cid)
                .orElseGet(() -> {
                    String latestId = enrollmentRepository.findTopByOrderByEnrollmentIdDesc()
                            .map(Enrollment::getEnrollmentId)
                            .orElse(null);
                    Enrollment enrollment = new Enrollment();
                    enrollment.setEnrollmentId(AuthService.nextId("ENR", latestId));
                    enrollment.setUserId(uid);
                    enrollment.setCourseId(cid);
                    enrollment.setProgressPercentage(BigDecimal.ZERO);
                    enrollment.setEnrolledAt(LocalDate.now());
                    return enrollmentRepository.save(enrollment);
                });
    }
}
