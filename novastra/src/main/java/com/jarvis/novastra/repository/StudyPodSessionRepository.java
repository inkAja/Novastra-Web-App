package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.StudyPodSession;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyPodSessionRepository extends JpaRepository<StudyPodSession, String> {
    List<StudyPodSession> findByUserIdAndSessionDateBetween(String userId, LocalDate start, LocalDate end);
    Optional<StudyPodSession> findTopBySessionIdStartingWithAndSessionIdLessThanOrderBySessionIdDesc(String prefix, String upperBound);
    void deleteByUserId(String userId);
}
