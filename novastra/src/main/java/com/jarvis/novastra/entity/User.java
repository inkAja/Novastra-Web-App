package com.jarvis.novastra.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "users", schema = "public")
public class User {

    @Id
    @Column(name = "user_id", length = 5)
    private String userId;

    @Column(name = "full_name", length = 60, nullable = false)
    private String fullName;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "password_user", nullable = false)
    private String passwordUser;

    @Column(name = "experience_level", nullable = false)
    private Integer experienceLevel = 0;

    @Column(name = "role_id", length = 5)
    private String roleId;

    @Column(name = "daily_time_limit", nullable = false)
    private Integer dailyTimeLimit = 0;

    @Column(name = "total_xp", nullable = false)
    private Integer totalXp = 0;

    @Column(name = "streak_count", nullable = false)
    private Integer streakCount = 0;

    @Column(name = "joined_at", nullable = false)
    private LocalDate joinedAt;

    public User() {}

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    /** Alias so existing frontend auth.js / storage.js reading `user.name` works directly. */
    public String getName() { return fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordUser() { return passwordUser; }
    public void setPasswordUser(String passwordUser) { this.passwordUser = passwordUser; }

    public Integer getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(Integer experienceLevel) { this.experienceLevel = experienceLevel; }

    public String getRoleId() { return roleId; }
    public void setRoleId(String roleId) { this.roleId = roleId; }

    public Integer getDailyTimeLimit() { return dailyTimeLimit; }
    public void setDailyTimeLimit(Integer dailyTimeLimit) { this.dailyTimeLimit = dailyTimeLimit; }

    public Integer getTotalXp() { return totalXp; }
    public void setTotalXp(Integer totalXp) { this.totalXp = totalXp; }

    public Integer getStreakCount() { return streakCount; }
    public void setStreakCount(Integer streakCount) { this.streakCount = streakCount; }

    public LocalDate getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDate joinedAt) { this.joinedAt = joinedAt; }

    public boolean isOnboarded() { return roleId != null && !roleId.isBlank(); }

    public void awardXp(int xp) {
        if (xp <= 0) return;
        this.totalXp = (this.totalXp != null ? this.totalXp : 0) + xp;
        if (this.streakCount == null || this.streakCount <= 0) {
            this.streakCount = 1;
        }
    }
}
