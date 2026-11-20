package com.jarvis.novastra.controller;

import com.jarvis.novastra.entity.Course;
import com.jarvis.novastra.entity.CourseModule;
import com.jarvis.novastra.service.CourseService;
import com.jarvis.novastra.service.EnrollmentService;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;
    private final EnrollmentService enrollmentService;

    public CourseController(CourseService courseService, EnrollmentService enrollmentService) {
        this.courseService = courseService;
        this.enrollmentService = enrollmentService;
    }

    public record CompleteModuleRequest(String userId) {}

    @GetMapping
    public List<Course> getAllCourses() {
        return courseService.getAllCourses();
    }

    @GetMapping("/workspace")
    public Map<String, Object> getLearnWorkspace(@RequestParam(required = false) String userId) {
        return courseService.getLearnWorkspace(userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCourseById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(courseService.getCourseById(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/modules")
    public List<CourseModule> getCourseModules(@PathVariable String id) {
        return courseService.getModulesByCourseId(id);
    }

    @PostMapping("/{courseId}/modules/{moduleId}/complete")
    public ResponseEntity<?> completeModule(
            @PathVariable String courseId,
            @PathVariable String moduleId,
            @RequestBody CompleteModuleRequest req) {
        try {
            return ResponseEntity.ok(enrollmentService.completeModule(req.userId(), courseId, moduleId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
