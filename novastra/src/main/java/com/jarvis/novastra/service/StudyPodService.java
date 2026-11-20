package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.StudyPodSession;
import com.jarvis.novastra.repository.StudyPodSessionRepository;
import com.jarvis.novastra.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudyPodService {

    public static final String PEER_MATCH = "PEER_MATCH";
    private static final BigDecimal DEFAULT_SENTIMENT_SCORE = new BigDecimal("85.00");
    private static final BigDecimal MAX_SCORE = new BigDecimal("100.00");

    private final StudyPodSessionRepository studyPodSessionRepository;
    private final UserRepository userRepository;

    public StudyPodService(
            StudyPodSessionRepository studyPodSessionRepository,
            UserRepository userRepository) {
        this.studyPodSessionRepository = studyPodSessionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Map<String, Object> createPeerSession(
            String userId, String sessionType, String scenarioType, BigDecimal sentimentScore) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId wajib diisi.");
        }
        String uid = userId.trim();
        if (!userRepository.existsById(uid)) {
            throw new NoSuchElementException("User tidak ditemukan.");
        }

        String requestedType = sessionType != null ? sessionType.trim().toUpperCase(Locale.ROOT) : "";
        if (!requestedType.isEmpty() && !PEER_MATCH.equals(requestedType)) {
            throw new IllegalArgumentException("Hanya tipe sesi PEER_MATCH yang didukung.");
        }

        String scenario = scenarioType != null ? scenarioType.trim() : "";
        if (scenario.isEmpty() || scenario.length() > 255) {
            throw new IllegalArgumentException("Topik latihan (scenarioType) wajib diisi (maksimal 255 karakter).");
        }

        BigDecimal score;
        if (sentimentScore == null) {
            score = DEFAULT_SENTIMENT_SCORE;
        } else {
            if (sentimentScore.compareTo(BigDecimal.ZERO) < 0 || sentimentScore.compareTo(MAX_SCORE) > 0) {
                throw new IllegalArgumentException("Skor evaluasi sesi harus antara 0 dan 100.");
            }
            score = sentimentScore.setScale(2, RoundingMode.HALF_UP);
        }

        String latestSpId = studyPodSessionRepository
                .findTopBySessionIdStartingWithAndSessionIdLessThanOrderBySessionIdDesc("SP", "SPA")
                .map(StudyPodSession::getSessionId)
                .orElse(null);

        StudyPodSession session = new StudyPodSession();
        session.setSessionId(AuthService.nextId("SP", latestSpId));
        session.setUserId(uid);
        session.setSessionType(PEER_MATCH);
        session.setScenarioType(scenario);
        session.setSentimentScore(score);
        session.setSessionDate(LocalDate.now());
        StudyPodSession saved = studyPodSessionRepository.save(session);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("sessionId", saved.getSessionId());
        response.put("userId", saved.getUserId());
        response.put("sessionType", saved.getSessionType());
        response.put("scenarioType", saved.getScenarioType());
        response.put("sentimentScore", saved.getSentimentScore());
        response.put("sessionDate", saved.getSessionDate().toString());
        response.put("message", "Sesi Peer Practice berhasil dicatat.");
        return response;
    }
}
