package com.jarvis.novastra.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class TrainerController {

    @GetMapping("/trainer/login")
    public String trainerLogin(HttpSession session) {
        if (TrainerReviewApiController.isTrainerAuthenticated(session)) {
            return "redirect:/trainer/submissions";
        }
        return "trainer-login";
    }

    @GetMapping({"/trainer", "/trainer/submissions"})
    public String trainerSubmissions(HttpSession session) {
        if (!TrainerReviewApiController.isTrainerAuthenticated(session)) {
            return "redirect:/trainer/login";
        }
        return "trainer-reviews";
    }
}
