package com.jarvis.novastra.controller;

import com.jarvis.novastra.service.StudyPodService;
import java.math.BigDecimal;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/studypod")
public class StudyPodController {

    private final StudyPodService studyPodService;

    public StudyPodController(StudyPodService studyPodService) {
        this.studyPodService = studyPodService;
    }

    public record CreateSessionRequest(
            String userId, String sessionType, String scenarioType, BigDecimal sentimentScore) {}

    @PostMapping("/sessions")
    public ResponseEntity<Map<String, Object>> createSession(
            @RequestBody(required = false) CreateSessionRequest req) {
        try {
            String userId = req != null ? req.userId() : null;
            String sessionType = req != null ? req.sessionType() : null;
            String scenarioType = req != null ? req.scenarioType() : null;
            BigDecimal sentimentScore = req != null ? req.sentimentScore() : null;
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(studyPodService.createPeerSession(userId, sessionType, scenarioType, sentimentScore));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
