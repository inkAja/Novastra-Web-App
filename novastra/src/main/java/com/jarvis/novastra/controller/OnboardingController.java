package com.jarvis.novastra.controller;

import com.jarvis.novastra.service.OnboardingService;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    public record OnboardingRequest(
            String roleId,
            Integer dailyTimeLimit,
            Integer experienceLevel,
            List<String> skillIds) {}

    @GetMapping("/options")
    public Map<String, Object> getOptions() {
        return onboardingService.getOptions();
    }

    @PostMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> saveOnboarding(
            @PathVariable String userId,
            @RequestBody OnboardingRequest req) {
        try {
            return ResponseEntity.ok(onboardingService.saveOnboarding(
                    userId, req.roleId(), req.dailyTimeLimit(), req.experienceLevel(), req.skillIds()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
