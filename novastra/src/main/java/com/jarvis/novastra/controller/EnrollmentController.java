package com.jarvis.novastra.controller;

import com.jarvis.novastra.service.EnrollmentService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    public EnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    public record EnrollRequest(String userId, String courseId) {}

    @PostMapping
    public ResponseEntity<?> enroll(@RequestBody EnrollRequest req) {
        try {
            return ResponseEntity.ok(enrollmentService.enroll(req.userId(), req.courseId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
