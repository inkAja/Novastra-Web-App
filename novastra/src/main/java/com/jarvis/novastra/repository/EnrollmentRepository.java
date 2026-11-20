package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.Enrollment;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnrollmentRepository extends JpaRepository<Enrollment, String> {
    boolean existsByUserIdAndCourseId(String userId, String courseId);
    List<Enrollment> findByUserId(String userId);
    List<Enrollment> findByUserIdAndEnrolledAtBetween(String userId, LocalDate start, LocalDate end);
    Optional<Enrollment> findByUserIdAndCourseId(String userId, String courseId);
    Optional<Enrollment> findTopByOrderByEnrollmentIdDesc();
    void deleteByUserId(String userId);
}
