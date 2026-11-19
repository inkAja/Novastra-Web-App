package com.jarvis.novastra.controller;

import com.jarvis.novastra.service.MicroTaskService;
import java.math.BigDecimal;
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
@RequestMapping("/api")
public class MicroTaskController {

    private final MicroTaskService microTaskService;

    public MicroTaskController(MicroTaskService microTaskService) {
        this.microTaskService = microTaskService;
    }

    public record SubmitMicroTaskRequest(String userId, String answer, BigDecimal score) {}
    public record SubmitBlindTestRequest(String userId, List<MicroTaskService.BlindTestAnswer> answers) {}

    @GetMapping("/modules/{moduleId}/micro-tasks")
    public ResponseEntity<?> getMicroTasksByModule(
            @PathVariable String moduleId,
            @RequestParam(required = false) String userId) {
        try {
            return ResponseEntity.ok(microTaskService.getMicroTasksByModule(moduleId, userId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/micro-tasks/{taskId}/submit")
    public ResponseEntity<?> submitMicroTask(
            @PathVariable String taskId,
            @RequestBody(required = false) SubmitMicroTaskRequest req) {
        try {
            String userId = req != null ? req.userId() : null;
            String answer = req != null ? req.answer() : null;
            BigDecimal score = req != null ? req.score() : null;
            return ResponseEntity.ok(microTaskService.submitMicroTask(taskId, userId, answer, score));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/blind-tests/submit")
    public ResponseEntity<?> submitBlindTest(@RequestBody(required = false) SubmitBlindTestRequest req) {
        try {
            String userId = req != null ? req.userId() : null;
            List<MicroTaskService.BlindTestAnswer> answers = req != null ? req.answers() : null;
            return ResponseEntity.ok(microTaskService.submitBlindTest(userId, answers));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
