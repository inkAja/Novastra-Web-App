package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.StudyPodSession;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyPodSessionRepository extends JpaRepository<StudyPodSession, String> {
    List<StudyPodSession> findByUserIdAndSessionDateBetween(String userId, LocalDate start, LocalDate end);
    void deleteByUserId(String userId);
}
