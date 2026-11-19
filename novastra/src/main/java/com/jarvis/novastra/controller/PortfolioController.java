package com.jarvis.novastra.controller;

import com.jarvis.novastra.service.CareerService;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final CareerService careerService;

    public PortfolioController(CareerService careerService) {
        this.careerService = careerService;
    }

    public record SubmitPortfolioRequest(String userId, String projectId, String externalUrl) {}

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitPortfolio(@RequestBody(required = false) SubmitPortfolioRequest req) {
        try {
            String userId = req != null ? req.userId() : null;
            String projectId = req != null ? req.projectId() : null;
            String externalUrl = req != null ? req.externalUrl() : null;
            return ResponseEntity.ok(careerService.submitPortfolioProject(userId, projectId, externalUrl));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        }
    }
}
