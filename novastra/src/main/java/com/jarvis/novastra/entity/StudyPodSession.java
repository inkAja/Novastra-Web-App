package com.jarvis.novastra.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "studypod_session", schema = "public")
public class StudyPodSession {

    @Id
    @Column(name = "session_id", length = 5)
    private String sessionId;

    @Column(name = "user_id", length = 5, nullable = false)
    private String userId;

    @Column(name = "session_type", length = 60, nullable = false)
    private String sessionType;

    @Column(name = "scenario_type", length = 255, nullable = false)
    private String scenarioType;

    @Column(name = "sentiment_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal sentimentScore = BigDecimal.ZERO;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    public StudyPodSession() {}

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getSessionType() { return sessionType; }
    public void setSessionType(String sessionType) { this.sessionType = sessionType; }

    public String getScenarioType() { return scenarioType; }
    public void setScenarioType(String scenarioType) { this.scenarioType = scenarioType; }

    public BigDecimal getSentimentScore() { return sentimentScore; }
    public void setSentimentScore(BigDecimal sentimentScore) { this.sentimentScore = sentimentScore; }

    public LocalDate getSessionDate() { return sessionDate; }
    public void setSessionDate(LocalDate sessionDate) { this.sessionDate = sessionDate; }
}
