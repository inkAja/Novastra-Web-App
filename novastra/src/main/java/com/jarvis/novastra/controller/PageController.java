package com.jarvis.novastra.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/onboarding")
    public String onboarding() {
        return "onboarding";
    }

    @GetMapping("/home")
    public String home() {
        return "home";
    }

    @GetMapping("/courses")
    public String courses() {
        return "courses";
    }

    @GetMapping("/course-detail")
    public String courseDetail() {
        return "course-detail";
    }

    @GetMapping("/quiz")
    public String quiz() {
        return "quiz";
    }

    @GetMapping("/career")
    public String career() {
        return "career";
    }

    @GetMapping("/profile")
    public String profile() {
        return "profile";
    }
}
