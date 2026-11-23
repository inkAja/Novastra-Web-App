package com.jarvis.novastra.controller;

import com.jarvis.novastra.service.TrainerReviewService;
import jakarta.servlet.http.HttpSession;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
public class TrainerReviewApiController {

    public static final String SESSION_EMAIL_KEY = "NOVASTRA_TRAINER_EMAIL";
    private static final String SESSION_NAME_KEY = "NOVASTRA_TRAINER_NAME";

    // shortcut: trainer session backed by application.properties & HttpSession; upgrade to dedicated trainer role/table before production
    private final String configuredEmail;
    private final String configuredPassword;
    private final String configuredName;
    private final TrainerReviewService trainerReviewService;

    public TrainerReviewApiController(
            TrainerReviewService trainerReviewService,
            @Value("${novastra.trainer.email:trainer@novastra.id}") String configuredEmail,
            @Value("${novastra.trainer.password:trainer123}") String configuredPassword,
            @Value("${novastra.trainer.name:Novastra Trainer}") String configuredName) {
        this.trainerReviewService = trainerReviewService;
        this.configuredEmail = configuredEmail.trim();
        this.configuredPassword = configuredPassword;
        this.configuredName = configuredName.trim();
    }

    public record TrainerLoginRequest(String email, String password) {}

    @GetMapping("/session")
    public ResponseEntity<Map<String, Object>> session(HttpSession session) {
        Object email = session != null ? session.getAttribute(SESSION_EMAIL_KEY) : null;
        if (email == null) {
            return ResponseEntity.ok(Map.of("authenticated", false));
        }
        Object name = session.getAttribute(SESSION_NAME_KEY);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("authenticated", true);
        body.put("trainerEmail", String.valueOf(email));
        body.put("trainerName", name != null ? String.valueOf(name) : configuredName);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody(required = false) TrainerLoginRequest req,
            HttpSession session) {
        String email = req != null && req.email() != null ? req.email().trim() : "";
        String password = req != null && req.password() != null ? req.password() : "";
        if (!configuredEmail.equalsIgnoreCase(email) || !configuredPassword.equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Email atau password Trainer tidak valid."));
        }
        session.setAttribute(SESSION_EMAIL_KEY, configuredEmail);
        session.setAttribute(SESSION_NAME_KEY, configuredName);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("authenticated", true);
        body.put("trainerEmail", configuredEmail);
        body.put("trainerName", configuredName);
        body.put("message", "Berhasil masuk ke Trainer Portal.");
        return ResponseEntity.ok(body);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpSession session) {
        if (session != null) {
            session.removeAttribute(SESSION_EMAIL_KEY);
            session.removeAttribute(SESSION_NAME_KEY);
        }
        return ResponseEntity.ok(Map.of("authenticated", false, "message", "Sesi Trainer berakhir."));
    }

    @GetMapping("/submissions")
    public ResponseEntity<?> listSubmissions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            HttpSession session) {
        if (!isTrainerAuthenticated(session)) {
            return unauthorizedResponse();
        }
        return ResponseEntity.ok(trainerReviewService.listSubmissions(status, q));
    }

    @GetMapping("/submissions/{submissionId}")
    public ResponseEntity<?> getSubmissionDetail(
            @PathVariable String submissionId,
            HttpSession session) {
        if (!isTrainerAuthenticated(session)) {
            return unauthorizedResponse();
        }
        try {
            return ResponseEntity.ok(trainerReviewService.getSubmissionDetail(submissionId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/submissions/{submissionId}/review")
    public ResponseEntity<?> reviewSubmission(
            @PathVariable String submissionId,
            @RequestBody(required = false) TrainerReviewService.TrainerReviewRequest req,
            HttpSession session) {
        if (!isTrainerAuthenticated(session)) {
            return unauthorizedResponse();
        }
        try {
            return ResponseEntity.ok(trainerReviewService.reviewSubmission(submissionId, req));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    static boolean isTrainerAuthenticated(HttpSession session) {
        return session != null && session.getAttribute(SESSION_EMAIL_KEY) != null;
    }

    private static ResponseEntity<Map<String, String>> unauthorizedResponse() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Autentikasi Trainer diperlukan untuk mengakses halaman ini."));
    }
}
