package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.Course;
import com.jarvis.novastra.entity.CourseModule;
import com.jarvis.novastra.repository.CourseModuleRepository;
import com.jarvis.novastra.repository.CourseRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseModuleRepository courseModuleRepository;

    public CourseService(CourseRepository courseRepository, CourseModuleRepository courseModuleRepository) {
        this.courseRepository = courseRepository;
        this.courseModuleRepository = courseModuleRepository;
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public List<CourseModule> getModulesByCourseId(String courseId) {
        return courseModuleRepository.findByCourseIdOrderBySequenceOrderAsc(courseId);
    }
}
