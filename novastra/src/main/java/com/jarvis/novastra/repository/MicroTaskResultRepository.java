package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.MicroTaskResult;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MicroTaskResultRepository extends JpaRepository<MicroTaskResult, String> {
    List<MicroTaskResult> findByUserIdAndTaskIdIn(String userId, Collection<String> taskIds);
    Optional<MicroTaskResult> findFirstByUserIdAndTaskIdOrderByResultIdAsc(String userId, String taskId);
    Optional<MicroTaskResult> findTopByResultIdStartingWithOrderByResultIdDesc(String prefix);
}
