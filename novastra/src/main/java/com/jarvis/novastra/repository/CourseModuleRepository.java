package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.CourseModule;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseModuleRepository extends JpaRepository<CourseModule, String> {
    List<CourseModule> findByCourseIdOrderBySequenceOrderAsc(String courseId);
    long countByCourseId(String courseId);
    Optional<CourseModule> findTopByOrderByModuleIdDesc();
    Optional<CourseModule> findTopByModuleIdStartingWithOrderByModuleIdDesc(String prefix);
    Optional<CourseModule> findByCourseIdAndSequenceOrder(String courseId, Integer sequenceOrder);
    List<CourseModule> findByCourseIdInOrderByCourseIdAscSequenceOrderAsc(Collection<String> courseIds);
}
