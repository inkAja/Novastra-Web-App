package com.jarvis.novastra.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "portfolio_submission", schema = "public")
public class PortfolioSubmission {

    @Id
    @Column(name = "submission_id", length = 5)
    private String submissionId;

    @Column(name = "user_id", length = 5, nullable = false)
    private String userId;

    @Column(name = "project_id", length = 5, nullable = false)
    private String projectId;

    @Column(name = "external_url", length = 255, nullable = false)
    private String externalUrl;

    @Column(name = "score", precision = 5, scale = 2, nullable = false)
    private BigDecimal score = BigDecimal.ZERO;

    @Column(name = "feedback_notes")
    private String feedbackNotes;

    @Column(name = "status", length = 60, nullable = false)
    private String status;

    public PortfolioSubmission() {}

    public String getSubmissionId() { return submissionId; }
    public void setSubmissionId(String submissionId) { this.submissionId = submissionId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getExternalUrl() { return externalUrl; }
    public void setExternalUrl(String externalUrl) { this.externalUrl = externalUrl; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public String getFeedbackNotes() { return feedbackNotes; }
    public void setFeedbackNotes(String feedbackNotes) { this.feedbackNotes = feedbackNotes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
