package com.jarvis.novastra.controller;

import com.jarvis.novastra.service.StudyPodRoomService;
import com.jarvis.novastra.service.StudyPodService;
import java.math.BigDecimal;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.function.Supplier;
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
@RequestMapping("/api/studypod")
public class StudyPodController {

    private final StudyPodService studyPodService;
    private final StudyPodRoomService studyPodRoomService;

    public StudyPodController(
            StudyPodService studyPodService,
            StudyPodRoomService studyPodRoomService) {
        this.studyPodService = studyPodService;
        this.studyPodRoomService = studyPodRoomService;
    }

    public record CreateSessionRequest(
            String userId, String sessionType, String scenarioType, BigDecimal sentimentScore) {}

    public record JoinRoomRequest(String userId, String scenarioType) {}

    public record RoomActionRequest(String userId, String scenarioType, String actionType, String payload) {}

    public record LeaveRoomRequest(String userId, String scenarioType) {}

    @GetMapping("/topics/{userId}")
    public ResponseEntity<Map<String, Object>> getTopicsForUser(@PathVariable String userId) {
        return handleRoomCall(() -> studyPodService.getTopicsForUser(userId));
    }

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

    @PostMapping("/room/join")
    public ResponseEntity<Map<String, Object>> joinRoom(@RequestBody(required = false) JoinRoomRequest req) {
        return handleRoomCall(() -> studyPodRoomService.joinRoom(
                req != null ? req.userId() : null,
                req != null ? req.scenarioType() : null));
    }

    @GetMapping("/room/state")
    public ResponseEntity<Map<String, Object>> getRoomState(
            @RequestParam(required = false) String scenarioType) {
        return handleRoomCall(() -> studyPodRoomService.getRoomState(scenarioType));
    }

    @PostMapping("/room/action")
    public ResponseEntity<Map<String, Object>> performAction(@RequestBody(required = false) RoomActionRequest req) {
        return handleRoomCall(() -> studyPodRoomService.performAction(
                req != null ? req.userId() : null,
                req != null ? req.scenarioType() : null,
                req != null ? req.actionType() : null,
                req != null ? req.payload() : null));
    }

    @PostMapping("/room/leave")
    public ResponseEntity<Map<String, Object>> leaveRoom(@RequestBody(required = false) LeaveRoomRequest req) {
        return handleRoomCall(() -> studyPodRoomService.leaveRoom(
                req != null ? req.userId() : null,
                req != null ? req.scenarioType() : null));
    }

    private ResponseEntity<Map<String, Object>> handleRoomCall(Supplier<Map<String, Object>> action) {
        try {
            return ResponseEntity.ok(action.get());
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
