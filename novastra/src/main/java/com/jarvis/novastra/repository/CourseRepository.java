package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.Course;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository extends JpaRepository<Course, String> {
    Optional<Course> findByTitle(String title);
    List<Course> findByTypeCourse(String typeCourse);
}
