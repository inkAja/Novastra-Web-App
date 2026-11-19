package com.jarvis.novastra.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "micro_task_result", schema = "public")
public class MicroTaskResult {

    @Id
    @Column(name = "result_id", length = 5)
    private String resultId;

    @Column(name = "user_id", length = 5, nullable = false)
    private String userId;

    @Column(name = "task_id", length = 5, nullable = false)
    private String taskId;

    @Column(name = "score", precision = 5, scale = 2, nullable = false)
    private BigDecimal score = BigDecimal.ZERO;

    @Column(name = "completed_at", nullable = false)
    private LocalDate completedAt;

    public MicroTaskResult() {}

    public String getResultId() { return resultId; }
    public void setResultId(String resultId) { this.resultId = resultId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public LocalDate getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDate completedAt) { this.completedAt = completedAt; }
}
