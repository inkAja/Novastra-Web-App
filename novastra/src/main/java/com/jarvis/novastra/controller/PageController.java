package com.jarvis.novastra.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping("/")
    public String index(HttpServletRequest request) {
        String host = request.getServerName();
        if ("localhost".equalsIgnoreCase(host)
                || "127.0.0.1".equals(host)
                || "::1".equals(host)
                || "0:0:0:0:0:0:0:1".equals(host)) {
            return "redirect:/trainer/login";
        }
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

    @GetMapping("/dashboard")
    public String dashboard() {
        return "home";
    }

    @GetMapping({"/courses", "/learn"})
    public String courses() {
        return "courses";
    }

    @GetMapping("/course-detail")
    public String courseDetail() {
        return "course-detail";
    }

    @GetMapping("/course-detail.html")
    public String courseDetailHtml() {
        return "course-detail";
    }

    @GetMapping({"/quiz", "/blind-test", "/studypod"})
    public String quiz() {
        return "quiz";
    }

    @GetMapping({"/practice-room", "/practice-room.html"})
    public String practiceRoom() {
        return "practice-room";
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
