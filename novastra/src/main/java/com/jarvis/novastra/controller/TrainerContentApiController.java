package com.jarvis.novastra.controller;

import com.jarvis.novastra.service.TrainerContentService;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trainer")
public class TrainerContentApiController {

    private final TrainerContentService trainerContentService;

    public TrainerContentApiController(TrainerContentService trainerContentService) {
        this.trainerContentService = trainerContentService;
    }

    @GetMapping("/courses")
    public ResponseEntity<?> listCourses(HttpSession session) {
        if (!TrainerReviewApiController.isTrainerAuthenticated(session)) {
            return TrainerReviewApiController.unauthorizedResponse();
        }
        return ResponseEntity.ok(trainerContentService.listCourses());
    }

    @PostMapping("/courses")
    public ResponseEntity<?> createCourse(
            @RequestBody(required = false) TrainerContentService.CourseRequest req,
            HttpSession session) {
        if (!TrainerReviewApiController.isTrainerAuthenticated(session)) {
            return TrainerReviewApiController.unauthorizedResponse();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(trainerContentService.createCourse(req));
    }

    @PutMapping("/courses/{courseId}")
    public ResponseEntity<?> updateCourse(
            @PathVariable String courseId,
            @RequestBody(required = false) TrainerContentService.CourseRequest req,
            HttpSession session) {
        if (!TrainerReviewApiController.isTrainerAuthenticated(session)) {
            return TrainerReviewApiController.unauthorizedResponse();
        }
        return ResponseEntity.ok(trainerContentService.updateCourse(courseId, req));
    }

    @DeleteMapping("/courses/{courseId}")
    public ResponseEntity<?> deleteCourse(@PathVariable String courseId, HttpSession session) {
        if (!TrainerReviewApiController.isTrainerAuthenticated(session)) {
            return TrainerReviewApiController.unauthorizedResponse();
        }
        return ResponseEntity.ok(trainerContentService.deleteCourse(courseId));
    }

    @GetMapping("/courses/{courseId}/modules")
    public ResponseEntity<?> listModules(@PathVariable String courseId, HttpSession session) {
        if (!TrainerReviewApiController.isTrainerAuthenticated(session)) {
            return TrainerReviewApiController.unauthorizedResponse();
        }
        return ResponseEntity.ok(trainerContentService.listModulesByCourse(courseId));
    }

    @PostMapping("/courses/{courseId}/modules")
    public ResponseEntity<?> createModule(
            @PathVariable String courseId,
            @RequestBody(required = false) TrainerContentService.ModuleRequest req,
            HttpSession session) {
        if (!TrainerReviewApiController.isTrainerAuthenticated(session)) {
            return TrainerReviewApiController.unauthorizedResponse();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(trainerContentService.createModule(courseId, req));
    }

    @PutMapping("/modules/{moduleId}")
    public ResponseEntity<?> updateModule(
            @PathVariable String moduleId,
            @RequestBody(required = false) TrainerContentService.ModuleRequest req,
            HttpSession session) {
        if (!TrainerReviewApiController.isTrainerAuthenticated(session)) {
            return TrainerReviewApiController.unauthorizedResponse();
        }
        return ResponseEntity.ok(trainerContentService.updateModule(moduleId, req));
    }

    @DeleteMapping("/modules/{moduleId}")
    public ResponseEntity<?> deleteModule(@PathVariable String moduleId, HttpSession session) {
        if (!TrainerReviewApiController.isTrainerAuthenticated(session)) {
            return TrainerReviewApiController.unauthorizedResponse();
        }
        return ResponseEntity.ok(trainerContentService.deleteModule(moduleId));
    }

    @GetMapping("/projects")
    public ResponseEntity<?> listProjects(
            @RequestParam(required = false) String courseId,
            HttpSession session) {
        if (!TrainerReviewApiController.isTrainerAuthenticated(session)) {
            return TrainerReviewApiController.unauthorizedResponse();
        }
        return ResponseEntity.ok(trainerContentService.listProjects(courseId));
    }

    @PostMapping("/projects")
    public ResponseEntity<?> createProject(
            @RequestBody(required = false) TrainerContentService.ProjectRequest req,
            HttpSession session) {
        if (!TrainerReviewApiController.isTrainerAuthenticated(session)) {
            return TrainerReviewApiController.unauthorizedResponse();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(trainerContentService.createProject(req));
    }

    @PutMapping("/projects/{projectId}")
    public ResponseEntity<?> updateProject(
            @PathVariable String projectId,
            @RequestBody(required = false) TrainerContentService.ProjectRequest req,
            HttpSession session) {
        if (!TrainerReviewApiController.isTrainerAuthenticated(session)) {
            return TrainerReviewApiController.unauthorizedResponse();
        }
        return ResponseEntity.ok(trainerContentService.updateProject(projectId, req));
    }

    @DeleteMapping("/projects/{projectId}")
    public ResponseEntity<?> deleteProject(@PathVariable String projectId, HttpSession session) {
        if (!TrainerReviewApiController.isTrainerAuthenticated(session)) {
            return TrainerReviewApiController.unauthorizedResponse();
        }
        return ResponseEntity.ok(trainerContentService.deleteProject(projectId));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleValidation(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleConflict(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
    }
}
