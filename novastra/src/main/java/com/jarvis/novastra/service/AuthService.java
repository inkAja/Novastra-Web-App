package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.User;
import com.jarvis.novastra.repository.UserRepository;
import java.time.LocalDate;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User register(String fullName, String email, String password) {
        if (fullName == null || fullName.isBlank()) {
            throw new IllegalArgumentException("Nama lengkap wajib diisi.");
        }
        if (email == null || email.isBlank() || password == null || password.length() < 6) {
            throw new IllegalArgumentException("Email wajib diisi dan password minimal 6 karakter.");
        }
        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email sudah terdaftar.");
        }

        String latestId = userRepository.findTopByOrderByUserIdDesc().map(User::getUserId).orElse(null);

        User user = new User();
        user.setUserId(nextId("USR", latestId));
        user.setFullName(fullName.trim());
        user.setEmail(normalizedEmail);
        // shortcut: plain-text password for initial MVP connection, upgrade to BCryptPasswordEncoder before production
        user.setPasswordUser(password);
        user.setExperienceLevel(0);
        user.setRoleId(null);
        user.setDailyTimeLimit(0);
        user.setTotalXp(0);
        user.setStreakCount(0);
        user.setJoinedAt(LocalDate.now());
        return userRepository.save(user);
    }

    public User login(String email, String password) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            throw new IllegalArgumentException("Email dan password wajib diisi.");
        }
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Email atau password salah."));
        if (!password.equals(user.getPasswordUser())) {
            throw new IllegalArgumentException("Email atau password salah.");
        }
        return user;
    }

    // shortcut: CHAR(5) ID fits up to 99 rows (3-char prefix) or 999 rows (2-char prefix); widen column before exceeding
    public static String nextId(String prefix, String latestId) {
        int next = 1;
        if (latestId != null && latestId.startsWith(prefix)) {
            try {
                next = Integer.parseInt(latestId.substring(prefix.length()).trim()) + 1;
            } catch (NumberFormatException ignored) {
            }
        }
        int digits = Math.max(1, 5 - prefix.length());
        return String.format("%s%0" + digits + "d", prefix, next);
    }
}
