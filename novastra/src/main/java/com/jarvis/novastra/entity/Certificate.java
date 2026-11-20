package com.jarvis.novastra.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "certificate", schema = "public")
public class Certificate {

    @Id
    @Column(name = "certificate_id", length = 5)
    private String certificateId;

    @Column(name = "user_id", length = 5, nullable = false)
    private String userId;

    @Column(name = "course_id", length = 5, nullable = false)
    private String courseId;

    @Column(name = "credential_url", length = 255, nullable = false)
    private String credentialUrl;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    public Certificate() {}

    public String getCertificateId() { return certificateId; }
    public void setCertificateId(String certificateId) { this.certificateId = certificateId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getCredentialUrl() { return credentialUrl; }
    public void setCredentialUrl(String credentialUrl) { this.credentialUrl = credentialUrl; }

    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }
}
