package com.jarvis.novastra.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "enrollment", schema = "public")
public class Enrollment {

    @Id
    @Column(name = "enrollment_id", length = 5)
    private String enrollmentId;

    @Column(name = "user_id", length = 5, nullable = false)
    private String userId;

    @Column(name = "course_id", length = 5, nullable = false)
    private String courseId;

    @Column(name = "progress_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal progressPercentage = BigDecimal.ZERO;

    @Column(name = "enrolled_at", nullable = false)
    private LocalDate enrolledAt;

    public Enrollment() {}

    public String getEnrollmentId() { return enrollmentId; }
    public void setEnrollmentId(String enrollmentId) { this.enrollmentId = enrollmentId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public BigDecimal getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(BigDecimal progressPercentage) { this.progressPercentage = progressPercentage; }

    public LocalDate getEnrolledAt() { return enrolledAt; }
    public void setEnrolledAt(LocalDate enrolledAt) { this.enrolledAt = enrolledAt; }

    public boolean advanceProgress(BigDecimal nextProgress) {
        BigDecimal current = progressPercentage != null ? progressPercentage : BigDecimal.ZERO;
        BigDecimal clamped = nextProgress.max(BigDecimal.ZERO).min(BigDecimal.valueOf(100));
        if (clamped.compareTo(current) <= 0) {
            return false;
        }
        this.progressPercentage = clamped;
        return true;
    }
}
