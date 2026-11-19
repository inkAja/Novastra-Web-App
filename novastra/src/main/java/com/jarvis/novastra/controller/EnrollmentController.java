package com.jarvis.novastra.controller;

import com.jarvis.novastra.service.EnrollmentService;
import java.math.BigDecimal;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
    public record ProgressRequest(BigDecimal progressPercentage, Integer xpBonus) {}

    @PostMapping
    public ResponseEntity<?> enroll(@RequestBody EnrollRequest req) {
        try {
            return ResponseEntity.ok(enrollmentService.enroll(req.userId(), req.courseId()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getEnrollmentsByUser(@PathVariable String userId) {
        try {
            return ResponseEntity.ok(enrollmentService.getEnrollmentsByUser(userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{enrollmentId}/progress")
    public ResponseEntity<?> updateProgress(
            @PathVariable String enrollmentId,
            @RequestBody(required = false) ProgressRequest req) {
        try {
            BigDecimal pct = req != null ? req.progressPercentage() : null;
            Integer bonus = req != null ? req.xpBonus() : null;
            return ResponseEntity.ok(enrollmentService.updateProgress(enrollmentId, pct, bonus));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
