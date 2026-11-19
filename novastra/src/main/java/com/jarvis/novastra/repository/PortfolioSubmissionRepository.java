package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.PortfolioSubmission;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioSubmissionRepository extends JpaRepository<PortfolioSubmission, String> {
    List<PortfolioSubmission> findByUserIdAndProjectIdIn(String userId, Collection<String> projectIds);
    Optional<PortfolioSubmission> findFirstByUserIdAndProjectIdOrderBySubmissionIdAsc(String userId, String projectId);
    Optional<PortfolioSubmission> findTopBySubmissionIdStartingWithOrderBySubmissionIdDesc(String prefix);
}
