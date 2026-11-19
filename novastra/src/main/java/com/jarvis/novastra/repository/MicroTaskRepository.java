package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.MicroTask;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MicroTaskRepository extends JpaRepository<MicroTask, String> {
    boolean existsByModuleIdAndQuestionText(String moduleId, String questionText);
    boolean existsByModuleIdAndTimestampSeconds(String moduleId, Integer timestampSeconds);
    List<MicroTask> findByModuleIdIn(Collection<String> moduleIds);
    List<MicroTask> findByModuleIdInAndTaskType(Collection<String> moduleIds, String taskType);
    List<MicroTask> findByModuleIdOrderByTimestampSecondsAscTaskIdAsc(String moduleId);
    Optional<MicroTask> findTopByTaskIdStartingWithOrderByTaskIdDesc(String prefix);
}
