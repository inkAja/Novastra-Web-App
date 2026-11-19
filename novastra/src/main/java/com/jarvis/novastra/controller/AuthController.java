package com.jarvis.novastra.controller;

import com.jarvis.novastra.entity.User;
import com.jarvis.novastra.service.AuthService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    public record RegisterRequest(String fullName, String name, String email, String password) {}
    public record LoginRequest(String email, String password) {}

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest req) {
        try {
            String resolvedName = req.fullName() != null ? req.fullName() : req.name();
            User user = authService.register(resolvedName, req.email(), req.password());
            return ResponseEntity.ok(Map.of(
                    "message", "Registrasi berhasil.",
                    "isOnboarded", user.isOnboarded(),
                    "user", user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest req) {
        try {
            User user = authService.login(req.email(), req.password());
            return ResponseEntity.ok(Map.of(
                    "message", "Login berhasil.",
                    "isOnboarded", user.isOnboarded(),
                    "user", user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }
}
