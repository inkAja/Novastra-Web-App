package com.jarvis.novastra.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "course", schema = "public")
public class Course {

    @Id
    @Column(name = "course_id", length = 5)
    private String courseId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "type_course", length = 60, nullable = false)
    private String typeCourse;

    @Column(name = "instructor_name", nullable = false)
    private String instructorName;

    @Column(name = "duration", nullable = false)
    private Integer duration;

    public Course() {}

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getTypeCourse() { return typeCourse; }
    public void setTypeCourse(String typeCourse) { this.typeCourse = typeCourse; }

    public String getInstructorName() { return instructorName; }
    public void setInstructorName(String instructorName) { this.instructorName = instructorName; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }

    /** JSON aliases so existing frontend templates work seamlessly with DB rows. */
    public String getId() { return courseId; }
    public String getField() { return typeCourse; }
    public String getInstructor() { return instructorName; }
}
