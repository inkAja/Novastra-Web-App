package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.MicroTask;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MicroTaskRepository extends JpaRepository<MicroTask, String> {
    boolean existsByModuleIdAndQuestionText(String moduleId, String questionText);
    List<MicroTask> findByModuleIdInAndTaskType(Collection<String> moduleIds, String taskType);
}
