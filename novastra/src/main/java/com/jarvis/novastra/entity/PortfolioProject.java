package com.jarvis.novastra.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "portfolio_project", schema = "public")
public class PortfolioProject {

    @Id
    @Column(name = "project_id", length = 5)
    private String projectId;

    @Column(name = "course_id", length = 5, nullable = false)
    private String courseId;

    @Column(name = "title", length = 60, nullable = false)
    private String title;

    @Column(name = "expected_output", nullable = false)
    private String expectedOutput;

    public PortfolioProject() {}

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getExpectedOutput() { return expectedOutput; }
    public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }
}
